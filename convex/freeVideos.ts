import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { logAudit } from "./lib/audit";

/**
 * Published free videos for the homepage, ordered, each with the (optional)
 * course it promotes so the card can show a "buy this course" link.
 */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const vids = (await ctx.db.query("freeVideos").collect())
      .filter((x) => x.published)
      .sort((a, b) => a.order - b.order);
    return Promise.all(
      vids.map(async (video) => {
        const course = video.courseId ? await ctx.db.get(video.courseId) : null;
        const linkable = course && course.published ? course : null;
        return {
          _id: video._id,
          title: video.title,
          description: video.description,
          youtubeUrl: video.youtubeUrl,
          courseSlug: linkable?.slug ?? null,
          courseTitle: linkable?.title ?? null,
        };
      }),
    );
  },
});

// ---- Admin ----

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("freeVideos").collect()).sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    youtubeUrl: v.string(),
    published: v.boolean(),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const siblings = await ctx.db.query("freeVideos").collect();
    const order = siblings.reduce((max, x) => Math.max(max, x.order), 0) + 1;
    const id = await ctx.db.insert("freeVideos", { ...args, order });
    await logAudit(ctx, "freeVideo.created", args.title);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("freeVideos"),
    title: v.string(),
    description: v.string(),
    youtubeUrl: v.string(),
    published: v.boolean(),
    // null clears the course link; an id sets it. (undefined would be dropped
    // over the wire, so we use an explicit null to mean "no linked course".)
    courseId: v.union(v.id("courses"), v.null()),
  },
  handler: async (ctx, { id, courseId, ...rest }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { ...rest, courseId: courseId ?? undefined });
    await logAudit(ctx, "freeVideo.updated", rest.title);
  },
});

export const remove = mutation({
  args: { id: v.id("freeVideos") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const video = await ctx.db.get(id);
    await ctx.db.delete(id);
    await logAudit(ctx, "freeVideo.deleted", video?.title);
  },
});

/** Swap a video with its neighbour above/below (admin reorder). */
export const move = mutation({
  args: { id: v.id("freeVideos"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    await requireAdmin(ctx);
    const cur = await ctx.db.get(id);
    if (!cur) return;
    const all = (await ctx.db.query("freeVideos").collect()).sort((a, b) => a.order - b.order);
    const idx = all.findIndex((x) => x._id === id);
    const swap = direction === "up" ? all[idx - 1] : all[idx + 1];
    if (!swap) return;
    await ctx.db.patch(cur._id, { order: swap.order });
    await ctx.db.patch(swap._id, { order: cur.order });
  },
});
