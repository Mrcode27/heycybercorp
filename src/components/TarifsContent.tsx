"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

type Region = "AFRIQUE" | "EUROPE";

const PLANS = [
  {
    level: "NIVEAU 01",
    name: "Débutant",
    afrique: "15,000",
    europe: "40",
    levelColor: "text-on-surface-variant",
    features: ["Introduction à la Cyber", "5 Labs Fondamentaux / mois", "Communauté Discord"],
    cta: "Initialiser la Session",
    ctaClass:
      "border border-primary text-primary hover:bg-primary hover:text-on-primary",
    featured: false,
  },
  {
    level: "NIVEAU 02",
    name: "Intermédiaire",
    afrique: "30,000",
    europe: "60",
    levelColor: "text-primary",
    features: [
      "Analyse de Malwares",
      "20 Labs Avancés / mois",
      "Préparation Certif. Junior",
      "Support Prioritaire 24/7",
    ],
    cta: "Élever les Privilèges",
    ctaClass: "bg-primary text-on-primary glow-primary hover:brightness-110",
    featured: true,
  },
  {
    level: "NIVEAU 03",
    name: "Hacking Pro",
    afrique: "45,000",
    europe: "80",
    levelColor: "text-on-surface-variant",
    features: [
      "Red Teaming & Exploitation",
      "Accès Labs Illimité",
      "Coaching 1-on-1 (2h/mois)",
      "Accès aux Exploits 0-day",
    ],
    cta: "Mode Root Activé",
    ctaClass:
      "border border-secondary text-secondary hover:bg-secondary hover:text-on-secondary",
    featured: false,
  },
];

const TABLE_ROWS = [
  { feature: "Nombre de Labs Virtuels", deb: "05", inter: "20", pro: "ILLIMITÉ" },
  { feature: "Accès SSH Direct", deb: "NON", inter: "OUI", pro: "OUI + VPN" },
  { feature: "Support IA Assistant", deb: "Standard", inter: "Avancé", pro: "Dédié" },
  { feature: "Certificat de Réussite", deb: "check", inter: "check", pro: "check" },
  { feature: "Analyse Forensics", deb: "X", inter: "X", pro: "check" },
];

const FAQ = [
  {
    q: "Puis-je changer de plan en cours de mois ?",
    a: "Affirmatif. Vous pouvez effectuer une mise à l'échelle (Upscale) à tout moment. La différence sera calculée au prorata de l'usage restant.",
  },
  {
    q: "Les certifications sont-elles reconnues ?",
    a: "Nos certifications \"heycybercorp Secure Operator\" sont reconnues par plus de 50 partenaires tech en Afrique et en Europe pour valider vos compétences pratiques.",
  },
  {
    q: "Quel est le mode de paiement accepté ?",
    a: "Nous acceptons Mobile Money (Orange, MTN, Wave), Cartes Bancaires (Visa, Mastercard) et Cryptomonnaies (BTC, ETH, USDT).",
  },
];

function Cell({ value }: { value: string }) {
  if (value === "check")
    return <Icon name="check_circle" className="text-primary" fill />;
  if (value === "NON" || value === "X")
    return <span className="text-error">{value === "X" ? "X" : "NON"}</span>;
  return <span>{value}</span>;
}

export default function TarifsContent() {
  const [region, setRegion] = useState<Region>("AFRIQUE");

  return (
    <>
      {/* Hero + plans */}
      <main className="relative pt-32 pb-20 overflow-hidden cyber-grid">
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="inline-flex items-center bg-surface-container border border-outline-variant/50 rounded-full px-4 py-1 mb-6">
            <Icon name="security" className="text-primary text-sm mr-2" fill />
            <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">
              Protocoles d&apos;Accès Sécurisés
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl mb-6 tracking-tight text-on-surface">
            Préparez-vous à <span className="text-primary glow-text-primary">Maîtriser</span> le
            Cyber-espace
          </h1>
          <p className="max-w-2xl mx-auto text-on-surface-variant font-body-lg text-body-lg mb-12">
            Choisissez le niveau de certification adapté à votre trajectoire professionnelle. Des
            laboratoires immersifs aux certifications reconnues.
          </p>

          {/* Region toggle */}
          <div className="flex justify-center mb-16">
            <div className="bg-surface-container-high p-1 rounded-xl flex border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setRegion("AFRIQUE")}
                className={`px-8 py-2 rounded-lg font-bold transition-all duration-300 ${
                  region === "AFRIQUE"
                    ? "bg-primary text-on-primary glow-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Afrique (FCFA)
              </button>
              <button
                type="button"
                onClick={() => setRegion("EUROPE")}
                className={`px-8 py-2 rounded-lg font-bold transition-all duration-300 ${
                  region === "EUROPE"
                    ? "bg-primary text-on-primary glow-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Europe (EUR)
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 flex flex-col text-left ${
                  plan.featured ? "border-primary/50 relative overflow-hidden md:scale-105 z-20" : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 font-label-mono text-xs font-bold uppercase tracking-tighter">
                    RECOMMANDÉ
                  </div>
                )}
                <div className="mb-6">
                  <span className={`font-label-mono text-label-mono block mb-2 ${plan.levelColor}`}>
                    {plan.level}
                  </span>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{plan.name}</h3>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-headline-xl text-primary">
                      {region === "AFRIQUE" ? plan.afrique : plan.europe}
                    </span>
                    <span className="font-body-md text-on-surface-variant">
                      {region === "AFRIQUE" ? "FCFA" : "€"}
                    </span>
                    <span className="text-on-surface-variant font-body-md">/ mois</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-on-surface-variant">
                      <Icon name="check_circle" className="text-primary text-xl" fill={plan.featured} />
                      <span className="font-body-md">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`w-full py-4 font-bold rounded-lg transition-all duration-300 ${plan.ctaClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
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
                    Hacking Pro
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

          <div className="mt-12 text-center p-8 glass-card border-dashed border-primary/40 rounded-xl">
            <p className="font-code-sm text-code-sm text-on-surface-variant mb-4">
              <span className="text-primary mr-2">[INFO]</span> Besoin d&apos;une offre sur mesure
              pour votre entreprise ? Nos experts sont en ligne.
            </p>
            <button
              type="button"
              className="font-label-mono text-label-mono text-primary hover:underline uppercase tracking-widest cursor-blink"
            >
              Contacter le SOC Corporate
            </button>
          </div>
        </div>
      </section>

      {/* FAQ + console */}
      <section className="py-24 border-t border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-lg text-headline-lg mb-8">FAQ Système</h2>
              <div className="space-y-6">
                {FAQ.map((item) => (
                  <details
                    key={item.q}
                    className="group bg-surface-container-low rounded-lg border border-outline-variant/30 p-6 transition-all"
                  >
                    <summary className="font-body-lg text-body-lg cursor-pointer list-none flex justify-between items-center text-on-surface">
                      {item.q}
                      <Icon
                        name="expand_more"
                        className="group-open:rotate-180 transition-transform"
                      />
                    </summary>
                    <div className="mt-4 text-on-surface-variant font-body-md">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>

            <div className="bg-[#000202] rounded-xl border border-primary/40 p-6 shadow-2xl relative">
              <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-4">
                <div className="w-3 h-3 rounded-full bg-error" />
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="ml-4 font-code-sm text-code-sm text-on-surface-variant">
                  heycybercorp-console ~ query pricing_status
                </span>
              </div>
              <div className="font-code-sm text-code-sm text-primary space-y-2">
                <p>&gt; Fetching market data for REGION_{region}...</p>
                <p className="text-on-surface-variant">&gt; Loading plans...</p>
                <p>
                  &gt; [SUCCESS] Debutant: {region === "AFRIQUE" ? "15k FCFA" : "40€"}
                </p>
                <p>
                  &gt; [SUCCESS] Intermediaire: {region === "AFRIQUE" ? "30k FCFA" : "60€"}
                </p>
                <p>
                  &gt; [SUCCESS] Hacking Pro: {region === "AFRIQUE" ? "45k FCFA" : "80€"}
                </p>
                <p className="mt-4 text-secondary">Awaiting user input...</p>
                <p className="cursor-blink">
                  admin@heycybercorp:~${" "}
                  <span className="bg-primary/20 px-1">select_plan --type=pro</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
