import "server-only";

import { createHash } from "node:crypto";
import { getBunnyStreamConfig } from "./config";

export interface BunnyVideo {
  videoLibraryId: number;
  guid: string;
  title: string;
  status: number;
  encodeProgress?: number;
  length?: number;
  collectionId?: string;
  thumbnailFileName?: string;
  [key: string]: unknown;
}

export class BunnyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BunnyApiError";
  }
}

function libraryUrl(path: string) {
  const config = getBunnyStreamConfig();
  const safePath = path.replace(/^\/+/, "");
  return new URL(`/library/${config.libraryId}/${safePath}`, `${config.apiUrl}/`);
}

export async function bunnyRequest<T>(
  path: string,
  init: RequestInit = {},
  searchParams?: URLSearchParams,
): Promise<T> {
  const config = getBunnyStreamConfig();
  const url = libraryUrl(path);
  if (searchParams) url.search = searchParams.toString();

  const headers = new Headers(init.headers);
  headers.set("AccessKey", config.apiKey);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, cache: "no-store" });
  } catch (cause) {
    throw new BunnyApiError(502, "Bunny Stream could not be reached.", cause);
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const upstreamMessage =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Bunny Stream returned HTTP ${response.status}.`;
    throw new BunnyApiError(response.status, upstreamMessage, payload);
  }

  return payload as T;
}

export async function createBunnyVideo(input: {
  title: string;
  collectionId?: string;
  thumbnailTime?: number;
}) {
  return bunnyRequest<BunnyVideo>("videos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTusUploadTicket(videoId: string) {
  const config = getBunnyStreamConfig();
  const configuredLifetime = Number(process.env.BUNNY_STREAM_TUS_EXPIRATION_SECONDS || 86400);
  const lifetime = Number.isFinite(configuredLifetime)
    ? Math.min(Math.max(Math.round(configuredLifetime), 3600), 604800)
    : 86400;
  const expirationTime = Math.floor(Date.now() / 1000) + lifetime;
  const signature = createHash("sha256")
    .update(`${config.libraryId}${config.apiKey}${expirationTime}${videoId}`)
    .digest("hex");

  return {
    endpoint: config.tusUrl,
    videoId,
    libraryId: config.libraryId,
    expirationTime,
    signature,
    embedUrl: `${config.playerUrl}/embed/${config.libraryId}/${videoId}`,
  };
}

export function createSignedEmbedUrl(videoId: string, lifetimeSeconds = 3600) {
  const config = getBunnyStreamConfig();
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY?.trim();
  const base = `${config.playerUrl}/embed/${config.libraryId}/${videoId}`;
  if (!tokenKey) return base;

  const expires = Math.floor(Date.now() / 1000) + Math.max(60, lifetimeSeconds);
  const token = createHash("sha256")
    .update(`${tokenKey}${videoId}${expires}`)
    .digest("hex");
  return `${base}?token=${token}&expires=${expires}`;
}
