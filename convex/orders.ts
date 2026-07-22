import { mutation, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";

const providerValidator = v.union(
  v.literal("stripe"),
  v.literal("pawapay"),
  v.literal("paydunya"),
  v.literal("manual"),
  v.literal("simulation"),
);

/**
 * Create a pending order for a PACKAGE before redirecting to the payment
 * provider. Amount is derived server-side from the package price.
 */
export const createPending = mutation({
  args: {
    packageId: v.id("packages"),
    provider: providerValidator,
    currency: v.union(v.literal("EUR"), v.literal("XOF")),
  },
  handler: async (ctx, { packageId, provider, currency }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const pkg = await ctx.db.get(packageId);
    if (!pkg) throw new Error("Package introuvable.");

    const amount = currency === "EUR" ? pkg.priceEur : pkg.priceXof;
    return await ctx.db.insert("orders", {
      userId: user._id,
      packageId,
      provider,
      amount,
      currency,
      status: "pending",
    });
  },
});

/** Order + package + buyer email — used by the Stripe checkout action. */
export const getWithPackage = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order || !order.packageId) return null;
    const [pkg, user] = await Promise.all([
      ctx.db.get(order.packageId),
      ctx.db.get(order.userId),
    ]);
    if (!pkg || !user) return null;
    return { order, pkg, userEmail: user.email };
  },
});

/**
 * Mark an order paid and grant the package entitlement. INTERNAL — only from a
 * verified payment webhook / checkout action. Idempotent.
 */
export const markPaid = internalMutation({
  args: { orderId: v.id("orders"), providerRef: v.string() },
  handler: async (ctx, { orderId, providerRef }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "paid") return;
    await ctx.db.patch(orderId, { status: "paid", providerRef });
    if (!order.packageId) return;

    const existing = await ctx.db
      .query("entitlements")
      .withIndex("by_user_package", (q) =>
        q.eq("userId", order.userId).eq("packageId", order.packageId!),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("entitlements", {
        userId: order.userId,
        packageId: order.packageId,
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
        label: o.packageId
          ? ((await ctx.db.get(o.packageId))?.name ?? "Package")
          : o.courseId
            ? ((await ctx.db.get(o.courseId))?.title ?? "Formation")
            : "—",
      })),
    );
  },
});

/** All orders with buyer + package info — admin only (the Ventes page). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").order("desc").collect();
    return Promise.all(
      orders.map(async (o) => {
        const [user, label] = await Promise.all([
          ctx.db.get(o.userId),
          (async () =>
            o.packageId
              ? ((await ctx.db.get(o.packageId))?.name ?? "Package")
              : o.courseId
                ? ((await ctx.db.get(o.courseId))?.title ?? "Formation")
                : "—")(),
        ]);
        return { ...o, label, userEmail: user?.email ?? "—" };
      }),
    );
  },
});
