"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "./Icon";
import BuyPackageButton from "./BuyPackageButton";
import { formatPrice } from "@/lib/format";

/** Homepage pricing — live packages from Convex, with working buy buttons. */
export default function PricingPreview() {
  const packages = useQuery(api.packages.listPublished);

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
      <h2 className="font-headline-xl text-headline-xl text-on-surface mb-6">
        Investissez dans votre Futur
      </h2>
      <p className="text-on-surface-variant mb-16 max-w-2xl mx-auto">
        Des packs pensés pour rendre l&apos;expertise cyber accessible. Prix en euros, achat
        unique, accès à vie à toutes les formations du pack.
      </p>

      {packages === undefined && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-dim p-10 rounded-xl h-96 animate-pulse" />
          ))}
        </div>
      )}

      {packages?.length === 0 && (
        <p className="text-on-surface-variant">Les packs seront bientôt disponibles.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {packages?.map((pkg) => (
          <div
            key={pkg._id}
            className={
              pkg.featured
                ? "bg-surface-container-highest p-10 rounded-xl border-2 border-primary relative overflow-hidden flex flex-col lg:scale-105 shadow-2xl"
                : "bg-surface-dim p-10 rounded-xl border border-outline-variant/30 flex flex-col"
            }
          >
            {pkg.featured && (
              <div className="absolute top-4 right-4 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">
                POPULAIRE
              </div>
            )}
            <div className="font-label-mono mb-2 text-primary uppercase tracking-widest text-xs">
              {pkg.name}
            </div>
            {pkg.tagline && (
              <div className="text-on-surface-variant text-sm mb-4">{pkg.tagline}</div>
            )}
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-headline-xl text-headline-xl text-on-surface">
                {formatPrice(pkg.priceEur)}
              </span>
              <span className="text-on-surface-variant text-sm">· à vie</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-on-surface">
                  <Icon name="check_circle" className="text-primary text-sm" fill />
                  {f}
                </li>
              ))}
            </ul>
            <BuyPackageButton
              packageId={pkg._id}
              label={`Choisir ${pkg.name}`}
              className={
                pkg.featured
                  ? "w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 cyber-glow-primary transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  : "w-full py-3 rounded-lg border border-outline text-on-surface hover:bg-surface-variant transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
