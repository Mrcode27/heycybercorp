const DEFAULT_API_URL = "https://video.bunnycdn.com";
const DEFAULT_PLAYER_URL = "https://player.mediadelivery.net";
const DEFAULT_TUS_URL = "https://video.bunnycdn.com/tusupload";

export interface BunnyStreamConfig {
  apiKey: string;
  libraryId: string;
  apiUrl: string;
  playerUrl: string;
  tusUrl: string;
}

function cleanUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

/** Server-only Bunny Stream configuration. Throws before any remote request. */
export function getBunnyStreamConfig(): BunnyStreamConfig {
  const apiKey = process.env.BUNNY_STREAM_API_KEY?.trim();
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();

  if (!apiKey || !libraryId) {
    throw new BunnyConfigurationError(
      "Bunny Stream is not configured. Set BUNNY_STREAM_API_KEY and BUNNY_STREAM_LIBRARY_ID.",
    );
  }
  if (!/^\d+$/.test(libraryId)) {
    throw new BunnyConfigurationError("BUNNY_STREAM_LIBRARY_ID must be numeric.");
  }

  return {
    apiKey,
    libraryId,
    apiUrl: cleanUrl(process.env.BUNNY_STREAM_API_URL, DEFAULT_API_URL),
    playerUrl: cleanUrl(process.env.BUNNY_STREAM_PLAYER_URL, DEFAULT_PLAYER_URL),
    tusUrl: cleanUrl(process.env.BUNNY_STREAM_TUS_URL, DEFAULT_TUS_URL),
  };
}

export class BunnyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BunnyConfigurationError";
  }
}
