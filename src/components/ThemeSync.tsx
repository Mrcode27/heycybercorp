"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const STORAGE_KEY = "hcc-theme";

/**
 * Applies the site theme chosen by an admin in /admin/apparence.
 *
 * The theme belongs to the site, not the visitor, so it comes from Convex
 * rather than from each browser. Convex queries are live, which means flipping
 * the switch in the admin panel repaints every open tab immediately — no
 * deploy, no refresh.
 *
 * The value is mirrored into localStorage purely so the inline script in the
 * document head can paint the right colours on the NEXT visit before React
 * boots. Losing that cache costs a brief flash, never correctness: Convex
 * remains the source of truth and overwrites whatever was cached.
 */
export default function ThemeSync() {
  const settings = useQuery(api.settings.get);

  useEffect(() => {
    if (!settings) return;
    const { theme } = settings;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode or blocked storage — the theme still applies this visit.
    }
  }, [settings]);

  return null;
}
