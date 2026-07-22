import { query } from "./_generated/server";
import { requireAdmin } from "./users";

/** Latest audit entries, newest first — the /admin/journal page. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("auditLog").order("desc").take(200);
  },
});
