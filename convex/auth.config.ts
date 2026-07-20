/**
 * Convex ↔ Clerk auth binding.
 * Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (Settings → Environment Variables)
 * to your Clerk Frontend API URL (e.g. https://your-app.clerk.accounts.dev).
 * Create a Clerk JWT template named "convex".
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
