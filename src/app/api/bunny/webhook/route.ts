import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function isValidSignature(rawBody: Buffer, request: Request) {
  const secret = process.env.BUNNY_STREAM_READ_ONLY_API_KEY?.trim();
  const signature = request.headers.get("x-bunnystream-signature") || "";
  const version = request.headers.get("x-bunnystream-signature-version");
  const algorithm = request.headers.get("x-bunnystream-signature-algorithm");
  if (!secret || version !== "v1" || algorithm !== "hmac-sha256" || !/^[0-9a-f]{64}$/.test(signature)) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
}

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (!isValidSignature(rawBody, request)) {
    return Response.json({ error: "Invalid Bunny Stream signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody.toString("utf8")) as {
      VideoLibraryId?: number;
      VideoGuid?: string;
      Status?: number;
    };
    const expectedLibrary = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
    if (!event.VideoGuid || !Number.isInteger(event.Status) || String(event.VideoLibraryId) !== expectedLibrary) {
      return Response.json({ error: "Invalid Bunny Stream webhook payload." }, { status: 400 });
    }

    // The endpoint intentionally acknowledges all valid state changes. The
    // admin UI reads current processing state from Bunny's API on demand.
    console.info("Bunny Stream video status", {
      videoId: event.VideoGuid,
      status: event.Status,
    });
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}
