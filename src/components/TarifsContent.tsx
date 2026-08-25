"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "@/components/Icon";
import BuyPackageButton from "@/components/BuyPackageButton";
import CheckoutResultBanner from "@/components/CheckoutResultBanner";
import { formatCoursePrice, type Region } from "@/lib/format";

const TABLE_ROWS = [
  { feature: "Nombre de Labs Virtuels", deb: "05", inter: "20", pro: "ILLIMITÉ" },
  { feature: "Accès SSH Direct", deb: "NON", inter: "OUI", pro: "OUI + VPN" },
  { feature: "Support IA Assistant", deb: "Standard", inter: "Avancé", pro: "Dédié" },
  { feature: "Certificat de Réussite", deb: "check", inter: "check", pro: "check" },
  { feature: "Analyse Forensics", deb: "X", inter: "X", pro: "check" },
];

const FAQ = [
  {
    q: "Le paiement est-il unique ou récurrent ?",
    a: "Paiement unique. Vous achetez un pack une seule fois et vous accédez à vie à toutes ses formations, sans abonnement ni frais mensuels.",
  },
  {
    q: "Que contient un pack ?",
    a: "Chaque pack débloque l'accès à vie à toutes les formations de son niveau (Débutant, Intermédiaire ou Avancé), avec les certificats correspondants.",
  },
  {
    q: "Quel est le mode de paiement accepté ?",
    a: "Carte bancaire (Visa, Mastercard) et les autres moyens proposés par Stripe selon votre pays — la liste s'affiche au moment du paiement. Le Mobile Money (Orange, MTN, Wave) arrive prochainement pour l'Afrique.",
  },
];

function Cell({ value }: { value: string }) {
  if (value === "check") return <Icon name="check_circle" className="text-primary" fill />;
  if (value === "NON" || value === "X")
    return <span className="text-error">{value === "X" ? "X" : "NON"}</span>;
  return <span>{value}</span>;
}

export default function TarifsContent() {
  const packages = useQuery(api.packages.listPublished);
  const me = useQuery(api.users.current);
  const [regionOverride, setRegionOverride] = useState<Region | null>(null);
  const region: Region = regionOverride ?? me?.region ?? "AFRIQUE";

  return (
    <>
      {/* Hero + plans */}
      <main className="relative pt-32 pb-20 overflow-hidden cyber-grid">
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          {/* Stripe redirects the buyer back here — the banner re-checks
              the payment with Stripe before claiming anything. */}
          <CheckoutResultBanner />

          <div className="inline-flex items-center bg-surface-container border border-outline-variant/50 rounded-full px-4 py-1 mb-6">
            <Icon name="security" className="text-primary text-sm mr-2" fill />
            <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
              Protocoles d&apos;Accès Sécurisés
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl mb-6 tracking-tight text-on-surface">
            Préparez-vous à <span className="text-primary glow-text-primary">Maîtriser</span>{" "}
            le Cyber-espace
          </h1>
          <p className="max-w-2xl mx-auto text-on-surface-variant font-body-lg text-body-lg mb-12">
            Choisissez le pack adapté à votre trajectoire. Un achat unique débloque à vie toutes
            les formations de son niveau.
          </p>

          {/* Region toggle */}
          <div className="flex justify-center mb-16">
            <div className="bg-surface-container-high p-1 rounded-xl flex border border-outline-variant/30">
              {(["AFRIQUE", "EUROPE"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegionOverride(r)}
                  className={`px-8 py-2 rounded-lg font-bold transition-all duration-300 ${
                    region === r
                      ? "bg-primary text-on-primary glow-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {r === "AFRIQUE" ? "Afrique (FCFA)" : "Europe (EUR)"}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards — live packages */}
          {packages === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass-card p-8 h-96 animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <p className="text-on-surface-variant">Les packs seront bientôt disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  className={`glass-card p-8 flex flex-col text-left ${
                    pkg.featured ? "border-primary/50 relative overflow-hidden md:scale-105 z-20" : ""
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 font-label-mono text-xs font-bold uppercase tracking-tighter">
                      RECOMMANDÉ
                    </div>
                  )}
                  <div className="mb-6">
                    <span className="font-label-mono text-label-mono block mb-2 text-primary uppercase">
                      Pack
                    </span>
                    <h3 className="font-headline-lg text-headline-lg text-on-surface">{pkg.name}</h3>
                    {pkg.tagline && (
                      <p className="text-on-surface-variant text-sm mt-1">{pkg.tagline}</p>
                    )}
                  </div>
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-xl text-headline-xl text-primary">
                        {formatCoursePrice(pkg.priceEur, pkg.priceXof, region)}
                      </span>
                      <span className="text-on-surface-variant font-body-md">· à vie</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-on-surface-variant">
                        <Icon name="check_circle" className="text-primary text-xl" fill={pkg.featured} />
                        <span className="font-body-md">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <BuyPackageButton
                    packageId={pkg._id}
                    label={`Choisir ${pkg.name}`}
                    className={`w-full py-4 font-bold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-60 ${
                      pkg.featured
                        ? "bg-primary text-on-primary glow-primary hover:brightness-110"
                        : "border border-primary text-primary hover:bg-primary hover:text-on-primary"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Comparison table */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline-lg text-headline-lg text-center mb-16">
            Analyse Comparative des Protocoles
          </h2>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-outline-variant/30">
              <thead>
                <tr className="bg-surface-container-high">
                  <th className="p-6 font-label-mono text-label-mono text-on-surface border border-outline-variant/30 uppercase">
                    Fonctionnalité
                  </th>
                  <th className="p-6 font-label-mono text-label-mono text-on-surface border border-outline-variant/30 text-center uppercase">
                    Débutant
                  </th>
                  <th className="p-6 font-label-mono text-label-mono text-primary border border-outline-variant/30 text-center uppercase">
                    Intermédiaire
                  </th>
                  <th className="p-6 font-label-mono text-label-mono text-secondary border border-outline-variant/30 text-center uppercase">
                    Avancé
                  </th>
                </tr>
              </thead>
              <tbody className="font-code-sm text-code-sm">
                {TABLE_ROWS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 ? "bg-surface-container-lowest" : ""}>
                    <td className="p-4 border border-outline-variant/30 text-on-surface-variant">
                      {row.feature}
                    </td>
                    <td className="p-4 border border-outline-variant/30 text-center">
                      <Cell value={row.deb} />
                    </td>
                    <td className="p-4 border border-outline-variant/30 text-center text-primary font-bold">
                      <Cell value={row.inter} />
                    </td>
                    <td className="p-4 border border-outline-variant/30 text-center text-secondary font-bold">
                      <Cell value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline-lg text-headline-lg mb-8 text-center">FAQ Système</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group bg-surface-container-low rounded-lg border border-outline-variant/30 p-6 transition-all"
              >
                <summary className="font-body-lg text-body-lg cursor-pointer list-none flex justify-between items-center text-on-surface">
                  {item.q}
                  <Icon name="expand_more" className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-4 text-on-surface-variant font-body-md">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
