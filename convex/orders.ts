import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";

/**
 * Create a pending order for a PACKAGE before redirecting to Stripe Checkout.
 * INTERNAL — only `stripe.createCheckoutSession` may call it, so the provider
 * and the amount are always decided server-side. The client never sends a
 * price, a currency or a provider.
 */
export const createPending = internalMutation({
  args: {
    packageId: v.id("packages"),
    currency: v.union(v.literal("EUR"), v.literal("XOF")),
  },
  handler: async (ctx, { packageId, currency }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.suspended) throw new Error("Ce compte est suspendu.");
    const pkg = await ctx.db.get(packageId);
    if (!pkg) throw new Error("Package introuvable.");
    if (!pkg.published) throw new Error("Ce pack n'est pas disponible à la vente.");

    const already = await ctx.db
      .query("entitlements")
      .withIndex("by_user_package", (q) =>
        q.eq("userId", user._id).eq("packageId", packageId),
      )
      .unique();
    if (already) throw new Error("Vous possédez déjà ce pack.");

    const amount = currency === "EUR" ? pkg.priceEur : pkg.priceXof;
    if (!amount || amount <= 0) {
      throw new Error("Le prix de ce pack n'est pas configuré.");
    }
    return await ctx.db.insert("orders", {
      userId: user._id,
      packageId,
      provider: "stripe",
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
 * Record the Stripe Checkout session id on a still-pending order, so an
 * abandoned/expired session can always be traced back to its order (admin
 * Ventes table, Stripe dashboard cross-check).
 */
export const attachProviderRef = internalMutation({
  args: { orderId: v.id("orders"), providerRef: v.string() },
  handler: async (ctx, { orderId, providerRef }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status !== "pending") return;
    await ctx.db.patch(orderId, { providerRef });
  },
});

/**
 * Turn the raw `orderId` string carried on a Stripe session into a real order
 * id, or null when it is not one of ours.
 *
 * Stripe metadata is just free-form text: a session created outside this app,
 * or a replayed event from another project, can carry anything at all. Feeding
 * that straight into a `v.id("orders")` argument would throw, the webhook would
 * answer 500, and Stripe would retry the same doomed event for days. Resolving
 * it first turns "not ours" into a quiet 200 instead.
 */
export const resolveId = internalQuery({
  args: { raw: v.string() },
  handler: async (ctx, { raw }) => ctx.db.normalizeId("orders", raw),
});

/**
 * Status of one of the CALLER'S OWN orders, or null if it isn't theirs.
 * Used by `stripe.confirmCheckout` to make sure a buyer can only confirm the
 * session they actually paid for.
 */
export const statusOfMine = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== user._id) return null;
    return order.status;
  },
});

/**
 * Mark an order paid and grant the package entitlement. INTERNAL — reached
 * only from a Stripe-signature-verified webhook or from a checkout session
 * re-read straight from the Stripe API. Idempotent: replaying the same event
 * (Stripe retries) neither double-charges nor double-grants.
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

/**
 * Money went back to the buyer, so the access it bought goes away with it.
 * Driven by the `charge.refunded` webhook — refunding in the Stripe dashboard
 * is the whole action, nobody has to remember to revoke by hand afterwards.
 *
 * Only the entitlement created by THIS order is removed: a buyer who also owns
 * another pack, or who was granted one manually, keeps that access.
 */
export const markRefunded = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "refunded") return;
    await ctx.db.patch(orderId, { status: "refunded" });

    const granted = await ctx.db
      .query("entitlements")
      .withIndex("by_user", (q) => q.eq("userId", order.userId))
      .collect();
    for (const ent of granted) {
      if (ent.orderId === orderId) await ctx.db.delete(ent._id);
    }
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
