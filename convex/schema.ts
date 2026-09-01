import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);

/**
 * Hercyberloop / heycybercorp data model.
 *
 * Billing model: one-time purchase per PACKAGE (a priced tier that unlocks one
 * or more difficulty levels). Owning a package that covers a course's level =
 * lifetime access to that course. Courses no longer carry their own price.
 */
export default defineSchema({
  // Synced from Clerk on sign-in (see users.store)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    region: v.optional(v.union(v.literal("AFRIQUE"), v.literal("EUROPE"))),
    role: v.union(v.literal("student"), v.literal("admin")),
    suspended: v.optional(v.boolean()),
    prefs: v.optional(
      v.object({
        emailNotifications: v.optional(v.boolean()),
        weeklySummary: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Priced tiers. A package unlocks every course whose level is in `levels`.
  packages: defineTable({
    slug: v.string(),
    name: v.string(),
    tagline: v.optional(v.string()),
    priceEur: v.number(), // cents
    priceXof: v.number(), // whole FCFA
    features: v.array(v.string()),
    levels: v.array(levelValidator), // which course levels this package unlocks
    published: v.boolean(),
    featured: v.optional(v.boolean()), // highlight on the pricing page
    order: v.number(),
  }).index("by_slug", ["slug"]),

  courses: defineTable({
    slug: v.string(),
    title: v.string(),
    level: levelValidator, // difficulty — also decides which package unlocks it
    description: v.string(),
    // Legacy per-course prices — pricing now comes from the covering package.
    priceEur: v.optional(v.number()),
    priceXof: v.optional(v.number()),
    azureContainer: v.string(),
    published: v.boolean(),
  }).index("by_slug", ["slug"]),

  lessons: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    blobPath: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    isPreview: v.boolean(),
  }).index("by_course", ["courseId"]),

  // One row = the buyer owns that package for life.
  entitlements: defineTable({
    userId: v.id("users"),
    packageId: v.optional(v.id("packages")), // current model
    courseId: v.optional(v.id("courses")), // legacy per-course entitlements
    grantedAt: v.number(),
    orderId: v.optional(v.id("orders")),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_package", ["userId", "packageId"])
    .index("by_package", ["packageId"]),

  /**
   * Site-wide settings — exactly one row. `theme` drives the public look and
   * is switched from /admin/apparence.
   *
   * The two colour lists drive the landing-page animations, also from
   * /admin/apparence. They are ordered: the rings interpolate across the list
   * from the innermost ring outwards, and the fluid cursor draws one entry per
   * stroke. Absent (or empty) means the built-in brand defaults — that is the
   * state before an admin has ever touched them, so it must stay valid.
   */
  siteSettings: defineTable({
    theme: v.union(v.literal("dark"), v.literal("light")),
    ringColors: v.optional(v.array(v.string())),
    fluidColors: v.optional(v.array(v.string())),
  }),

  /**
   * Bell notifications. One row per user per event; `readAt` absent = unread.
   *
   * Deliberately denormalised (title/body/href are copied in, not looked up):
   * a notification is a record of what was true when it fired, and the bell
   * must render from a single indexed read.
   */
  notifications: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("message"),
      v.literal("system"),
      v.literal("purchase"),
      v.literal("certificate"),
    ),
    title: v.string(),
    body: v.optional(v.string()),
    /** In-app destination, e.g. "/dashboard/messages". */
    href: v.optional(v.string()),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "readAt"]),

  /**
   * In-app messaging between one student and the admin team.
   *
   * A conversation always belongs to a student (`userId`); admins are the
   * counterparty collectively, so any admin can answer any thread. The unread
   * counters are maintained on write rather than derived, so listing every
   * thread stays one read per side.
   */
  conversations: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    lastMessageAt: v.number(),
    lastSender: v.union(v.literal("student"), v.literal("admin")),
    unreadForStudent: v.number(),
    unreadForAdmin: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_last_message", ["lastMessageAt"]),

  conversationMessages: defineTable({
    conversationId: v.id("conversations"),
    authorId: v.id("users"),
    authorRole: v.union(v.literal("student"), v.literal("admin")),
    body: v.string(),
  }).index("by_conversation", ["conversationId"]),

  orders: defineTable({
    userId: v.id("users"),
    packageId: v.optional(v.id("packages")), // current model
    courseId: v.optional(v.id("courses")), // legacy
    // "stripe" is the only provider a buyer can trigger. "manual" is an admin
    // grant; pawapay/paydunya are reserved for Phase 7 mobile money.
    // "simulation" is DEAD — the fake-payment mode was removed and no code
    // path can produce it; the literal only stays so the three legacy test
    // rows on the DEV deployment keep validating (prod has none). Drop the
    // literal once those rows are purged.
    provider: v.union(
      v.literal("stripe"),
      v.literal("pawapay"),
      v.literal("paydunya"),
      v.literal("manual"),
      v.literal("simulation"),
    ),
    providerRef: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(), // "EUR" | "XOF"
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_provider_ref", ["providerRef"]),

  progress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    secondsWatched: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    code: v.string(),
    issuedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"])
    .index("by_user_course", ["userId", "courseId"]),

  /**
   * Hands-on challenges. A lab is a brief plus a flag the student has to find;
   * `flag` NEVER leaves the server — `labs.listForStudent` strips it, and
   * `labs.submit` compares it in a mutation.
   */
  labs: defineTable({
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    /** Full brief. Newlines are rendered; no markdown parsing. */
    brief: v.string(),
    hint: v.optional(v.string()),
    /** Admin-only walkthrough. Never included in student-facing queries. */
    guide: v.optional(v.string()),
    level: v.union(
      v.literal("Débutant"),
      v.literal("Intermédiaire"),
      v.literal("Avancé"),
    ),
    category: v.string(),
    icon: v.string(),
    flag: v.string(),
    points: v.number(),
    /** Free labs are playable without owning the matching pack. */
    isFree: v.boolean(),
    published: v.boolean(),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  /** One row per student per lab: attempt count, and when it was solved. */
  labSolves: defineTable({
    userId: v.id("users"),
    labId: v.id("labs"),
    attempts: v.number(),
    solvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_lab", ["userId", "labId"])
    .index("by_lab", ["labId"]),

  /**
   * Scenario cases: a situation, its evidence, and ordered questions.
   *
   * The security rule for this whole feature: `caseSteps.answer` never leaves
   * the server. Student-facing queries build their payload field by field, so
   * a field added here cannot leak by accident.
   */
  cases: defineTable({
    title: v.string(),
    slug: v.string(),
    /** Shown even when locked — the teaser. */
    summary: v.string(),
    /** The scene set before the first question. */
    setting: v.string(),
    /** Admin-only walkthrough. Student guidance stays in step hints. */
    guide: v.optional(v.string()),
    level: levelValidator,
    category: v.string(),
    icon: v.string(),
    estimatedMinutes: v.number(),
    isFree: v.boolean(),
    published: v.boolean(),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  /** Evidence attached to a case. `content` is plain text, or JSON for terminal/table. */
  caseArtifacts: defineTable({
    caseId: v.id("cases"),
    order: v.number(),
    kind: v.union(
      v.literal("email"),
      v.literal("log"),
      v.literal("terminal"),
      v.literal("file"),
      v.literal("table"),
      v.literal("http"),
      v.literal("image"),
      v.literal("webos"),
    ),
    label: v.string(),
    content: v.string(),
  }).index("by_case", ["caseId"]),

  /** One question. `answer` is server-only; `choices` are safe to send. */
  caseSteps: defineTable({
    caseId: v.id("cases"),
    order: v.number(),
    prompt: v.string(),
    kind: v.union(v.literal("text"), v.literal("choice")),
    choices: v.array(v.string()),
    /** The canonical answer, shown to admins as "the" answer. */
    answer: v.string(),
    /**
     * Other wordings that are equally right. A student who understood the case
     * should not fail on a synonym.
     */
    accept: v.optional(v.array(v.string())),
    /**
     * How `answer`/`accept` are compared — see `matches()` in cases.ts.
     *  exact    : normalised equality, with a small typo tolerance
     *  contains : the entry appears somewhere in the reply
     *  keywords : every entry must appear (stems work: "partag")
     */
    match: v.optional(
      v.union(v.literal("exact"), v.literal("contains"), v.literal("keywords")),
    ),
    hint: v.optional(v.string()),
    /** Consequence revealed once the step is answered. */
    reveal: v.optional(v.string()),
    points: v.number(),
  }).index("by_case", ["caseId"]),

  /**
   * Per-student, per-step state. Completion and score are derived from these
   * rows rather than stored, so the two can never disagree.
   */
  caseStepAttempts: defineTable({
    userId: v.id("users"),
    caseId: v.id("cases"),
    stepId: v.id("caseSteps"),
    attempts: v.number(),
    solvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_case", ["userId", "caseId"])
    .index("by_user_step", ["userId", "stepId"])
    .index("by_case", ["caseId"]),

  messages: defineTable({
    kind: v.union(v.literal("contact"), v.literal("devis")),
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  freeVideos: defineTable({
    title: v.string(),
    description: v.string(),
    youtubeUrl: v.string(),
    order: v.number(),
    published: v.boolean(),
    courseId: v.optional(v.id("courses")),
  }),

  auditLog: defineTable({
    actorClerkId: v.optional(v.string()),
    action: v.string(),
    target: v.optional(v.string()),
    meta: v.optional(v.string()),
  }).index("by_action", ["action"]),
});
