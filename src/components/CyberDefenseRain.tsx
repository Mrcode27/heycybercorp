"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * The ambient "cyber-defense rain" backdrop for the page below the hero.
 *
 * A fixed 2D-canvas layer at z-index -1 (see `.cyber-rain-host` in
 * globals.css): under every section, above the root background, so it reads
 * as atmosphere behind transparent panels and never takes pointer events.
 *
 * Each column is a literal vertical stream of numbers and letters: a bright
 * head glyph spills a fading trail of characters behind it, so the whole
 * thing reads as a chain falling down a column — not a single moving dot.
 * The palette and opacity come from /admin/apparence through the same live
 * Convex query the hero animations use; saving repaints every open tab.
 *
 * The canvas stays transparent (old frames are faded with `destination-out`),
 * the layer is dimmed while the hero is on screen and fades in once it scrolls
 * out, and reduced motion is honoured in the CSS and before the first frame.
 */

/** Must match DEFAULT_CYBER_RAIN_COLORS in convex/settings.ts. */
const FALLBACK_COLORS = ["#6add93", "#66d5f1"];

/** Numbers + letters — the character set the rain is built on. */
const GLYPHS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** One-line "defence pings" a column occasionally carries down. */
const ALERTS = [
  "INTRUSION BLOQUÉE",
  "PAQUET INSPECTÉ",
  "SCAN NEUTRALISÉ",
  "SIGNATURE VALIDÉE",
];

type Column = {
  x: number;
  y: number; // continuous pixel y of the head glyph
  row: number; // integer cell row of the head (glyphs[0] lives here)
  speed: number; // pixels per 16.7 ms tick
  len: number; // glyphs in the trail
  glyphs: string[]; // glyphs[0] is the head, the rest trail below it
  color: string;
  ping: number; // frames left for a bright label above the head
  label: string | null;
};

export default function CyberDefenseRain() {
  const settings = useQuery(api.settings.get);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Latest palette/opacity for the running loop. Refs are assigned on every
  // render, so saving in the admin panel is picked up by the next frame
  // without tearing down and rebuilding the animation.
  const colorsRef = useRef<string[]>(FALLBACK_COLORS);
  const opacityRef = useRef(0.45);
  colorsRef.current = settings?.cyberRainColors?.length
    ? settings.cyberRainColors
    : FALLBACK_COLORS;
  opacityRef.current =
    Math.min(100, Math.max(0, settings?.cyberRainOpacity ?? 45)) / 100;

  const rainOn = settings?.cyberRain !== false;

  useEffect(() => {
    if (!rainOn) return;

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas cannot resolve a CSS `var()` inside a font shorthand, so read the
    // next/font family name once and let Consolas stand in before it loads.
    const brandMono = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-jetbrains-mono")
      .trim();
    const fontStack = brandMono
      ? `"${brandMono}", Consolas, "Courier New", monospace`
      : "Consolas, \"Courier New\", monospace";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const FONT = 16;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `bold ${FONT}px ${fontStack}`;
      ctx.textBaseline = "top";
    };
    resize();
    window.addEventListener("resize", resize);

    const colWidth = FONT * 1.15;
    const cols = Math.max(1, Math.floor(width / colWidth));

    const makeColumn = (i: number): Column => {
      const len = 8 + Math.floor(Math.random() * 18); // 8–26 glyphs long
      const startRow =
        -(len + 2) - Math.floor(Math.random() * Math.floor(height / FONT) * 1.4);
      return {
        x: i * colWidth + (colWidth - FONT) / 2,
        y: startRow * FONT,
        row: startRow,
        speed: 1.1 + Math.random() * 2.4,
        len,
        glyphs: Array.from({ length: len }, randomGlyph),
        color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        ping: 0,
        label: null,
      };
    };

    const columns = Array.from({ length: cols }, (_, i) => makeColumn(i));

    // Dim the layer while the hero occupies the viewport; fade it in once the
    // hero has scrolled out.
    const hero = document.querySelector("[data-cyber-hero]");
    host.style.transition = "opacity 900ms ease";
    host.style.opacity = "0";
    let io: IntersectionObserver | null = null;
    if (hero && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          host.style.opacity = entry.isIntersecting ? "0" : "1";
        },
        { threshold: 0.35 },
      );
      io.observe(hero);
    } else {
      host.style.opacity = "1";
    }

    // Whether each column carries a rare bright "defence ping" label.
    let pingSoon = 900 + Math.floor(Math.random() * 1200);

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(50, now - last) / 16.667;
      last = now;

      const colors = colorsRef.current;
      const opacity = opacityRef.current;

      // Fade the previous frame, keeping the canvas transparent.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      if (--pingSoon <= 0) {
        pingSoon = 900 + Math.floor(Math.random() * 1200);
        const target = columns[Math.floor(Math.random() * columns.length)];
        if (target && target.ping <= 0) {
          target.ping = 130;
          target.label = ALERTS[Math.floor(Math.random() * ALERTS.length)];
        }
      }

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        col.y += col.speed * dt;

        // Advance the head; every time it crosses a new row, a fresh glyph is
        // pushed on top and the oldest one drops off the tail.
        const headRow = Math.floor(col.y / FONT);
        while (headRow > col.row) {
          col.glyphs.unshift(randomGlyph());
          if (col.glyphs.length > col.len) col.glyphs.pop();
          col.row++;
        }

        // The whole trail has fallen past the bottom: recycle the column.
        if ((col.row - col.len + 1) * FONT > height + FONT) {
          columns[c] = makeColumn(c);
          continue;
        }

        col.color = colors[c % colors.length] ?? col.color;

        if (col.ping > 0) col.ping--;

        for (let i = 0; i < col.glyphs.length; i++) {
          const top = (col.row - i) * FONT;
          if (top < -FONT || top > height) continue;

          // Classic flicker: the characters keep mutating as they fall.
          if (Math.random() < 0.07) col.glyphs[i] = randomGlyph();

          // Bright at the head, fading down the trail.
          const t = i / Math.max(1, col.glyphs.length - 1);
          const fade = Math.pow(1 - t, 1.25);
          const alpha =
            opacity * (0.2 + 0.8 * fade) * (0.7 + Math.random() * 0.3);

          ctx.globalAlpha =
            i === 0 ? Math.min(1, opacity * 1.4) : Math.min(1, alpha);
          ctx.fillStyle = i === 0 ? "#ffffff" : col.color;
          ctx.fillText(col.glyphs[i], col.x, top);
        }

        // A rare bright "defence ping" label riding above the head.
        if (col.ping > 0 && col.label) {
          const headTop = col.row * FONT;
          if (headTop > -FONT * 2 && headTop < height) {
            ctx.globalAlpha = Math.min(1, opacity * 1.5);
            ctx.fillStyle = "#ffffff";
            ctx.font = `600 ${Math.round(FONT * 0.85)}px ${fontStack}`;
            const tw = ctx.measureText(col.label).width;
            ctx.fillText(
              col.label,
              Math.min(Math.max(8, col.x - tw / 2), width - tw - 8),
              headTop - FONT * 1.5,
            );
            ctx.font = `bold ${FONT}px ${fontStack}`;
          }
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io?.disconnect();
      host.style.transition = "";
      host.style.opacity = "";
    };
  }, [rainOn]);

  if (!rainOn) return null;

  return (
    <div ref={hostRef} className="cyber-rain-host" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-rain-canvas" />
    </div>
  );
}