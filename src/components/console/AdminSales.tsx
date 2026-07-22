"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

function statusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-primary/10 text-primary border-primary/30";
    case "failed":
      return "bg-error/10 text-error border-error/30";
    case "refunded":
      return "bg-surface-variant text-on-surface-variant border-outline-variant/40";
    default:
      return "bg-secondary/10 text-secondary border-secondary/30"; // pending
  }
}

function money(amount: number, currency: string) {
  return currency === "EUR"
    ? `${(amount / 100).toLocaleString("fr-FR")} €`
    : `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function AdminSales() {
  const orders = useQuery(api.orders.listAll, {});

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-outline-variant/30">
        <Icon name="point_of_sale" className="text-secondary" fill />
        <h3 className="font-headline-lg-mobile text-on-surface">Ventes &amp; Commandes</h3>
      </div>

      {orders?.length === 0 ? (
        <div className="p-12 text-center">
          <Icon name="receipt_long" className="text-on-surface-variant text-4xl mb-3 opacity-60" />
          <p className="text-on-surface-variant">
            Aucune commande pour l&apos;instant. Les ventes apparaîtront ici dès l&apos;activation
            des paiements (Stripe — Phase&nbsp;4).
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
                <th className="p-4">Client</th>
                <th className="p-4">Achat</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Fournisseur</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {orders === undefined && (
                <tr><td colSpan={5} className="p-6 text-on-surface-variant font-code-sm">Chargement…</td></tr>
              )}
              {orders?.map((o, i) => (
                <tr key={o._id} className={`border-t border-outline-variant/20 ${i % 2 ? "bg-surface-container-lowest/50" : ""}`}>
                  <td className="p-4 text-on-surface-variant text-sm">{o.userEmail}</td>
                  <td className="p-4 text-on-surface font-medium">{o.label}</td>
                  <td className="p-4 font-code-sm tabular-nums whitespace-nowrap">{money(o.amount, o.currency)}</td>
                  <td className="p-4 text-on-surface-variant capitalize">{o.provider}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border capitalize ${statusClasses(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
