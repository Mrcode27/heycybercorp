"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * The landing-page animations, in the colours an admin picked in
 * /admin/apparence, and whichever hero background they selected.
 *
 * Everything here is deliberately NOT part of the first load. These are three
 * WebGL canvases behind the content; none of them is worth a millisecond of
 * time-to-first-paint. So:
 *
 *  - each renderer is a `dynamic(..., { ssr: false })` import, which keeps it
 *    (and, for the rings, the 550 KB three.js runtime) out of the homepage's
 *    initial script tags entirely;
 *  - only the SELECTED hero background is ever imported, so offering a second
 *    one costs nothing to visitors who see the first;
 *  - mounting waits for an idle callback, so the decoration cannot compete with
 *    hydration for the main thread.
 *
 * The palettes come from a live Convex query, so saving in the admin panel
 * repaints every open tab with no deploy — the same contract the site theme
 * already has.
 */

const MagicRings = dynamic(() => import("./MagicRings"), { ssr: false });
const CursorRingField = dynamic(() => import("./CursorRingField"), { ssr: false });
const FluidCursor = dynamic(() => import("./FluidCursor"), { ssr: false });

/** Kept in step with the DEFAULT_* constants in convex/settings.ts. */
const FALLBACK_RINGS = ["#08723d", "#087f97"];
const FALLBACK_FLUID = ["#2aa561", "#0097b2", "#08723d", "#00c2a8"];

/**
 * True once the browser has gone idle at least once.
 *
 * Decoration should never be on the critical path: hydration, the Convex
 * socket and Clerk all want the main thread first. `requestIdleCallback` is
 * not in Safari, so a timeout stands in for it there.
 */
function useAfterIdle(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idleHandle = 0;
    let timeout = 0;
    const go = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(go, { timeout: 2500 });
    } else {
      timeout = window.setTimeout(go, 900);
    }

    return () => {
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  return ready;
}

/** The hero background — whichever of the two the admin selected. */
export default function LandingHeroAnimation() {
  const settings = useQuery(api.settings.get);
  const ready = useAfterIdle();

  if (!ready) return null;

  const colors = settings?.ringColors?.length ? settings.ringColors : FALLBACK_RINGS;

  if (settings?.heroAnimation === "ringField") {
    return (
      <div className="landing-rings">
        <CursorRingField colors={colors} />
      </div>
    );
  }

  return (
    <div className="landing-rings">
      {/* `coverage` alpha is what keeps dark brand colours legible on the light
          hero surface — `luminance` is for glowing rings on a dark one. */}
      <MagicRings
        colors={colors}
        ringCount={7}
        speed={0.6}
        attenuation={7}
        lineThickness={2.6}
        baseRadius={0.3}
        radiusStep={0.11}
        scaleRate={0.12}
        opacity={0.95}
        blur={0.3}
        noiseAmount={0.05}
        ringGap={1.9}
        fadeIn={0.7}
        fadeOut={0.5}
        followMouse
        mouseInfluence={0.2}
        hoverScale={1.15}
        parallax={0.06}
        clickBurst
        alphaMode="coverage"
      />
    </div>
  );
}

/** The fluid trail, for the page below the hero. */
export function LandingFluidCursor() {
  const settings = useQuery(api.settings.get);
  const ready = useAfterIdle();

  if (!ready) return null;

  const fluidColors = settings?.fluidColors?.length ? settings.fluidColors : FALLBACK_FLUID;

  return (
    <FluidCursor
      palette={fluidColors}
      colorMode={settings?.fluidColorMode ?? "sequence"}
      densityDissipation={2.2}
      velocityDissipation={2}
      pressure={0.1}
      curl={3}
      splatRadius={0.2}
      splatForce={6000}
      transparent
      excludeSelector="[data-cyber-hero]"
    />
  );
}
