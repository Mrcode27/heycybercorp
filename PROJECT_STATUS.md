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
| Stripe checkout + webhook → entitlement | 🟡 **code complete — purchases are SIMULATED until you set the 3 Stripe env vars** |
| Lessons: admin manager + student player | ✅ built (URL-based videos; Azure SAS pending) |
| Progress tracking + auto certificates | ✅ live (public verify page + printable diploma) |
| Contact & quote forms → admin inbox | ✅ live |
| Admin: course edit, roles, suspension, manual access grants | ✅ live |
| Real analytics + audit journal | ✅ live |
| Student dashboard (progress bars, certifications) | ✅ live |
| Deployment (Vercel) | 🟡 configuring env vars |
| Video hosting (Azure Blob + SAS) | ⏳ needs your Azure account (stub ready) |
| Email (receipts, notifications) | ⏳ needs a provider key |
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
- **Buy a course**: full checkout flow (needs Stripe keys to go live).
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
- ⏳ Refunds (Stripe refund → status "refunded") — order management beyond status display.
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
- 🟡 **Stripe**: add the 3 env vars in the Convex dashboard + create the webhook endpoint → payments go live (steps in `IMPLEMENTATION_GUIDE.md` §8.1).
- 🟡 **Vercel**: finish Production env vars → site live.

**Still to do ⏳**
- ⏳ **Azure Blob + SAS**: swap the `kind: "azure"` stub in `convex/lessons.ts → playback` for a SAS-minting action (guide §8.2).
- ⏳ **Email** provider (contact notifications, receipts).
- ⏳ Production Clerk + Convex instances (needs custom domain).
- ⏳ Strict CSP (after production domains are final — see guide §10.8).
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
| **4** | Payments — live catalogue, detail page, checkout, webhook | 🟡 **code done — needs keys** |
| **5** | Student polish — progress, certifications, notifications | ✅ done (labs/exams excluded) |
| **6** | Hardening — headers ✅, rate limit ✅, audit ✅ · CSP + prod instances ⏳ | 🟡 partial |
| **7** | African mobile-money payments | ⏳ deferred |

---

## 6. What to do next (recommended order)

1. **Finish Vercel deploy** (env vars on Production) → site live.
2. **Activate Stripe** — 3 env vars + 1 webhook, zero code (guide §8.1) → revenue possible immediately.
3. **Seed real content** — add lessons (YouTube/mp4 URLs work today) via the lesson manager; test the full flow with a manual grant (guide §9).
4. **Azure storage** when videos are produced → implement the one SAS action (guide §8.2).
5. **Email provider** → receipts + contact notifications.
6. **Production Clerk/Convex + custom domain + CSP**, then **Phase 7** African PSP.

---

## 7. Known limitations / honest notes

- Still on **development** Clerk + Convex instances — fine for testing, not for real customers.
- **No money moves until you add Stripe keys** — until then the buy button *simulates* a successful purchase (orders tagged `simulation`, access granted) so the platform is fully testable. Never launch publicly in this state: courses would be free.
- Azure playback is stubbed: lessons with only a `blobPath` show "upload in progress" in the player; URL-based lessons play fine.
- Certificates are **completion-based** (all lessons done), not exam-based.
- Labs page is still a visual template — real labs need VM infrastructure (own project).
- Messages are stored, not emailed — admins must check `/admin/messages` until an email provider is wired.
- The analytics queries do full table scans — fine now, revisit past ~10k rows/table.
