"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;
type Level = (typeof LEVELS)[number];

const inputClass =
  "w-full bg-[#000202] border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type LessonForm = {
  title: string;
  description: string;
  videoUrl: string;
  blobPath: string;
  durationMin: string;
  isPreview: boolean;
};
const EMPTY_LESSON: LessonForm = {
  title: "",
  description: "",
  videoUrl: "",
  blobPath: "",
  durationMin: "",
  isPreview: false,
};

const EMPTY = {
  title: "",
  slug: "",
  level: "Débutant" as Level,
  description: "",
  published: true,
};

/**
 * Course CRUD. Price comes from the course's level package (managed under
 * Packs), so there's no price field here. When creating, you can set a number
 * of lessons and fill them in-line — the course + lessons are created together.
 */
export default function AdminCourses() {
  const router = useRouter();
  const courses = useQuery(api.courses.listAll, {});
  const createCourse = useMutation(api.courses.create);
  const createWithLessons = useMutation(api.courses.createWithLessons);
  const updateCourse = useMutation(api.courses.update);
  const removeCourse = useMutation(api.courses.remove);
  const seedCourses = useMutation(api.courses.seed);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"courses"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [lessonForms, setLessonForms] = useState<LessonForm[]>([]);

  function setLessonCount(raw: string) {
    const count = Math.max(0, Math.min(30, Math.floor(Number(raw) || 0)));
    setLessonForms((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ ...EMPTY_LESSON });
      return next;
    });
  }

  function patchLesson(i: number, patch: Partial<LessonForm>) {
    setLessonForms((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function reset() {
    setForm(EMPTY);
    setLessonForms([]);
    setEditingId(null);
  }

  function openCreate() {
    reset();
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
      published: course.published,
    });
    setLessonForms([]);
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const slug = form.slug.trim() || slugify(form.title);
      const base = {
        title: form.title.trim(),
        slug,
        level: form.level,
        description: form.description.trim(),
        published: form.published,
      };
      if (editingId) {
        await updateCourse({ id: editingId, patch: base });
        reset();
        setShowForm(false);
      } else {
        const lessons = lessonForms
          .filter((l) => l.title.trim())
          .map((l) => ({
            title: l.title.trim(),
            description: l.description.trim() || undefined,
            videoUrl: l.videoUrl.trim() || undefined,
            blobPath: l.blobPath.trim() || undefined,
            durationSec: l.durationMin ? Math.round(parseFloat(l.durationMin) * 60) : undefined,
            isPreview: l.isPreview,
          }));
        const newId =
          lessons.length > 0
            ? await createWithLessons({ ...base, lessons })
            : await createCourse({ ...base });
        reset();
        setShowForm(false);
        router.push(`/admin/formations/${newId}`);
      }
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
          className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest/40 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 font-label-mono text-label-mono uppercase text-primary">
            <Icon name={editingId ? "edit" : "add_circle"} className="text-sm" />
            {editingId ? "Modifier le cours" : "Créer un cours"}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="font-label-mono text-xs uppercase text-on-surface-variant">Titre</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Introduction au Pentest" />
            </div>
            <div>
              <label className="font-label-mono text-xs uppercase text-on-surface-variant">Slug (optionnel)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="auto depuis le titre" />
            </div>
            <div>
              <label className="font-label-mono text-xs uppercase text-on-surface-variant">Niveau (définit le pack &amp; le prix)</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })} className={inputClass}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-label-mono text-xs uppercase text-on-surface-variant">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} placeholder="Ce que l'étudiant va apprendre…" />
            </div>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" />
              {editingId ? "Publié" : "Publier immédiatement"}
            </label>
          </div>

          {/* Lessons — only when creating (edit lessons in the course workspace) */}
          {!editingId && (
            <div className="border-t border-outline-variant/20 pt-4">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                  Nombre de leçons
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={lessonForms.length || ""}
                  onChange={(e) => setLessonCount(e.target.value)}
                  className="w-24 bg-[#000202] border border-outline-variant text-on-surface px-3 py-1.5 rounded text-sm outline-none focus:border-primary"
                  placeholder="0"
                />
                <span className="text-on-surface-variant text-xs">
                  Ajoutez les leçons maintenant, ou laissez à 0 et gérez-les ensuite.
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {lessonForms.map((lesson, i) => (
                  <div key={i} className="glass-panel rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2 font-label-mono text-xs uppercase text-secondary">
                      Leçon {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-label-mono text-[10px] uppercase text-on-surface-variant">Titre</label>
                      <input value={lesson.title} onChange={(e) => patchLesson(i, { title: e.target.value })} className={inputClass} placeholder="01 — Découverte du terminal" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-label-mono text-[10px] uppercase text-on-surface-variant">Description</label>
                      <input value={lesson.description} onChange={(e) => patchLesson(i, { description: e.target.value })} className={inputClass} placeholder="Ce que couvre la leçon…" />
                    </div>
                    <div>
                      <label className="font-label-mono text-[10px] uppercase text-on-surface-variant">URL vidéo (YouTube / Vimeo / mp4)</label>
                      <input value={lesson.videoUrl} onChange={(e) => patchLesson(i, { videoUrl: e.target.value })} className={inputClass} placeholder="https://…" type="url" />
                    </div>
                    <div>
                      <label className="font-label-mono text-[10px] uppercase text-on-surface-variant">Durée (min)</label>
                      <input value={lesson.durationMin} onChange={(e) => patchLesson(i, { durationMin: e.target.value })} className={inputClass} placeholder="12" type="number" min="0" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-label-mono text-[10px] uppercase text-on-surface-variant">Chemin Azure (optionnel — Phase 3)</label>
                      <input value={lesson.blobPath} onChange={(e) => patchLesson(i, { blobPath: e.target.value })} className={inputClass} placeholder="lecon-01.mp4" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant md:col-span-2">
                      <input type="checkbox" checked={lesson.isPreview} onChange={(e) => patchLesson(i, { isPreview: e.target.checked })} className="accent-primary" />
                      Aperçu gratuit (visible sans achat)
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="font-code-sm text-code-sm text-error flex items-center gap-2">
              <Icon name="error" className="text-sm" /> {error}
            </p>
          )}
          <div>
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
              <th className="p-4">Pack / Prix</th>
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
                  <Link href={`/admin/formations/${c._id}`} className="text-primary hover:underline font-code-sm tabular-nums">
                    {c.lessonCount} leçon{c.lessonCount > 1 ? "s" : ""}
                  </Link>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {c.packageName && c.priceEur != null && c.priceXof != null ? (
                    <>
                      <div className="text-on-surface text-sm">{c.packageName}</div>
                      <div className="text-on-surface-variant text-xs font-code-sm tabular-nums">
                        {(c.priceEur / 100).toLocaleString("fr-FR")} € · {c.priceXof.toLocaleString("fr-FR")} FCFA
                      </div>
                    </>
                  ) : (
                    <span className="text-on-surface-variant text-xs font-code-sm">Aucun pack</span>
                  )}
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
                  <Link href={`/admin/formations/${c._id}`} className="inline-flex text-on-surface-variant hover:text-primary transition-colors mr-3 align-middle" aria-label="Gérer les leçons" title="Gérer les leçons">
                    <Icon name="playlist_play" className="text-lg" />
                  </Link>
                  <button onClick={() => openEdit(c)} className="text-on-surface-variant hover:text-secondary transition-colors mr-3 align-middle" aria-label="Modifier" title="Modifier">
                    <Icon name="edit" className="text-lg" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Supprimer « ${c.title} » ? Les leçons et la progression seront retirées.`)) removeCourse({ id: c._id }); }}
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
