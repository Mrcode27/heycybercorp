import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";
import { ownedLevels } from "./entitlements";
import { logAudit } from "./lib/audit";
import type { Doc, Id, DataModel } from "./_generated/dataModel";
import type { GenericQueryCtx } from "convex/server";

/**
 * Scenario cases — the simulation engine.
 *
 * One rule governs this file: **`caseSteps.answer` never crosses the wire.**
 * Every student-facing payload is assembled field by field rather than by
 * spreading a document, so adding a column to the schema cannot leak it by
 * accident. A locked case returns `null` for its body rather than a value the
 * client is trusted to hide.
 *
 * Access is re-checked in all three places a request can arrive: the catalogue,
 * the direct fetch by slug (an IDOR would otherwise hand out paid content), and
 * every single submission.
 */

const levelValidator = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
);

const artifactKind = v.union(
  v.literal("email"),
  v.literal("log"),
  v.literal("terminal"),
  v.literal("file"),
  v.literal("table"),
  v.literal("http"),
  v.literal("image"),
  v.literal("webos"),
);

/**
 * Attempt caps.
 *
 * Be honest about what this buys: on a four-option question, no cap eliminates
 * guessing — three tries still find the answer, and one try is a 25% win. A cap
 * only makes guessing unattractive. What actually carries the value is the
 * `reveal`, which explains *why*, and which a guesser skips past having learnt
 * nothing. Free text is capped far higher because a wrong spelling is not a
 * wrong answer.
 */
const MAX_ATTEMPTS = { choice: 3, text: 40 } as const;

/**
 * Fold a reply down to what it actually says: lowercase, no accents, no
 * punctuation, single spaces. "Ne le partagez, avec personne !" and "ne le
 * partagez avec personne" become the same string.
 */
function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@._:/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, capped work — inputs here are short answers. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Is this reply right?
 *
 * Grading a security exercise on spelling teaches spelling. A student who
 * identified the attacker's IP should not fail on a trailing full stop, and one
 * who wrote "ne partagez le code avec personne" understood the SMS exactly as
 * well as one who copied it verbatim. So:
 *
 *  - every mode compares normalised text (see above);
 *  - `exact` additionally forgives one typo per ~8 characters;
 *  - `keywords` asks only that the meaningful words are present, in any order
 *    and any phrasing — the mode to reach for whenever the answer is a
 *    sentence rather than a value;
 *  - `contains` accepts a reply that includes the expected value amid
 *    surrounding words.
 *
 * Strictness is still available where it belongs: an IP address or a timestamp
 * stays `exact`, because there getting it almost right is getting it wrong.
 */
function matches(given: string, step: Doc<"caseSteps">): boolean {
  const reply = normalise(given);
  if (!reply) return false;
  const candidates = [step.answer, ...(step.accept ?? [])].map(normalise).filter(Boolean);
  const mode = step.match ?? "exact";

  if (mode === "keywords") {
    // Each candidate is a required token or stem.
    return candidates.length > 0 && candidates.every((k) => reply.includes(k));
  }
  if (mode === "contains") {
    // One direction only. Also accepting "candidate contains reply" would pass
    // a truncated answer — "45.146.83.1" for "45.146.83.12" — which is wrong.
    // Shorter equivalents belong in `accept`, where they are deliberate.
    return candidates.some((c) => reply.includes(c));
  }
  return candidates.some((c) => {
    if (reply === c) return true;
    const tolerance = Math.floor(c.length / 8);
    return tolerance > 0 && distance(reply, c) <= tolerance;
  });
}

type Ctx = GenericQueryCtx<DataModel>;

async function canPlay(ctx: Ctx, c: Doc<"cases">, userId: Id<"users"> | null) {
  if (c.isFree) return true;
  if (!userId) return false;
  const levels = await ownedLevels(ctx, userId);
  return levels.has(c.level);
}

/**
 * The catalogue. Deliberately cheap and answer-free: it carries no artifacts
 * and no steps, only enough to render a card and a progress bar.
 */
export const listForStudent = query({
  args: {},
  handler: async (ctx) => {
    const all = (await ctx.db.query("cases").withIndex("by_order").collect())
      .filter((c) => c.published)
      .sort((a, b) => a.order - b.order);

    const user = await getCurrentUser(ctx);
    const userId = user && !user.suspended ? user._id : null;

    const mine = userId
      ? await ctx.db
          .query("caseStepAttempts")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect()
      : [];

    let points = 0;
    let maxPoints = 0;
    let completed = 0;

    const rows = [];
    for (const c of all) {
      const unlocked = await canPlay(ctx, c, userId);
      const steps = await ctx.db
        .query("caseSteps")
        .withIndex("by_case", (q) => q.eq("caseId", c._id))
        .collect();
      const solvedIds = new Set(
        mine.filter((a) => a.caseId === c._id && a.solvedAt).map((a) => a.stepId),
      );
      const solvedSteps = steps.filter((s) => solvedIds.has(s._id));
      const casePoints = steps.reduce((n, s) => n + s.points, 0);
      const earned = solvedSteps.reduce((n, s) => n + s.points, 0);
      const done = steps.length > 0 && solvedSteps.length === steps.length;

      if (unlocked) maxPoints += casePoints;
      points += earned;
      if (done) completed += 1;

      rows.push({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        level: c.level,
        category: c.category,
        icon: c.icon,
        estimatedMinutes: c.estimatedMinutes,
        isFree: c.isFree,
        points: casePoints,
        unlocked,
        totalSteps: steps.length,
        solvedSteps: solvedSteps.length,
        earnedPoints: earned,
        completed: done,
      });
    }

    return {
      cases: rows,
      stats: { completed, total: all.length, points, maxPoints },
    };
  },
});

/**
 * One case, ready to play. Refuses outright when the caller has not bought the
 * covering pack — the body is never sent and then hidden.
 */
export const getCase = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const c = await ctx.db
      .query("cases")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!c || !c.published) return null;

    const user = await getCurrentUser(ctx);
    const userId = user && !user.suspended ? user._id : null;
    const unlocked = await canPlay(ctx, c, userId);

    const head = {
      _id: c._id,
      title: c.title,
      slug: c.slug,
      summary: c.summary,
      level: c.level,
      category: c.category,
      icon: c.icon,
      estimatedMinutes: c.estimatedMinutes,
      isFree: c.isFree,
      unlocked,
    };

    if (!unlocked) {
      return { ...head, setting: null, artifacts: [], steps: [], signedIn: Boolean(userId) };
    }

    const [artifacts, steps] = await Promise.all([
      ctx.db.query("caseArtifacts").withIndex("by_case", (q) => q.eq("caseId", c._id)).collect(),
      ctx.db.query("caseSteps").withIndex("by_case", (q) => q.eq("caseId", c._id)).collect(),
    ]);

    const attempts = userId
      ? await ctx.db
          .query("caseStepAttempts")
          .withIndex("by_user_case", (q) => q.eq("userId", userId).eq("caseId", c._id))
          .collect()
      : [];
    const byStep = new Map(attempts.map((a) => [a.stepId, a]));

    return {
      ...head,
      setting: c.setting,
      signedIn: Boolean(userId),
      artifacts: artifacts
        .sort((a, b) => a.order - b.order)
        .map((a) => ({ _id: a._id, kind: a.kind, label: a.label, content: a.content })),
      // `answer` is absent by construction. `reveal` only appears once solved.
      steps: steps
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const mine = byStep.get(s._id);
          const solved = Boolean(mine?.solvedAt);
          return {
            _id: s._id,
            order: s.order,
            prompt: s.prompt,
            kind: s.kind,
            choices: s.choices,
            hint: s.hint ?? null,
            points: s.points,
            solved,
            attempts: mine?.attempts ?? 0,
            maxAttempts: MAX_ATTEMPTS[s.kind],
            reveal: solved ? (s.reveal ?? null) : null,
          };
        }),
    };
  },
});

/**
 * Check one answer. Returns only whether it was right — never how close, never
 * which option was wrong, never the expected value.
 */
export const submitStep = mutation({
  args: { stepId: v.id("caseSteps"), answer: v.string() },
  handler: async (ctx, { stepId, answer }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Connectez-vous pour répondre.");
    if (user.suspended) throw new Error("Ce compte est suspendu.");

    const step = await ctx.db.get(stepId);
    if (!step) throw new Error("Étape introuvable.");
    const c = await ctx.db.get(step.caseId);
    if (!c || !c.published) throw new Error("Cas introuvable.");

    // Re-checked here and not merely in the UI: this mutation is reachable
    // directly, whatever the client renders.
    if (!(await canPlay(ctx, c, user._id))) {
      throw new Error("Ce cas n'est pas débloqué.");
    }

    const existing = await ctx.db
      .query("caseStepAttempts")
      .withIndex("by_user_step", (q) => q.eq("userId", user._id).eq("stepId", stepId))
      .unique();

    if (existing?.solvedAt) {
      return { correct: true as const, already: true, points: step.points, reveal: step.reveal ?? null };
    }

    const cap = MAX_ATTEMPTS[step.kind];
    if (existing && existing.attempts >= cap) {
      throw new Error("Trop de tentatives sur cette étape. Relisez le dossier, ou passez à la suite.");
    }

    const correct = matches(answer, step);

    if (existing) {
      await ctx.db.patch(existing._id, {
        attempts: existing.attempts + 1,
        ...(correct ? { solvedAt: Date.now() } : {}),
      });
    } else {
      await ctx.db.insert("caseStepAttempts", {
        userId: user._id,
        caseId: c._id,
        stepId,
        attempts: 1,
        ...(correct ? { solvedAt: Date.now() } : {}),
      });
    }

    return {
      correct,
      already: false,
      points: correct ? step.points : 0,
      reveal: correct ? (step.reveal ?? null) : null,
    };
  },
});

// ---- Admin ----

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const cases = await ctx.db.query("cases").collect();
    const rows = [];
    for (const c of cases.sort((a, b) => a.order - b.order)) {
      const [artifacts, steps, attempts] = await Promise.all([
        ctx.db.query("caseArtifacts").withIndex("by_case", (q) => q.eq("caseId", c._id)).collect(),
        ctx.db.query("caseSteps").withIndex("by_case", (q) => q.eq("caseId", c._id)).collect(),
        ctx.db.query("caseStepAttempts").withIndex("by_case", (q) => q.eq("caseId", c._id)).collect(),
      ]);
      const players = new Set(attempts.map((a) => a.userId));
      rows.push({
        ...c,
        artifacts: artifacts.sort((a, b) => a.order - b.order),
        steps: steps.sort((a, b) => a.order - b.order),
        players: players.size,
        solvedSteps: attempts.filter((a) => a.solvedAt).length,
      });
    }
    return rows;
  },
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create or replace a whole case in one transaction — head, evidence and
 * questions together. Authoring a case is a single edit, so saving it should be
 * a single write; partial CRUD would let a case exist with steps that no longer
 * match its artifacts.
 */
export const adminSave = mutation({
  args: {
    caseId: v.optional(v.id("cases")),
    title: v.string(),
    summary: v.string(),
    setting: v.string(),
    guide: v.optional(v.string()),
    level: levelValidator,
    category: v.string(),
    icon: v.string(),
    estimatedMinutes: v.number(),
    isFree: v.boolean(),
    published: v.boolean(),
    artifacts: v.array(
      v.object({ kind: artifactKind, label: v.string(), content: v.string() }),
    ),
    steps: v.array(
      v.object({
        prompt: v.string(),
        kind: v.union(v.literal("text"), v.literal("choice")),
        choices: v.array(v.string()),
        answer: v.string(),
        accept: v.optional(v.array(v.string())),
        match: v.optional(
          v.union(v.literal("exact"), v.literal("contains"), v.literal("keywords")),
        ),
        hint: v.optional(v.string()),
        reveal: v.optional(v.string()),
        points: v.number(),
      }),
    ),
  },
  handler: async (ctx, { caseId, artifacts, steps, ...head }) => {
    await requireAdmin(ctx);
    if (steps.length === 0) throw new Error("Un cas doit comporter au moins une étape.");

    let id = caseId;
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing) throw new Error("Cas introuvable.");
      await ctx.db.patch(id, head);
      // Replace children wholesale. Attempts are keyed by step id, so editing
      // a case resets progress on it — acceptable, and safer than guessing
      // which reworded question is still "the same" one.
      for (const table of ["caseArtifacts", "caseSteps"] as const) {
        const old = await ctx.db
          .query(table)
          .withIndex("by_case", (q) => q.eq("caseId", id!))
          .collect();
        for (const row of old) await ctx.db.delete(row._id);
      }
      const stale = await ctx.db
        .query("caseStepAttempts")
        .withIndex("by_case", (q) => q.eq("caseId", id!))
        .collect();
      for (const row of stale) await ctx.db.delete(row._id);
    } else {
      const all = await ctx.db.query("cases").collect();
      const base = slugify(head.title) || "cas";
      let slug = base;
      let n = 2;
      while (all.some((c) => c.slug === slug)) slug = `${base}-${n++}`;
      id = await ctx.db.insert("cases", {
        ...head,
        slug,
        order: all.length ? Math.max(...all.map((c) => c.order)) + 1 : 1,
      });
    }

    for (const [i, a] of artifacts.entries()) {
      await ctx.db.insert("caseArtifacts", { caseId: id, order: i + 1, ...a });
    }
    for (const [i, s] of steps.entries()) {
      await ctx.db.insert("caseSteps", { caseId: id, order: i + 1, ...s });
    }

    await logAudit(ctx, caseId ? "case.updated" : "case.created", head.title);
    return id;
  },
});

export const adminRemove = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, { caseId }) => {
    await requireAdmin(ctx);
    const c = await ctx.db.get(caseId);
    if (!c) return;
    for (const table of ["caseArtifacts", "caseSteps", "caseStepAttempts"] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    await ctx.db.delete(caseId);
    await logAudit(ctx, "case.deleted", c.title);
  },
});
