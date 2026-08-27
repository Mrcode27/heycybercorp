import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { ownedLevels } from "./entitlements";
import { logAudit } from "./lib/audit";
import type { Doc } from "./_generated/dataModel";

/**
 * Hands-on labs: a brief, and a flag the student has to find.
 *
 * The security rule for this whole file: `lab.flag` never crosses the wire.
 * Student-facing queries build their own objects field by field rather than
 * spreading the document, so adding a field to the schema can never leak it by
 * accident. Checking happens in `submit`, server-side.
 */

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);

/** Flags are compared trimmed and case-insensitively — a stray capital is not a wrong answer. */
function normalise(s: string): string {
  return s.trim().toLowerCase();
}

/** Brute force is not a lab skill; this caps it well above any honest attempt. */
const MAX_ATTEMPTS = 100;

/** The safe shape of a lab for a signed-in student. Note: no `flag`. */
function publicLab(lab: Doc<"labs">, unlocked: boolean) {
  return {
    _id: lab._id,
    title: lab.title,
    slug: lab.slug,
    summary: lab.summary,
    // The full brief and the hint are part of what a pack buys, so a locked
    // lab shows only its teaser.
    brief: unlocked ? lab.brief : null,
    hint: unlocked ? (lab.hint ?? null) : null,
    level: lab.level,
    category: lab.category,
    icon: lab.icon,
    points: lab.points,
    isFree: lab.isFree,
    unlocked,
  };
}

/**
 * Every published lab, each marked unlocked/solved for the caller, plus a
 * score summary. Signed-out visitors see the catalogue with everything locked.
 */
export const listForStudent = query({
  args: {},
  handler: async (ctx) => {
    const labs = (await ctx.db.query("labs").withIndex("by_order").collect())
      .filter((l) => l.published)
      .sort((a, b) => a.order - b.order);

    const user = await getCurrentUser(ctx);
    if (!user || user.suspended) {
      return {
        labs: labs.map((l) => ({
          ...publicLab(l, l.isFree),
          solved: false,
          attempts: 0,
        })),
        stats: { solved: 0, total: labs.length, points: 0, maxPoints: 0 },
      };
    }

    const levels = await ownedLevels(ctx, user._id);
    const solves = await ctx.db
      .query("labSolves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const byLab = new Map(solves.map((s) => [s.labId, s]));

    let points = 0;
    let solved = 0;
    let maxPoints = 0;

    const rows = labs.map((l) => {
      const unlocked = l.isFree || levels.has(l.level);
      const mine = byLab.get(l._id);
      const isSolved = Boolean(mine?.solvedAt);
      if (unlocked) maxPoints += l.points;
      if (isSolved) {
        solved += 1;
        points += l.points;
      }
      return {
        ...publicLab(l, unlocked),
        solved: isSolved,
        attempts: mine?.attempts ?? 0,
      };
    });

    return { labs: rows, stats: { solved, total: labs.length, points, maxPoints } };
  },
});

/**
 * Check a flag. Returns whether it was right — never what the right one is,
 * and never how close the guess was.
 */
export const submit = mutation({
  args: { labId: v.id("labs"), flag: v.string() },
  handler: async (ctx, { labId, flag }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Connectez-vous pour valider un lab.");
    if (user.suspended) throw new Error("Ce compte est suspendu.");

    const lab = await ctx.db.get(labId);
    if (!lab || !lab.published) throw new Error("Lab introuvable.");

    const levels = await ownedLevels(ctx, user._id);
    if (!lab.isFree && !levels.has(lab.level)) {
      throw new Error("Ce lab n'est pas encore débloqué.");
    }

    const existing = await ctx.db
      .query("labSolves")
      .withIndex("by_user_lab", (q) => q.eq("userId", user._id).eq("labId", labId))
      .unique();

    if (existing?.solvedAt) {
      return { correct: true as const, already: true as const, points: lab.points };
    }
    if (existing && existing.attempts >= MAX_ATTEMPTS) {
      throw new Error("Trop de tentatives sur ce lab. Contactez-nous si vous êtes bloqué.");
    }

    const correct = normalise(flag) === normalise(lab.flag);

    if (existing) {
      await ctx.db.patch(existing._id, {
        attempts: existing.attempts + 1,
        ...(correct ? { solvedAt: Date.now() } : {}),
      });
    } else {
      await ctx.db.insert("labSolves", {
        userId: user._id,
        labId,
        attempts: 1,
        ...(correct ? { solvedAt: Date.now() } : {}),
      });
    }

    return {
      correct,
      already: false as const,
      points: correct ? lab.points : 0,
    };
  },
});

// ---- Admin ----

/** Full lab docs, flag included — admin only, for the management table. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const labs = await ctx.db.query("labs").collect();
    const solves = await ctx.db.query("labSolves").collect();
    return labs
      .sort((a, b) => a.order - b.order)
      .map((l) => ({
        ...l,
        solveCount: solves.filter((s) => s.labId === l._id && s.solvedAt).length,
        attemptCount: solves
          .filter((s) => s.labId === l._id)
          .reduce((n, s) => n + s.attempts, 0),
      }));
  },
});

const labFields = {
  title: v.string(),
  summary: v.string(),
  brief: v.string(),
  hint: v.optional(v.string()),
  level: levelValidator,
  category: v.string(),
  icon: v.string(),
  flag: v.string(),
  points: v.number(),
  isFree: v.boolean(),
  published: v.boolean(),
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const create = mutation({
  args: labFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("labs").collect();
    const base = slugify(args.title) || "lab";
    // Slugs must stay unique even if two labs share a title.
    let slug = base;
    let n = 2;
    while (all.some((l) => l.slug === slug)) slug = `${base}-${n++}`;

    const id = await ctx.db.insert("labs", {
      ...args,
      slug,
      order: all.length ? Math.max(...all.map((l) => l.order)) + 1 : 1,
    });
    await logAudit(ctx, "lab.created", args.title);
    return id;
  },
});

export const update = mutation({
  args: { labId: v.id("labs"), ...labFields },
  handler: async (ctx, { labId, ...fields }) => {
    await requireAdmin(ctx);
    const lab = await ctx.db.get(labId);
    if (!lab) throw new Error("Lab introuvable.");
    await ctx.db.patch(labId, fields);
    await logAudit(ctx, "lab.updated", fields.title);
  },
});

export const remove = mutation({
  args: { labId: v.id("labs") },
  handler: async (ctx, { labId }) => {
    await requireAdmin(ctx);
    const lab = await ctx.db.get(labId);
    if (!lab) return;
    // Solves reference the lab, so they go with it rather than dangling.
    const solves = await ctx.db
      .query("labSolves")
      .withIndex("by_lab", (q) => q.eq("labId", labId))
      .collect();
    for (const s of solves) await ctx.db.delete(s._id);
    await ctx.db.delete(labId);
    await logAudit(ctx, "lab.deleted", lab.title);
  },
});
