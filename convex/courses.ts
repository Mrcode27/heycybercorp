import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { logAudit } from "./lib/audit";
import { primaryPackage } from "./packages";
import { ownedLevels } from "./entitlements";
import type { Doc, Id } from "./_generated/dataModel";

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);

/** Public, spoiler-free view of a lesson (no blobPath / videoUrl). */
function sanitizeLesson(l: Doc<"lessons">) {
  return {
    _id: l._id,
    title: l.title,
    description: l.description,
    order: l.order,
    durationSec: l.durationSec,
    isPreview: l.isPreview,
    hasVideo: Boolean(l.videoUrl || l.blobPath),
  };
}

/** Price + package identity for a course, derived from the covering package. */
async function coursePricing(ctx: QueryCtx, course: Doc<"courses">) {
  const pkg = await primaryPackage(ctx, course.level);
  return {
    priceEur: pkg?.priceEur ?? null,
    priceXof: pkg?.priceXof ?? null,
    packageId: pkg?._id ?? null,
    packageSlug: pkg?.slug ?? null,
    packageName: pkg?.name ?? null,
  };
}

async function courseMeta(ctx: QueryCtx, courseId: Id<"courses">) {
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();
  return {
    lessonCount: lessons.length,
    durationSec: lessons.reduce((sum, l) => sum + (l.durationSec ?? 0), 0),
  };
}

/** Public catalogue — published courses + package price + lesson meta. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();
    return Promise.all(
      courses.map(async (c) => ({
        ...c,
        ...(await courseMeta(ctx, c._id)),
        ...(await coursePricing(ctx, c)),
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

/** Lessons for a course (metadata only). */
export const lessons = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) =>
    ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect(),
});

/** Everything the course detail page needs: course, lessons, package, ownership. */
export const detail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!course || !course.published) return null;

    const lessonDocs = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();
    lessonDocs.sort((a, b) => a.order - b.order);

    const pkg = await primaryPackage(ctx, course.level);

    let owned = false;
    const user = await getCurrentUser(ctx);
    if (user && !user.suspended) {
      const levels = await ownedLevels(ctx, user._id);
      owned = levels.has(course.level);
    }

    return {
      course,
      lessons: lessonDocs.map(sanitizeLesson),
      owned,
      region: user?.region ?? null,
      pkg: pkg
        ? {
            _id: pkg._id,
            slug: pkg.slug,
            name: pkg.name,
            priceEur: pkg.priceEur,
            priceXof: pkg.priceXof,
          }
        : null,
    };
  },
});

// ---- Admin ----

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const courses = await ctx.db.query("courses").collect();
    return Promise.all(
      courses.map(async (c) => ({
        ...c,
        ...(await courseMeta(ctx, c._id)),
        ...(await coursePricing(ctx, c)),
      })),
    );
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const courseId = ctx.db.normalizeId("courses", id);
    return courseId ? await ctx.db.get(courseId) : null;
  },
});

async function assertSlugFree(ctx: QueryCtx, slug: string, ignore?: Id<"courses">) {
  const existing = await ctx.db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== ignore) {
    throw new Error(`Le slug « ${slug} » est déjà utilisé par un autre cours.`);
  }
}

export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    level: levelValidator,
    description: v.string(),
    azureContainer: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, { azureContainer, ...args }) => {
    await requireAdmin(ctx);
    await assertSlugFree(ctx, args.slug);
    const id = await ctx.db.insert("courses", {
      ...args,
      azureContainer: azureContainer ?? "course-videos",
    });
    await logAudit(ctx, "course.created", args.slug, args.title);
    return id;
  },
});

/**
 * Create a course together with its lessons in one shot — powers the
 * "choose a number of lessons" form. Lesson order follows array order.
 */
export const createWithLessons = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    level: levelValidator,
    description: v.string(),
    published: v.boolean(),
    lessons: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        videoUrl: v.optional(v.string()),
        blobPath: v.optional(v.string()),
        durationSec: v.optional(v.number()),
        isPreview: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { lessons: lessonInputs, ...courseArgs }) => {
    await requireAdmin(ctx);
    await assertSlugFree(ctx, courseArgs.slug);
    const courseId = await ctx.db.insert("courses", {
      ...courseArgs,
      azureContainer: "course-videos",
    });
    let order = 1;
    for (const l of lessonInputs) {
      if (!l.title.trim()) continue; // skip blank lesson blocks
      await ctx.db.insert("lessons", { ...l, courseId, order: order++ });
    }
    await logAudit(ctx, "course.created", courseArgs.slug, courseArgs.title);
    return courseId;
  },
});

export const update = mutation({
  args: {
    id: v.id("courses"),
    patch: v.object({
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      level: v.optional(levelValidator),
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get(id);
    if (!course) throw new Error("Cours introuvable.");
    if (patch.slug && patch.slug !== course.slug) await assertSlugFree(ctx, patch.slug, id);
    await ctx.db.patch(id, patch);
    await logAudit(
      ctx,
      "published" in patch && Object.keys(patch).length === 1
        ? patch.published
          ? "course.published"
          : "course.unpublished"
        : "course.updated",
      course.slug,
      course.title,
    );
  },
});

export const remove = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get(id);

    const lessonDocs = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", id))
      .collect();
    for (const lesson of lessonDocs) await ctx.db.delete(lesson._id);

    const progressRows = await ctx.db
      .query("progress")
      .filter((q) => q.eq(q.field("courseId"), id))
      .collect();
    for (const row of progressRows) await ctx.db.delete(row._id);

    await ctx.db.delete(id);
    await logAudit(ctx, "course.deleted", course?.slug, course?.title);
  },
});

/** One-time demo seed. Inserts a starter catalogue only if none exist. */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").take(1);
    if (existing.length > 0) return "Des cours existent déjà — seed ignoré.";

    const catalogue = [
      { slug: "introduction-reseaux-securises", title: "Introduction aux Réseaux Sécurisés", level: "Débutant" as const, description: "Comprendre les protocoles TCP/IP et la topologie des réseaux critiques pour identifier les vulnérabilités de base." },
      { slug: "ligne-de-commande-linux", title: "Ligne de Commande Linux", level: "Débutant" as const, description: "Maîtrisez le terminal, le scripting Bash et la gestion des permissions dans un environnement Unix sécurisé." },
      { slug: "cryptographie-appliquee", title: "Cryptographie Appliquée", level: "Intermédiaire" as const, description: "Les mathématiques derrière le chiffrement AES, RSA et les protocoles d'échange de clés modernes." },
      { slug: "pentest-web", title: "Penetration Testing : Web", level: "Intermédiaire" as const, description: "Exploitation de vulnérabilités OWASP Top 10, injection SQL et XSS dans des environnements de laboratoire contrôlés." },
      { slug: "soc-incident-response", title: "SOC & Incident Response", level: "Intermédiaire" as const, description: "Analyse de logs SIEM, détection d'anomalies et mise en place de stratégies de remédiation post-attaque." },
      { slug: "reverse-engineering", title: "Reverse Engineering", level: "Avancé" as const, description: "Désassemblage de malwares, analyse de binaires et exploitation de corruption mémoire sous x64." },
    ];

    for (const c of catalogue) {
      await ctx.db.insert("courses", { ...c, azureContainer: "course-videos", published: true });
    }
    await logAudit(ctx, "course.seeded", undefined, `${catalogue.length} cours`);
    return `${catalogue.length} cours créés.`;
  },
});
