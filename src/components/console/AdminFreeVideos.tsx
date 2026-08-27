"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { youtubeId } from "@/lib/youtube";
import { cleanConvexError } from "@/lib/errors";

const inputClass =
  "w-full bg-field border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

const EMPTY = {
  title: "",
  description: "",
  youtubeUrl: "",
  published: true,
  courseId: "" as string,
};

/**
 * Admin manager for the homepage free videos. Each video is a YouTube link
 * with a title, short description, an optional linked course (for the
 * "buy this course" nudge), plus publish + reorder controls.
 */
export default function AdminFreeVideos() {
  const videos = useQuery(api.freeVideos.listAll, {});
  const courses = useQuery(api.courses.listAll, {});
  const createVideo = useMutation(api.freeVideos.create);
  const updateVideo = useMutation(api.freeVideos.update);
  const removeVideo = useMutation(api.freeVideos.remove);
  const moveVideo = useMutation(api.freeVideos.move);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"freeVideos"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(video: NonNullable<typeof videos>[number]) {
    setEditingId(video._id);
    setForm({
      title: video.title,
      description: video.description,
      youtubeUrl: video.youtubeUrl,
      published: video.published,
      courseId: video.courseId ?? "",
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!youtubeId(form.youtubeUrl.trim())) {
      setError("Lien YouTube invalide. Collez une URL youtube.com ou youtu.be.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateVideo({
          id: editingId,
          title: form.title.trim(),
          description: form.description.trim(),
          youtubeUrl: form.youtubeUrl.trim(),
          published: form.published,
          courseId: form.courseId ? (form.courseId as Id<"courses">) : null,
        });
      } else {
        await createVideo({
          title: form.title.trim(),
          description: form.description.trim(),
          youtubeUrl: form.youtubeUrl.trim(),
          published: form.published,
          courseId: form.courseId ? (form.courseId as Id<"courses">) : undefined,
        });
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

  const courseTitle = (id?: Id<"courses">) =>
    id ? (courses?.find((c) => c._id === id)?.title ?? "—") : null;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Icon name="smart_display" className="text-secondary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">Vidéos de la page d&apos;accueil</h3>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Icon name={showForm ? "close" : "add"} className="text-sm" />
          {showForm ? "Annuler" : "Nouvelle vidéo"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="p-6 border-b border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest/40"
        >
          <div className="md:col-span-2 flex items-center gap-2 font-label-mono text-label-mono uppercase text-primary">
            <Icon name={editingId ? "edit" : "add_circle"} className="text-sm" />
            {editingId ? "Modifier la vidéo" : "Ajouter une vidéo"}
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Titre</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Comprendre le phishing en 5 minutes" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Description courte</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} placeholder="Un aperçu rapide de ce que couvre la vidéo…" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Lien YouTube</label>
            <input required value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} className={inputClass} placeholder="https://youtu.be/…" type="url" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Formation liée (optionnel)</label>
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className={inputClass}>
              <option value="">Aucune</option>
              {courses?.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" />
            Afficher sur la page d&apos;accueil
          </label>
          {error && (
            <p className="md:col-span-2 font-code-sm text-code-sm text-error flex items-center gap-2">
              <Icon name="error" className="text-sm" /> {error}
            </p>
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-60">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter la vidéo"}
            </button>
          </div>
        </form>
      )}

      {videos === undefined && (
        <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
      )}
      {videos?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="video_library" className="text-on-surface-variant text-4xl mb-3 opacity-60" />
          <p className="text-on-surface-variant">
            Aucune vidéo. Ajoutez-en une pour qu&apos;elle apparaisse sur la page d&apos;accueil.
          </p>
        </div>
      )}

      <ol>
        {videos?.map((video, i) => (
          <li
            key={video._id}
            className={`flex items-center gap-4 px-6 py-4 border-t border-outline-variant/20 ${
              i % 2 ? "bg-surface-container-lowest/50" : ""
            }`}
          >
            <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums w-8">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-grow min-w-0">
              <div className="text-on-surface font-medium truncate flex items-center gap-2">
                {video.title}
                {!video.published && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-surface-variant text-on-surface-variant border-outline-variant/40">
                    Masqué
                  </span>
                )}
              </div>
              <div className="text-on-surface-variant text-xs font-code-sm truncate">
                {video.youtubeUrl}
                {video.courseId ? ` · → ${courseTitle(video.courseId)}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateVideo({
                  id: video._id,
                  title: video.title,
                  description: video.description,
                  youtubeUrl: video.youtubeUrl,
                  published: !video.published,
                  courseId: video.courseId ?? null,
                })}
                className={`px-2 py-0.5 text-xs font-bold rounded border mr-1 ${
                  video.published
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface-variant text-on-surface-variant border-outline-variant/40"
                }`}
                title="Afficher / masquer"
              >
                {video.published ? "Visible" : "Masqué"}
              </button>
              <button
                onClick={() => moveVideo({ id: video._id, direction: "up" })}
                disabled={i === 0}
                className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                aria-label="Monter"
              >
                <Icon name="arrow_upward" className="text-lg" />
              </button>
              <button
                onClick={() => moveVideo({ id: video._id, direction: "down" })}
                disabled={i === videos.length - 1}
                className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                aria-label="Descendre"
              >
                <Icon name="arrow_downward" className="text-lg" />
              </button>
              <button
                onClick={() => openEdit(video)}
                className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors"
                aria-label="Modifier"
              >
                <Icon name="edit" className="text-lg" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer la vidéo « ${video.title} » ?`)) removeVideo({ id: video._id });
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
  );
}
