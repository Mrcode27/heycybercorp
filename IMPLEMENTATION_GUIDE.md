# Implementation Guide — What Was Built & How It Works

_Written for a developer joining the project. Simple English, real code from the repo, file references everywhere. Read it top to bottom once, then use it as a map._

_Date: 2026-07-21 · Stack: Next.js 16.2.10 (App Router, Turbopack, React Compiler) + React 19 + Clerk 7 + Convex 1.42 + Tailwind 4 + Stripe SDK_

---

## 0. TL;DR — before vs after

| Feature | Before | After |
|---|---|---|
| `/formations` catalogue | Hardcoded array in the component | Live from Convex, prices, owned badges, region toggle |
| Course detail page | Did not exist | `/formations/[slug]` — programme, price card, Stripe buy button |
| Payments | Nothing | Full Stripe Checkout + webhook → entitlement pipeline. **No key yet? Purchases are simulated** so you can test everything today |
| Watching lessons | Nothing | `/dashboard/formations/[slug]` player (mp4 / YouTube / Vimeo), progress tracking |
| Lessons management | Nothing | Admin CRUD + reorder at `/admin/formations/[courseId]` |
| Course editing | Create/delete only | Full edit form (title, slug, prices, level, description) |
| Certificates | Static template | Auto-issued at 100% completion, public verify page `/certificat/[code]`, printable |
| Progress | DB schema only | Real % bars on dashboard, per-lesson completion |
| Contact / quote forms | Fake success message | Saved to Convex + admin inbox `/admin/messages` |
| User management | Read-only table | Change roles, suspend accounts, grant/revoke course access |
| Analytics `/admin/rapports` | Sample numbers | Real revenue/signup/completion charts from live data |
| Audit log | Empty table | Every admin action logged + `/admin/journal` viewer |
| Notification settings | Static toggles | Persisted per user |
| Security headers | None | HSTS, X-Frame-Options, nosniff, etc. in `next.config.ts` |

Everything that needs **your keys** (Stripe, Azure, email) was built up to the exact line where the key goes, and no further. Section 8 tells you precisely what to paste where.

---

## 1. How the stack fits together

```
Browser ──► Next.js 16 (Vercel)          ──► pages, UI, Clerk widgets
   │              │
   │              └─ src/proxy.ts        ──► route protection (/dashboard, /admin)
   │
   ├──► Clerk                            ──► who is this user? (JWT "convex" template)
   │
   └──► Convex (WebSocket, reactive)     ──► ALL data + business logic
              │
              ├─ convex/*.ts             ──► queries / mutations / actions
              └─ convex/http.ts          ──► https://<deployment>.convex.site/stripe/webhook
                                              ▲
Stripe ───────────────────────────────────────┘  (payment confirmations)
```

Two Next.js 16 things that differ from older tutorials (the bundled docs in `node_modules/next/dist/docs/` are the source of truth — `AGENTS.md` insists, and it's right):

1. **Middleware is called Proxy now.** The file is [src/proxy.ts](src/proxy.ts), not `middleware.ts`. Same API, new name.
2. **`params` is a Promise** in pages, and there's a generated `PageProps` helper. Every new dynamic page uses it:

```tsx
// src/app/formations/[slug]/page.tsx
export default async function CourseDetailPage({
  params,
}: PageProps<"/formations/[slug]">) {
  const { slug } = await params;          // ← await, because params is a Promise
  return (
    <PublicShell>
      ...
      <CourseDetail slug={slug} />
    </PublicShell>
  );
}
```

Every page that renders live Convex data also exports:

```ts
export const dynamic = "force-dynamic";
```

Why: these pages use client hooks (`useQuery`) that need the Convex provider at request time. Without this, `next build` tries to prerender them at build time and crashes — that's exactly the bug fixed in commit `a2437f3`, so all new pages follow the same convention.

---

## 2. The data model (convex/schema.ts)

Existing tables were kept; here is what was **added or changed**:

```ts
// convex/schema.ts (excerpts)

users: defineTable({
  // ...existing fields...
  suspended: v.optional(v.boolean()),        // NEW — soft-lock an account
  prefs: v.optional(v.object({               // NEW — Paramètres toggles
    emailNotifications: v.optional(v.boolean()),
    weeklySummary: v.optional(v.boolean()),
  })),
}),

lessons: defineTable({
  // ...
  blobPath: v.optional(v.string()),   // CHANGED: optional until Azure exists
  videoUrl: v.optional(v.string()),   // NEW — mp4/YouTube/Vimeo link for today
  description: v.optional(v.string()),// NEW
}),

certificates: defineTable({           // NEW TABLE — issued diplomas
  userId: v.id("users"),
  courseId: v.id("courses"),
  code: v.string(),                   // e.g. HCC-2026-8F3KQ2ZL — public
  issuedAt: v.number(),
}).index("by_code", ["code"]),

messages: defineTable({               // NEW TABLE — contact/quote submissions
  kind: v.union(v.literal("contact"), v.literal("devis")),
  name: v.string(),
  email: v.string(),
  subject: v.optional(v.string()),
  body: v.string(),
  status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
}),
```

Also: `orders.provider` gained a `"manual"` value (admin-granted access shows up in sales history), and `progress` and `entitlements` got extra indexes (`by_user_course`, `by_course`) so the new queries never scan.

**Convex note:** after any schema/function change, `npx convex codegen` regenerates the typed `convex/_generated/api` AND pushes the functions to the dev deployment. It was run — the backend above is live on your dev deployment right now.

---

## 3. Backend security model (read this before touching convex/)

Three helpers gate everything; they already existed or were added in this pass:

```ts
// convex/users.ts — the two auth primitives every function uses
export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();   // verified Clerk JWT
  if (!identity) return null;
  return await ctx.db.query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireAdmin(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}
```

```ts
// convex/lib/audit.ts — NEW: one-liner used inside admin mutations
export async function logAudit(ctx: MutationCtx, action: string, target?: string, meta?: string) {
  const identity = await ctx.auth.getUserIdentity();
  await ctx.db.insert("auditLog", { actorClerkId: identity?.subject, action, target, meta });
}
```

The rule followed everywhere: **the client is never trusted**. The UI hides buttons, but the server re-checks. Examples you can grep for: `requireAdmin(ctx)` at the top of every admin function, and the entitlement check inside `progress.record` (section 5).

---

## 4. The catalogue & course detail page

### 4.1 One query feeds the whole detail page

Instead of three round-trips (course, lessons, "do I own it?"), one query returns everything, and — important — the lessons are **sanitized** so video URLs never reach people who didn't pay:

```ts
// convex/courses.ts
/** Public, spoiler-free view of a lesson (no blobPath / videoUrl). */
function sanitizeLesson(l: Doc<"lessons">) {
  return {
    _id: l._id,
    title: l.title,
    description: l.description,
    order: l.order,
    durationSec: l.durationSec,
    isPreview: l.isPreview,
    hasVideo: Boolean(l.videoUrl || l.blobPath),   // "there is a video" — not "here it is"
  };
}

export const detail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const course = /* by_slug index lookup */;
    if (!course || !course.published) return null;
    const lessons = /* by_course index, sorted by order */;
    let owned = false;
    const user = await getCurrentUser(ctx);
    if (user && !user.suspended) { owned = /* entitlement by_user_course exists */; }
    return { course, lessons: lessons.map(sanitizeLesson), owned, region: user?.region ?? null };
  },
});
```

### 4.2 The catalogue is live now

[src/components/FormationsCatalogue.tsx](src/components/FormationsCatalogue.tsx) dropped its hardcoded `COURSES` array entirely:

```tsx
const courses = useQuery(api.courses.listPublished);     // the 6 real courses
const me = useQuery(api.users.current);                  // for the default currency
const ownedIds = useQuery(api.entitlements.myCourseIds); // for "POSSÉDÉ" badges
```

Convex queries are **reactive**: when an admin publishes a course, every open browser updates without a refresh. The three tier sections (Fondamentaux / Spécialiste / Expert) are now derived from `course.level` instead of a hardcoded `tier` field, and each card is a `<Link href={`/formations/${course.slug}`}>`.

Prices come from one shared helper so the format is identical everywhere:

```ts
// src/lib/format.ts
export function formatCoursePrice(priceEur: number, priceXof: number, region: Region): string {
  return region === "AFRIQUE"
    ? `${priceXof.toLocaleString("fr-FR")} FCFA`
    : `${(priceEur / 100).toLocaleString("fr-FR")} €`;   // stored in cents!
}
```

(Remember: `priceEur` is **cents** — `4000` displays as `40 €`. `priceXof` is whole FCFA.)

---

## 5. Payments — the full Stripe pipeline (keys excluded) + simulation mode

This is Phase 4 from PROJECT_STATUS.md, built end-to-end. **One switch decides everything: is `STRIPE_SECRET_KEY` set on the Convex deployment?**

```ts
// convex/stripe.ts — the very first thing createCheckoutSession checks
const key = process.env.STRIPE_SECRET_KEY;

// ---- Simulation mode: no Stripe key yet ----
if (!key) {
  const orderId = await ctx.runMutation(api.orders.createPending, {
    courseId, provider: "simulation", currency: "EUR",
  });
  ...
  await ctx.runMutation(internal.orders.markPaid, {
    orderId, providerRef: `SIM-${orderId.slice(-8).toUpperCase()}`,
  });
  return `/formations/${info.course.slug}?paiement=simulation`;  // relative → works on any host
}
// ---- Real Stripe ----
const stripe = new Stripe(key);
```

**Simulation mode (today, zero keys):** clicking *Acheter maintenant* records a `provider: "simulation"` order, marks it paid, grants the entitlement, and redirects back with `?paiement=simulation` — the page shows an amber *"Achat simulé (mode test)"* banner and the course unlocks. The order is visible in `/admin/ventes` tagged `simulation`, so test data is easy to spot and never mistaken for revenue.

> ⚠ By design this means **courses are free while the key is absent**. Set `STRIPE_SECRET_KEY` before the site goes public.

**Real mode (after you add the key):** the same button goes through genuine Stripe Checkout — nothing else changes. The flow:

```
[Acheter maintenant]                                   (CourseDetail.tsx)
      │  useAction(api.stripe.createCheckoutSession)({ courseId })
      ▼
convex/stripe.ts · createCheckoutSession  ("use node" action)
      │  1. requires a signed-in identity
      │  2. api.orders.createPending  → price read from DB, never from client
      │  3. stripe.checkout.sessions.create({ metadata: { orderId }, ... })
      ▼
Stripe hosted checkout page  (card, PayPal, SEPA, Revolut Pay — dashboard-managed)
      │  customer pays (or abandons)
      ▼
POST https://<deployment>.convex.site/stripe/webhook    (convex/http.ts)
      │  passes raw body + signature to the Node runtime
      ▼
convex/stripe.ts · fulfill  → verifies the signature → internal.orders.markPaid
      ▼
orders.markPaid  → order "paid" + entitlement inserted  (idempotent)
      ▼
The buyer's browser updates BY ITSELF: the reactive `detail` query flips
`owned: true`, and the price card becomes "Accéder au cours".
```

Key excerpts and why they're written that way:

```ts
// convex/stripe.ts — price is server-side, orderId rides in metadata
const orderId: Id<"orders"> = await ctx.runMutation(api.orders.createPending, {
  courseId,
  provider: "stripe",
  currency: "EUR",           // African mobile-money (XOF) arrives in Phase 7
});
...
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ quantity: 1, price_data: {
    currency: "eur",
    unit_amount: info.order.amount,          // ← cents, from the DB row
    product_data: { name: info.course.title, ... },
  }}],
  metadata: { orderId },                     // ← the webhook's only job is to read this
  success_url: `${siteUrl()}/formations/${info.course.slug}?paiement=succes`,
  cancel_url:  `${siteUrl()}/formations/${info.course.slug}?paiement=annule`,
});
```

```ts
// convex/http.ts — why two files? Convex http actions run in a V8 runtime
// with no Node crypto. So the route only extracts payload+signature and
// forwards to the "use node" action that CAN verify:
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });
    const payload = await request.text();
    const result = await ctx.runAction(internal.stripe.fulfill, { payload, signature });
    return new Response(null, { status: result.success ? 200 : 400 });
  }),
});
```

```ts
// convex/orders.ts — markPaid was already written; note it is an
// internalMutation (unreachable from browsers) and idempotent:
export const markPaid = internalMutation({
  args: { orderId: v.id("orders"), providerRef: v.string() },
  handler: async (ctx, { orderId, providerRef }) => {
    const order = await ctx.db.get(orderId);
    if (!order || order.status === "paid") return;   // ← replayed webhooks are no-ops
    ...
```

The redirect lands on `/formations/[slug]?paiement=succes|annule|simulation`; `CourseDetail` reads it with `useSearchParams()` and shows a green / neutral / amber banner accordingly.

---

## 6. Video lessons, progress, certificates

### 6.1 Playback is a server decision, not a client one

```ts
// convex/lessons.ts — the ONLY door to a video source
export const playback = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    /* course must exist & be published; suspended users refused */
    let allowed = lesson.isPreview;
    if (!allowed && user) { allowed = /* entitlement exists */; }
    if (!allowed) return { allowed: false as const, reason: "non-acheté" };

    if (lesson.videoUrl)  return { allowed: true, kind: "url",   url: lesson.videoUrl };
    if (lesson.blobPath)  return { allowed: true, kind: "azure", url: null };  // Phase 3 stub
    return { allowed: true, kind: "none", url: null };
  },
});
```

The `kind: "azure"` branch is **the** place where Phase 3 plugs in: replace it with an action that mints a short-lived SAS URL from `course.azureContainer` + `lesson.blobPath`. The player already renders a "Vidéo en cours de téléversement sécurisé" panel for it, so nothing else changes.

### 6.2 The player

[src/components/console/CoursePlayer.tsx](src/components/console/CoursePlayer.tsx) (route: `/dashboard/formations/[slug]?lecon=<id>`):

- URL detection: YouTube / Vimeo links become privacy-friendly embeds, anything else is a native `<video>`:

```ts
function toPlayerSource(url: string): { type: "iframe" | "video"; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { type: "video", src: url };
}
```

- Watch-time is reported at most once per 15 s from the `<video>`'s `onTimeUpdate` (fire-and-forget; the server keeps the max), and `onEnded` auto-completes the lesson.
- The `?lecon=` query param is kept in sync with `router.replace(...)` so lesson links are shareable — that's also where the "Aperçu gratuit" links from the public detail page land.

### 6.3 Completing the last lesson issues the certificate — atomically

```ts
// convex/progress.ts — record() guards, then upserts, then:
if (!lesson.isPreview) {
  const ent = /* entitlement lookup */;
  if (!ent) throw new Error("Vous ne possédez pas ce cours.");  // client can't cheat
}
...
if (completed) {
  return await maybeIssueCertificate(ctx, user, lesson.courseId);  // null unless 100%
}
```

`maybeIssueCertificate` counts lessons vs completed progress rows; when everything is done it inserts a `certificates` row with an unguessable code (32-symbol alphabet, no `0/O/1/I` ambiguity):

```ts
// convex/progress.ts
function makeCertCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 8; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `HCC-${new Date().getFullYear()}-${tail}`;      // e.g. HCC-2026-8F3KQ2ZL
}
```

Because a Convex mutation is a transaction, "mark lesson done + issue certificate" cannot half-happen. The player receives the code as the mutation's return value and shows the congratulations banner with a link.

### 6.4 The public certificate page

`/certificat/[code]` ([src/components/CertificateView.tsx](src/components/CertificateView.tsx)) is intentionally **outside** `/dashboard` — recruiters don't have accounts. It calls the only public read:

```ts
// convex/certificates.ts — returns ONLY what belongs on a diploma
export const verify = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const cert = /* by_code index lookup, trimmed & uppercased */;
    if (!cert) return null;
    return { code, issuedAt, studentName, courseTitle, courseLevel };
  },
});
```

The page has `print:` Tailwind classes throughout (dark UI on screen, clean white diploma when printing) and an **Imprimer / PDF** button that just calls `window.print()` — that's the "PDF certificate" with zero external services.

---

## 7. The admin console upgrades

| Page | What's new |
|---|---|
| `/admin/formations` | **Edit** button per course (same form as create, pre-filled → `courses.update`), slug shown, lesson count linking to the lesson manager, seed button kept |
| `/admin/formations/[courseId]` | **NEW — lesson manager**: add/edit/delete lessons, ▲▼ reorder, duration in minutes, video URL field, Azure path field (Phase 3), "Aperçu gratuit" flag |
| `/admin/utilisateurs` | Expand a row → change role, suspend/reactivate, **grant/revoke course access** |
| `/admin/messages` | **NEW — inbox** for contact + quote forms (open = mark read, archive, delete, mailto reply) |
| `/admin/rapports` | Real analytics (see below) |
| `/admin/journal` | **NEW — audit trail viewer** |

Things worth knowing when you extend it:

- **Reorder** swaps `order` values with the neighbour — two `ctx.db.patch` calls in one mutation, so it's transactional ([convex/lessons.ts](convex/lessons.ts) → `move`).
- **Manual access grant** writes a paid `provider: "manual"` order first, then the entitlement — so offline sales (mobile money by hand, promos) appear in `/admin/ventes` and in analytics like any Stripe sale ([convex/entitlements.ts](convex/entitlements.ts) → `grant`).
- **Role/suspension guards** live server-side:

```ts
// convex/users.ts → setRole
if (admin._id === userId) throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
// → setSuspended
if (suspended && target.role === "admin")
  throw new Error("Rétrogradez cet administrateur avant de le suspendre.");
```

  (You can never demote yourself → there is always at least one admin.)
- **URL safety**: the lesson manager gets `courseId` from the URL. A garbage id would make `v.id("courses")` throw before the handler runs, crashing the page — so `courses.getById` takes a *string* and normalizes:

```ts
// convex/courses.ts
export const getById = query({
  args: { id: v.string() },                      // NOT v.id — URLs are user input
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const courseId = ctx.db.normalizeId("courses", id);   // null if malformed
    return courseId ? await ctx.db.get(courseId) : null;  // → "Cours introuvable." UI
  },
});
```

- **Analytics** ([convex/admin.ts](convex/admin.ts) → `analytics`) computes, in one query: 6 monthly buckets of revenue (EUR and FCFA kept separate — you can't add currencies), signups per month, 30-day KPIs vs the previous 30 days, top courses by entitlements, and average completion. The comment in the file says it honestly: full table scans are fine at today's size; add aggregates past ~10k rows. The chart component has a €/FCFA toggle because a mixed-currency bar chart would be a lie.
- **Audit log**: admin mutations call `logAudit(ctx, "course.created", slug, title)` etc. Grep `logAudit(` to see all ~12 call sites. `/admin/journal` renders the latest 200.

---

## 8. What YOU still need to plug in (the keys I left out, on purpose)

### 8.1 Stripe (flips simulation → real payments)

The checkout code runs **inside Convex**, so the keys live on the Convex deployment, not in Next's `.env.local`. Setting them is three terminal commands from the project folder:

```powershell
npx convex env set STRIPE_SECRET_KEY sk_test_XXXXXXXXXXXX
npx convex env set STRIPE_WEBHOOK_SECRET whsec_XXXXXXXXXXXX
npx convex env set SITE_URL https://your-site.vercel.app
```

(Or paste them in the Convex dashboard → Settings → Environment Variables — same thing.)

To get the `whsec_…` value: Stripe dashboard → **Developers → Webhooks → Add endpoint** with URL
`https://<your-deployment>.convex.site/stripe/webhook` (that host is already in your `.env.local` as `NEXT_PUBLIC_CONVEX_SITE_URL`), events: `checkout.session.completed` and `checkout.session.expired`. Enable card / PayPal / SEPA / Revolut Pay under **Settings → Payment methods** — the code doesn't pin methods, your dashboard decides.

That's it. No code changes — the next click on *Acheter maintenant* goes through real Stripe instead of the simulator. Until then, purchases are **simulated** (instant success, tagged `simulation` in Ventes) so the full journey stays testable.

### 8.2 Azure video (Phase 3)

One function to write when you have a Storage account: replace the `kind: "azure"` branch in [convex/lessons.ts](convex/lessons.ts) → `playback` with a `"use node"` action that mints a short-lived SAS URL. Admin UI (blob path field), player UI (upload-pending panel), and the schema are already in place.

### 8.3 Email (receipts, contact notifications)

Messages are stored, nothing is sent. When you pick a provider (Resend, Postmark…), the natural hook points are `messages.submit` and `orders.markPaid` (send from an action, not a mutation).

### 8.4 Going to production

Unchanged from PROJECT_STATUS.md: production Clerk instance + production Convex deployment need your custom domain; Vercel needs the `NEXT_PUBLIC_*` + Clerk env vars for Production.

---

## 9. Test the whole business flow today — no Stripe needed

Two key-free paths exist: **simulated self-purchase** (the student journey) and **manual admin grant** (the support journey).

1. Sign in as the admin → `/admin/formations` → pick a course → **playlist icon** → add a lesson with a YouTube URL, duration `5`, leave "Aperçu gratuit" off. Add a second one.
2. As a student, open the course page and click **Acheter maintenant** → the purchase is *simulated* (amber banner, order tagged `simulation` in `/admin/ventes`) and the course unlocks instantly. — Alternatively, grant it by hand: `/admin/utilisateurs` → expand the account → *Formations possédées* → **Accorder** (recorded as a paid `manual` order).
3. Still as the student: `/dashboard/formations` shows the course with a 0% bar → **Commencer** → the player opens, the YouTube embed plays → **Marquer comme terminée** on both lessons.
4. On the second one: the certificate banner appears → open `/certificat/HCC-2026-…` → print it → open the same URL in a private window: it verifies publicly.
5. Check the side effects: `/dashboard/certifications` (Certifié), `/dashboard/achats` (the order), `/admin/rapports` (revenue + completion moved), `/admin/journal` (`entitlement.granted`, `lesson.created`, …).
6. Public site: submit the contact form and the home-page quote form → `/admin/messages`.

---

## 10. Gotchas discovered while building (so you don't rediscover them)

1. **`/docs` is gitignored** (line 5 of [.gitignore](.gitignore)) — that's why this file sits at the repo root instead of a `docs/` folder.
2. **The TS target predates es2018**, so regex `/s` (dotAll) doesn't compile. That's why [src/lib/errors.ts](src/lib/errors.ts) uses `[\s\S]` — don't "simplify" it back.
3. **React Compiler lint is strict**: a helper that reads a `useRef` + `Date.now()` and is *referenced* in JSX fails `react-hooks/purity` even if it's only ever called from an event. The throttle in `CoursePlayer` is written inline inside `onTimeUpdate={...}` for exactly this reason.
4. **Convex error strings are wrapped** (`[CONVEX M(...)] ... Uncaught Error: <your message> at handler...`). Always display them through `cleanConvexError()` ([src/lib/errors.ts](src/lib/errors.ts)) or users see stack traces.
5. **Deriving types from queries**: use `FunctionReturnType<typeof api.courses.listPublished>[number]` (from `convex/server`) — see the top of [src/components/FormationsCatalogue.tsx](src/components/FormationsCatalogue.tsx).
6. **`npx convex codegen` is not just codegen** — it also pushes functions to the dev deployment. Handy, but know that it deploys.
7. **LiveForm has a build-time fallback**: if `NEXT_PUBLIC_CONVEX_URL` is missing, [src/components/LiveForm.tsx](src/components/LiveForm.tsx) renders a disabled form instead of calling `useMutation` — that keeps the static marketing pages (`/`, `/contact`, `/entreprise`) prerenderable in any environment, mirroring the guard in `ConvexClientProvider`.
8. **A strict CSP is deliberately absent** from [next.config.ts](next.config.ts): it must whitelist your *production* Clerk/Convex/Stripe domains and be tested against the login flow, or it will brick auth. The other headers (HSTS, DENY framing, nosniff, referrer, permissions) are live.

---

## 11. File inventory of this pass

**New Convex modules:** `lessons.ts`, `certificates.ts`, `messages.ts`, `audit.ts`, `stripe.ts`, `http.ts`, `lib/audit.ts` · **Extended:** `schema.ts`, `users.ts`, `courses.ts`, `entitlements.ts`, `orders.ts`, `progress.ts`, `admin.ts`

**New pages:** `formations/[slug]`, `dashboard/formations/[slug]`, `certificat/[code]`, `admin/formations/[courseId]`, `admin/messages`, `admin/journal`

**New components:** `CourseDetail`, `CertificateView`, `LiveForm`, `console/CoursePlayer`, `console/AdminLessons`, `console/AdminMessages`, `console/AdminJournal` · **Rewritten:** `FormationsCatalogue`, `console/StudentCourses`, `console/CertificationsView`, `console/AdminCourses`, `console/AdminUsers`, `console/AdminReports` · **Extended:** `console/StudentSettings`, `DashboardConsole`, `consoleNav` · **Deleted:** `DemoForm` (replaced by `LiveForm`)

**New libs:** `src/lib/format.ts`, `src/lib/errors.ts` · **Config:** `next.config.ts` (security headers), `package.json` (+`stripe`)

Verification run: `npx convex codegen` ✅ (functions deployed to dev) · `npm run build` ✅ (24 routes) · `npm run lint` ✅ (0 errors; the 6 warnings are pre-existing).
