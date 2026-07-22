import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { logAudit } from "./lib/audit";
import type { Doc } from "./_generated/dataModel";

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);
export type Level = "Débutant" | "Intermédiaire" | "Avancé";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Published packages that unlock `level`, most-specific (fewest levels) first. */
export async function coveringPackages(
  ctx: QueryCtx,
  level: Level,
): Promise<Doc<"packages">[]> {
  const all = await ctx.db.query("packages").collect();
  return all
    .filter((p) => p.published && p.levels.includes(level))
    .sort((a, b) => a.levels.length - b.levels.length || a.order - b.order);
}

/** The package used to price/label a course of `level` (the most specific one). */
export async function primaryPackage(
  ctx: QueryCtx,
  level: Level,
): Promise<Doc<"packages"> | null> {
  return (await coveringPackages(ctx, level))[0] ?? null;
}

// ---- Public ----

export const listPublished = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("packages").collect())
      .filter((p) => p.published)
      .sort((a, b) => a.order - b.order),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

// ---- Admin ----

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("packages").collect()).sort((a, b) => a.order - b.order);
  },
});

async function assertSlugFree(ctx: QueryCtx, slug: string, ignore?: Doc<"packages">["_id"]) {
  const existing = await ctx.db
    .query("packages")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignore) {
    throw new Error(`Le slug « ${slug} » est déjà utilisé par un autre package.`);
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    tagline: v.optional(v.string()),
    priceEur: v.number(),
    priceXof: v.number(),
    features: v.array(v.string()),
    levels: v.array(levelValidator),
    published: v.boolean(),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, { slug, ...rest }) => {
    await requireAdmin(ctx);
    const finalSlug = slug?.trim() || slugify(rest.name);
    await assertSlugFree(ctx, finalSlug);
    const siblings = await ctx.db.query("packages").collect();
    const order = siblings.reduce((m, x) => Math.max(m, x.order), 0) + 1;
    const id = await ctx.db.insert("packages", { ...rest, slug: finalSlug, order });
    await logAudit(ctx, "package.created", finalSlug, rest.name);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("packages"),
    patch: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      tagline: v.optional(v.string()),
      priceEur: v.optional(v.number()),
      priceXof: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      levels: v.optional(v.array(levelValidator)),
      published: v.optional(v.boolean()),
      featured: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const pkg = await ctx.db.get(id);
    if (!pkg) throw new Error("Package introuvable.");
    if (patch.slug && patch.slug !== pkg.slug) await assertSlugFree(ctx, patch.slug, id);
    await ctx.db.patch(id, patch);
    await logAudit(ctx, "package.updated", pkg.slug, pkg.name);
  },
});

export const remove = mutation({
  args: { id: v.id("packages") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const pkg = await ctx.db.get(id);
    // Revoke access rows tied to this package (orders stay as history).
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_package", (q) => q.eq("packageId", id))
      .collect();
    for (const e of ents) await ctx.db.delete(e._id);
    await ctx.db.delete(id);
    await logAudit(ctx, "package.deleted", pkg?.slug, pkg?.name);
  },
});

export const move = mutation({
  args: { id: v.id("packages"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    await requireAdmin(ctx);
    const cur = await ctx.db.get(id);
    if (!cur) return;
    const all = (await ctx.db.query("packages").collect()).sort((a, b) => a.order - b.order);
    const idx = all.findIndex((x) => x._id === id);
    const swap = direction === "up" ? all[idx - 1] : all[idx + 1];
    if (!swap) return;
    await ctx.db.patch(cur._id, { order: swap.order });
    await ctx.db.patch(swap._id, { order: cur.order });
  },
});

/**
 * One-time seed: three packages, one per level, at the current tier prices.
 * Safe to re-run (no-op once any package exists).
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("packages").take(1);
    if (existing.length > 0) return "Des packages existent déjà — seed ignoré.";

    const defs = [
      {
        slug: "debutant",
        name: "Débutant",
        tagline: "Les fondamentaux de la cyberdéfense",
        priceEur: 4000,
        priceXof: 15000,
        levels: ["Débutant" as const],
        features: [
          "Accès à vie à toutes les formations Débutant",
          "Certificat de réussite vérifiable",
          "Communauté Discord",
        ],
        published: true,
        featured: false,
        order: 1,
      },
      {
        slug: "intermediaire",
        name: "Intermédiaire",
        tagline: "Montez en compétences",
        priceEur: 6000,
        priceXof: 30000,
        levels: ["Intermédiaire" as const],
        features: [
          "Accès à vie à toutes les formations Intermédiaire",
          "Certificat de réussite vérifiable",
          "Support prioritaire",
        ],
        published: true,
        featured: true,
        order: 2,
      },
      {
        slug: "avance",
        name: "Avancé",
        tagline: "Niveau expert / Red Team",
        priceEur: 8000,
        priceXof: 45000,
        levels: ["Avancé" as const],
        features: [
          "Accès à vie à toutes les formations Avancé",
          "Certificat de réussite vérifiable",
          "Coaching et exploitation avancée",
        ],
        published: true,
        featured: false,
        order: 3,
      },
    ];
    for (const d of defs) await ctx.db.insert("packages", d);
    await logAudit(ctx, "package.seeded", undefined, `${defs.length} packages`);
    return `${defs.length} packages créés.`;
  },
});
