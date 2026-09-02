"use client";

import { useEffect, useRef } from "react";

/**
 * A dot field with a ring that follows the pointer and shoves the dots outward.
 *
 * Written against raw WebGL rather than three.js on purpose: this is the
 * alternative hero background, and pulling a 550 KB renderer in behind a
 * decorative grid is most of why the homepage was slow. The whole effect is one
 * full-screen fragment shader.
 *
 * The dots are not geometry. Each fragment finds the grid cells around it,
 * works out where each of those dots has been pushed to, and keeps the nearest.
 * Displacement is evaluated from the dot's HOME position, never its live one —
 * sampling the live position lets a shoved dot drag its own halo along and the
 * field smears.
 */

interface CursorRingFieldProps {
  /** Ordered palette: dot colour at rest, then the colours the ring lights. */
  colors?: string[];
  /** Grid pitch in CSS pixels. */
  spacing?: number;
  /** Dot radius as a fraction of the spacing. */
  dotSize?: number;
  /** Ring radius in CSS pixels. */
  radius?: number;
  /** Thickness of the lit band, in CSS pixels. */
  width?: number;
  /** How far the band shoves a dot, in CSS pixels. */
  push?: number;
  /** Overall opacity. */
  opacity?: number;
  className?: string;
}

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uRing;
uniform float uSpacing, uDotSize, uRadius, uWidth, uPush, uOpacity, uEnergy;
uniform vec3 uColors[4];
uniform int uColorCount;

/** Sample the palette at t in [0,1]; constant-bounded so ES 1.00 accepts it. */
vec3 paletteAt(float t) {
  int last = uColorCount - 1;
  if (last <= 0) return uColors[0];
  float scaled = clamp(t, 0.0, 1.0) * float(last);
  int idx = int(floor(scaled));
  if (idx > last - 1) idx = last - 1;
  float f = clamp(scaled - float(idx), 0.0, 1.0);
  vec3 a = uColors[0];
  vec3 b = uColors[0];
  for (int i = 0; i < 4; i++) {
    if (i == idx) a = uColors[i];
    if (i == idx + 1) b = uColors[i];
  }
  return mix(a, b, f);
}

/** 1.0 on the ring's lit band, falling off to 0 either side of it. */
float band(vec2 home) {
  float d = abs(length(home - uRing) - uRadius);
  return smoothstep(uWidth, 0.0, d);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 cell = floor(p / uSpacing);
  float dotRadius = uSpacing * uDotSize;

  float nearest = 1e9;
  float lit = 0.0;

  // A shoved dot can land in a neighbouring cell, so the fragment has to
  // consider the ring of cells around it, not only its own.
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 home = (cell + vec2(float(i), float(j)) + 0.5) * uSpacing;
      float b = band(home);
      vec2 away = home - uRing;
      vec2 dir = length(away) > 0.0001 ? normalize(away) : vec2(0.0, 1.0);
      vec2 pos = home + dir * uPush * b * uEnergy;
      float d = length(p - pos);
      if (d < nearest) {
        nearest = d;
        lit = b;
      }
    }
  }

  float grown = dotRadius * (1.0 + 0.85 * lit);
  float dot = 1.0 - smoothstep(grown * 0.55, grown, nearest);
  if (dot <= 0.001) discard;

  // Dots inside the ring stay warm, so the ring reads as a lit disc rather
  // than a bare outline.
  float inside = smoothstep(uRadius, uRadius - uWidth * 2.0, length(p - uRing));
  float heat = clamp(lit + inside * 0.35, 0.0, 1.0) * uEnergy;

  vec3 color = paletteAt(heat);
  float alpha = dot * uOpacity * (0.5 + 0.5 * heat);
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
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

/** Must match the `uColors[4]` declaration in the fragment shader. */
const MAX_COLORS = 4;

export default function CursorRingField({
  colors = ["#0d2b1d", "#08723d", "#087f97", "#7dffb3"],
  spacing = 15,
  dotSize = 0.26,
  radius = 175,
  width = 115,
  push = 30,
  opacity = 1,
  className,
}: CursorRingFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef({ colors, spacing, dotSize, radius, width, push, opacity });

  useEffect(() => {
    configRef.current = { colors, spacing, dotSize, radius, width, push, opacity };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.className = "cursor-ring-field-canvas";
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    host.appendChild(canvas);

    // A lost context renders opaque; hide it rather than let it cover the hero.
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

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uResolution = u("uResolution");
    const uRing = u("uRing");
    const uSpacing = u("uSpacing");
    const uDotSize = u("uDotSize");
    const uRadius = u("uRadius");
    const uWidth = u("uWidth");
    const uPush = u("uPush");
    const uOpacity = u("uOpacity");
    const uEnergy = u("uEnergy");
    const uColors = u("uColors");
    const uColorCount = u("uColorCount");

    let dpr = 1;
    const resize = () => {
      // The grid is sized in CSS pixels, so the shader works in CSS pixels and
      // the device ratio only scales the backing store.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = host.clientWidth;
      const h = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Ring state, in backing-store pixels. It starts parked off-centre so the
    // field is not a dead grid before the pointer arrives.
    let targetX = canvas.width * 0.68;
    let targetY = canvas.height * 0.62;
    let ringX = targetX;
    let ringY = targetY;
    let energy = 0.7;
    let energyTarget = 0.7;

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = (event.clientX - rect.left) * dpr;
      // WebGL's origin is bottom-left; the DOM's is top-left.
      targetY = (rect.height - (event.clientY - rect.top)) * dpr;
      energyTarget = 1;
    };
    const onPointerLeave = () => {
      energyTarget = 0.7;
    };
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);

    let frame = 0;
    let visible = false;
    let pageVisible = !document.hidden;
    let last = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const c = configRef.current;
      const dt = last === 0 ? 16 : Math.min(now - last, 100);
      last = now;

      // 130ms time constant, framerate-independent: the ring eases to the
      // pointer rather than snapping to it.
      const k = 1 - Math.exp(-dt / 130);
      ringX += (targetX - ringX) * k;
      ringY += (targetY - ringY) * k;
      energy += (energyTarget - energy) * (1 - Math.exp(-dt / 260));

      const palette = c.colors.length ? c.colors : ["#08723d"];
      const count = Math.min(palette.length, MAX_COLORS);
      const flat = new Float32Array(MAX_COLORS * 3);
      for (let i = 0; i < count; i++) {
        const [r, g, b] = hexToRgb(palette[i]);
        flat[i * 3] = r;
        flat[i * 3 + 1] = g;
        flat[i * 3 + 2] = b;
      }
      gl.uniform3fv(uColors, flat);
      gl.uniform1i(uColorCount, count);

      gl.uniform2f(uRing, ringX, ringY);
      gl.uniform1f(uSpacing, c.spacing * dpr);
      gl.uniform1f(uDotSize, c.dotSize);
      gl.uniform1f(uRadius, c.radius * dpr);
      gl.uniform1f(uWidth, c.width * dpr);
      gl.uniform1f(uPush, c.push * dpr);
      gl.uniform1f(uOpacity, c.opacity);
      gl.uniform1f(uEnergy, energy);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className={className ?? "cursor-ring-field"} aria-hidden="true" />;
}
