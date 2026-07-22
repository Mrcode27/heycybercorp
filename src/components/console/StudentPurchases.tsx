"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

function statusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-primary/10 text-primary border-primary/30";
    case "failed":
      return "bg-error/10 text-error border-error/30";
    default:
      return "bg-secondary/10 text-secondary border-secondary/30";
  }
}

function statusLabel(status: string) {
  return { paid: "Payé", pending: "En attente", failed: "Échoué", refunded: "Remboursé" }[status] ?? status;
}

function money(amount: number, currency: string) {
  return currency === "EUR"
    ? `${(amount / 100).toLocaleString("fr-FR")} €`
    : `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function StudentPurchases() {
  const orders = useQuery(api.orders.mine);

  if (orders?.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="receipt_long" className="text-primary text-5xl mb-4" />
        <h4 className="font-headline-lg-mobile text-on-surface mb-2">Aucun achat pour l&apos;instant</h4>
        <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
          Vos reçus et formations achetées apparaîtront ici. Chaque achat est unique et donne un
          accès à vie.
        </p>
        <Link
          href="/formations"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all"
        >
          Voir les formations
          <Icon name="arrow_forward" className="text-sm" />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
              <th className="p-4">Date</th>
              <th className="p-4">Achat</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md">
            {orders === undefined && (
              <tr><td colSpan={4} className="p-6 text-on-surface-variant font-code-sm">Chargement…</td></tr>
            )}
            {orders?.map((o, i) => (
              <tr key={o._id} className={`border-t border-outline-variant/20 ${i % 2 ? "bg-surface-container-lowest/50" : ""}`}>
                <td className="p-4 text-on-surface-variant font-code-sm text-code-sm whitespace-nowrap">
                  {new Date(o._creationTime).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4 text-on-surface font-medium">{o.label}</td>
                <td className="p-4 font-code-sm tabular-nums whitespace-nowrap">{money(o.amount, o.currency)}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded border ${statusClasses(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
