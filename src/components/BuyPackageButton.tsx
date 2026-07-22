"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import Icon from "./Icon";
import { cleanConvexError } from "@/lib/errors";

/**
 * Buy a package. Signed-out → sign-in link. Already owned → "possédé" link to
 * the dashboard. Otherwise starts checkout (real Stripe or the simulator).
 */
export default function BuyPackageButton({
  packageId,
  label = "Choisir ce pack",
  className,
}: {
  packageId: Id<"packages">;
  label?: string;
  className: string;
}) {
  const { isSignedIn } = useUser();
  const owned = useQuery(
    api.entitlements.hasPackage,
    isSignedIn ? { packageId } : "skip",
  );
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSignedIn && owned) {
    return (
      <Link href="/dashboard/formations" className={className}>
        <Icon name="check_circle" className="text-sm" fill />
        Pack possédé
      </Link>
    );
  }

  if (!isSignedIn) {
    return (
      <Link href="/connexion" className={className}>
        Se connecter pour acheter
      </Link>
    );
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const url = await createCheckout({ packageId });
      window.location.href = url;
    } catch (err) {
      setError(cleanConvexError(err, "Le paiement a échoué. Réessayez."));
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button type="button" onClick={buy} disabled={busy} className={className}>
        {busy ? "Redirection…" : label}
      </button>
      {error && (
        <p className="mt-2 font-code-sm text-code-sm text-error flex items-center gap-1.5">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
}
