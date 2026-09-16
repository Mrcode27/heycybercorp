import { requireBunnyAdmin } from "@/lib/bunny/auth";
import { bunnyErrorResponse } from "@/lib/bunny/response";
import { bunnyRequest } from "@/lib/bunny/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROOTS = new Set(["videos", "collections"]);
const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    await requireBunnyAdmin();
    const { path } = await context.params;
    if (!path.length || !ALLOWED_ROOTS.has(path[0]) || path.some((part) => !SAFE_SEGMENT.test(part))) {
      return Response.json({ error: "Unsupported Bunny Stream path." }, { status: 400 });
    }

    const method = request.method.toUpperCase();
    const contentType = request.headers.get("content-type") || "";
    const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    const upstream = await bunnyRequest<unknown>(
      path.join("/"),
      {
        method,
        body,
        headers: contentType ? { "Content-Type": contentType } : undefined,
      },
      new URL(request.url).searchParams,
    );
    return Response.json(upstream);
  } catch (error) {
    return bunnyErrorResponse(error);
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
