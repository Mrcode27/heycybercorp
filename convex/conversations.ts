import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getCurrentUser, requireAdmin } from "./users";
import { notify, notifyAdmins } from "./notifications";

/**
 * In-app messaging between a student and the admin team.
 *
 * A conversation belongs to exactly one student. Admins are the counterparty
 * *collectively* — any admin can answer any thread — which is why there is no
 * adminId on the row: assigning threads to individuals would strand a
 * conversation the moment that person is away.
 *
 * Unread counts are stored on the conversation and maintained on write.
 * Deriving them would mean reading every message of every thread just to draw
 * a list, and the list is the screen people look at most.
 */

const STUDENT_LINK = "/dashboard/messages";
const ADMIN_LINK = "/admin/messages";

const MAX_SUBJECT = 140;
const MAX_BODY = 5000;
const MIN_BODY = 2;

/** Throttle: a student may open this many threads per day. */
const MAX_NEW_THREADS_PER_DAY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function cleanBody(body: string): string {
  const clean = body.trim();
  if (clean.length < MIN_BODY) throw new Error("Message vide.");
  if (clean.length > MAX_BODY) throw new Error("Message trop long (5000 caractères maximum).");
  return clean;
}

function cleanSubject(subject: string): string {
  const clean = subject.trim();
  if (clean.length < 3) throw new Error("Sujet trop court.");
  if (clean.length > MAX_SUBJECT) throw new Error("Sujet trop long (140 caractères maximum).");
  return clean;
}

/**
 * Resolve a conversation the caller is allowed to see: its owner, or any
 * admin. Throws rather than returning null so no caller can forget to check.
 */
async function readableConversation(
  ctx: QueryCtx,
  conversationId: Id<"conversations">,
): Promise<{ conversation: Doc<"conversations">; user: Doc<"users">; isAdmin: boolean }> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("Conversation introuvable.");
  const isAdmin = user.role === "admin";
  if (!isAdmin && conversation.userId !== user._id) {
    throw new Error("Forbidden");
  }
  return { conversation, user, isAdmin };
}

// ---------------------------------------------------------------- student

/** The signed-in student's own threads, newest activity first. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

/** Badge for the student's own sidebar. */
export const myUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.reduce((sum, r) => sum + r.unreadForStudent, 0);
  },
});

/** Open a new thread with the admin team. */
export const start = mutation({
  args: { subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.suspended) throw new Error("Votre compte est suspendu.");

    const subject = cleanSubject(args.subject);
    const body = cleanBody(args.body);

    const since = Date.now() - DAY_MS;
    const recent = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gt(q.field("_creationTime"), since))
      .collect();
    if (recent.length >= MAX_NEW_THREADS_PER_DAY) {
      throw new Error("Trop de conversations ouvertes aujourd'hui. Réessayez demain.");
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      subject,
      status: "open",
      lastMessageAt: now,
      lastSender: "student",
      unreadForStudent: 0,
      unreadForAdmin: 1,
    });
    await ctx.db.insert("conversationMessages", {
      conversationId,
      authorId: user._id,
      authorRole: "student",
      body,
    });

    const who = user.name?.trim() || user.email;
    await notifyAdmins(ctx, {
      kind: "message",
      title: `Nouveau message de ${who}`,
      body: subject,
      href: ADMIN_LINK,
    });

    // Mail is scheduled, never awaited inside the transaction: the thread is
    // already safe in the database, and Gmail being slow is not the student's
    // problem.
    await ctx.scheduler.runAfter(0, internal.email.sendConversationNotification, {
      to: "admins",
      subject,
      body,
      fromName: who,
      fromEmail: user.email,
      link: ADMIN_LINK,
    });

    return conversationId;
  },
});

/** Student replies inside one of their own threads. */
export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.suspended) throw new Error("Votre compte est suspendu.");

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) throw new Error("Forbidden");
    if (conversation.status === "closed") {
      throw new Error("Cette conversation est clôturée.");
    }

    const clean = cleanBody(body);
    await ctx.db.insert("conversationMessages", {
      conversationId,
      authorId: user._id,
      authorRole: "student",
      body: clean,
    });
    await ctx.db.patch(conversationId, {
      lastMessageAt: Date.now(),
      lastSender: "student",
      unreadForAdmin: conversation.unreadForAdmin + 1,
    });

    const who = user.name?.trim() || user.email;
    await notifyAdmins(ctx, {
      kind: "message",
      title: `Réponse de ${who}`,
      body: conversation.subject,
      href: ADMIN_LINK,
    });
    await ctx.scheduler.runAfter(0, internal.email.sendConversationNotification, {
      to: "admins",
      subject: conversation.subject,
      body: clean,
      fromName: who,
      fromEmail: user.email,
      link: ADMIN_LINK,
    });
  },
});

// ------------------------------------------------------------------ admin

/** Every thread, newest activity first, with the student attached. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("conversations").withIndex("by_last_message").order("desc").collect();
    return Promise.all(
      rows.map(async (row) => {
        const student = await ctx.db.get(row.userId);
        return {
          ...row,
          studentName: student?.name ?? null,
          studentEmail: student?.email ?? "(compte supprimé)",
        };
      }),
    );
  },
});

/** Badge for the admin sidebar. */
export const adminUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return 0;
    const rows = await ctx.db.query("conversations").collect();
    return rows.reduce((sum, r) => sum + (r.unreadForAdmin > 0 ? 1 : 0), 0);
  },
});

/** Admin answers a thread. */
export const reply = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const admin = await requireAdmin(ctx);
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation introuvable.");

    const clean = cleanBody(body);
    await ctx.db.insert("conversationMessages", {
      conversationId,
      authorId: admin._id,
      authorRole: "admin",
      body: clean,
    });
    await ctx.db.patch(conversationId, {
      lastMessageAt: Date.now(),
      lastSender: "admin",
      unreadForStudent: conversation.unreadForStudent + 1,
      // Answering is also reading.
      unreadForAdmin: 0,
      status: "open",
    });

    await notify(ctx, {
      userId: conversation.userId,
      kind: "message",
      title: "Réponse de l'équipe heycybercorp",
      body: conversation.subject,
      href: STUDENT_LINK,
    });

    // Email the student only if they have not opted out. The in-app
    // notification above is unconditional — that one is not a broadcast
    // channel, it is their own inbox.
    const student = await ctx.db.get(conversation.userId);
    if (student && student.prefs?.emailNotifications !== false) {
      await ctx.scheduler.runAfter(0, internal.email.sendConversationNotification, {
        to: "student",
        studentEmail: student.email,
        subject: conversation.subject,
        body: clean,
        fromName: "L'équipe heycybercorp",
        link: STUDENT_LINK,
      });
    }
  },
});

export const setStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, { conversationId, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(conversationId, { status });
  },
});

export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    await requireAdmin(ctx);
    const messages = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);
    await ctx.db.delete(conversationId);
  },
});

// ------------------------------------------------------------------ shared

/** Messages of one thread. Readable by its owner or any admin. */
export const messages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    await readableConversation(ctx, conversationId);
    return ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
  },
});

/**
 * Clear the caller's side of the unread counter. Which side that is follows
 * from who is calling, so a student can never mark the admin queue as read.
 */
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const { conversation, isAdmin } = await readableConversation(ctx, conversationId);
    if (isAdmin) {
      if (conversation.unreadForAdmin === 0) return;
      await ctx.db.patch(conversationId, { unreadForAdmin: 0 });
    } else {
      if (conversation.unreadForStudent === 0) return;
      await ctx.db.patch(conversationId, { unreadForStudent: 0 });
    }
  },
});
