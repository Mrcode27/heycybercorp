import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);

/** Public catalogue — only published courses. */
export const listPublished = query({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("published"), true))
      .collect(),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

/** Lessons for a course (metadata only — no video URLs; those are minted on demand). */
export const lessons = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) =>
    ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect(),
});

// ---- Admin ----

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("courses").collect();
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    level: levelValidator,
    description: v.string(),
    priceEur: v.number(),
    priceXof: v.number(),
    azureContainer: v.string(),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("courses", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("courses"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      level: v.optional(levelValidator),
      priceEur: v.optional(v.number()),
      priceXof: v.optional(v.number()),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    // Remove the course's lessons first, then the course itself.
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", id))
      .collect();
    for (const lesson of lessons) await ctx.db.delete(lesson._id);
    await ctx.db.delete(id);
  },
});

/**
 * One-time demo seed. Inserts a starter catalogue ONLY if none exist yet,
 * so it's safe to re-run. Prices: EUR in cents, FCFA (XOF) as whole numbers.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").take(1);
    if (existing.length > 0) return "Des cours existent déjà — seed ignoré.";

    const catalogue = [
      {
        slug: "introduction-reseaux-securises",
        title: "Introduction aux Réseaux Sécurisés",
        level: "Débutant" as const,
        description:
          "Comprendre les protocoles TCP/IP et la topologie des réseaux critiques pour identifier les vulnérabilités de base.",
        priceEur: 4000,
        priceXof: 15000,
      },
      {
        slug: "ligne-de-commande-linux",
        title: "Ligne de Commande Linux",
        level: "Débutant" as const,
        description:
          "Maîtrisez le terminal, le scripting Bash et la gestion des permissions dans un environnement Unix sécurisé.",
        priceEur: 4000,
        priceXof: 15000,
      },
      {
        slug: "cryptographie-appliquee",
        title: "Cryptographie Appliquée",
        level: "Intermédiaire" as const,
        description:
          "Les mathématiques derrière le chiffrement AES, RSA et les protocoles d'échange de clés modernes.",
        priceEur: 6000,
        priceXof: 30000,
      },
      {
        slug: "pentest-web",
        title: "Penetration Testing : Web",
        level: "Intermédiaire" as const,
        description:
          "Exploitation de vulnérabilités OWASP Top 10, injection SQL et XSS dans des environnements de laboratoire contrôlés.",
        priceEur: 6000,
        priceXof: 30000,
      },
      {
        slug: "soc-incident-response",
        title: "SOC & Incident Response",
        level: "Intermédiaire" as const,
        description:
          "Analyse de logs SIEM, détection d'anomalies et mise en place de stratégies de remédiation post-attaque.",
        priceEur: 6000,
        priceXof: 30000,
      },
      {
        slug: "reverse-engineering",
        title: "Reverse Engineering",
        level: "Avancé" as const,
        description:
          "Désassemblage de malwares, analyse de binaires et exploitation de corruption mémoire sous x64.",
        priceEur: 8000,
        priceXof: 45000,
      },
    ];

    for (const c of catalogue) {
      await ctx.db.insert("courses", {
        ...c,
        azureContainer: "course-videos",
        published: true,
      });
    }
    return `${catalogue.length} cours créés.`;
  },
});
