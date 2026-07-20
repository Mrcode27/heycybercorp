import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";

const providerValidator = v.union(
  v.literal("stripe"),
  v.literal("pawapay"),
  v.literal("paydunya"),
);

/**
 * Create a pending order before redirecting the buyer to the payment provider.
 * Amount is derived server-side from the course price (never trust the client).
 */
export const createPending = mutation({
  args: {
    courseId: v.id("courses"),
    provider: providerValidator,
    currency: v.union(v.literal("EUR"), v.literal("XOF")),
  },
  handler: async (ctx, { courseId, provider, currency }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const course = await ctx.db.get(courseId);
    if (!course) throw new Error("Course not found");

    const amount = currency === "EUR" ? course.priceEur : course.priceXof;
    return await ctx.db.insert("orders", {
      userId: user._id,
      courseId,
      provider,
      amount,
      currency,
      status: "pending",
    });
  },
});

/**
 * Mark an order paid and grant the entitlement. INTERNAL — only callable from a
 * verified payment webhook (Convex httpAction), never from the client. Idempotent.
 */
export const markPaid = internalMutation({
  args: { orderId: v.id("orders"), providerRef: v.string() },
  handler: async (ctx, { orderId, providerRef }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "paid") return;

    await ctx.db.patch(orderId, { status: "paid", providerRef });

    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", order.userId).eq("courseId", order.courseId),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("entitlements", {
        userId: order.userId,
        courseId: order.courseId,
        orderId,
        grantedAt: Date.now(),
      });
    }
  },
});

export const markFailed = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "paid") return;
    await ctx.db.patch(orderId, { status: "failed" });
  },
});

/** The current user's own orders (purchase history), newest first. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return Promise.all(
      orders.map(async (o) => ({
        ...o,
        courseTitle: (await ctx.db.get(o.courseId))?.title ?? "—",
      })),
    );
  },
});

/** All orders with buyer + course info — admin only (the Ventes page). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").order("desc").collect();
    return Promise.all(
      orders.map(async (o) => {
        const [course, user] = await Promise.all([
          ctx.db.get(o.courseId),
          ctx.db.get(o.userId),
        ]);
        return {
          ...o,
          courseTitle: course?.title ?? "—",
          userEmail: user?.email ?? "—",
        };
      }),
    );
  },
});
