"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;
type Level = (typeof LEVELS)[number];

const inputClass =
  "w-full bg-[#000202] border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

function eur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR");
}

const EMPTY = {
  title: "",
  slug: "",
  level: "Débutant" as Level,
  description: "",
  priceEur: "",
  priceXof: "",
  published: true,
};

export default function AdminCourses() {
  const courses = useQuery(api.courses.listAll, {});
  const createCourse = useMutation(api.courses.create);
  const updateCourse = useMutation(api.courses.update);
  const removeCourse = useMutation(api.courses.remove);
  const seedCourses = useMutation(api.courses.seed);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug =
        form.slug.trim() ||
        form.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      await createCourse({
        title: form.title.trim(),
        slug,
        level: form.level,
        description: form.description.trim(),
        priceEur: Math.round(parseFloat(form.priceEur || "0") * 100),
        priceXof: Math.round(parseFloat(form.priceXof || "0")),
        azureContainer: "course-videos",
        published: form.published,
      });
      setForm(EMPTY);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Icon name="school" className="text-secondary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">Gestion des Formations</h3>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Icon name={showForm ? "close" : "add"} className="text-sm" />
          {showForm ? "Annuler" : "Nouveau cours"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="p-6 border-b border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest/40"
        >
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Titre</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Introduction au Pentest" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Slug (optionnel)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="auto depuis le titre" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Niveau</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })} className={inputClass}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} placeholder="Ce que l'étudiant va apprendre…" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Prix Europe (€)</label>
            <input type="number" min="0" step="1" required value={form.priceEur} onChange={(e) => setForm({ ...form, priceEur: e.target.value })} className={inputClass} placeholder="40" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Prix Afrique (FCFA)</label>
            <input type="number" min="0" step="1" required value={form.priceXof} onChange={(e) => setForm({ ...form, priceXof: e.target.value })} className={inputClass} placeholder="15000" />
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" />
            Publier immédiatement
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-60">
              {saving ? "Enregistrement…" : "Créer le cours"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
              <th className="p-4">Formation</th>
              <th className="p-4 hidden md:table-cell">Niveau</th>
              <th className="p-4">Prix</th>
              <th className="p-4">État</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md">
            {courses === undefined && (
              <tr><td colSpan={5} className="p-6 text-on-surface-variant font-code-sm">Chargement…</td></tr>
            )}
            {courses?.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center">
                <button onClick={() => seedCourses({})} className="font-label-mono text-label-mono text-primary hover:underline uppercase">
                  Charger le catalogue de démo
                </button>
              </td></tr>
            )}
            {courses?.map((c, i) => (
              <tr key={c._id} className={`border-t border-outline-variant/20 ${i % 2 ? "bg-surface-container-lowest/50" : ""}`}>
                <td className="p-4 text-on-surface font-medium">{c.title}</td>
                <td className="p-4 hidden md:table-cell text-on-surface-variant">{c.level}</td>
                <td className="p-4 text-on-surface-variant font-code-sm tabular-nums whitespace-nowrap">
                  {eur(c.priceEur)} € · {c.priceXof.toLocaleString("fr-FR")} FCFA
                </td>
                <td className="p-4">
                  <button
                    onClick={() => updateCourse({ id: c._id, patch: { published: !c.published } })}
                    className={`px-2 py-0.5 text-xs font-bold rounded border ${
                      c.published
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-surface-variant text-on-surface-variant border-outline-variant/40"
                    }`}
                    title="Basculer la publication"
                  >
                    {c.published ? "Publié" : "Brouillon"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => { if (confirm(`Supprimer « ${c.title} » ?`)) removeCourse({ id: c._id }); }}
                    className="text-on-surface-variant hover:text-error transition-colors"
                    aria-label="Supprimer"
                  >
                    <Icon name="delete" className="text-lg" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
