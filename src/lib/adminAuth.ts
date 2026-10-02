import "server-only";

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

/**
 * The signed-in admin's Convex user row, or null for anyone else (signed out,
 * student, or no Convex token). Same role check the Convex functions enforce.
 * Cached per request so several callers cost one round trip.
 */
export const getServerAdmin = cache(async () => {
  const { userId, getToken } = await auth();
  if (!userId) return null;

  const token = await getToken({ template: "convex" });
  if (!token) return null;

  const user = await fetchQuery(api.users.current, {}, { token });
  return user?.role === "admin" ? user : null;
});

/**
 * `generateMetadata` for an admin page. Next streams metadata separately from
 * the page body, so a static `metadata` export would still send the page title
 * ("Diffusion | Admin …") to a visitor who is shown the 404.
 */
export function adminMetadata(title: string) {
  return async (): Promise<Metadata> => {
    if (!(await getServerAdmin())) notFound();
    return { title };
  };
}
