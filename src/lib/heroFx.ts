"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared state for the hero FX toggle.
 *
 * The toggle button and the hero renderers (LandingEffects) both need the
 * on/off state, but they live in different React trees that mount at
 * different times. So the source of truth is a `data-hero-fx` attribute on
 * `<html>` plus a localStorage key, exposed to React through
 * `useSyncExternalStore` — no context or store library needed for a single
 * boolean.
 */

export const HERO_FX_KEY = "hero-fx";

/** Window event fired whenever the toggle changes; `detail` is the new state. */
export const HERO_FX_EVENT = "hero-fx-change";

/** FX are on unless the visitor explicitly turned them off. */
export function readHeroFx(): boolean {
  try {
    return localStorage.getItem(HERO_FX_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeHeroFx(on: boolean): void {
  try {
    localStorage.setItem(HERO_FX_KEY, on ? "on" : "off");
  } catch {
    // Private mode or blocked storage: the attribute still works for this page.
  }
  document.documentElement.dataset.heroFx = on ? "on" : "off";
  window.dispatchEvent(new CustomEvent<boolean>(HERO_FX_EVENT, { detail: on }));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(HERO_FX_EVENT, onChange);
  return () => window.removeEventListener(HERO_FX_EVENT, onChange);
}

/** The current hero FX state, live in whichever component needs it. */
export function useHeroFx(): boolean {
  return useSyncExternalStore(subscribe, readHeroFx, () => true);
}

