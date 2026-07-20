import { query } from "./_generated/server";
import { requireAdmin } from "./users";

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
