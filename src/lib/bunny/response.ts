import { BunnyAuthorizationError } from "./auth";
import { BunnyApiError } from "./server";
import { BunnyConfigurationError } from "./config";

export function bunnyErrorResponse(error: unknown) {
  if (error instanceof BunnyAuthorizationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof BunnyConfigurationError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof BunnyApiError) {
    return Response.json(
      { error: error.message, upstreamStatus: error.status },
      { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
    );
  }
  console.error("Unexpected Bunny Stream error", error);
  return Response.json({ error: "Unexpected Bunny Stream error." }, { status: 500 });
}
