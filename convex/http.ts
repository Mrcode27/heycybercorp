import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Public HTTP endpoints served at https://<deployment>.convex.site
 * (NEXT_PUBLIC_CONVEX_SITE_URL). This runtime has no Node crypto, so the
 * webhook only extracts the raw body + signature and hands verification to
 * the Node action `internal.stripe.fulfill`.
 */
const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const payload = await request.text();
    const result = await ctx.runAction(internal.stripe.fulfill, {
      payload,
      signature,
    });
    return new Response(null, { status: result.success ? 200 : 400 });
  }),
});

export default http;
