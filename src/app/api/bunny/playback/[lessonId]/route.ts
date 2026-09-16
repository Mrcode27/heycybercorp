import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { createSignedEmbedUrl } from "@/lib/bunny/server";
import { getBunnyStreamConfig } from "@/lib/bunny/config";
import { bunnyErrorResponse } from "@/lib/bunny/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    if (!convexUrl) {
      return Response.json({ error: "Convex is not configured." }, { status: 503 });
    }

    const client = new ConvexHttpClient(convexUrl);
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (token) client.setAuth(token);

    const { lessonId } = await context.params;
    const playback = await client.query(api.lessons.playback, {
      lessonId: lessonId as Id<"lessons">,
    });
    if (!playback.allowed || playback.kind !== "url" || !playback.url) {
      return Response.json({ error: "Video access denied." }, { status: 403 });
    }

    const match = playback.url.match(
      /(?:iframe|player)\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([\w-]+)/,
    );
    const config = getBunnyStreamConfig();
    if (!match || match[1] !== config.libraryId) {
      return Response.json({ error: "This lesson is not a configured Bunny Stream video." }, { status: 400 });
    }

    const location = createSignedEmbedUrl(match[2], 3600);
    return new Response(null, {
      status: 307,
      headers: { Location: location, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return bunnyErrorResponse(error);
  }
}
