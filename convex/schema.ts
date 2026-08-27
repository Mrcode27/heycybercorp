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
   */
  siteSettings: defineTable({
    theme: v.union(v.literal("dark"), v.literal("light")),
  }),

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
