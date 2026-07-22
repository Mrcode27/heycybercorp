import { query } from "./_generated/server";
import { requireAdmin } from "./users";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

/** High-level counts for the admin overview. Admin only. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, courses, entitlements, orders] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("courses").collect(),
      ctx.db.query("entitlements").collect(),
      ctx.db.query("orders").collect(),
    ]);
    return {
      users: users.length,
      courses: courses.length,
      published: courses.filter((c) => c.published).length,
      accessGranted: entitlements.length,
      paidOrders: orders.filter((o) => o.status === "paid").length,
    };
  },
});

/**
 * Live analytics for /admin/rapports, computed from real orders, users,
 * entitlements and progress. Tables are small enough for full scans today;
 * revisit with aggregates if the platform grows past ~10k rows per table.
 */
export const analytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, courses, entitlements, orders, progress, lessons] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("courses").collect(),
        ctx.db.query("entitlements").collect(),
        ctx.db.query("orders").collect(),
        ctx.db.query("progress").collect(),
        ctx.db.query("lessons").collect(),
      ]);

    const now = Date.now();
    const paid = orders.filter((o) => o.status === "paid");

    // --- 6 monthly buckets (oldest → newest) for the charts ---
    const buckets: { key: string; label: string; eur: number; xof: number; signups: number }[] = [];
    const anchor = new Date(now);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        eur: 0,
        xof: 0,
        signups: 0,
      });
    }
    const bucketOf = (ts: number) => {
      const d = new Date(ts);
      return buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
    };
    for (const o of paid) {
      const b = bucketOf(o._creationTime);
      if (!b) continue;
      if (o.currency === "EUR") b.eur += o.amount / 100;
      else b.xof += o.amount;
    }
    for (const u of users) {
      const b = bucketOf(u._creationTime);
      if (b) b.signups += 1;
    }

    // --- 30-day KPIs vs the previous 30 days ---
    const in30 = (ts: number) => ts > now - 30 * DAY_MS;
    const inPrev30 = (ts: number) => ts > now - 60 * DAY_MS && ts <= now - 30 * DAY_MS;
    const sumRevenue = (filter: (ts: number) => boolean) =>
      paid.reduce(
        (acc, o) => {
          if (!filter(o._creationTime)) return acc;
          if (o.currency === "EUR") acc.eur += o.amount / 100;
          else acc.xof += o.amount;
          return acc;
        },
        { eur: 0, xof: 0 },
      );

    // --- Top courses by number of accesses (all time) ---
    const countByCourse = new Map<string, number>();
    for (const e of entitlements) {
      countByCourse.set(e.courseId, (countByCourse.get(e.courseId) ?? 0) + 1);
    }
    const topCourses = [...countByCourse.entries()]
      .map(([courseId, count]) => ({
        title: courses.find((c) => c._id === courseId)?.title ?? "—",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- Average completion across every (user, owned course) pair ---
    const lessonsByCourse = new Map<string, number>();
    for (const l of lessons) {
      lessonsByCourse.set(l.courseId, (lessonsByCourse.get(l.courseId) ?? 0) + 1);
    }
    const completedByUserCourse = new Map<string, number>();
    for (const p of progress) {
      if (!p.completedAt) continue;
      const key = `${p.userId}:${p.courseId}`;
      completedByUserCourse.set(key, (completedByUserCourse.get(key) ?? 0) + 1);
    }
    let pctSum = 0;
    let pctCount = 0;
    for (const e of entitlements) {
      const total = lessonsByCourse.get(e.courseId) ?? 0;
      if (total === 0) continue;
      const done = completedByUserCourse.get(`${e.userId}:${e.courseId}`) ?? 0;
      pctSum += Math.min(done / total, 1);
      pctCount += 1;
    }

    return {
      months: buckets.map(({ label, eur, xof, signups }) => ({ label, eur, xof, signups })),
      revenue30d: sumRevenue(in30),
      revenuePrev30d: sumRevenue(inPrev30),
      newStudents30d: users.filter((u) => in30(u._creationTime)).length,
      newStudentsPrev30d: users.filter((u) => inPrev30(u._creationTime)).length,
      paidOrders30d: paid.filter((o) => in30(o._creationTime)).length,
      completionPct: pctCount === 0 ? null : Math.round((pctSum / pctCount) * 100),
      topCourses,
    };
  },
});
