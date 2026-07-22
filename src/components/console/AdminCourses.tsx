"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;
type Level = (typeof LEVELS)[number];

const inputClass =
  "w-full bg-[#000202] border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

function eur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR");
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

/** Course CRUD: create, edit in place, publish toggle, delete, lesson manager link. */
export default function AdminCourses() {
  const courses = useQuery(api.courses.listAll, {});
  const createCourse = useMutation(api.courses.create);
  const updateCourse = useMutation(api.courses.update);
  const removeCourse = useMutation(api.courses.remove);
  const seedCourses = useMutation(api.courses.seed);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"courses"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(course: NonNullable<typeof courses>[number]) {
    setEditingId(course._id);
    setForm({
      title: course.title,
      slug: course.slug,
      level: course.level,
      description: course.description,
      priceEur: String(course.priceEur / 100),
      priceXof: String(course.priceXof),
      published: course.published,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const slug = form.slug.trim() || slugify(form.title);
      const common = {
        title: form.title.trim(),
        slug,
        level: form.level,
        description: form.description.trim(),
        priceEur: Math.round(parseFloat(form.priceEur || "0") * 100),
        priceXof: Math.round(parseFloat(form.priceXof || "0")),
        published: form.published,
      };
      if (editingId) {
        await updateCourse({ id: editingId, patch: common });
      } else {
        await createCourse({ ...common, azureContainer: "course-videos" });
      }
      setForm(EMPTY);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(cleanConvexError(err));
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
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
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
          <div className="md:col-span-2 flex items-center gap-2 font-label-mono text-label-mono uppercase text-primary">
            <Icon name={editingId ? "edit" : "add_circle"} className="text-sm" />
            {editingId ? "Modifier le cours" : "Créer un cours"}
          </div>
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
            {editingId ? "Publié" : "Publier immédiatement"}
          </label>
          {error && (
            <p className="md:col-span-2 font-code-sm text-code-sm text-error flex items-center gap-2">
              <Icon name="error" className="text-sm" /> {error}
            </p>
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-60">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer le cours"}
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
              <th className="p-4 hidden lg:table-cell">Leçons</th>
              <th className="p-4">Prix</th>
              <th className="p-4">État</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md">
            {courses === undefined && (
              <tr><td colSpan={6} className="p-6 text-on-surface-variant font-code-sm">Chargement…</td></tr>
            )}
            {courses?.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center">
                <button onClick={() => seedCourses({})} className="font-label-mono text-label-mono text-primary hover:underline uppercase">
                  Charger le catalogue de démo
                </button>
              </td></tr>
            )}
            {courses?.map((c, i) => (
              <tr key={c._id} className={`border-t border-outline-variant/20 ${i % 2 ? "bg-surface-container-lowest/50" : ""}`}>
                <td className="p-4">
                  <div className="text-on-surface font-medium">{c.title}</div>
                  <div className="text-on-surface-variant text-xs font-code-sm">/{c.slug}</div>
                </td>
                <td className="p-4 hidden md:table-cell text-on-surface-variant">{c.level}</td>
                <td className="p-4 hidden lg:table-cell">
                  <Link
                    href={`/admin/formations/${c._id}`}
                    className="text-primary hover:underline font-code-sm tabular-nums"
                  >
                    {c.lessonCount} leçon{c.lessonCount > 1 ? "s" : ""}
                  </Link>
                </td>
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
                <td className="p-4 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/formations/${c._id}`}
                    className="inline-flex text-on-surface-variant hover:text-primary transition-colors mr-3 align-middle"
                    aria-label="Gérer les leçons"
                    title="Gérer les leçons"
                  >
                    <Icon name="playlist_play" className="text-lg" />
                  </Link>
                  <button
                    onClick={() => openEdit(c)}
                    className="text-on-surface-variant hover:text-secondary transition-colors mr-3 align-middle"
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <Icon name="edit" className="text-lg" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Supprimer « ${c.title} » ? Les leçons et accès étudiants seront retirés.`)) removeCourse({ id: c._id }); }}
                    className="text-on-surface-variant hover:text-error transition-colors align-middle"
                    aria-label="Supprimer"
                    title="Supprimer"
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
