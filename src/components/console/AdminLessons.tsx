"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { formatDuration } from "@/lib/format";

const inputClass =
  "w-full bg-[#000202] border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

const EMPTY = {
  title: "",
  description: "",
  videoUrl: "",
  blobPath: "",
  durationMin: "",
  isPreview: false,
};

/**
 * Lesson manager for one course. Videos are referenced by URL today
 * (mp4 / YouTube / Vimeo); the Azure path field is ready for Phase 3.
 */
export default function AdminLessons({ courseId }: { courseId: string }) {
  const course = useQuery(api.courses.getById, { id: courseId });
  const lessons = useQuery(
    api.lessons.adminListForCourse,
    course ? { courseId: course._id } : "skip",
  );
  const createLesson = useMutation(api.lessons.create);
  const updateLesson = useMutation(api.lessons.update);
  const removeLesson = useMutation(api.lessons.remove);
  const moveLesson = useMutation(api.lessons.move);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"lessons"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  if (course === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement…</p>;
  }
  if (course === null) {
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <Icon name="search_off" className="text-error text-4xl mb-3" />
        <p className="text-on-surface-variant mb-4">Cours introuvable.</p>
        <Link href="/admin/formations" className="text-primary hover:underline">
          ← Retour aux formations
        </Link>
      </div>
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(lesson: NonNullable<typeof lessons>[number]) {
    setEditingId(lesson._id);
    setForm({
      title: lesson.title,
      description: lesson.description ?? "",
      videoUrl: lesson.videoUrl ?? "",
      blobPath: lesson.blobPath ?? "",
      durationMin: lesson.durationSec ? String(Math.round(lesson.durationSec / 60)) : "",
      isPreview: lesson.isPreview,
    });
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        blobPath: form.blobPath.trim() || undefined,
        durationSec: form.durationMin ? Math.round(parseFloat(form.durationMin) * 60) : undefined,
        isPreview: form.isPreview,
      };
      if (editingId) {
        await updateLesson({ id: editingId, patch: payload });
      } else {
        await createLesson({ courseId: course._id, ...payload });
      }
      setForm(EMPTY);
      setEditingId(null);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Course header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/formations"
            className="w-11 h-11 rounded-lg bg-surface-variant border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all shrink-0"
            aria-label="Retour"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-on-surface-variant text-sm mt-0.5">
              {course.published ? "Publié" : "Brouillon"} · /{course.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/formations/${course.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all text-sm"
          >
            <Icon name="open_in_new" className="text-sm" />
            Page publique
          </Link>
          <button
            onClick={() => (showForm ? setShowForm(false) : openCreate())}
            className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Icon name={showForm ? "close" : "add"} className="text-sm" />
            {showForm ? "Annuler" : "Nouvelle leçon"}
          </button>
        </div>
      </div>

      {/* Lesson form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="glass-card rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2 flex items-center gap-2 font-label-mono text-label-mono uppercase text-primary">
            <Icon name={editingId ? "edit" : "add_circle"} className="text-sm" />
            {editingId ? "Modifier la leçon" : "Ajouter une leçon"}
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Titre</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="01 — Découverte du terminal" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Description (optionnel)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} placeholder="Ce que couvre cette leçon…" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">URL vidéo (mp4 / YouTube / Vimeo)</label>
            <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="https://…" type="url" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Durée (minutes)</label>
            <input value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} className={inputClass} placeholder="12" type="number" min="0" step="1" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">
              Chemin Azure Blob (optionnel — Phase 3)
            </label>
            <input value={form.blobPath} onChange={(e) => setForm({ ...form, blobPath: e.target.value })} className={inputClass} placeholder="lecon-01.mp4 (dans le conteneur privé du cours)" />
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
            <input type="checkbox" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} className="accent-primary" />
            Aperçu gratuit (visible sans achat)
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-60">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter la leçon"}
            </button>
          </div>
        </form>
      )}

      {/* Lessons list */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <Icon name="playlist_play" className="text-primary" fill />
            <h3 className="font-headline-lg-mobile text-on-surface">Programme du cours</h3>
          </div>
          {lessons && (
            <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
              {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {lessons === undefined && (
          <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
        )}
        {lessons?.length === 0 && (
          <div className="p-12 text-center">
            <Icon name="playlist_add" className="text-on-surface-variant text-4xl mb-3 opacity-60" />
            <p className="text-on-surface-variant">
              Aucune leçon. Ajoutez la première pour construire le programme.
            </p>
          </div>
        )}

        <ol>
          {lessons?.map((lesson, i) => (
            <li
              key={lesson._id}
              className={`flex items-center gap-4 px-6 py-4 border-t border-outline-variant/20 ${
                i % 2 ? "bg-surface-container-lowest/50" : ""
              }`}
            >
              <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums w-8">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-grow min-w-0">
                <div className="text-on-surface font-medium truncate flex items-center gap-2">
                  {lesson.title}
                  {lesson.isPreview && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-secondary/10 text-secondary border-secondary/20">
                      Aperçu
                    </span>
                  )}
                </div>
                <div className="text-on-surface-variant text-xs font-code-sm truncate">
                  {lesson.videoUrl
                    ? `URL · ${lesson.videoUrl}`
                    : lesson.blobPath
                      ? `Azure · ${lesson.blobPath}`
                      : "Pas de vidéo"}
                  {lesson.durationSec ? ` · ${formatDuration(lesson.durationSec)}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveLesson({ id: lesson._id, direction: "up" })}
                  disabled={i === 0}
                  className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                  aria-label="Monter"
                >
                  <Icon name="arrow_upward" className="text-lg" />
                </button>
                <button
                  onClick={() => moveLesson({ id: lesson._id, direction: "down" })}
                  disabled={i === lessons.length - 1}
                  className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                  aria-label="Descendre"
                >
                  <Icon name="arrow_downward" className="text-lg" />
                </button>
                <button
                  onClick={() => openEdit(lesson)}
                  className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors"
                  aria-label="Modifier"
                >
                  <Icon name="edit" className="text-lg" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer la leçon « ${lesson.title} » ?`)) {
                      removeLesson({ id: lesson._id });
                    }
                  }}
                  className="p-1.5 text-on-surface-variant hover:text-error transition-colors"
                  aria-label="Supprimer"
                >
                  <Icon name="delete" className="text-lg" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
