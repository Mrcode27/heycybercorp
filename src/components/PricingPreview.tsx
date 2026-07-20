"use client";

import { useState } from "react";

type Plan = {
  tag: string;
  tagColor: string;
  name?: string;
  priceEurope: string;
  priceAfrica: string;
  suffix?: string;
  features: { label: string; included: boolean }[];
  cta: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    tag: "STARTER",
    tagColor: "text-primary",
    priceEurope: "40€",
    priceAfrica: "15 000 FCFA",
    suffix: "· paiement unique",
    features: [
      { label: "Accès aux modules débutant", included: true },
      { label: "Support communautaire", included: true },
      { label: "Certification officielle", included: false },
    ],
    cta: "Choisir Starter",
  },
  {
    tag: "PROFESSIONAL",
    tagColor: "text-primary",
    priceEurope: "60€",
    priceAfrica: "30 000 FCFA",
    suffix: "· paiement unique",
    featured: true,
    features: [
      { label: "Accès à vie", included: true },
      { label: "Certification heycybercorp", included: true },
      { label: "Labs pratiques (VMs)", included: true },
      { label: "Mentorat 1-on-1", included: true },
    ],
    cta: "S'inscrire",
  },
  {
    tag: "HACKING PRO",
    tagColor: "text-secondary",
    priceEurope: "80€",
    priceAfrica: "45 000 FCFA",
    suffix: "· paiement unique",
    features: [
      { label: "Red Teaming & Exploitation", included: true },
      { label: "Accès Labs illimité", included: true },
      { label: "Coaching 1-on-1", included: true },
    ],
    cta: "Mode Root",
  },
];

export default function PricingPreview() {
  const [isEurope, setIsEurope] = useState(true);

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
      <h2 className="font-headline-xl text-headline-xl text-white mb-6">
        Investissez dans votre Futur
      </h2>
      <p className="text-on-surface-variant mb-12 max-w-2xl mx-auto">
        Des tarifs adaptés pour démocratiser l&apos;accès à l&apos;expertise cyber, quel que soit
        votre continent.
      </p>

      {/* Region Toggle */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <span
          className={`font-label-mono text-on-surface-variant transition-opacity ${
            isEurope ? "opacity-100" : "opacity-50"
          }`}
        >
          Europe
        </span>
        <button
          type="button"
          onClick={() => setIsEurope((v) => !v)}
          aria-label="Basculer la région"
          className="relative w-16 h-8 rounded-full bg-surface-container-highest border border-outline-variant p-1 transition-all"
        >
          <div
            className="absolute top-1 w-6 h-6 rounded-full bg-primary transition-all duration-300"
            style={{ left: isEurope ? "4px" : "32px" }}
          />
        </button>
        <span
          className={`font-label-mono text-on-surface-variant transition-opacity ${
            isEurope ? "opacity-50" : "opacity-100"
          }`}
        >
          Afrique
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {PLANS.map((plan) => (
          <div
            key={plan.tag}
            className={
              plan.featured
                ? "bg-surface-container-highest p-10 rounded-xl border-2 border-primary relative overflow-hidden flex flex-col lg:scale-105 shadow-2xl"
                : "bg-surface-dim p-10 rounded-xl border border-outline-variant/30 flex flex-col"
            }
          >
            {plan.featured && (
              <div className="absolute top-4 right-4 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">
                POPULAIRE
              </div>
            )}
            <div className={`font-label-mono mb-4 ${plan.tagColor}`}>{plan.tag}</div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-headline-xl text-headline-xl text-white">
                {isEurope ? plan.priceEurope : plan.priceAfrica}
              </span>
              <span className="text-on-surface-variant text-sm">{plan.suffix}</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((f) => (
                <li
                  key={f.label}
                  className={`flex items-center gap-3 ${
                    f.included ? "text-on-surface" : "text-on-surface-variant opacity-60"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-sm ${
                      f.included ? "text-primary" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {f.included ? "check_circle" : "cancel"}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={
                plan.featured
                  ? "w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 cyber-glow-primary transition-all"
                  : "w-full py-3 rounded-lg border border-outline text-white hover:bg-surface-variant transition-all"
              }
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
