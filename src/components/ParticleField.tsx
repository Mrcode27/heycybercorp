"use client";

import { useEffect, useRef } from "react";

/**
 * The hero particle field: a circular disc of luminous bars that breathes like
 * a jellyfish, with an EMPTY centre — and the cursor takes over that empty
 * centre wherever it goes.
 *
 * Written against raw WebGL like the rest of the hero effects. Each particle
 * is a short bar (a rotated capsule drawn inside a point sprite, so the whole
 * field is still a single draw call). The physics are a few hundred particles
 * integrated on the CPU with a spatial hash for spacing — trivial cost, holds
 * 60fps on integrated GPUs.
 *
 * Shape of the effect:
 *  - the bars live on a disc (a circle, like border-radius: 50%) centred in
 *    the hero, with a hole punched out of the middle at rest;
 *  - the cursor carves its own void: bars inside the void radius FLEE it and
 *    never touch it, while bars just outside are gently pulled in — the outer
 *    part compresses around the empty centre;
 *  - a pairwise repulsion keeps every bar at a distinct distance, so the
 *    compression never congests into clumps;
 *  - on its own, the disc slowly rotates, breathes radially and each bar
 *    jiggles around its spot — the jellyfish motion — and bars stretch and
 *    steer with their velocity when they are displaced.
 */

interface ParticleFieldProps {
  /** Bar colours; bars pick one by index. Blue, green, yellow. */
  colors?: string[];
  /** Bar count at a 1440x900 hero; scales with the hero's area. */
  count?: number;
  /** Overall opacity. */
  opacity?: number;
  className?: string;
}

const VERTEX = `
attribute vec2 aPosition;
attribute float aAngle;
attribute float aLength;
attribute float aAlpha;
attribute vec3 aColor;
uniform vec2 uResolution;
varying vec3 vColor;
varying float vAlpha;
varying float vAngle;
void main() {
  vec2 clip = (aPosition / uResolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aLength;
  vAngle = aAngle;
  vColor = aColor;
  vAlpha = aAlpha;
}
`;

const FRAGMENT = `
precision mediump float;
uniform float uHalfW;
varying vec3 vColor;
varying float vAlpha;
varying float vAngle;
void main() {
  // Rotate the sprite's square coordinate space so the capsule aligns with
  // the bar's world angle, then draw a soft rounded bar.
  vec2 p = gl_PointCoord - vec2(0.5);
  float c = cos(-vAngle);
  float s = sin(-vAngle);
  p = mat2(c, -s, s, c) * p;
  vec2 q = abs(p) - vec2(0.40 - uHalfW, uHalfW);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uHalfW;
  float a = smoothstep(0.02, -0.02, d) * vAlpha;
  if (a <= 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

/** Hard cap: past this the CPU integration starts showing up on weak laptops. */
const MAX_PARTICLES = 700;

/* Physics tuning, in CSS pixels and seconds. */
const SPRING = 3.4; // pull back toward the bar's spot on the disc
const DAMPING = 3.0; // per-second velocity decay
const FLEE = 2600; // outward push inside the cursor's void
const COMPRESS = 420; // inward pull on the ring just outside the void
const SEPARATION = 10; // rest spacing between bars, px
const SEPARATION_FORCE = 1600; // pairwise push when closer than SEPARATION
const MAX_SPEED = 900; // px/s velocity clamp
const HOLE = 0.15; // empty centre at rest, as a fraction of the disc radius

export default function ParticleField({
  colors = ["#0097b2", "#009150", "#ffd400"],
  count = 480,
  opacity = 1,
  className,
}: ParticleFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef({ colors, count, opacity });

  useEffect(() => {
    configRef.current = { colors, count, opacity };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.className = "particle-field-canvas";
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    host.appendChild(canvas);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      canvas.style.display = "none";
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uHalfW = gl.getUniformLocation(program, "uHalfW");
    // Bar thickness as a fraction of the bar's own length.
    gl.uniform1f(uHalfW, 0.055);

    const colorData = new Float32Array(MAX_PARTICLES * 3);
    const dyn = new Float32Array(MAX_PARTICLES * 5); // x, y, angle, length, alpha
    const colorBuffer = gl.createBuffer();
    const dynBuffer = gl.createBuffer();

    const bindAttributes = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuffer);
      const aPosition = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 20, 0);
      const aAngle = gl.getAttribLocation(program, "aAngle");
      gl.enableVertexAttribArray(aAngle);
      gl.vertexAttribPointer(aAngle, 1, gl.FLOAT, false, 20, 8);
      const aLength = gl.getAttribLocation(program, "aLength");
      gl.enableVertexAttribArray(aLength);
      gl.vertexAttribPointer(aLength, 1, gl.FLOAT, false, 20, 12);
      const aAlpha = gl.getAttribLocation(program, "aAlpha");
      gl.enableVertexAttribArray(aAlpha);
      gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 20, 16);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      const aColor = gl.getAttribLocation(program, "aColor");
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 12, 0);
    };
    bindAttributes();

    gl.enable(gl.BLEND);
    // Straight alpha: the hero also has a light theme, where additive
    // blending would wash the bars out to white.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /* ------------------------------------------------ bar state */

    // Physics run in CSS pixels; only the final write to the GPU buffer is
    // scaled by the device ratio.
    const baseR = new Float32Array(MAX_PARTICLES); // orbit radius at rest
    const baseA = new Float32Array(MAX_PARTICLES); // orbit angle
    const angW = new Float32Array(MAX_PARTICLES); // angular jiggle speed
    const phase = new Float32Array(MAX_PARTICLES); // breathing/sway phase
    const swayAmp = new Float32Array(MAX_PARTICLES);
    const swayW = new Float32Array(MAX_PARTICLES);
    const lenPx = new Float32Array(MAX_PARTICLES); // bar length at rest, CSS px
    const px = new Float32Array(MAX_PARTICLES);
    const py = new Float32Array(MAX_PARTICLES);
    const vx = new Float32Array(MAX_PARTICLES);
    const vy = new Float32Array(MAX_PARTICLES);

    // Spatial hash for the pairwise spacing repulsion (flat linked lists, no
    // allocations per frame).
    let cellSize = SEPARATION;
    let gridW = 1;
    let gridH = 1;
    let heads = new Int32Array(1);
    const next = new Int32Array(MAX_PARTICLES);

    let live = 0; // bars in use for the current viewport
    let w = 0;
    let h = 0;
    let discR = 1; // the disc's radius, CSS px
    let voidR = 150; // the cursor's void radius
    let dpr = 1;

    /** A bar's spot on the disc: area-uniform across the annulus. */
    const seed = (i: number) => {
      // sqrt between hole² and 1 → uniform density over the ring's area.
      const u = Math.sqrt(HOLE * HOLE + Math.random() * (1 - HOLE * HOLE));
      baseR[i] = u * discR;
      baseA[i] = Math.random() * Math.PI * 2;
      // Slow per-bar angular drift in both directions: bars wander around
      // their spot instead of sitting fixed.
      angW[i] = (0.04 + Math.random() * 0.09) * (Math.random() < 0.5 ? -1 : 1);
      phase[i] = Math.random() * Math.PI * 2;
      swayAmp[i] = 3 + Math.random() * 9;
      swayW[i] = 0.3 + Math.random() * 0.55;
      lenPx[i] = 9 + Math.random() * 7;
      px[i] = w / 2 + Math.cos(baseA[i]) * baseR[i];
      py[i] = h / 2 + Math.sin(baseA[i]) * baseR[i];
      vx[i] = 0;
      vy[i] = 0;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);

      // The disc is a circle covering the hero, like a border-radius: 50%
      // element — the corners just fade out with the rim.
      discR = Math.hypot(w, h) * 0.4;
      // The cursor's empty centre: a comfortable pocket, never touched.
      voidR = Math.min(190, Math.max(110, Math.min(w, h) * 0.16));

      cellSize = SEPARATION;
      gridW = Math.ceil(w / cellSize) + 2;
      gridH = Math.ceil(h / cellSize) + 2;
      heads = new Int32Array(gridW * gridH);

      const target = Math.min(
        MAX_PARTICLES,
        Math.round(configRef.current.count * Math.min(1.6, (w * h) / (1440 * 900))),
      );
      for (let i = live; i < target; i++) seed(i);
      live = target;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ------------------------------------------------ pointer */

    // Window-level tracking with a cached rect, so hero content layered above
    // the canvas can never block it (and no layout read per mouse move).
    let rect = host.getBoundingClientRect();
    const refreshRect = () => {
      rect = host.getBoundingClientRect();
    };
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect);

    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const onPointerMove = (event: PointerEvent) => {
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      pointerActive = inside;
      if (!inside) return;
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointerActive = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    /* ------------------------------------------------ render loop */

    let colorsKey = "";
    let colorsLive = 0;

    const uploadColors = () => {
      const palette = configRef.current.colors.length
        ? configRef.current.colors
        : ["#0097b2", "#009150", "#ffd400"];
      for (let i = 0; i < live; i++) {
        const [r, g, b] = hexToRgb(palette[i % palette.length]);
        colorData[i * 3] = r;
        colorData[i * 3 + 1] = g;
        colorData[i * 3 + 2] = b;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colorData.subarray(0, live * 3), gl.STATIC_DRAW);
      bindAttributes(); // re-binding is cheap insurance after a bufferData
      colorsKey = configRef.current.colors.join(",") || "default";
      colorsLive = live;
    };

    let simTime = 0;
    let last = 0;
    let frame = 0;
    let visible = false;
    let pageVisible = !document.hidden;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = last === 0 ? 0.016 : Math.min((now - last) / 1000, 0.05);
      last = now;
      simTime += dt;

      const damp = Math.exp(-dt * DAMPING);
      const spring = SPRING * dt;
      const flee = FLEE * dt;
      const compress = COMPRESS * dt;
      const sepf = SEPARATION_FORCE * dt;
      const cx = w / 2;
      const cy = h / 2;
      const cOpacity = configRef.current.opacity;

      if (configRef.current.colors.join(",") !== colorsKey || colorsLive !== live) uploadColors();

      /* -- pairwise spacing: rebuild the spatial hash, then resolve pairs -- */

      heads.fill(-1);
      for (let i = 0; i < live; i++) {
        const gx = Math.min(gridW - 1, Math.max(0, ((px[i] / cellSize) | 0) + 1));
        const gy = Math.min(gridH - 1, Math.max(0, ((py[i] / cellSize) | 0) + 1));
        const cell = gy * gridW + gx;
        next[i] = heads[cell];
        heads[cell] = i;
      }

      for (let i = 0; i < live; i++) {
        const gx = Math.min(gridW - 1, Math.max(0, ((px[i] / cellSize) | 0) + 1));
        const gy = Math.min(gridH - 1, Math.max(0, ((py[i] / cellSize) | 0) + 1));
        for (let oy = -1; oy <= 1; oy++) {
          const yy = gy + oy;
          if (yy < 0 || yy >= gridH) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = gx + ox;
            if (xx < 0 || xx >= gridW) continue;
            for (let j = heads[yy * gridW + xx]; j !== -1; j = next[j]) {
              if (j <= i) continue; // each pair once
              const dx = px[i] - px[j];
              const dy = py[i] - py[j];
              const d2 = dx * dx + dy * dy;
              if (d2 >= SEPARATION * SEPARATION || d2 < 1e-4) continue;
              const d = Math.sqrt(d2);
              // Push the pair apart — this keeps bars at distinct distances
              // even when the cursor compresses the outer ring.
              const f = (sepf * (1 - d / SEPARATION)) / d;
              const fx = dx * f;
              const fy = dy * f;
              vx[i] += fx;
              vy[i] += fy;
              vx[j] -= fx;
              vy[j] -= fy;
            }
          }
        }
      }

      /* -- per-bar physics -- */

      for (let i = 0; i < live; i++) {
        // The bar's spot: slow orbit + radial breathing + a gentle sway. The
        // disc is alive before any mouse arrives.
        const angle = baseA[i] + simTime * angW[i] + 0.03 * Math.sin(simTime * 0.8 + phase[i]);
        const breath = 1 + 0.05 * Math.sin(simTime * 0.55 + phase[i]);
        const r = baseR[i] * breath;
        const homeX =
          cx + Math.cos(angle) * r + Math.sin(simTime * swayW[i] + phase[i]) * swayAmp[i];
        const homeY =
          cy +
          Math.sin(angle) * r * 0.97 +
          Math.cos(simTime * swayW[i] * 0.83 + phase[i] * 1.7) * swayAmp[i];

        // Spring back toward the spot…
        vx[i] += (homeX - px[i]) * spring;
        vy[i] += (homeY - py[i]) * spring;

        // …the cursor carves its own empty centre: bars inside the void FLEE
        // it (and never touch it), bars just outside are pulled in so the
        // outer part compresses around the hole.
        let nearVoid = 0;
        if (pointerActive) {
          const dx = px[i] - pointerX;
          const dy = py[i] - pointerY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < voidR && d > 0.5) {
            const k = 1 - d / voidR;
            const f = (flee * (1.15 - d / voidR)) / d;
            vx[i] += dx * f;
            vy[i] += dy * f;
            nearVoid = k;
          } else if (d < voidR * 2.1 && d > 0.5) {
            const k = 1 - (d - voidR) / voidR;
            const f = (compress * k) / d;
            vx[i] -= dx * f;
            vy[i] -= dy * f;
          }
        }

        vx[i] *= damp;
        vy[i] *= damp;
        const speed2 = vx[i] * vx[i] + vy[i] * vy[i];
        if (speed2 > MAX_SPEED * MAX_SPEED) {
          const s = MAX_SPEED / Math.sqrt(speed2);
          vx[i] *= s;
          vy[i] *= s;
        }
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;

        // Orientation: bars lie tangentially on the disc (fibres of the
        // jellyfish), steer toward their motion when displaced, and never
        // hold perfectly still.
        const speed = Math.sqrt(speed2);
        let barAngle = angle + Math.PI / 2 + 0.18 * Math.sin(simTime * 1.6 + phase[i]);
        if (speed > 24) {
          const va = Math.atan2(vy[i], vx[i]);
          const blend = Math.min(1, speed / 320) * 0.75;
          let delta = va - barAngle;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          barAngle += delta * blend;
        }

        // Alpha: brighter mid-disc, fading into the rim; bars squeezed
        // against the cursor's void light up.
        const r01 = baseR[i] / discR;
        const rim = r01 < 0.82 ? 1 : 1 - (r01 - 0.82) / 0.18;
        const a = Math.min(1, 0.5 * (1 - 0.3 * r01) * rim * (0.85 + 0.7 * nearVoid) * cOpacity);

        // Bars stretch with their speed — the jellyfish pulse when the field
        // is disturbed.
        const stretch = Math.min(0.8, speed / 700);
        const o = i * 5;
        dyn[o] = px[i] * dpr;
        dyn[o + 1] = py[i] * dpr;
        dyn[o + 2] = barAngle;
        dyn[o + 3] = lenPx[i] * (1 + stretch) * dpr;
        dyn[o + 4] = a;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, dyn.subarray(0, live * 5), gl.DYNAMIC_DRAW);
      bindAttributes();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, live);
    };

    const start = () => {
      if (visible && pageVisible && frame === 0) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    const stop = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      // Removing the element releases the context with it (same contract as
      // the other hero renderers).
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className={className ?? "particle-field"} aria-hidden="true" />;
}

