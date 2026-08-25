"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "./Icon";

type Outcome = "paid" | "processing" | "failed" | "unknown";

/**
 * Banner shown when Stripe redirects the buyer back (?paiement=succes|annule).
 *
 * "succes" only means Stripe finished its own flow — it is a URL, and a URL is
 * never proof of payment. So on arrival the session id is re-read server-side
 * straight from the Stripe API (stripe.confirmCheckout) and the banner reports
 * what Stripe actually says. Access itself is granted server-side; this just
 * tells the buyer where they stand.
 *
 * The webhook remains the authoritative path (it fires even if the buyer never
 * comes back); this poll simply removes the wait when it lands first.
 */
const POLL_DELAYS_MS = [0, 1200, 2000, 3000, 5000];

export default function CheckoutResultBanner({
  surface = "glass-card",
  spacing = "mb-10",
}: {
  /** Matches the surrounding page: glass-card on /tarifs, glass-panel on a course. */
  surface?: "glass-card" | "glass-panel";
  spacing?: string;
}) {
  const searchParams = useSearchParams();
  const paiement = searchParams.get("paiement");
  const sessionId = searchParams.get("session_id");
  const confirmCheckout = useAction(api.stripe.confirmCheckout);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const isReturn = paiement === "succes" && Boolean(sessionId);

  useEffect(() => {
    if (!isReturn || !sessionId) return;
    let cancelled = false;

    (async () => {
      for (const delay of POLL_DELAYS_MS) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        let result: Outcome;
        try {
          result = await confirmCheckout({ sessionId });
        } catch {
          result = "unknown";
        }
        if (cancelled) return;
        setOutcome(result);
        // "unknown" also covers "Clerk auth not attached yet", so keep trying.
        if (result === "paid" || result === "failed") return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReturn, sessionId, confirmCheckout]);

  const wrapper = `${surface} rounded-xl px-6 py-4 ${spacing} flex items-center gap-3 text-left`;

  if (paiement === "annule") {
    return (
      <div className={`${wrapper} border-outline-variant/40`}>
        <Icon name="info" className="text-secondary" />
        <p className="text-on-surface-variant">
          Paiement annulé. Vous n&apos;avez pas été débité.
        </p>
      </div>
    );
  }

  if (!isReturn) return null;

  if (outcome === "paid") {
    return (
      <div className={`${wrapper} border-primary/50`}>
        <Icon name="check_circle" className="text-primary" fill />
        <p className="text-on-surface">
          <span className="font-bold text-primary">Paiement confirmé.</span> Votre accès
          est actif — retrouvez vos formations dans votre espace.
        </p>
      </div>
    );
  }

  if (outcome === "failed") {
    return (
      <div className={`${wrapper} border-error/50`}>
        <Icon name="error" className="text-error" fill />
        <p className="text-on-surface">
          <span className="font-bold text-error">Paiement non abouti.</span> Vous
          n&apos;avez pas été débité. Réessayez, ou écrivez-nous si le problème persiste.
        </p>
      </div>
    );
  }

  if (outcome === "processing") {
    return (
      <div className={`${wrapper} border-secondary/50`}>
        <Icon name="hourglass_top" className="text-secondary" fill />
        <p className="text-on-surface">
          <span className="font-bold text-secondary">Paiement en cours de validation.</span>{" "}
          Certains moyens de paiement (prélèvement SEPA) demandent quelques jours. Votre
          accès s&apos;ouvrira automatiquement dès la confirmation de la banque.
        </p>
      </div>
    );
  }

  // null (first render) or "unknown" while a retry is still pending.
  return (
    <div className={`${wrapper} border-outline-variant/40`}>
      <Icon name="progress_activity" className="text-primary animate-spin" />
      <p className="text-on-surface-variant">Vérification du paiement auprès de Stripe…</p>
    </div>
  );
}
