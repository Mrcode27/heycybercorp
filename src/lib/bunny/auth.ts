import "server-only";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export class BunnyAuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403 | 500,
    message: string,
  ) {
    super(message);
    this.name = "BunnyAuthorizationError";
  }
}

/** Require the same Convex-backed admin role used by the admin UI. */
export async function requireBunnyAdmin() {
  const { userId, getToken } = await auth();
  if (!userId) throw new BunnyAuthorizationError(401, "Authentication required.");

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) throw new BunnyAuthorizationError(500, "Convex is not configured.");

  const token = await getToken({ template: "convex" });
  if (!token) throw new BunnyAuthorizationError(401, "Authentication token unavailable.");

  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  const user = await client.query(api.users.current, {});
  if (!user || user.role !== "admin") {
    throw new BunnyAuthorizationError(403, "Administrator access required.");
  }
  return user;
}
