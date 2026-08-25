"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import Stripe from "stripe";

/**
 * Stripe payments. There is NO simulation / test-bypass path: a purchase can
 * only ever be granted by money actually moving through Stripe. Every secret
 * lives in the Convex deployment environment (`npx convex env set NAME value`,
 * or the dashboard → Settings → Environment Variables) — never in the repo:
 *
 *   STRIPE_SECRET_KEY      sk_test_… in dev, sk_live_… in production
 *   STRIPE_WEBHOOK_SECRET  whsec_… for the endpoint
 *                          https://<deployment>.convex.site/stripe/webhook
 *   SITE_URL               canonical origin Stripe returns the buyer to, no
 *                          trailing slash (e.g. https://www.heycybercorp.fr).
 *                          Doubles as the allowlist for the origin the
 *                          browser proposes — see returnOrigin.
 *
 * Going live is therefore a pure configuration swap — set the three live
 * values on the production deployment, change nothing in this file.
 *
 * Access is granted by `orders.markPaid`, which is internal and reachable from
 * exactly two places, both of which prove payment:
 *   1. `fulfill` — a webhook whose Stripe signature verified;
 *   2. `confirmCheckout` — the session re-read from the Stripe API on return.
 * Both are idempotent, so the two racing on the same order is harmless.
 */

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Split audience: the operator needs the variable name, the visitor needs
    // a sentence that doesn't expose our configuration.
    console.error(
      "STRIPE_SECRET_KEY absente de ce déploiement Convex — checkout impossible.",
    );
    throw new Error(
      "Le paiement est momentanément indisponible. Réessayez plus tard ou contactez-nous.",
    );
  }
  return new Stripe(key);
}

/** Test-mode dev servers, whatever port Next picked. */
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

/**
 * Origin Stripe sends the buyer back to.
 *
 * One Convex deployment serves both the local dev server and the deployed
 * site, so a single hard-coded SITE_URL would bounce local test payments to
 * production. The browser therefore proposes its own origin — and it is only
 * honoured if it is on the allowlist (SITE_URL itself, plus localhost while a
 * test key is in use). Anything else is ignored rather than rejected, so a
 * caller crafting an `origin` can never turn our checkout into an open
 * redirect. With no SITE_URL and a live key it throws: a misconfigured
 * production deployment must fail loudly, not strand real customers.
 */
function returnOrigin(requested?: string): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");
  const testMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;

  const asked = requested?.trim().replace(/\/$/, "");
  if (asked && (asked === configured || (testMode && LOCALHOST.test(asked)))) {
    return asked;
  }
  if (configured) return configured;
  if (testMode) return "http://localhost:3000";
  console.error(
    "SITE_URL absente d'un déploiement en clé live — URLs de retour Stripe impossibles.",
  );
  throw new Error(
    "Le paiement est momentanément indisponible. Réessayez plus tard ou contactez-nous.",
  );
}

/** True once Stripe considers the money collected (or nothing was owed). */
function isSettled(session: Stripe.Checkout.Session): boolean {
  return (
    session.payment_status === "paid" || session.payment_status === "no_payment_required"
  );
}

/**
 * The raw `orderId` string a session carries, before any validation. Never
 * treat it as an Id: run it through `orders.resolveId` first (see there).
 */
function rawOrderId(session: Stripe.Checkout.Session): string | undefined {
  return session.metadata?.orderId || undefined;
}

/**
 * Start a real Stripe Checkout for one package and return the URL to send the
 * buyer to. The client only ever sends a packageId: the price, the currency
 * and the provider are all derived server-side in `orders.createPending`,
 * which also refuses a pack the caller already owns.
 *
 * Payment methods (card, PayPal, SEPA, Revolut Pay…) are deliberately NOT
 * listed here — they come from the Stripe Dashboard's payment-method
 * settings, so enabling one later needs no deploy.
 */
export const createCheckoutSession = action({
  args: {
    packageId: v.id("packages"),
    /** window.location.origin — honoured only if allowlisted, see returnOrigin. */
    origin: v.optional(v.string()),
  },
  handler: async (ctx, { packageId, origin: requestedOrigin }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Connectez-vous pour acheter un pack.");

    const stripe = stripeClient();
    const origin = returnOrigin(requestedOrigin);

    // Pending order first: the id rides along in metadata so the webhook can
    // tell exactly what was bought, without trusting anything from the client.
    const orderId: Id<"orders"> = await ctx.runMutation(internal.orders.createPending, {
      packageId,
      currency: "EUR", // African mobile-money (XOF) arrives in Phase 7
    });
    const info = await ctx.runQuery(internal.orders.getWithPackage, { orderId });
    if (!info) throw new Error("Commande introuvable.");

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "fr",
        customer_email: info.userEmail || undefined,
        client_reference_id: orderId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: info.order.amount, // cents, straight from the DB
              product_data: {
                name: `Pack ${info.pkg.name}`,
                description: `heycybercorp — accès à vie à toutes les formations du pack ${info.pkg.name}`,
              },
            },
          },
        ],
        metadata: { orderId, packageSlug: info.pkg.slug },
        // Same metadata on the PaymentIntent: that is what shows up on the
        // payment itself in the Stripe dashboard (and on any dispute).
        payment_intent_data: { metadata: { orderId, packageSlug: info.pkg.slug } },
        success_url: `${origin}/tarifs?paiement=succes&pack=${info.pkg.slug}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/tarifs?paiement=annule&pack=${info.pkg.slug}`,
      },
      // A network retry of this very call must not create a second session.
      { idempotencyKey: `checkout:${orderId}` },
    );

    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
    await ctx.runMutation(internal.orders.attachProviderRef, {
      orderId,
      providerRef: session.id,
    });
    return session.url;
  },
});

/** What the buyer's return page is told about their payment. */
export type CheckoutOutcome = "paid" | "processing" | "failed" | "unknown";

/**
 * Confirm a checkout straight from the Stripe API when the buyer lands back on
 * the site. This is a safety net, not the primary path: the webhook is what
 * makes fulfilment reliable (it fires even if the buyer closes the tab). But
 * webhooks can lag a few seconds, and are not delivered at all until the
 * endpoint is registered — this keeps the return page honest either way.
 *
 * Only the buyer's own session counts: the orderId read back from Stripe must
 * belong to the caller, so pasting someone else's session_id does nothing.
 */
export const confirmCheckout = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }): Promise<CheckoutOutcome> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "unknown";
    if (!sessionId.startsWith("cs_")) return "unknown";

    let session: Stripe.Checkout.Session;
    try {
      session = await stripeClient().checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error("Session Stripe illisible:", err);
      return "unknown";
    }

    const raw = rawOrderId(session);
    if (!raw) return "unknown";
    const orderId = await ctx.runQuery(internal.orders.resolveId, { raw });
    if (!orderId) return "unknown";

    // Ownership check: null means "not this caller's order".
    const status = await ctx.runQuery(internal.orders.statusOfMine, { orderId });
    if (status === null) return "unknown";
    if (status === "paid") return "paid";

    if (isSettled(session)) {
      await ctx.runMutation(internal.orders.markPaid, {
        orderId,
        providerRef: session.id,
      });
      return "paid";
    }
    // SEPA and other delayed methods sit here until the bank confirms; the
    // async_payment_succeeded webhook finishes the job.
    return session.status === "expired" ? "failed" : "processing";
  },
});

/**
 * Verify + process a webhook event. Runs in the Node runtime because the
 * Stripe SDK needs real crypto; convex/http.ts forwards the raw payload here.
 *
 * An unverifiable signature is answered with a 400 and nothing is granted —
 * that signature check is the only thing standing between a forged POST and
 * free access, so it is never skipped, not even in development.
 */
export const fulfill = internalAction({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!key || !webhookSecret) {
      console.error("STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET manquant — webhook rejeté.");
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

    // Resolve the session's metadata to one of our orders, or null for an
    // event that simply isn't ours (a test ping, another integration).
    const orderOf = async (session: Stripe.Checkout.Session) => {
      const raw = rawOrderId(session);
      return raw ? await ctx.runQuery(internal.orders.resolveId, { raw }) : null;
    };

    switch (event.type) {
      // Checkout finished. For cards this already means paid; for delayed
      // methods (SEPA…) payment_status is still "unpaid" here and the order
      // must stay pending until async_payment_succeeded arrives.
      case "checkout.session.completed": {
        const session = event.data.object;
        if (!isSettled(session)) break;
        const orderId = await orderOf(session);
        if (orderId) {
          await ctx.runMutation(internal.orders.markPaid, {
            orderId,
            providerRef: session.id,
          });
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderId = await orderOf(session);
        if (orderId) {
          await ctx.runMutation(internal.orders.markPaid, {
            orderId,
            providerRef: session.id,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const orderId = await orderOf(event.data.object);
        if (orderId) await ctx.runMutation(internal.orders.markFailed, { orderId });
        break;
      }
      // Refunds arrive on the charge, which carries no session — but the
      // PaymentIntent does carry our metadata (set in payment_intent_data
      // above), so one lookup gets us back to the order.
      case "charge.refunded": {
        const charge = event.data.object;
        // A partial refund (goodwill gesture, price correction) is not a
        // cancelled sale — only give the access back when all of it went back.
        if (charge.amount_refunded < charge.amount) break;
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!pi) break;
        const intent = await new Stripe(key).paymentIntents.retrieve(pi);
        const raw = intent.metadata?.orderId;
        if (!raw) break;
        const orderId = await ctx.runQuery(internal.orders.resolveId, { raw });
        if (orderId) await ctx.runMutation(internal.orders.markRefunded, { orderId });
        break;
      }
      default:
        // Any other subscribed event is acknowledged so Stripe stops retrying.
        break;
    }

    return { success: true };
  },
});
