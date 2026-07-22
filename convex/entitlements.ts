import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { logAudit } from "./lib/audit";

/** Does the current user own this course? (Server-authoritative access check.) */
export const hasAccess = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return false;
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
    if (!user || user.suspended) return [];
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const courses = await Promise.all(ents.map((e) => ctx.db.get(e.courseId)));
    return courses.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

/** Just the owned course ids — cheap "possédé" badges on the public catalogue. */
export const myCourseIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return [];
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return ents.map((e) => e.courseId);
  },
});

/**
 * Owned courses + real completion state. Powers "Mes formations" cards
 * (progress bar + Continuer) and the certifications page.
 */
export const myCoursesWithProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return [];

    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = [];
    for (const ent of ents) {
      const course = await ctx.db.get(ent.courseId);
      if (!course) continue;

      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect();
      const progressRows = await ctx.db
        .query("progress")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", user._id).eq("courseId", course._id),
        )
        .collect();
      const completed = progressRows.filter((p) => p.completedAt).length;
      const total = lessons.length;

      const certificate = await ctx.db
        .query("certificates")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", user._id).eq("courseId", course._id),
        )
        .unique();

      results.push({
        ...course,
        totalLessons: total,
        completedLessons: Math.min(completed, total),
        pct: total === 0 ? 0 : Math.round((Math.min(completed, total) / total) * 100),
        certificateCode: certificate?.code ?? null,
        grantedAt: ent.grantedAt,
      });
    }
    return results;
  },
});

// ---- Admin ----

/**
 * Manually grant a course to a user (offline payment, promo, support gesture).
 * Records a paid "manual" order so it shows up in Ventes, then the entitlement.
 */
export const grant = mutation({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, { userId, courseId }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    const course = await ctx.db.get(courseId);
    if (!user || !course) throw new Error("Utilisateur ou cours introuvable.");

    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", courseId),
      )
      .unique();
    if (existing) throw new Error("Cet utilisateur possède déjà ce cours.");

    const currency = user.region === "AFRIQUE" ? "XOF" : "EUR";
    const orderId = await ctx.db.insert("orders", {
      userId,
      courseId,
      provider: "manual",
      amount: currency === "XOF" ? course.priceXof : course.priceEur,
      currency,
      status: "paid",
    });
    await ctx.db.insert("entitlements", {
      userId,
      courseId,
      orderId,
      grantedAt: Date.now(),
    });
    await logAudit(ctx, "entitlement.granted", user.email, course.title);
  },
});

/** Remove a user's access to a course. Order history is kept. */
export const revoke = mutation({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, { userId, courseId }) => {
    await requireAdmin(ctx);
    const ent = await ctx.db
      .query("entitlements")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", courseId),
      )
      .unique();
    if (!ent) return;
    await ctx.db.delete(ent._id);

    const [user, course] = await Promise.all([
      ctx.db.get(userId),
      ctx.db.get(courseId),
    ]);
    await logAudit(ctx, "entitlement.revoked", user?.email, course?.title);
  },
});

/** Per-user entitlements for the admin users table (grant/revoke panel). */
export const forUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return Promise.all(
      ents.map(async (e) => ({
        courseId: e.courseId,
        courseTitle: (await ctx.db.get(e.courseId))?.title ?? "—",
        grantedAt: e.grantedAt,
      })),
    );
  },
});
