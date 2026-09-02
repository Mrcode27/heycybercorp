"use client";

import Icon from "./Icon";
import { readHeroFx, useHeroFx, writeHeroFx } from "@/lib/heroFx";

/**
 * The ON/OFF pill for the fluid cursor trail (the page beneath the hero).
 *
 * It floats in the bottom-right corner of the viewport — deliberately not in
 * the navbar — styled with the same mono-type chrome as the hero. The choice
 * persists across visits; the renderers in LandingEffects read the same
 * store, so flipping it unmounts the WebGL canvas without a reload. The hero
 * animation is NOT affected: it always plays.
 */
export default function HeroFxToggle() {
  const on = useHeroFx();

  return (
    <button
      type="button"
      className="fluid-fx-toggle"
      aria-pressed={on}
      title={on ? "Désactiver la traînée de curseur" : "Activer la traînée de curseur"}
      onClick={() => writeHeroFx(!readHeroFx())}
    >
      <Icon name={on ? "gesture" : "do_not_touch"} className="text-[15px]" fill />
      <span>FX CURSEUR</span>
      <span className={`fluid-fx-toggle-state${on ? "" : " is-off"}`}>{on ? "ON" : "OFF"}</span>
    </button>
  );
}
