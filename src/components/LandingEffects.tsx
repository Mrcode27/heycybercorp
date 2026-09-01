"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MagicRings from "./MagicRings";
import FluidCursor from "./FluidCursor";

/**
 * The two landing-page animations, painted in the colours an admin picked in
 * /admin/apparence.
 *
 * Both palettes come from a live Convex query, so saving in the admin panel
 * repaints every open tab without a deploy — the same contract the site theme
 * already has. Neither component is gated behind a loading state: before the
 * query resolves they run on the brand defaults below, because a hero that
 * blinks its background in reads worse than one that starts on green.
 *
 * They are two exports rather than one because they mount in different places.
 * The rings sit inside the hero; the fluid cursor is fixed to the viewport and
 * deliberately excludes the hero, which runs its own pointer choreography.
 */

/** Kept in step with DEFAULT_RING_COLORS / DEFAULT_FLUID_COLORS in convex/settings.ts. */
const FALLBACK_RINGS = ["#08723d", "#087f97"];
const FALLBACK_FLUID = ["#2aa561", "#0097b2", "#08723d", "#00c2a8"];

/** Concentric signal rings, drawn behind the whole hero. */
export default function LandingRings() {
  const settings = useQuery(api.settings.get);
  const ringColors = settings?.ringColors?.length ? settings.ringColors : FALLBACK_RINGS;

  return (
    <div className="landing-rings">
      {/* `coverage` alpha is what keeps dark brand colours legible on the light
          hero surface — `luminance` is for glowing rings on a dark one. */}
      <MagicRings
        colors={ringColors}
        ringCount={7}
        speed={0.6}
        attenuation={11}
        lineThickness={1.6}
        baseRadius={0.3}
        radiusStep={0.11}
        scaleRate={0.12}
        opacity={0.6}
        blur={0.4}
        noiseAmount={0.05}
        ringGap={1.9}
        fadeIn={0.7}
        fadeOut={0.5}
        followMouse
        mouseInfluence={0.12}
        hoverScale={1.08}
        parallax={0.03}
        clickBurst
        alphaMode="coverage"
      />
    </div>
  );
}

/** The fluid trail, for the page below the hero. */
export function LandingFluidCursor() {
  const settings = useQuery(api.settings.get);
  const fluidColors = settings?.fluidColors?.length ? settings.fluidColors : FALLBACK_FLUID;

  return (
    <FluidCursor
      palette={fluidColors}
      densityDissipation={3.5}
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
