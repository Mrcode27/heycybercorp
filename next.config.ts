import type { NextConfig } from "next";

/**
 * Security headers (Phase 6 hardening, first pass).
 * A strict Content-Security-Policy is deliberately NOT set yet: it must
 * whitelist the Clerk + Convex + Stripe domains of the *production* instances
 * and be tested against the auth flow — see Clerk's CSP guide when domains
 * are final.
 */
const securityHeaders = [
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
