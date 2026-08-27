"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

type Filter = "tous" | "à faire" | "résolus" | "verrouillés";

const LEVEL_STYLE: Record<string, string> = {
  Débutant: "border-primary/30 text-primary",
  Intermédiaire: "border-secondary/30 text-secondary",
  Avancé: "border-error/30 text-error",
};

/**
 * The student lab list.
 *
 * Everything shown here comes from `labs.listForStudent`, which strips the
 * flag server-side — the browser is never sent the answer, so opening the
 * devtools reveals nothing a solver could use. Submissions are checked in a
 * mutation for the same reason.
 */
export default function LabsView() {
  const data = useQuery(api.labs.listForStudent);
  const [filter, setFilter] = useState<Filter>("tous");
  const [openId, setOpenId] = useState<Id<"labs"> | null>(null);

  if (data === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-11 w-11 rounded-lg bg-surface-variant mb-4" />
            <div className="h-4 w-2/3 bg-surface-variant rounded mb-3" />
            <div className="h-3 w-full bg-surface-variant rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { labs, stats } = data;

  if (labs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Icon name="science" className="text-secondary text-5xl mb-4" />
        <h3 className="font-headline-lg-mobile text-on-surface mb-2">
          Aucun lab publié pour l&apos;instant
        </h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Les laboratoires pratiques arrivent. En attendant, vos formations
          contiennent déjà des exercices guidés.
        </p>
      </div>
    );
  }

  const shown = labs.filter((l) => {
    if (filter === "résolus") return l.solved;
    if (filter === "à faire") return l.unlocked && !l.solved;
    if (filter === "verrouillés") return !l.unlocked;
    return true;
  });

  const pct = stats.maxPoints === 0 ? 0 : Math.round((stats.points / stats.maxPoints) * 100);

  return (
    <>
      {/* Score summary */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <div className="font-headline-lg text-headline-lg text-primary tabular-nums">
                {stats.points}
              </div>
              <div className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                Points
              </div>
            </div>
            <div className="w-px h-12 bg-outline-variant/40" />
            <div>
              <div className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
                {stats.solved}/{stats.total}
              </div>
              <div className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                Labs résolus
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-50">
            <div className="flex justify-between font-code-sm text-code-sm text-on-surface-variant mb-1.5">
              <span>Progression sur vos labs débloqués</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["tous", "à faire", "résolus", "verrouillés"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg font-label-mono text-label-mono uppercase tracking-wider transition-all ${
              filter === f
                ? "active-filter"
                : "border border-outline-variant/40 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shown.map((lab) => (
          <LabCard
            key={lab._id}
            lab={lab}
            open={openId === lab._id}
            onToggle={() => setOpenId(openId === lab._id ? null : lab._id)}
          />
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-on-surface-variant font-code-sm text-code-sm mt-4">
          Aucun lab dans cette catégorie.
        </p>
      )}
    </>
  );
}

/** One row of `labs.listForStudent`, typed straight from the server function. */
type Lab = FunctionReturnType<typeof api.labs.listForStudent>["labs"][number];

function LabCard({
  lab,
  open,
  onToggle,
}: {
  lab: Lab;
  open: boolean;
  onToggle: () => void;
}) {
  const submit = useMutation(api.labs.submit);
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "ko" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!flag.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await submit({ labId: lab._id, flag });
      setResult(r.correct ? "ok" : "ko");
      if (r.correct) setFlag("");
    } catch (err) {
      setError(cleanConvexError(err, "La validation a échoué."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`glass-card rounded-xl p-6 flex flex-col ${
        lab.unlocked ? "" : "opacity-75"
      } ${lab.solved ? "border-primary/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
          <Icon name={lab.icon} className={lab.solved ? "text-primary" : "text-on-surface-variant"} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {lab.points} pts
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm ${
              LEVEL_STYLE[lab.level] ?? ""
            }`}
          >
            {lab.level}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-headline-lg-mobile text-on-surface">{lab.title}</h4>
        {lab.solved && <Icon name="verified" className="text-primary text-lg" fill />}
      </div>
      <div className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant mb-3">
        {lab.category}
        {lab.isFree && " · accès libre"}
      </div>
      <p className="text-on-surface-variant text-sm mb-5 grow">{lab.summary}</p>

      {!lab.unlocked ? (
        <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
            <Icon name="lock" className="text-sm" />
            Pack {lab.level} requis
          </span>
          <Link
            href="/tarifs"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all"
          >
            Débloquer
          </Link>
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-between gap-3">
            <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
              <Icon name={lab.solved ? "check_circle" : "bolt"} className="text-sm" fill={lab.solved} />
              {lab.solved
                ? "Résolu"
                : lab.attempts > 0
                  ? `${lab.attempts} tentative${lab.attempts > 1 ? "s" : ""}`
                  : "Disponible"}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center gap-1.5"
            >
              {open ? "Réduire" : lab.solved ? "Revoir" : "Ouvrir le lab"}
              <Icon
                name={open ? "expand_less" : "expand_more"}
                className="text-sm"
              />
            </button>
          </div>

          {open && (
            <div className="mt-5 pt-5 border-t border-outline-variant/20 space-y-4">
              <div>
                <div className="font-label-mono text-label-mono uppercase tracking-wider text-primary mb-2">
                  Brief
                </div>
                <p className="text-on-surface-variant text-sm whitespace-pre-wrap">{lab.brief}</p>
              </div>

              {lab.hint && (
                <div>
                  {showHint ? (
                    <p className="text-on-surface-variant text-sm bg-surface-container-low rounded-lg p-3 border border-outline-variant/30">
                      <span className="text-secondary font-bold">Indice — </span>
                      {lab.hint}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="font-code-sm text-code-sm text-secondary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Icon name="lightbulb" className="text-sm" />
                      Afficher l&apos;indice
                    </button>
                  )}
                </div>
              )}

              {lab.solved ? (
                <p className="font-code-sm text-code-sm text-primary flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-sm" fill />
                  Flag validé — {lab.points} points acquis.
                </p>
              ) : (
                <form onSubmit={check} className="space-y-2">
                  <label className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">
                    Soumettre le flag
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      placeholder="HCL{...}"
                      spellCheck={false}
                      autoComplete="off"
                      className="flex-1 bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded font-code-sm text-code-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={busy || !flag.trim()}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {busy ? "Vérification…" : "Valider"}
                    </button>
                  </div>

                  {result === "ok" && (
                    <p className="font-code-sm text-code-sm text-primary flex items-center gap-1.5">
                      <Icon name="check_circle" className="text-sm" fill />
                      Correct — {lab.points} points.
                    </p>
                  )}
                  {result === "ko" && (
                    <p className="font-code-sm text-code-sm text-error flex items-center gap-1.5">
                      <Icon name="cancel" className="text-sm" />
                      Ce n&apos;est pas le bon flag. Relisez le brief.
                    </p>
                  )}
                  {error && (
                    <p className="font-code-sm text-code-sm text-error flex items-center gap-1.5">
                      <Icon name="error" className="text-sm" />
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
