"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import AdminModal from "./AdminModal";
import AdminLabTester, { type AdminChallengePreview } from "./AdminLabTester";
import { cleanConvexError } from "@/lib/errors";

const inputClass =
  "w-full bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded text-sm outline-none focus:border-primary transition-colors";
const labelClass =
  "font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant";

type Level = "Débutant" | "Intermédiaire" | "Avancé";

type Form = {
  title: string;
  summary: string;
  brief: string;
  hint: string;
  guide: string;
  level: Level;
  category: string;
  icon: string;
  flag: string;
  points: number;
  isFree: boolean;
  published: boolean;
};

const EMPTY: Form = {
  title: "",
  summary: "",
  brief: "",
  hint: "",
  guide: "",
  level: "Débutant",
  category: "Web",
  icon: "science",
  flag: "",
  points: 100,
  isFree: false,
  published: true,
};

/** Create, edit, publish and delete labs. Admin only (page is behind AdminGate). */
export default function AdminLabs({ previewLabs }: { previewLabs?: AdminChallengePreview[] } = {}) {
  const queriedLabs = useQuery(api.labs.adminList, previewLabs ? "skip" : {});
  const labs = previewLabs ?? queriedLabs;
  const create = useMutation(api.labs.create);
  const update = useMutation(api.labs.update);
  const remove = useMutation(api.labs.remove);

  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<Id<"labs"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [testing, setTesting] = useState<AdminChallengePreview | null>(null);

  function set<K extends keyof Form>(k: K, val: Form[K]) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function reset() {
    setForm({ ...EMPTY });
    setEditing(null);
    setError(null);
    setEditorOpen(false);
  }

  function openCreate() {
    setForm({ ...EMPTY });
    setEditing(null);
    setError(null);
    setEditorOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { ...form, hint: form.hint.trim() || undefined, guide: form.guide.trim() || undefined };
    try {
      if (editing) await update({ labId: editing, ...payload });
      else await create(payload);
      reset();
    } catch (err) {
      setError(cleanConvexError(err, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Editor */}
      {editorOpen && (
      <AdminModal title={editing ? "Modifier le challenge" : "Nouveau challenge"} eyebrow="Éditeur de challenge" icon={editing ? "edit" : "add_circle"} onClose={reset}>
      <form onSubmit={save} className="p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <Icon name={editing ? "edit" : "add_circle"} className="text-primary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">
            {editing ? "Modifier le lab" : "Nouveau lab"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Titre</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputClass}
              placeholder="Injection SQL — en aveugle"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Catégorie</label>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass}
              placeholder="Web · Réseau · Forensic · Crypto"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Résumé (visible même verrouillé)</label>
          <input
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className={inputClass}
            placeholder="Une phrase qui donne envie sans rien dévoiler."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Brief complet</label>
          <textarea
            value={form.brief}
            onChange={(e) => set("brief", e.target.value)}
            rows={5}
            className={`${inputClass} font-code-sm`}
            placeholder="Contexte, objectif, contraintes. Les retours à la ligne sont conservés."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Indice (optionnel)</label>
          <input
            value={form.hint}
            onChange={(e) => set("hint", e.target.value)}
            className={inputClass}
            placeholder="Affiché seulement si l'étudiant le demande."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Notes pédagogiques de l’instructeur (optionnel)</label>
          <textarea
            value={form.guide}
            onChange={(e) => set("guide", e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="Ajoutez un piège fréquent, un contexte métier ou un conseil de débrief. Le tutoriel raisonné est généré automatiquement."
          />
          <p className="font-code-sm text-code-sm text-on-surface-variant">Cette note complète le parcours problème → hypothèse → outil → observation → conclusion. Elle reste privée.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Niveau</label>
            <select
              value={form.level}
              onChange={(e) => set("level", e.target.value as Level)}
              className={inputClass}
            >
              <option>Débutant</option>
              <option>Intermédiaire</option>
              <option>Avancé</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Icône (Material Symbols)</label>
            <input
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
              className={inputClass}
              placeholder="database · terminal · lan · memory"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Points</label>
            <input
              type="number"
              min={0}
              value={form.points}
              onChange={(e) => set("points", Number(e.target.value))}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Flag attendu</label>
          <input
            value={form.flag}
            onChange={(e) => set("flag", e.target.value)}
            className={`${inputClass} font-code-sm`}
            placeholder="HCL{...}"
            required
          />
          <p className="font-code-sm text-code-sm text-on-surface-variant">
            Comparé sans tenir compte de la casse ni des espaces autour. Jamais envoyé au
            navigateur d&apos;un étudiant.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-on-surface text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set("isFree", e.target.checked)}
              className="accent-[color:var(--color-primary)] w-4 h-4"
            />
            Accès libre (sans pack)
          </label>
          <label className="flex items-center gap-2 text-on-surface text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="accent-[color:var(--color-primary)] w-4 h-4"
            />
            Publié
          </label>
        </div>

        {error && (
          <p className="font-code-sm text-code-sm text-error flex items-center gap-1.5">
            <Icon name="error" className="text-sm" />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-60"
          >
            {busy ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer le lab"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 rounded-lg font-bold border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
      </AdminModal>
      )}

      {testing && <AdminLabTester target={{ kind: "challenge", item: testing }} onClose={() => setTesting(null)} />}

      {/* Existing labs */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-6 border-b border-outline-variant/30">
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-secondary/10 text-secondary"><Icon name="flag" fill /></div>
          <div><h3 className="font-headline-lg-mobile text-on-surface">Challenges existants {labs ? `(${labs.length})` : ""}</h3><p className="font-code-sm text-code-sm text-on-surface-variant mt-0.5">Briefs courts à flag, testables sans créer de tentative étudiante.</p></div>
          <button type="button" onClick={openCreate} className="ml-auto px-4 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold inline-flex items-center gap-2 hover:brightness-110"><Icon name="add" /> Nouveau challenge</button>
        </div>

        {labs === undefined ? (
          <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
        ) : labs.length === 0 ? (
          <p className="p-6 text-on-surface-variant">Aucun lab pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
                  <th className="p-4">Lab</th>
                  <th className="p-4">Niveau</th>
                  <th className="p-4">Pts</th>
                  <th className="p-4">Résolu / tentatives</th>
                  <th className="p-4">État</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {labs.map((l) => (
                  <tr key={l._id} className="border-t border-outline-variant/20">
                    <td className="p-4">
                      <div className="text-on-surface">{l.title}</div>
                      <div className="font-code-sm text-code-sm text-on-surface-variant">
                        {l.category}
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{l.level}</td>
                    <td className="p-4 text-on-surface-variant tabular-nums">{l.points}</td>
                    <td className="p-4 text-on-surface-variant tabular-nums">
                      {l.solveCount} / {l.attemptCount}
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-code-sm text-code-sm ${
                          l.published ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {l.published ? "Publié" : "Brouillon"}
                        {l.isFree && " · libre"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          aria-label={`Tester ${l.title}`}
                          onClick={() => setTesting(l)}
                          className="px-3 py-1.5 rounded-lg border border-secondary/25 text-secondary hover:bg-secondary/10 transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Icon name="play_arrow" className="text-base" fill /> Tester
                        </button>
                        <button
                          type="button"
                          aria-label={`Modifier ${l.title}`}
                          onClick={() => {
                            setEditing(l._id);
                            setForm({
                              title: l.title,
                              summary: l.summary,
                              brief: l.brief,
                              hint: l.hint ?? "",
                              guide: l.guide ?? "",
                              level: l.level,
                              category: l.category,
                              icon: l.icon,
                              flag: l.flag,
                              points: l.points,
                              isFree: l.isFree,
                              published: l.published,
                            });
                            setEditorOpen(true);
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer ${l.title}`}
                          onClick={() => {
                            // Deleting a lab also deletes its solves, so make
                            // the consequence explicit before it happens.
                            if (
                              window.confirm(
                                `Supprimer « ${l.title} » ?\n\n${l.solveCount} résolution(s) seront également supprimées. Action irréversible.`,
                              )
                            ) {
                              remove({ labId: l._id });
                            }
                          }}
                          className="text-on-surface-variant hover:text-error transition-colors"
                        >
                          <Icon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
