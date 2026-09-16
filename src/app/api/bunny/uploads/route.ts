import { requireBunnyAdmin } from "@/lib/bunny/auth";
import { bunnyErrorResponse } from "@/lib/bunny/response";
import { createBunnyVideo, createTusUploadTicket } from "@/lib/bunny/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireBunnyAdmin();
    const body = (await request.json()) as {
      title?: unknown;
      collectionId?: unknown;
      thumbnailTime?: unknown;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 255) {
      return Response.json({ error: "A title between 1 and 255 characters is required." }, { status: 400 });
    }

    const collectionId =
      typeof body.collectionId === "string" && body.collectionId.trim()
        ? body.collectionId.trim()
        : undefined;
    const thumbnailTime =
      typeof body.thumbnailTime === "number" && body.thumbnailTime >= 0
        ? Math.round(body.thumbnailTime)
        : undefined;

    const video = await createBunnyVideo({ title, collectionId, thumbnailTime });
    return Response.json({ video, upload: createTusUploadTicket(video.guid) }, { status: 201 });
  } catch (error) {
    return bunnyErrorResponse(error);
  }
}
