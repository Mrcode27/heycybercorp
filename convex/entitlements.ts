import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { logAudit } from "./lib/audit";
import type { Doc, Id } from "./_generated/dataModel";
import type { Level } from "./packages";

/** The set of course levels a user can access, from all packages they own. */
export async function ownedLevels(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Set<Level>> {
  const ents = await ctx.db
    .query("entitlements")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const levels = new Set<Level>();
  for (const ent of ents) {
    if (!ent.packageId) continue;
    const pkg = await ctx.db.get(ent.packageId);
    if (pkg) pkg.levels.forEach((l) => levels.add(l));
  }
  return levels;
}

/** Published courses the user can access (level covered by an owned package). */
async function accessibleCourses(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"courses">[]> {
  const levels = await ownedLevels(ctx, userId);
  if (levels.size === 0) return [];
  const courses = await ctx.db
    .query("courses")
    .filter((q) => q.eq(q.field("published"), true))
    .collect();
  return courses.filter((c) => levels.has(c.level));
}

/** Does the current user own a package covering this course? */
export const hasAccess = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return false;
    const course = await ctx.db.get(courseId);
    if (!course) return false;
    const levels = await ownedLevels(ctx, user._id);
    return levels.has(course.level);
  },
});

/** Does the current user own this specific package? */
export const hasPackage = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, { packageId }) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return false;
    const ent = await ctx.db
      .query("entitlements")
      .withIndex("by_user_package", (q) =>
        q.eq("userId", user._id).eq("packageId", packageId),
      )
      .unique();
    return ent !== null;
  },
});

/** Courses the current user can access. */
export const myCourses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return [];
    return accessibleCourses(ctx, user._id);
  },
});

/** Just the accessible course ids — cheap "possédé" badges on the catalogue. */
export const myCourseIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return [];
    return (await accessibleCourses(ctx, user._id)).map((c) => c._id);
  },
});

/** Accessible courses + real completion state (dashboard + certifications). */
export const myCoursesWithProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) return [];
    const courses = await accessibleCourses(ctx, user._id);

    const results = [];
    for (const course of courses) {
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
      });
    }
    return results;
  },
});

// ---- Admin ----

/** Grant a package to a user (records a paid "manual" order, then access). */
export const grant = mutation({
  args: { userId: v.id("users"), packageId: v.id("packages") },
  handler: async (ctx, { userId, packageId }) => {
    await requireAdmin(ctx);
    const [user, pkg] = await Promise.all([ctx.db.get(userId), ctx.db.get(packageId)]);
    if (!user || !pkg) throw new Error("Utilisateur ou package introuvable.");

    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_user_package", (q) =>
        q.eq("userId", userId).eq("packageId", packageId),
      )
      .unique();
    if (existing) throw new Error("Cet utilisateur possède déjà ce package.");

    const currency = user.region === "AFRIQUE" ? "XOF" : "EUR";
    const orderId = await ctx.db.insert("orders", {
      userId,
      packageId,
      provider: "manual",
      amount: currency === "XOF" ? pkg.priceXof : pkg.priceEur,
      currency,
      status: "paid",
    });
    await ctx.db.insert("entitlements", { userId, packageId, orderId, grantedAt: Date.now() });
    await logAudit(ctx, "entitlement.granted", user.email, pkg.name);
  },
});

export const revoke = mutation({
  args: { userId: v.id("users"), packageId: v.id("packages") },
  handler: async (ctx, { userId, packageId }) => {
    await requireAdmin(ctx);
    const ent = await ctx.db
      .query("entitlements")
      .withIndex("by_user_package", (q) =>
        q.eq("userId", userId).eq("packageId", packageId),
      )
      .unique();
    if (!ent) return;
    await ctx.db.delete(ent._id);
    const [user, pkg] = await Promise.all([ctx.db.get(userId), ctx.db.get(packageId)]);
    await logAudit(ctx, "entitlement.revoked", user?.email, pkg?.name);
  },
});

/** Packages a user owns — admin users table grant/revoke panel. */
export const forUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const ents = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const rows = [];
    for (const e of ents) {
      if (!e.packageId) continue;
      const pkg = await ctx.db.get(e.packageId);
      rows.push({
        packageId: e.packageId,
        packageName: pkg?.name ?? "—",
        grantedAt: e.grantedAt,
      });
    }
    return rows;
  },
});
