import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { ownedLevels } from "./entitlements";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/** Random, unguessable certificate code, e.g. HCC-2026-8F3KQ2ZL. */
function makeCertCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let tail = "";
  for (let i = 0; i < 8; i++) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `HCC-${new Date().getFullYear()}-${tail}`;
}

/** Issue the course certificate once every lesson is completed. Idempotent. */
async function maybeIssueCertificate(ctx: MutationCtx, user: Doc<"users">, courseId: Doc<"courses">["_id"]) {
  const existing = await ctx.db
    .query("certificates")
    .withIndex("by_user_course", (q) =>
      q.eq("userId", user._id).eq("courseId", courseId),
    )
    .unique();
  if (existing) return existing.code;

  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();
  if (lessons.length === 0) return null;

  const rows = await ctx.db
    .query("progress")
    .withIndex("by_user_course", (q) =>
      q.eq("userId", user._id).eq("courseId", courseId),
    )
    .collect();
  const completedLessonIds = new Set(
    rows.filter((r) => r.completedAt).map((r) => r.lessonId),
  );
  const allDone = lessons.every((l) => completedLessonIds.has(l._id));
  if (!allDone) return null;

  const code = makeCertCode();
  await ctx.db.insert("certificates", {
    userId: user._id,
    courseId,
    code,
    issuedAt: Date.now(),
  });
  return code;
}

/**
 * Upsert watch progress for a lesson. Only owners (or preview lessons) may
 * record progress; completing the last lesson auto-issues the certificate.
 * Returns the certificate code when this call earned it, else null.
 */
export const record = mutation({
  args: {
    lessonId: v.id("lessons"),
    secondsWatched: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, { lessonId, secondsWatched, completed }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.suspended) throw new Error("Compte suspendu.");

    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Leçon introuvable.");

    if (!lesson.isPreview) {
      const course = await ctx.db.get(lesson.courseId);
      const levels = await ownedLevels(ctx, user._id);
      if (!course || !levels.has(course.level)) {
        throw new Error("Vous ne possédez pas ce cours.");
      }
    }

    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", user._id).eq("lessonId", lessonId),
      )
      .unique();

    const completedAt = completed ? Date.now() : undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        secondsWatched: Math.max(existing.secondsWatched, secondsWatched),
        completedAt: existing.completedAt ?? completedAt,
      });
    } else {
      await ctx.db.insert("progress", {
        userId: user._id,
        lessonId,
        courseId: lesson.courseId,
        secondsWatched,
        completedAt,
      });
    }

    if (completed) {
      return await maybeIssueCertificate(ctx, user, lesson.courseId);
    }
    return null;
  },
});

/** Progress rows for the current user across one course (the player sidebar). */
export const forCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", user._id).eq("courseId", courseId),
      )
      .collect();
  },
});
