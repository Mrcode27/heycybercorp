import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Hercyberloop / heycybercorp data model.
 * Billing model: one-time purchase per course → access = an `entitlements` row exists.
 */
export default defineSchema({
  // Synced from Clerk on sign-in (see users.store)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    region: v.optional(v.union(v.literal("AFRIQUE"), v.literal("EUROPE"))),
    role: v.union(v.literal("student"), v.literal("admin")),
    // A suspended account keeps its data but loses access to lessons/purchases.
    suspended: v.optional(v.boolean()),
    // Notification preferences (Paramètres → Préférences).
    prefs: v.optional(
      v.object({
        emailNotifications: v.optional(v.boolean()),
        weeklySummary: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  courses: defineTable({
    slug: v.string(),
    title: v.string(),
    level: v.union(
      v.literal("Débutant"),
      v.literal("Intermédiaire"),
      v.literal("Avancé"),
    ),
    description: v.string(),
    priceEur: v.number(), // in cents (e.g. 4000 = 40,00 €)
    priceXof: v.number(), // in whole FCFA (e.g. 15000)
    azureContainer: v.string(), // private Blob container holding this course's videos
    published: v.boolean(),
  }).index("by_slug", ["slug"]),

  lessons: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    // Azure path (Phase 3: signed SAS playback). Optional until videos are uploaded.
    blobPath: v.optional(v.string()),
    // Direct/external video URL (mp4, YouTube, Vimeo) — dev & pre-Azure fallback.
    videoUrl: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    isPreview: v.boolean(), // previews are watchable without an entitlement
  }).index("by_course", ["courseId"]),

  // One row = the buyer owns that course for life.
  entitlements: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    grantedAt: v.number(),
    orderId: v.optional(v.id("orders")),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  orders: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    provider: v.union(
      v.literal("stripe"),
      v.literal("pawapay"),
      v.literal("paydunya"),
      v.literal("manual"), // granted by an admin (offline payment, promo, support)
      v.literal("simulation"), // test purchase made while Stripe keys are absent
    ),
    providerRef: v.optional(v.string()), // Stripe session id / PSP transaction id
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

  // Issued automatically when every lesson of an owned course is completed.
  // `code` is public & verifiable on /certificat/[code].
  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    code: v.string(),
    issuedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"])
    .index("by_user_course", ["userId", "courseId"]),

  // Contact + quote form submissions (public site).
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

  auditLog: defineTable({
    actorClerkId: v.optional(v.string()),
    action: v.string(),
    target: v.optional(v.string()),
    meta: v.optional(v.string()),
  }).index("by_action", ["action"]),
});
