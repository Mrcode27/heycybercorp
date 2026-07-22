import type { MutationCtx } from "../_generated/server";

/**
 * Append one line to the audit log. Plain helper (not a Convex function) —
 * call it from inside mutations so the write shares their transaction.
 */
export async function logAudit(
  ctx: MutationCtx,
  action: string,
  target?: string,
  meta?: string,
) {
  const identity = await ctx.auth.getUserIdentity();
  await ctx.db.insert("auditLog", {
    actorClerkId: identity?.subject,
    action,
    target,
    meta,
  });
}
