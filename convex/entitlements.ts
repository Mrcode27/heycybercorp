import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

/** Does the current user own this course? (Server-authoritative access check.) */
export const hasAccess = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    const ent = await ctx.db
      .query("entitlements")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", user._id).eq("courseId", courseId),
      )
      .unique();
    return ent !== null;
  },
});

/** Courses the current user has purchased. */
export const myCourses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const courses = await Promise.all(ents.map((e) => ctx.db.get(e.courseId)));
    return courses.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});
