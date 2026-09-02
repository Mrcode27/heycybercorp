"use client";

import { useEffect, useRef } from "react";

/**
 * A WebGL fluid-simulation cursor trail.
 *
 * This is the React counterpart of the `<FluidCursor />` single-file
 * component: same simulation (advection → curl → vorticity → divergence →
 * pressure jacobi → gradient subtract) and the same prop names, so the values
 * tuned in the Vue playground transfer over unchanged.
 *
 * The canvas is fixed to the viewport and never takes pointer events; pointer
 * movement is read from `window`. Anything matching `excludeSelector` is
 * treated as a dead zone — on the homepage that is the hero, which runs its own
 * pointer choreography and would otherwise fight this one.
 */

interface FluidCursorProps {
  /** Colour dissipation: higher fades the trail faster. */
  densityDissipation?: number;
  /** Velocity dissipation: higher settles the motion faster. */
  velocityDissipation?: number;
  /** Pressure retained between frames (0–1). */
  pressure?: number;
  /** Vorticity confinement — the swirl in the trail. */
  curl?: number;
  /** Radius of each splat, as a fraction of the canvas. */
  splatRadius?: number;
  /** How hard a pointer move pushes the fluid. */
  splatForce?: number;
  /** Composite the fluid over the page instead of over black. */
  transparent?: boolean;
  /** Simulation grid resolution (velocity/pressure). */
  simResolution?: number;
  /** Dye grid resolution (the visible colour). */
  dyeResolution?: number;
  /** Colours the splats are drawn from, when colorMode is "sequence". */
  palette?: string[];
  /**
   * "rainbow" sweeps the hue wheel and ignores the palette; "sequence" walks
   * the palette in order so consecutive strokes are the brand colours, in the
   * order an admin arranged them.
   */
  colorMode?: "rainbow" | "sequence";
  /** How strongly a stroke tints the dye. Higher reads more on a light page. */
  intensity?: number;
  /** Region where the pointer must not produce splats. */
  excludeSelector?: string;
  className?: string;
}

type GL = WebGL2RenderingContext;

interface ExtFormat {
  internalFormat: number;
  format: number;
}

interface Ext {
  formatRGBA: ExtFormat;
  formatRG: ExtFormat;
  formatR: ExtFormat;
  halfFloatTexType: number;
  supportLinearFiltering: boolean;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Pointer {
  down: boolean;
  moved: boolean;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  color: RGB;
}

/* ------------------------------------------------------------------ shaders */

const BASE_VERTEX_SHADER = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const COPY_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

const CLEAR_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const DISPLAY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uOpaque;

  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, max(a, uOpaque));
  }
`;

const SPLAT_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const ADVECTION_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const DIVERGENCE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const CURL_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const PRESSURE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_SUBTRACT_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

/* ------------------------------------------------------------------ helpers */

function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

/**
 * How fast the rainbow hue sweeps along a stroke, in full wheel turns per unit
 * of texcoord distance. One full turn ≈ a third of the viewport: a stroke
 * across the page walks the whole spectrum, while a short flick stays mostly
 * one hue.
 */
const RAINBOW_SWEEP = 3;

/** HSV -> RGB, for the rainbow sweep. Saturated but not blinding. */
function hsvToRgb(h: number, s: number, v: number): RGB {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      return { r: v, g: t, b: p };
    case 1:
      return { r: q, g: v, b: p };
    case 2:
      return { r: p, g: v, b: t };
    case 3:
      return { r: p, g: q, b: v };
    case 4:
      return { r: t, g: p, b: v };
    default:
      return { r: v, g: p, b: q };
  }
}

function scaleByPixelRatio(input: number): number {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  return Math.floor(input * ratio);
}

function correctRadius(radius: number, aspectRatio: number): number {
  return aspectRatio > 1 ? radius * aspectRatio : radius;
}

/** The dye grid keeps the canvas aspect ratio, with the long side at `resolution`. */
function getResolution(gl: GL, resolution: number) {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);
  return gl.drawingBufferWidth > gl.drawingBufferHeight
    ? { width: max, height: min }
    : { width: min, height: max };
}

export default function FluidCursor({
  densityDissipation = 3.5,
  velocityDissipation = 2,
  pressure = 0.1,
  curl = 3,
  splatRadius = 0.2,
  splatForce = 6000,
  transparent = true,
  simResolution = 128,
  dyeResolution = 1024,
  palette = ["#2aa561", "#0097b2", "#08723d", "#00c2a8"],
  colorMode = "sequence",
  intensity = 0.42,
  excludeSelector,
  className,
}: FluidCursorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // The simulation loop must see live prop values without being torn down and
  // rebuilt (which would lose the dye buffers), so it reads them from a ref
  // that is refreshed after every render.
  const configRef = useRef({
    densityDissipation,
    velocityDissipation,
    pressure,
    curl,
    splatRadius,
    splatForce,
    transparent,
    palette,
    colorMode,
    intensity,
  });

  useEffect(() => {
    configRef.current = {
      densityDissipation,
      velocityDissipation,
      pressure,
      curl,
      splatRadius,
      splatForce,
      transparent,
      palette,
      colorMode,
      intensity,
    };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.className = "fluid-cursor-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A fluid trail needs a pointer to trail; touch devices get nothing.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onContextLost = (event: Event) => {
      // Without preventDefault the context can never be restored; and a lost
      // context on a viewport-sized canvas renders as an opaque sheet over the
      // page, so it is hidden rather than left to blanket the content.
      event.preventDefault();
      canvas.style.display = "none";
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const context = getWebGLContext(canvas);
    if (!context) {
      canvas.remove();
      return;
    }
    const { gl, ext } = context;

    /* ---------------------------------------------------------- gl plumbing */

    function getWebGLContext(target: HTMLCanvasElement) {
      const params: WebGLContextAttributes = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
      };

      let context2 = target.getContext("webgl2", params) as GL | null;
      const isWebGL2 = context2 !== null;
      if (!context2) {
        context2 = target.getContext("webgl", params) as unknown as GL | null;
      }
      if (!context2) return null;
      const webgl = context2;

      let halfFloat: OES_texture_half_float | null = null;
      let supportLinearFiltering: unknown = null;
      if (isWebGL2) {
        webgl.getExtension("EXT_color_buffer_float");
        supportLinearFiltering = webgl.getExtension("OES_texture_float_linear");
      } else {
        halfFloat = webgl.getExtension("OES_texture_half_float");
        supportLinearFiltering = webgl.getExtension("OES_texture_half_float_linear");
      }

      webgl.clearColor(0, 0, 0, 1);

      const halfFloatTexType = isWebGL2
        ? webgl.HALF_FLOAT
        : (halfFloat as OES_texture_half_float).HALF_FLOAT_OES;

      let formatRGBA: ExtFormat | null;
      let formatRG: ExtFormat | null;
      let formatR: ExtFormat | null;

      if (isWebGL2) {
        formatRGBA = getSupportedFormat(webgl, webgl.RGBA16F, webgl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(webgl, webgl.RG16F, webgl.RG, halfFloatTexType);
        formatR = getSupportedFormat(webgl, webgl.R16F, webgl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(webgl, webgl.RGBA, webgl.RGBA, halfFloatTexType);
        formatRG = formatRGBA;
        formatR = formatRGBA;
      }

      if (!formatRGBA || !formatRG || !formatR) return null;

      return {
        gl: webgl,
        ext: {
          formatRGBA,
          formatRG,
          formatR,
          halfFloatTexType,
          supportLinearFiltering: Boolean(supportLinearFiltering),
        } satisfies Ext,
      };
    }

    /** Half-float render targets are not universally supported; degrade format by format. */
    function getSupportedFormat(
      webgl: GL,
      internalFormat: number,
      format: number,
      type: number,
    ): ExtFormat | null {
      if (!supportRenderTextureFormat(webgl, internalFormat, format, type)) {
        switch (internalFormat) {
          case webgl.R16F:
            return getSupportedFormat(webgl, webgl.RG16F, webgl.RG, type);
          case webgl.RG16F:
            return getSupportedFormat(webgl, webgl.RGBA16F, webgl.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(
      webgl: GL,
      internalFormat: number,
      format: number,
      type: number,
    ) {
      const texture = webgl.createTexture();
      webgl.bindTexture(webgl.TEXTURE_2D, texture);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
      webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
      webgl.texImage2D(webgl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

      const fbo = webgl.createFramebuffer();
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, fbo);
      webgl.framebufferTexture2D(
        webgl.FRAMEBUFFER,
        webgl.COLOR_ATTACHMENT0,
        webgl.TEXTURE_2D,
        texture,
        0,
      );

      const status = webgl.checkFramebufferStatus(webgl.FRAMEBUFFER);
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
      webgl.deleteFramebuffer(fbo);
      webgl.deleteTexture(texture);
      return status === webgl.FRAMEBUFFER_COMPLETE;
    }

    function compileShader(type: number, source: string, keywords?: string[]) {
      const withKeywords = keywords
        ? keywords.map((k) => `#define ${k}\n`).join("") + source
        : source;
      const shader = gl.createShader(type);
      if (!shader) throw new Error("fluid-cursor: shader allocation failed");
      gl.shaderSource(shader, withKeywords);
      gl.compileShader(shader);
      return shader;
    }

    function createProgram(vertex: WebGLShader, fragment: WebGLShader) {
      const program = gl.createProgram();
      if (!program) throw new Error("fluid-cursor: program allocation failed");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      return program;
    }

    function getUniforms(program: WebGLProgram) {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i += 1) {
        const name = gl.getActiveUniform(program, i)?.name;
        if (name) uniforms[name] = gl.getUniformLocation(program, name);
      }
      return uniforms;
    }

    class Program {
      program: WebGLProgram;
      uniforms: Record<string, WebGLUniformLocation | null>;

      constructor(vertex: WebGLShader, fragment: WebGLShader) {
        this.program = createProgram(vertex, fragment);
        this.uniforms = getUniforms(this.program);
      }

      bind() {
        gl.useProgram(this.program);
      }
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER, BASE_VERTEX_SHADER);
    const advectionShader = compileShader(
      gl.FRAGMENT_SHADER,
      ADVECTION_SHADER,
      ext.supportLinearFiltering ? undefined : ["MANUAL_FILTERING"],
    );

    const copyProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, COPY_SHADER));
    const clearProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, CLEAR_SHADER));
    const splatProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, SPLAT_SHADER));
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, DIVERGENCE_SHADER));
    const curlProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, CURL_SHADER));
    const vorticityProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, VORTICITY_SHADER));
    const pressureProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, PRESSURE_SHADER));
    const gradienSubtractProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, GRADIENT_SUBTRACT_SHADER));
    const displayProgram = new Program(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, DISPLAY_SHADER));

    /* --------------------------------------------------------- full-screen quad */

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const quadIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const blit = (target: FBO | null, clear = false) => {
      if (target === null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    /* -------------------------------------------------------------- buffers */

    function createFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ): FBO {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ): DoubleFBO {
      return {
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        read: createFBO(w, h, internalFormat, format, type, param),
        write: createFBO(w, h, internalFormat, format, type, param),
        swap() {
          const temp = this.read;
          this.read = this.write;
          this.write = temp;
        },
      };
    }

    function resizeFBO(
      target: FBO,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ) {
      const next = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture!, target.attach(0));
      blit(next);
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.texture);
      return next;
    }

    function resizeDoubleFBO(
      target: DoubleFBO,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      gl.deleteFramebuffer(target.write.fbo);
      gl.deleteTexture(target.write.texture);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1 / w;
      target.texelSizeY = 1 / h;
      return target;
    }

    function disposeFBO(target: FBO) {
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.texture);
    }

    function disposeDoubleFBO(target: DoubleFBO) {
      disposeFBO(target.read);
      disposeFBO(target.write);
    }

    let initialised = false;
    let dye!: DoubleFBO;
    let velocity!: DoubleFBO;
    let divergence!: FBO;
    let curlFBO!: FBO;
    let pressureFBO!: DoubleFBO;

    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    function initFramebuffers() {
      const simRes = getResolution(gl, simResolution);
      const dyeRes = getResolution(gl, dyeResolution);
      const texType = ext.halfFloatTexType;
      const { formatRGBA: rgba, formatRG: rg, formatR: r } = ext;

      gl.disable(gl.BLEND);

      if (initialised) {
        // The dye and velocity fields carry the picture across a resize; the
        // scratch buffers below hold nothing worth keeping and are rebuilt.
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        disposeFBO(divergence);
        disposeFBO(curlFBO);
        disposeDoubleFBO(pressureFBO);
      } else {
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      }

      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressureFBO = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      initialised = true;
    }

    /** Returns true when the backing store had to change size. */
    function resizeCanvas() {
      const width = scaleByPixelRatio(canvas.clientWidth);
      const height = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    }

    /* -------------------------------------------------------------- pointer */

    const pointer: Pointer = {
      down: false,
      moved: false,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      color: { r: 0, g: 0, b: 0 },
    };

    // "sequence" walks the palette rather than sampling it at random, so the
    // admin's order is what people actually see stroke after stroke.
    let paletteCursor = 0;
    let hue = Math.random();
    // Rainbow strokes sweep the wheel ALONG the path: `strokeHue` is the
    // stroke's base (golden-ratio stepped so consecutive strokes stay apart)
    // and `strokeDist` accumulates the distance travelled. The colour a splat
    // gets is the hue at its position on the stroke, so one stroke paints a
    // gradient through the whole spectrum instead of one flat colour that only
    // changes when the next stroke starts.
    let strokeHue = hue;
    let strokeDist = 0;

    function pickColor(): RGB {
      const cfg = configRef.current;
      let rgb: RGB;
      if (cfg.colorMode === "rainbow") {
        // Golden-ratio hue stepping: consecutive strokes stay far apart on the
        // wheel instead of clustering the way plain random does.
        hue = (hue + 0.618033988749895) % 1;
        strokeHue = hue;
        strokeDist = 0;
        rgb = hsvToRgb(hue, 0.85, 1);
      } else {
        const list = cfg.palette.length ? cfg.palette : ["#2aa561"];
        const chosen = list[paletteCursor % list.length];
        paletteCursor += 1;
        rgb = hexToRgb(chosen);
      }
      // The dye buffer is HDR; the raw colour is far too bright once splatted.
      const k = cfg.intensity;
      return { r: rgb.r * k, g: rgb.g * k, b: rgb.b * k };
    }

    /** Aspect-correct the horizontal delta so diagonal strokes stay symmetric. */
    function correctDeltaX(delta: number) {
      const aspectRatio = canvas.width / canvas.height;
      return aspectRatio < 1 ? delta * aspectRatio : delta;
    }

    function correctDeltaY(delta: number) {
      const aspectRatio = canvas.width / canvas.height;
      return aspectRatio > 1 ? delta / aspectRatio : delta;
    }

    function updatePointer(x: number, y: number) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = x / canvas.clientWidth;
      pointer.texcoordY = 1 - y / canvas.clientHeight;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      strokeDist += Math.hypot(pointer.deltaX, pointer.deltaY);
    }

    let excluded: HTMLElement | null = excludeSelector
      ? document.querySelector<HTMLElement>(excludeSelector)
      : null;

    function inDeadZone(x: number, y: number) {
      if (!excluded) return false;
      if (!excluded.isConnected) {
        excluded = excludeSelector ? document.querySelector<HTMLElement>(excludeSelector) : null;
        if (!excluded) return false;
      }
      const rect = excluded.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    let hasEntered = false;

    const onPointerMove = (event: PointerEvent) => {
      if (inDeadZone(event.clientX, event.clientY)) {
        // Re-entering the live area must not splat a stroke across the page.
        hasEntered = false;
        pointer.moved = false;
        return;
      }
      const x = event.clientX;
      const y = event.clientY;
      if (!hasEntered) {
        hasEntered = true;
        pointer.texcoordX = x / canvas.clientWidth;
        pointer.texcoordY = 1 - y / canvas.clientHeight;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.color = pickColor();
        return;
      }
      updatePointer(x, y);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (inDeadZone(event.clientX, event.clientY)) return;
      pointer.down = true;
      pointer.color = pickColor();
      // A click blooms outward instead of only tinting the next move.
      const x = event.clientX / canvas.clientWidth;
      const y = 1 - event.clientY / canvas.clientHeight;
      const force = configRef.current.splatForce;
      for (let i = 0; i < 3; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        splat(x, y, Math.cos(angle) * force * 0.02, Math.sin(angle) * force * 0.02, pointer.color);
      }
    };

    const onPointerUp = () => {
      pointer.down = false;
    };

    const onPointerLeave = () => {
      hasEntered = false;
      pointer.moved = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    /* ------------------------------------------------------------ splatting */

    function splat(x: number, y: number, dx: number, dy: number, color: RGB) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget!, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio!, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point!, x, y);
      gl.uniform3f(splatProgram.uniforms.color!, dx, dy, 0);
      gl.uniform1f(
        splatProgram.uniforms.radius!,
        correctRadius(configRef.current.splatRadius / 100, canvas.width / canvas.height),
      );
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms.uTarget!, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color!, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function applyInputs() {
      if (!pointer.moved) return;
      pointer.moved = false;
      const cfg = configRef.current;
      const force = cfg.splatForce;
      let color = pointer.color;
      if (cfg.colorMode === "rainbow") {
        // The stroke IS the rainbow: the hue sweeps along the path travelled,
        // so one stroke paints the whole spectrum as a gradient rather than a
        // single colour that only changes when the next stroke begins.
        const h = (((strokeHue + strokeDist * RAINBOW_SWEEP) % 1) + 1) % 1;
        const rgb = hsvToRgb(h, 0.85, 1);
        const k = cfg.intensity;
        color = { r: rgb.r * k, g: rgb.g * k, b: rgb.b * k };
      }
      splat(
        pointer.texcoordX,
        pointer.texcoordY,
        pointer.deltaX * force,
        pointer.deltaY * force,
        color,
      );
    }

    /* ---------------------------------------------------------- simulation */

    function step(dt: number) {
      const config = configRef.current;
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity!, velocity.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity!, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl!, curlFBO.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl!, config.curl);
      gl.uniform1f(vorticityProgram.uniforms.dt!, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity!, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture!, pressureFBO.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value!, config.pressure);
      blit(pressureFBO.write);
      pressureFBO.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence!, divergence.attach(0));
      for (let i = 0; i < 20; i += 1) {
        gl.uniform1i(pressureProgram.uniforms.uPressure!, pressureFBO.read.attach(1));
        blit(pressureFBO.write);
        pressureFBO.swap();
      }

      gradienSubtractProgram.bind();
      gl.uniform2f(gradienSubtractProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradienSubtractProgram.uniforms.uPressure!, pressureFBO.read.attach(0));
      gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity!, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize!, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering) {
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize!, velocity.texelSizeX, velocity.texelSizeY);
      }
      const velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity!, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource!, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt!, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation!, config.velocityDissipation);
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering) {
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize!, dye.texelSizeX, dye.texelSizeY);
      }
      gl.uniform1i(advectionProgram.uniforms.uVelocity!, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource!, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation!, config.densityDissipation);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      const opaque = configRef.current.transparent ? 0 : 1;
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      displayProgram.bind();
      gl.uniform1i(displayProgram.uniforms.uTexture!, dye.read.attach(0));
      gl.uniform1f(displayProgram.uniforms.uOpaque!, opaque);
      blit(null);
    }

    /* --------------------------------------------------------------- loop */

    let lastTime = performance.now();
    let frameId = 0;
    let running = true;

    function frame() {
      if (!running) return;
      const now = performance.now();
      // Clamp so a backgrounded tab does not resume with one enormous step.
      const dt = Math.min((now - lastTime) / 1000, 0.016666);
      lastTime = now;

      if (resizeCanvas()) initFramebuffers();
      applyInputs();
      step(dt);
      render();

      frameId = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!running) {
        running = true;
        lastTime = performance.now();
        frameId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    resizeCanvas();
    initFramebuffers();
    frameId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      // Removing the element releases the context with it. Calling
      // loseContext() here instead would permanently poison a canvas that
      // React may hand straight back on the next mount.
      canvas.remove();
    };
    // The simulation owns its own lifecycle; live values arrive through
    // configRef, so it is built once for a given resolution and dead zone.
  }, [simResolution, dyeResolution, excludeSelector]);

  return <div ref={hostRef} aria-hidden="true" className={className ?? "fluid-cursor-host"} />;
}
