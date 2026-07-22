import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { logAudit } from "./lib/audit";

/**
 * Resolve what the player is allowed to show for one lesson.
 * Server-authoritative: the raw video source never reaches users
 * without an entitlement (or `isPreview`).
 *
 * Phase 3 (Azure): when `blobPath` is set and Azure creds are configured,
 * replace the `kind: "azure"` branch with an action that mints a short-lived
 * SAS URL (container from `course.azureContainer`, blob from `lesson.blobPath`).
 */
export const playback = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) return { allowed: false as const, reason: "introuvable" };
    const course = await ctx.db.get(lesson.courseId);
    if (!course || !course.published) {
      return { allowed: false as const, reason: "introuvable" };
    }

    const user = await getCurrentUser(ctx);
    if (user?.suspended) return { allowed: false as const, reason: "suspendu" };

    let allowed = lesson.isPreview;
    if (!allowed && user) {
      const ent = await ctx.db
        .query("entitlements")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", user._id).eq("courseId", lesson.courseId),
        )
        .unique();
      allowed = ent !== null;
    }
    if (!allowed) return { allowed: false as const, reason: "non-acheté" };

    if (lesson.videoUrl) {
      return { allowed: true as const, kind: "url" as const, url: lesson.videoUrl };
    }
    if (lesson.blobPath) {
      // Azure not wired yet — the player shows a "video being uploaded" state.
      return { allowed: true as const, kind: "azure" as const, url: null };
    }
    return { allowed: true as const, kind: "none" as const, url: null };
  },
});

// ---- Admin ----

/** Full lesson docs for one course, ordered — admin lesson manager. */
export const adminListForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    await requireAdmin(ctx);
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
    return lessons.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    blobPath: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    isPreview: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Cours introuvable.");

    const siblings = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    const order = siblings.reduce((max, l) => Math.max(max, l.order), 0) + 1;

    const id = await ctx.db.insert("lessons", { ...args, order });
    await logAudit(ctx, "lesson.created", course.slug, args.title);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("lessons"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      blobPath: v.optional(v.string()),
      durationSec: v.optional(v.number()),
      isPreview: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get(id);
    if (!lesson) throw new Error("Leçon introuvable.");
    await ctx.db.patch(id, patch);
    await logAudit(ctx, "lesson.updated", lesson.title);
  },
});

export const remove = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get(id);
    if (!lesson) return;

    // Drop everyone's progress on this lesson so course % stays accurate.
    const rows = await ctx.db
      .query("progress")
      .filter((q) => q.eq(q.field("lessonId"), id))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);

    await ctx.db.delete(id);
    await logAudit(ctx, "lesson.deleted", lesson.title);
  },
});

/** Swap a lesson with its neighbour above/below (admin reorder buttons). */
export const move = mutation({
  args: { id: v.id("lessons"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get(id);
    if (!lesson) throw new Error("Leçon introuvable.");

    const siblings = (
      await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", lesson.courseId))
        .collect()
    ).sort((a, b) => a.order - b.order);

    const idx = siblings.findIndex((l) => l._id === id);
    const swapWith = direction === "up" ? siblings[idx - 1] : siblings[idx + 1];
    if (!swapWith) return; // already at the edge

    await ctx.db.patch(lesson._id, { order: swapWith.order });
    await ctx.db.patch(swapWith._id, { order: lesson.order });
  },
});
