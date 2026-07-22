"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import Stripe from "stripe";

/**
 * Stripe wiring (Phase 4). Everything reads environment variables set on the
 * Convex deployment (`npx convex env set NAME value`, or the dashboard) —
 * no keys in the code:
 *
 *   STRIPE_SECRET_KEY      sk_test_… / sk_live_…
 *   STRIPE_WEBHOOK_SECRET  whsec_… (endpoint: https://<deployment>.convex.site/stripe/webhook)
 *   SITE_URL               https://your-site.vercel.app (no trailing slash)
 *
 * ⚠ SIMULATION MODE: while STRIPE_SECRET_KEY is absent, buying a course
 * "succeeds" instantly without any real payment — the order is recorded with
 * provider "simulation" and access is granted, so the whole student journey
 * is testable with zero keys. The moment the key exists, the same button goes
 * through real Stripe Checkout instead. Do NOT launch publicly without the
 * key set, or courses are effectively free.
 */

function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Create a checkout for one course and return the URL to send the buyer to.
 * The price is derived server-side (orders.createPending) — the client only
 * ever sends a courseId.
 *
 * - Stripe configured  → real Stripe Checkout URL (card / PayPal / SEPA /
 *   Revolut Pay, managed in the Stripe dashboard, not in code).
 * - No key             → SIMULATION: order is marked paid on the spot and a
 *   relative success URL is returned (works on any host, no SITE_URL needed).
 */
export const createCheckoutSession = action({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Connectez-vous pour acheter une formation.");

    const key = process.env.STRIPE_SECRET_KEY;

    // ---- Simulation mode: no Stripe key yet ----
    if (!key) {
      const orderId: Id<"orders"> = await ctx.runMutation(api.orders.createPending, {
        courseId,
        provider: "simulation",
        currency: "EUR",
      });
      const info = await ctx.runQuery(internal.orders.getWithCourse, { orderId });
      if (!info) throw new Error("Commande introuvable.");
      await ctx.runMutation(internal.orders.markPaid, {
        orderId,
        providerRef: `SIM-${orderId.slice(-8).toUpperCase()}`,
      });
      return `/formations/${info.course.slug}?paiement=simulation`;
    }

    // ---- Real Stripe ----
    const stripe = new Stripe(key);

    // Pending order first: server-side price, and the id rides along in
    // metadata so the webhook knows exactly what was bought.
    const orderId: Id<"orders"> = await ctx.runMutation(api.orders.createPending, {
      courseId,
      provider: "stripe",
      currency: "EUR", // African mobile-money (XOF) arrives in Phase 7
    });
    const info = await ctx.runQuery(internal.orders.getWithCourse, { orderId });
    if (!info) throw new Error("Commande introuvable.");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: info.userEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: info.order.amount, // cents, from the DB
            product_data: {
              name: info.course.title,
              description: `Formation heycybercorp — accès à vie (${info.course.level})`,
            },
          },
        },
      ],
      metadata: { orderId },
      success_url: `${siteUrl()}/formations/${info.course.slug}?paiement=succes`,
      cancel_url: `${siteUrl()}/formations/${info.course.slug}?paiement=annule`,
    });

    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
    return session.url;
  },
});

/**
 * Verify + process a webhook event. Runs in the Node runtime because the
 * Stripe SDK needs real crypto; convex/http.ts forwards the raw payload here.
 */
export const fulfill = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!key || !webhookSecret) {
      console.error("STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET manquant — webhook ignoré.");
      return { success: false };
    }

    let event: Stripe.Event;
    try {
      event = await new Stripe(key).webhooks.constructEventAsync(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error("Signature Stripe invalide:", err);
      return { success: false };
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.expired"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as Id<"orders"> | undefined;
      if (!orderId) return { success: true }; // not one of ours

      if (event.type === "checkout.session.completed") {
        await ctx.runMutation(internal.orders.markPaid, {
          orderId,
          providerRef: session.id,
        });
      } else {
        await ctx.runMutation(internal.orders.markFailed, { orderId });
      }
    }

    return { success: true };
  },
});
