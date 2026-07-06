"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

type Mode = "login" | "register";

const inputClass =
  "w-full bg-[#000202] border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none";
const labelClass = "font-label-mono text-label-mono text-on-surface-variant uppercase";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [region, setRegion] = useState<"AFRIQUE" | "EUROPE">("AFRIQUE");
  const isRegister = mode === "register";

  return (
    <div className="w-full max-w-md">
      <div className="glass-card p-8 md:p-10 rounded-xl">
        <div className="mb-8">
          <div className="font-label-mono text-label-mono text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <Icon name="lock" className="text-sm" fill />
            {isRegister ? "Nouvel Opérateur" : "Accès Sécurisé"}
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {isRegister ? "Créer un compte" : "Connexion"}
          </h1>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          {isRegister && (
            <div className="space-y-2">
              <label className={labelClass}>Nom Complet</label>
              <input className={inputClass} placeholder="Jean Dupont" type="text" required />
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <input className={inputClass} placeholder="jean@email.com" type="email" required />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Mot de passe</label>
            <input className={inputClass} placeholder="••••••••" type="password" required />
          </div>

          {isRegister && (
            <div className="space-y-2">
              <label className={labelClass}>Région</label>
              <div className="grid grid-cols-2 gap-3">
                {(["AFRIQUE", "EUROPE"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    className={`py-3 rounded-sm font-bold text-sm transition-all border ${
                      region === r
                        ? "bg-primary text-on-primary border-primary glow-primary"
                        : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    {r === "AFRIQUE" ? "Afrique (FCFA)" : "Europe (EUR)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isRegister && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-on-surface-variant cursor-pointer">
                <input type="checkbox" className="accent-primary" />
                Se souvenir
              </label>
              <a href="#" className="text-secondary hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isRegister ? "Initialiser le compte" : "Se connecter"}
            <Icon name="arrow_forward" className="text-sm" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center text-sm text-on-surface-variant">
          {isRegister ? (
            <>
              Déjà un compte ?{" "}
              <Link href="/connexion" className="text-primary font-bold hover:underline">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-primary font-bold hover:underline">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
