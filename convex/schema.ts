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
    order: v.number(),
    blobPath: v.string(), // object path inside the course's Azure container
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
    .index("by_user_course", ["userId", "courseId"]),

  orders: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    provider: v.union(
      v.literal("stripe"),
      v.literal("pawapay"),
      v.literal("paydunya"),
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
    .index("by_user_lesson", ["userId", "lessonId"]),

  auditLog: defineTable({
    actorClerkId: v.optional(v.string()),
    action: v.string(),
    target: v.optional(v.string()),
    meta: v.optional(v.string()),
  }).index("by_action", ["action"]),
});
