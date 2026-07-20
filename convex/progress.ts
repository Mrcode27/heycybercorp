import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

/** Upsert watch progress for a lesson. */
export const record = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    secondsWatched: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, { lessonId, courseId, secondsWatched, completed }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

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
      return existing._id;
    }

    return await ctx.db.insert("progress", {
      userId: user._id,
      lessonId,
      courseId,
      secondsWatched,
      completedAt,
    });
  },
});

/** Progress rows for the current user across one course. */
export const forCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("courseId"), courseId))
      .collect();
  },
});
