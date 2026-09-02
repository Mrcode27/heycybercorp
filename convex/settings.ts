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

/** The two hero backgrounds an admin can choose between. */
export type HeroAnimation = "rings" | "ringField";
const heroAnimationValidator = v.union(v.literal("rings"), v.literal("ringField"));

/** How the fluid trail colours each stroke. */
export type FluidColorMode = "rainbow" | "sequence";
const fluidColorModeValidator = v.union(v.literal("rainbow"), v.literal("sequence"));

export type SiteSettings = {
  theme: Theme;
  ringColors: string[];
  fluidColors: string[];
  heroAnimation: HeroAnimation;
  fluidColorMode: FluidColorMode;
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
  },
  handler: async (ctx, { ringColors, fluidColors }) => {
    const admin = await requireAdmin(ctx);

    const patch: { ringColors?: string[]; fluidColors?: string[] } = {};
    if (ringColors !== undefined) patch.ringColors = cleanColors(ringColors, "les anneaux");
    if (fluidColors !== undefined) patch.fluidColors = cleanColors(fluidColors, "le curseur fluide");
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
    });
    await logAudit(ctx, "settings.animation_colors", admin.email, "réinitialisées");
  },
});
