import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { logAudit } from "./lib/audit";

/** Resolve the Convex user row for the currently-authenticated Clerk identity. */
export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/** Throw unless the caller is an admin. Returns the admin user row. */
export async function requireAdmin(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
  return user;
}

/** Current signed-in user (or null). */
export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
});

/** All users — admin only (for the admin users table). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("users").order("desc").collect();
  },
});

/**
 * Upsert the current Clerk user into Convex. Call once after sign-in
 * (see AuthSync on the client). Idempotent.
 */
export const store = mutation({
  args: { region: v.optional(v.union(v.literal("AFRIQUE"), v.literal("EUROPE"))) },
  handler: async (ctx, { region }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const email = identity.email ?? "";
    const name = identity.name ?? undefined;

    if (existing) {
      const patch: Partial<Doc<"users">> = {};
      if (existing.email !== email && email) patch.email = email;
      if (existing.name !== name && name) patch.name = name;
      if (region && existing.region !== region) patch.region = region;
      if (Object.keys(patch).length > 0) await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      region,
      role: "student",
    });
  },
});

/** Save notification preferences (Paramètres → Préférences). */
export const updatePrefs = mutation({
  args: {
    prefs: v.object({
      emailNotifications: v.optional(v.boolean()),
      weeklySummary: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { prefs }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { prefs: { ...user.prefs, ...prefs } });
  },
});

/** Change a user's role — admin only. You cannot change your own role. */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("admin")),
  },
  handler: async (ctx, { userId, role }) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === userId) {
      throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
    }
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("Utilisateur introuvable.");
    if (target.role === role) return;

    await ctx.db.patch(userId, { role });
    await logAudit(ctx, "user.role_changed", target.email, `${target.role} → ${role}`);
  },
});

/** Suspend / reinstate an account — admin only. Admins must be demoted first. */
export const setSuspended = mutation({
  args: { userId: v.id("users"), suspended: v.boolean() },
  handler: async (ctx, { userId, suspended }) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === userId) {
      throw new Error("Vous ne pouvez pas suspendre votre propre compte.");
    }
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("Utilisateur introuvable.");
    if (suspended && target.role === "admin") {
      throw new Error("Rétrogradez cet administrateur avant de le suspendre.");
    }

    await ctx.db.patch(userId, { suspended });
    await logAudit(ctx, suspended ? "user.suspended" : "user.reinstated", target.email);
  },
});

/**
 * One-time bootstrap: promote a user to admin, but ONLY while no admin exists.
 * Safe to leave deployed — it refuses once the first admin is set.
 */
export const bootstrapAdmin = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
    if (admins.length > 0) throw new Error("Un administrateur existe déjà.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) throw new Error("Utilisateur introuvable.");

    await ctx.db.patch(user._id, { role: "admin" });
    return `Promu admin: ${user.email || clerkId}`;
  },
});
