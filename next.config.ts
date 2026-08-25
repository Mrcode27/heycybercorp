import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * ENFORCED in production as of 2026-08: the policy below ran in Report-Only
 * mode while Clerk sign-in/sign-up, the Convex websocket and the embedded
 * lesson players were exercised, and no violations remained. If a new
 * third-party origin is added to the stack later, expect it to be blocked
 * until its origins are allow-listed here.
 *
 * Development keeps the policy Report-ONLY and grants 'unsafe-eval': React's
 * development build needs eval() for debugging features (callstack
 * reconstruction), and enforcing without it breaks the dev server console.
 * React never uses eval() in production, so the enforced policy stays strict.
 *
 * 'unsafe-inline' in script-src is load-bearing: Next inlines its hydration
 * bootstrap. Removing it requires nonce plumbing through a middleware — worth
 * doing later; it is the main thing keeping this policy from being genuinely
 * strict.
 */
const IS_PROD = process.env.NODE_ENV === "production";

const CSP_ENFORCE = IS_PROD;

const CSP = [
  "default-src 'self'",
  // Clerk serves its SDK from the instance domain; Cloudflare Turnstile backs
  // its bot protection. 'unsafe-eval' is appended in development only.
  `script-src 'self' 'unsafe-inline'${IS_PROD ? "" : " 'unsafe-eval'"} https://*.clerk.accounts.dev https://clerk.heycybercorp.fr https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://img.clerk.com https://i.ytimg.com",
  // Convex talks over both HTTPS and a websocket; the wildcard covers the dev
  // and production deployments without hard-coding either.
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://*.clerk.accounts.dev https://clerk.heycybercorp.fr",
  // Lesson players. Stripe is absent on purpose: checkout is a top-level
  // redirect, never an embed.
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://iframe.mediadelivery.net https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Security headers (Phase 6 hardening).
 */
const securityHeaders = [
  {
    key: CSP_ENFORCE
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    value: CSP,
  },
  // Never let the site be framed (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must not MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin cross-site, full URL same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app never needs these powerful browser APIs.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // 2 years of HTTPS-only (browsers ignore HSTS on plain-HTTP localhost).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
