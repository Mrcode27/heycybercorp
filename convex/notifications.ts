import { query, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

/**
 * Bell notifications.
 *
 * A notification is a record of something that already happened, so it is
 * written inside the same mutation as the event it describes — never
 * scheduled. If the event commits, the bell knows about it; if it rolls back,
 * so does the notification. That is why `notify` below is a plain helper
 * rather than a Convex function.
 *
 * Email is the opposite: it is scheduled after commit, because a mail outage
 * must never cost us the event itself.
 */

export type NotificationKind = "message" | "system" | "purchase" | "certificate";

/** The bell shows a window, not a history — nobody scrolls 200 notifications. */
const FEED_LIMIT = 30;

/**
 * Append one notification. Call from inside a mutation so it shares the
 * transaction with whatever caused it.
 */
export async function notify(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    kind: NotificationKind;
    title: string;
    body?: string;
    href?: string;
  },
): Promise<void> {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    kind: args.kind,
    title: args.title,
    body: args.body,
    href: args.href,
  });
}

/** Notify every admin at once — used when a student writes in. */
export async function notifyAdmins(
  ctx: MutationCtx,
  args: { kind: NotificationKind; title: string; body?: string; href?: string },
): Promise<Doc<"users">[]> {
  const admins = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .collect();
  for (const admin of admins) {
    await notify(ctx, { ...args, userId: admin._id });
  }
  return admins;
}

/** The signed-in user's latest notifications. Empty for signed-out visitors. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(FEED_LIMIT);
  },
});

/**
 * Unread badge count.
 *
 * Uses the [userId, readAt] index with readAt === undefined, so this stays a
 * bounded index scan instead of reading the user's whole notification history.
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("readAt", undefined))
      .take(FEED_LIMIT + 1);
    return unread.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const row = await ctx.db.get(id);
    // Silently ignore someone else's notification rather than confirming it
    // exists.
    if (!row || row.userId !== user._id || row.readAt !== undefined) return;
    await ctx.db.patch(id, { readAt: Date.now() });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("readAt", undefined))
      .collect();
    const now = Date.now();
    for (const row of unread) {
      await ctx.db.patch(row._id, { readAt: now });
    }
    return unread.length;
  },
});

/** Admin-authored broadcast, e.g. an announcement. */
export const broadcast = mutation({
  args: { title: v.string(), body: v.optional(v.string()), href: v.optional(v.string()) },
  handler: async (ctx, { title, body, href }) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") throw new Error("Forbidden: admin access required");
    if (title.trim().length < 3) throw new Error("Titre trop court.");

    const everyone = await ctx.db.query("users").collect();
    for (const target of everyone) {
      await notify(ctx, {
        userId: target._id,
        kind: "system",
        title: title.trim(),
        body: body?.trim() || undefined,
        href,
      });
    }
    return everyone.length;
  },
});
