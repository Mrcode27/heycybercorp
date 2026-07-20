import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

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
