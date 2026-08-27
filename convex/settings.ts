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
 */

const themeValidator = v.union(v.literal("dark"), v.literal("light"));
export type Theme = "dark" | "light";

/** Public. Read on every page load, so it stays deliberately tiny. */
export const get = query({
  args: {},
  handler: async (ctx): Promise<{ theme: Theme }> => {
    const row = await ctx.db.query("siteSettings").first();
    // "dark" is the original design, and the fallback before anyone has chosen.
    return { theme: row?.theme ?? "dark" };
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
