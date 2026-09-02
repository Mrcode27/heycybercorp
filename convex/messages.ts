import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { notifyAdmins } from "./notifications";
import { internal } from "./_generated/api";

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;

/**
 * Public form submission (contact page, quote request). No auth required.
 * Light rate limit: max 5 messages per email per hour, plus size caps —
 * enough to stop casual spam until Phase 6 hardening.
 */
export const submit = mutation({
  args: {
    kind: v.union(v.literal("contact"), v.literal("devis")),
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, { kind, name, email, subject, body }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Adresse email invalide.");
    }
    if (name.trim().length < 2 || body.trim().length < 10) {
      throw new Error("Message trop court.");
    }
    if (name.length > 120 || body.length > 5000 || (subject?.length ?? 0) > 200) {
      throw new Error("Message trop long.");
    }

    const cutoff = Date.now() - HOUR_MS;
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .filter((q) => q.gt(q.field("_creationTime"), cutoff))
      .collect();
    if (recent.length >= MAX_PER_HOUR) {
      throw new Error("Trop de messages envoyés. Réessayez dans une heure.");
    }

    await ctx.db.insert("messages", {
      kind,
      name: name.trim(),
      email: cleanEmail,
      subject: subject?.trim() || undefined,
      body: body.trim(),
      status: "new",
    });

    // Ping every admin's bell in the same transaction, so the inbox badge
    // appears even before they open /admin/messages. Same pattern as
    // conversations.start.
    await notifyAdmins(ctx, {
      kind: "message",
      title:
        kind === "devis"
          ? `Nouvelle demande de devis de ${name.trim()}`
          : `Nouveau message de ${name.trim()}`,
      body: subject?.trim() || body.trim().slice(0, 80),
      href: "/admin/messages",
    });

    // Notify by email, but only after the row is safely committed and without
    // blocking the visitor on Gmail's latency. If the mail fails the message
    // is still in /admin/messages — the inbox is the record, email is the
    // convenience.
    await ctx.scheduler.runAfter(0, internal.email.sendContactNotification, {
      kind,
      name: name.trim(),
      email: cleanEmail,
      subject: subject?.trim() || undefined,
      body: body.trim(),
    });
  },
});

// ---- Admin ----

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("messages").order("desc").collect();
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("messages"),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
