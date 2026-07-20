"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Upserts the signed-in Clerk user into the Convex `users` table.
 * Renders nothing; mounted once inside the Convex + Clerk providers.
 */
export default function AuthSync() {
  const { isSignedIn } = useUser();
  const store = useMutation(api.users.store);

  useEffect(() => {
    if (isSignedIn) {
      store({}).catch(() => {
        /* transient auth timing errors are safe to ignore; it retries on next mount */
      });
    }
  }, [isSignedIn, store]);

  return null;
}
