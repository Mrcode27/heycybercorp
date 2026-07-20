"use client";

import { useMemo, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import AuthSync from "./AuthSync";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Adds Convex on top of Clerk. Must render INSIDE <ClerkProvider> (see layout).
 * Convex activates once `npx convex dev` sets NEXT_PUBLIC_CONVEX_URL; until then
 * children render normally and Clerk auth still works.
 */
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [],
  );

  if (!client) return <>{children}</>;

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <AuthSync />
      {children}
    </ConvexProviderWithClerk>
  );
}
