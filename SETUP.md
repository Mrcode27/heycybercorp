# heycybercorp — Backend Setup

Stack: **Next.js 16** (frontend) · **Convex** (database + functions) · **Clerk** (auth) · **Azure Blob + SAS** (video) · **Stripe** (Europe payments). Billing is **one-time per course**.

Everything below is free-tier at MVP scale. Do the steps in order; the app runs as static marketing pages until you complete Clerk + Convex.

---

## 1. Convex (database)

```bash
npx convex dev
```

This opens a browser to log in, creates a project, generates `convex/_generated/`, deploys the schema/functions in `convex/`, and writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` into `.env.local`. Leave it running in its own terminal while developing.

## 2. Clerk (auth)

1. Create an app at <https://dashboard.clerk.com>.
2. **API Keys** → copy the Publishable key and Secret key into `.env.local`
   (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
3. **JWT Templates** → **New template** → choose **Convex** → save. Copy the
   **Issuer** URL (looks like `https://xxxx.clerk.accounts.dev`).
4. Put that Issuer URL in `.env.local` as `CLERK_JWT_ISSUER_DOMAIN`, **and** in the
   Convex dashboard → your project → **Settings → Environment Variables** add
   `CLERK_JWT_ISSUER_DOMAIN` = same URL. Then restart `npx convex dev`.

## 3. Run it

```bash
cp .env.local.example .env.local   # then fill in the values from steps 1–2
npm install
npm run dev                        # http://localhost:3000  (keep `npx convex dev` running too)
```

Sign up → your Clerk user is synced into the Convex `users` table → `/dashboard` loads, `/admin` is blocked unless your `users.role` is `admin` (flip it in the Convex dashboard data browser for your own account).

---

## 4. Azure Blob (video) — Phase 3

1. Create a **Storage account** in the Azure portal.
2. Create a **private** container (default name `course-videos`), upload course MP4s.
3. Copy the account name + an access key into `.env.local`
   (`AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_ACCOUNT_KEY`, `AZURE_BLOB_CONTAINER`).

The server checks the buyer's entitlement, then mints a short-lived **SAS URL** for playback. The account key stays server-side only.

## 5. Stripe (Europe) — Phase 4

1. <https://dashboard.stripe.com> → **Developers → API keys** → copy into `.env.local`.
2. In **Settings → Payment methods**, enable Cards, **Revolut Pay**, **PayPal**, SEPA.
3. Add a webhook endpoint → `https://<your-domain>/api/webhooks/stripe`, copy the
   signing secret into `STRIPE_WEBHOOK_SECRET`. Access is granted only when this
   signature-verified webhook confirms payment.

> African mobile-money (PawaPay / PayDunya) is deferred (Phase 7) — the payment layer is written to slot it in without reworking anything else.

---

## What's already in the repo

- `convex/schema.ts` — data model (users, courses, lessons, entitlements, orders, progress, auditLog).
- `convex/{users,courses,entitlements,orders,progress}.ts` — queries/mutations, with server-side auth + admin checks.
- `convex/auth.config.ts` — Clerk binding.
- `.env.local.example` — every key you need.

**Clerk auth is wired and verified** (via the Clerk CLI): `ClerkProvider` (dark theme) in the layout, `src/proxy.ts` protecting `/dashboard` + `/admin` (→ redirect to `/connexion`), and the French `/connexion` + `/inscription` pages rendering Clerk's `<SignIn>` / `<SignUp>` inside the branded `AuthShell`. Navbar shows Connexion when signed out and the user menu when signed in.

**Remaining to light up data:** run `npx convex dev` (step 1 above) to generate `convex/_generated` and set `NEXT_PUBLIC_CONVEX_URL` — then Convex activates and we wire the admin/dashboard to live data. Azure (video) and Stripe (payments) come after.
