import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { logAudit } from "./lib/audit";

/**
 * Site-wide settings, stored as a single row.
 *
 * The theme is a property of the SITE, not of the visitor: an admin picks the
 * look and every visitor gets it. That is why it lives in the database rather
 * than in each browser's localStorage — switching it in the admin panel
 * repaints the site for everyone, live, with no deploy.
 *
 * The animation palettes work the same way, and for the same reason.
 */

const themeValidator = v.union(v.literal("dark"), v.literal("light"));
export type Theme = "dark" | "light";

/**
 * Brand defaults for the landing animations. These are what the site shows
 * before an admin has ever opened the colour pickers, and what "Réinitialiser"
 * restores — so they are the real design, not a placeholder.
 */
export const DEFAULT_RING_COLORS = ["#08723d", "#087f97"];
export const DEFAULT_FLUID_COLORS = ["#2aa561", "#0097b2", "#08723d", "#00c2a8"];
/** The cyber-defence rain's palette — brand green + the cyan scan tint. */
export const DEFAULT_CYBER_RAIN_COLORS = ["#6add93", "#66d5f1"];

/** Both pickers cap here: past a handful the gradient stops reading as one. */
export const MAX_COLORS = 8;

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Colours are stored as strings and handed straight to WebGL, so they are
 * validated on the way in rather than trusted on the way out. Anything that is
 * not a 6-digit hex is rejected here, which keeps the render path from ever
 * having to defend itself.
 */
function cleanColors(colors: string[], label: string): string[] {
  const cleaned = colors.map((c) => c.trim().toLowerCase());
  if (cleaned.length === 0) {
    throw new Error(`Choisissez au moins une couleur pour ${label}.`);
  }
  if (cleaned.length > MAX_COLORS) {
    throw new Error(`${MAX_COLORS} couleurs maximum pour ${label}.`);
  }
  for (const c of cleaned) {
    if (!HEX.test(c)) {
      throw new Error(`Couleur invalide pour ${label} : « ${c} » (format attendu #rrggbb).`);
    }
  }
  return cleaned;
}

/** The three hero backgrounds an admin can choose between. */
export type HeroAnimation = "rings" | "ringField" | "cursorRing";
const heroAnimationValidator = v.union(
  v.literal("rings"),
  v.literal("ringField"),
  v.literal("cursorRing"),
);

/** How the fluid trail colours each stroke. */
export type FluidColorMode = "rainbow" | "sequence";
const fluidColorModeValidator = v.union(v.literal("rainbow"), v.literal("sequence"));

export type SiteSettings = {
  theme: Theme;
  ringColors: string[];
  fluidColors: string[];
  heroAnimation: HeroAnimation;
  fluidColorMode: FluidColorMode;
  /** Whether the fluid cursor trail runs at all. Default: on. */
  fluidEnabled: boolean;
  /** Strength of the fluid trail, 0–100. */
  fluidDensity: number;
  /** Ambient digital-rain backdrop below the hero. */
  cyberRain: boolean;
  /** Colours of the digital-rain glyphs. */
  cyberRainColors: string[];
  /** Opacity of the rain layer, 0–100. */
  cyberRainOpacity: number;
};

/** Public. Read on every page load, so it stays deliberately tiny. */
export const get = query({
  args: {},
  handler: async (ctx): Promise<SiteSettings> => {
    const row = await ctx.db.query("siteSettings").first();
    return {
      // "dark" is the original design, and the fallback before anyone has chosen.
      theme: row?.theme ?? "dark",
      // An empty list is treated as "unset" so a row can never render the
      // animations colourless.
      ringColors: row?.ringColors?.length ? row.ringColors : DEFAULT_RING_COLORS,
      fluidColors: row?.fluidColors?.length ? row.fluidColors : DEFAULT_FLUID_COLORS,
      // The rings shipped first, so they stay the default.
      heroAnimation: row?.heroAnimation ?? "rings",
      // Walking the brand palette is the on-brand default; rainbow is opt-in.
      fluidColorMode: row?.fluidColorMode ?? "sequence",
      // The trail ships enabled; an admin has to switch it off deliberately.
      fluidEnabled: row?.fluidEnabled ?? true,
      // Centered on the shipped splat radius/force, so 50 looks like the
      // original design and the dial has room either way.
      fluidDensity: row?.fluidDensity ?? 55,
      // The rain ships enabled; it is ambient, not intrusive.
      cyberRain: row?.cyberRain ?? true,
      // Brand greens/cyan, matching the shipped look.
      cyberRainColors: row?.cyberRainColors?.length
        ? row.cyberRainColors
        : DEFAULT_CYBER_RAIN_COLORS,
      // 45 was the fixed shipped alpha (0.45 in the renderer).
      cyberRainOpacity: row?.cyberRainOpacity ?? 45,
    };
  },
});

/** Admin only — switches the look of the whole public site. */
export const setTheme = mutation({
  args: { theme: themeValidator },
  handler: async (ctx, { theme }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.theme === theme) return;
      await ctx.db.patch(row._id, { theme });
    } else {
      await ctx.db.insert("siteSettings", { theme });
    }
    await logAudit(ctx, "settings.theme", admin.email, theme);
  },
});

/**
 * Admin only — repaints the landing animations for every visitor.
 *
 * Both lists are optional so the two pickers can save independently; omitting
 * one leaves it exactly as it was.
 */
export const setAnimationColors = mutation({
  args: {
    ringColors: v.optional(v.array(v.string())),
    fluidColors: v.optional(v.array(v.string())),
    cyberRainColors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { ringColors, fluidColors, cyberRainColors }) => {
    const admin = await requireAdmin(ctx);

    const patch: {
      ringColors?: string[];
      fluidColors?: string[];
      cyberRainColors?: string[];
    } = {};
    if (ringColors !== undefined) patch.ringColors = cleanColors(ringColors, "les anneaux");
    if (fluidColors !== undefined) patch.fluidColors = cleanColors(fluidColors, "le curseur fluide");
    if (cyberRainColors !== undefined) {
      patch.cyberRainColors = cleanColors(cyberRainColors, "la pluie de données");
    }
    if (Object.keys(patch).length === 0) return;

    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      await ctx.db.patch(row._id, patch);
    } else {
      // No settings row yet: the theme has to come along, at its default.
      await ctx.db.insert("siteSettings", { theme: "dark", ...patch });
    }

    await logAudit(
      ctx,
      "settings.animation_colors",
      admin.email,
      [
        patch.ringColors ? `anneaux: ${patch.ringColors.join(" ")}` : null,
        patch.fluidColors ? `fluide: ${patch.fluidColors.join(" ")}` : null,
        patch.cyberRainColors ? `pluie: ${patch.cyberRainColors.join(" ")}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  },
});

/** Admin only — swaps which animation fills the hero. */
export const setHeroAnimation = mutation({
  args: { heroAnimation: heroAnimationValidator },
  handler: async (ctx, { heroAnimation }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.heroAnimation === heroAnimation) return;
      await ctx.db.patch(row._id, { heroAnimation });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", heroAnimation });
    }
    await logAudit(ctx, "settings.hero_animation", admin.email, heroAnimation);
  },
});

/** Admin only — rainbow hues, or the brand palette in order. */
export const setFluidColorMode = mutation({
  args: { fluidColorMode: fluidColorModeValidator },
  handler: async (ctx, { fluidColorMode }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.fluidColorMode === fluidColorMode) return;
      await ctx.db.patch(row._id, { fluidColorMode });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", fluidColorMode });
    }
    await logAudit(ctx, "settings.fluid_color_mode", admin.email, fluidColorMode);
  },
});

/** Admin only — enables or disables the fluid cursor trail for every visitor. */
export const setFluidEnabled = mutation({
  args: { fluidEnabled: v.boolean() },
  handler: async (ctx, { fluidEnabled }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.fluidEnabled === fluidEnabled) return;
      await ctx.db.patch(row._id, { fluidEnabled });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", fluidEnabled });
    }
    await logAudit(ctx, "settings.fluid_enabled", admin.email, fluidEnabled ? "activé" : "désactivé");
  },
});

/** Admin only — strength of the fluid trail, 0–100. */
export const setFluidDensity = mutation({
  args: { fluidDensity: v.number() },
  handler: async (ctx, { fluidDensity }) => {
    const admin = await requireAdmin(ctx);
    const value = Math.round(Math.min(100, Math.max(0, fluidDensity)));
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.fluidDensity === value) return;
      await ctx.db.patch(row._id, { fluidDensity: value });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", fluidDensity: value });
    }
    await logAudit(ctx, "settings.fluid_density", admin.email, String(value));
  },
});

/** Admin only — toggles the ambient digital-rain backdrop. */
export const setCyberRain = mutation({
  args: { cyberRain: v.boolean() },
  handler: async (ctx, { cyberRain }) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.cyberRain === cyberRain) return;
      await ctx.db.patch(row._id, { cyberRain });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", cyberRain });
    }
    await logAudit(ctx, "settings.cyber_rain", admin.email, cyberRain ? "activée" : "désactivée");
  },
});

/** Admin only — how visible the digital-rain layer is, 0–100. */
export const setCyberRainOpacity = mutation({
  args: { cyberRainOpacity: v.number() },
  handler: async (ctx, { cyberRainOpacity }) => {
    const admin = await requireAdmin(ctx);
    const value = Math.round(Math.min(100, Math.max(0, cyberRainOpacity)));
    const row = await ctx.db.query("siteSettings").first();
    if (row) {
      if (row.cyberRainOpacity === value) return;
      await ctx.db.patch(row._id, { cyberRainOpacity: value });
    } else {
      await ctx.db.insert("siteSettings", { theme: "dark", cyberRainOpacity: value });
    }
    await logAudit(ctx, "settings.cyber_rain_opacity", admin.email, String(value));
  },
});

/** Admin only — back to the brand palettes. */
export const resetAnimationColors = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.query("siteSettings").first();
    if (!row) return;
    await ctx.db.patch(row._id, {
      ringColors: DEFAULT_RING_COLORS,
      fluidColors: DEFAULT_FLUID_COLORS,
      cyberRainColors: DEFAULT_CYBER_RAIN_COLORS,
    });
    await logAudit(ctx, "settings.animation_colors", admin.email, "réinitialisées");
  },
});
