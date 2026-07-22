import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public certificate verification — anyone with the code (QR, CV, recruiter)
 * can confirm it's genuine. Returns only what belongs on the diploma.
 */
export const verify = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();
    if (!cert) return null;

    const [user, course] = await Promise.all([
      ctx.db.get(cert.userId),
      ctx.db.get(cert.courseId),
    ]);

    return {
      code: cert.code,
      issuedAt: cert.issuedAt,
      studentName: user?.name || user?.email || "Étudiant heycybercorp",
      courseTitle: course?.title ?? "Formation heycybercorp",
      courseLevel: course?.level ?? null,
    };
  },
});
