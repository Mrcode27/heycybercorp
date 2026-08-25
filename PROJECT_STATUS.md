# heycybercorp — Project Status & Roadmap

_French-language cybersecurity e-learning platform for African & European markets._
_Last updated: 2026-07-21 (major build pass — see `IMPLEMENTATION_GUIDE.md` for the full technical walkthrough)_

Legend: ✅ done & working · 🟡 partial / needs your keys · ⏳ not started

---

## 1. The vision (what it should ultimately be)

A premium, dark-themed **cyber-security academy** where:

- **Visitors** discover courses, see transparent pricing (FCFA for Africa, € for Europe), and sign up.
- **Students** buy individual courses **once** (lifetime access), watch **secured video lessons**, do hands-on **labs**, track **progress**, and earn **certifications**.
- **Admins** manage courses, lessons/videos, users, sales, and analytics.
- **Payments** work per region: **Stripe** (cards + Revolut Pay + PayPal + SEPA) for Europe, and an **African mobile-money** gateway (Orange/MTN/Wave) later.
- **Course videos** are long-form, stored privately on **Azure Blob** and streamed through short-lived signed links so they can't be shared.

**Billing model:** one-time purchase **per course** (not a subscription).

---

## 2. Where we are right now (summary)

| Area | State |
|---|---|
| Public marketing site (7 pages) | ✅ built |
| Authentication (Clerk) | ✅ working (development instance) |
| Database & backend (Convex) | ✅ working (dev deployment) |
| Live catalogue + course detail pages | ✅ wired to Convex |
| Stripe checkout + webhook → entitlement | ✅ **live in test mode** — real Stripe Checkout, signed webhook, no simulation path left |
| Lessons: admin manager + student player | ✅ built (URL-based videos; Azure SAS pending) |
| Progress tracking + auto certificates | ✅ live (public verify page + printable diploma) |
| Contact & quote forms → admin inbox | ✅ live |
| Admin: course edit, roles, suspension, manual access grants | ✅ live |
| Real analytics + audit journal | ✅ live |
| Student dashboard (progress bars, certifications) | ✅ live |
| Deployment (Vercel) | 🟡 configuring env vars |
| Video hosting (Azure Blob + SAS) | ⏳ needs your Azure account (stub ready) |
| Email (contact notifications) | ✅ Gmail SMTP wired — fill SMTP_USER/SMTP_PASSWORD in `.env.local`, then `npm run mail:sync` |
| Labs (real VMs) | ⏳ not started (template page) |

**Roughly: the shop window, the accounts, the back-office, the product delivery (lessons → progress → certificates) and the entire payment pipeline are built. What's missing is only what requires external accounts: Stripe keys, Azure storage, an email provider — plus production Clerk/Convex on your custom domain.**

---

## 3. Functionality by ACTOR

### 3.1 🌍 Visitor (not logged in)

**Implemented ✅**
- Landing page: hero + interactive terminal, course preview cards, pricing preview with Afrique/Europe toggle, **working quote-request form** (stored in Convex → admin inbox).
- Courses page `/formations`: **live Convex catalogue** (6 real courses), level filter, region price toggle, lesson counts & durations.
- **Course detail page `/formations/[slug]`**: overview, programme (lesson list with free-preview markers), region-aware price card, Stripe buy button, payment result banners.
- Pricing `/tarifs`, Enterprise `/entreprise` (working quote form), Contact `/contact` (working form).
- **Public certificate verification `/certificat/[code]`** — anyone can authenticate a diploma.
- Sign in `/connexion` & sign up `/inscription` (Clerk, dark-themed).

**Still to do ⏳**
- ⏳ Nothing blocking. (Nice-to-have: SEO metadata per course.)

### 3.2 🎓 Student (registered user)

**Implemented ✅**
- Register / log in via Clerk; auto-sync into Convex.
- Dashboard with **real progress bars** per owned course (Commencer / Continuer / Revoir).
- **Course player** `/dashboard/formations/[slug]`: lesson sidebar with completion ticks, mp4/YouTube/Vimeo playback, watch-time tracking, mark-as-done, prev/next, deep-linkable lessons.
- **Certificates**: auto-issued at 100% completion → printable diploma + public verify code. Certifications page shows real tracks.
- **Buy a course**: real Stripe Checkout — hosted payment page, signed webhook, plus a return-page re-check against the Stripe API.
- Purchase history `/dashboard/achats` (live — includes admin-granted "manual" orders).
- Paramètres: profile, region, **persisted notification preferences**.
- Suspended accounts see a banner and lose lesson/purchase access (server-enforced).

**Still to do ⏳**
- ⏳ Real labs environment (on-demand VMs) — Labs page remains a visual template.
- ⏳ Exam-based certifications (current ones are completion-based).

### 3.3 🛡️ Administrator

**Implemented ✅**
- Admin-gated console; live KPIs; users table.
- **Formations**: create, **edit**, publish/unpublish, delete — plus per-course **lesson manager** (`/admin/formations/[courseId]`): add/edit/delete/reorder lessons, video URL, duration, free-preview flag, Azure path field ready.
- **Utilisateurs**: change roles, **suspend/reactivate**, **grant/revoke course access** (grants record a paid "manual" order → visible in Ventes).
- **Ventes**: live orders (Stripe + manual).
- **Messages** (`/admin/messages`): inbox for contact/quote submissions — read/archive/delete/reply-by-mail.
- **Rapports**: **real analytics** — monthly revenue (€/FCFA toggle), signups, 30-day KPIs vs previous period, top courses, average completion.
- **Journal** (`/admin/journal`): audit trail — every course/lesson/role/access action is logged.

**Still to do ⏳**
- ✅ Refunds: a full refund in Stripe fires `charge.refunded` → order marked "refunded" **and the entitlement revoked automatically**. Partial refunds keep access on purpose.
- ⏳ Cohort-level analytics once volume justifies it.

### 3.4 ⚙️ System & Integrations

**Implemented ✅**
- Clerk ↔ Convex trust link; route protection (`src/proxy.ts`).
- **Stripe integration code**: checkout action (`convex/stripe.ts`), webhook endpoint (`convex/http.ts` → `/stripe/webhook`), idempotent fulfillment (`orders.markPaid`). Reads `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL` from Convex env — **no keys in code**.
- Playback authorization query (entitlement/preview checked server-side; video URLs never exposed to non-buyers).
- Form rate-limiting (5/email/hour) + size caps.
- **Security headers** (HSTS, X-Frame-Options DENY, nosniff, referrer & permissions policies) in `next.config.ts`.
- Audit logging infrastructure (`convex/lib/audit.ts`).

**Waiting on your accounts 🟡**
- ✅ **Stripe (test)**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SITE_URL` are set on the Convex deployment and the webhook endpoint is registered. Going live = swap in the live key + a live-mode webhook secret, no code change.
- 🟡 **Stripe payment methods**: only card/Link/Klarna/Bancontact/EPS/MB WAY/Amazon Pay/Satispay are enabled on the account. **PayPal, SEPA and Revolut Pay are advertised on /tarifs but not switched on** — enable them in Stripe → Settings → Payment methods.
- 🟡 **Vercel**: finish Production env vars → site live.

**Still to do ⏳**
- ⏳ **Azure Blob + SAS**: swap the `kind: "azure"` stub in `convex/lessons.ts → playback` for a SAS-minting action (guide §8.2).
- 🟡 **Email**: Gmail SMTP is wired and SMTP egress from Convex is verified. Needs your Gmail address + a Google **App Password** in `.env.local`, then `npm run mail:sync` (add `-- --prod` for production). Receipts are still not sent — only contact/devis notifications.
- ⏳ Production Clerk + Convex instances (needs custom domain).
- ✅ **Legal pages**: `/mentions-legales` (LCEN) & `/confidentialite` (RGPD) are live, linked from the footer and listed in the sitemap. Remaining placeholders to fill: forme juridique, SIREN, adresse du siège, n° TVA et directeur de la publication.
- ✅ **CSP**: **enforced in production** since 2026-08 (`CSP_ENFORCE = NODE_ENV === "production"` in `next.config.ts`) after a Report-Only validation period. Development stays Report-Only with `'unsafe-eval'` granted (React's dev build requires it). `'unsafe-inline'` in script-src remains (Next hydration bootstrap); removing it needs nonce plumbing in the middleware.
- ⏳ African mobile-money PSP (Phase 7).

---

## 4. Data model (Convex)

| Table | Purpose | Used by UI? |
|---|---|---|
| `users` | People + role + region + suspension + preferences | ✅ |
| `courses` | Catalogue: title, level, prices (EUR/XOF), published | ✅ |
| `lessons` | Videos in a course (URL now, Azure path later), order, preview flag | ✅ |
| `entitlements` | "This user owns this course" = access | ✅ |
| `orders` | Purchases: stripe/manual/PSP, amount, status | ✅ |
| `progress` | Per-lesson watch time + completion | ✅ |
| `certificates` | Issued diplomas with public verify codes | ✅ NEW |
| `messages` | Contact & quote form submissions | ✅ NEW |
| `auditLog` | Admin & access history | ✅ |

---

## 5. Roadmap (phases)

| Phase | Scope | Status |
|---|---|---|
| **0** | Frontend + one-time pricing copy | ✅ done |
| **1** | Clerk auth | ✅ done |
| **2** | Convex data + live consoles | ✅ done |
| **Deploy** | Vercel (env vars, production build) | 🟡 in progress |
| **3** | Video — lesson pages, player, progress ✅ · Azure SAS storage ⏳ | 🟡 mostly done |
| **4** | Payments — live catalogue, detail page, checkout, webhook | ✅ done (test mode) |
| **5** | Student polish — progress, certifications, notifications | ✅ done (labs/exams excluded) |
| **6** | Hardening — headers ✅, rate limit ✅, audit ✅, CSP report-only ✅ · CSP enforce ⏳ | 🟡 partial |
| **7** | African mobile-money payments | ⏳ deferred |

---

## 6. What to do next (recommended order)

1. **Finish Vercel deploy** (env vars on Production) → site live.
2. **Switch Stripe to live** — live key + live-mode webhook secret on the production Convex deployment, and enable PayPal/SEPA/Revolut Pay in the dashboard. Zero code changes.
3. **Seed real content** — add lessons (YouTube/mp4 URLs work today) via the lesson manager; test the full flow with a manual grant (guide §9).
4. **Azure storage** when videos are produced → implement the one SAS action (guide §8.2).
5. **Fill the mail credentials** → `.env.local` + `npm run mail:sync` (see §Email).
6. **Production Clerk/Convex + custom domain + CSP**, then **Phase 7** African PSP.

---

## 7. Known limitations / honest notes

- Still on **development** Clerk + Convex instances — fine for testing, not for real customers.
- **Payments are on Stripe TEST keys** — real card numbers are declined; use `4242 4242 4242 4242`. Nothing grants access except a Stripe-verified payment: the old simulation bypass is gone.
- **Three legacy `simulation` orders** remain in the `orders` table from that bypass, and the entitlements they granted are still active. Purge them before treating `/admin/ventes` as revenue.
- **Refunds revoke access automatically** on a full refund. A partial refund deliberately does not.
- Azure playback is stubbed: lessons with only a `blobPath` show "upload in progress". The player now accepts YouTube, Vimeo, **Bunny Stream** embeds and direct .mp4 via `videoUrl` — if Bunny becomes the host, the Azure/`blobPath` branch is dead code to delete.
- **Iframe lessons (YouTube/Vimeo/Bunny) have no automatic progress tracking** — only direct `<video>` files report watch time. Students mark those lessons done by hand.
- The contact page still shows `contact@heycybercorp.com` and `corporate@heycybercorp.io`, but the site is `heycybercorp.fr` — three different domains.
- Certificates are **completion-based** (all lessons done), not exam-based.
- Labs page is still a visual template — real labs need VM infrastructure (own project).
- Messages are stored **and** emailed to MAIL_TO once the SMTP credentials are set; `/admin/messages` remains the system of record if mail fails.
- The analytics queries do full table scans — fine now, revisit past ~10k rows/table.
