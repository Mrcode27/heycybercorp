"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;
type Level = (typeof LEVELS)[number];

const inputClass =
  "w-full bg-field border border-outline-variant text-on-surface px-3 py-2 rounded focus:border-primary focus:ring-0 outline-none transition-colors text-sm";

const EMPTY = {
  name: "",
  slug: "",
  tagline: "",
  priceEur: "",
  priceXof: "",
  features: "",
  levels: [] as Level[],
  published: true,
  featured: false,
};

/**
 * Full CRUD for packages — the priced tiers that unlock courses by level.
 * A package can cover one or several levels (a "bundle"), and the owner can
 * add as many packages as they like.
 */
export default function AdminPackages() {
  const packages = useQuery(api.packages.listAll, {});
  const createPkg = useMutation(api.packages.create);
  const updatePkg = useMutation(api.packages.update);
  const removePkg = useMutation(api.packages.remove);
  const movePkg = useMutation(api.packages.move);
  const seedPkg = useMutation(api.packages.seed);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"packages"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(pkg: NonNullable<typeof packages>[number]) {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name,
      slug: pkg.slug,
      tagline: pkg.tagline ?? "",
      priceEur: String(pkg.priceEur / 100),
      priceXof: String(pkg.priceXof),
      features: pkg.features.join("\n"),
      levels: pkg.levels,
      published: pkg.published,
      featured: pkg.featured ?? false,
    });
    setError(null);
    setShowForm(true);
  }

  function toggleLevel(l: Level) {
    setForm((f) => ({
      ...f,
      levels: f.levels.includes(l) ? f.levels.filter((x) => x !== l) : [...f.levels, l],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.levels.length === 0) {
      setError("Choisissez au moins un niveau à débloquer.");
      return;
    }
    setSaving(true);
    try {
      const common = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || undefined,
        priceEur: Math.round(parseFloat(form.priceEur || "0") * 100),
        priceXof: Math.round(parseFloat(form.priceXof || "0")),
        features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
        levels: form.levels,
        published: form.published,
        featured: form.featured,
      };
      if (editingId) {
        await updatePkg({ id: editingId, patch: { ...common, slug: form.slug.trim() || undefined } });
      } else {
        await createPkg({ ...common, slug: form.slug.trim() || undefined });
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
          <Icon name="sell" className="text-secondary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">Packs &amp; Tarifs</h3>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Icon name={showForm ? "close" : "add"} className="text-sm" />
          {showForm ? "Annuler" : "Nouveau pack"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="p-6 border-b border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest/40">
          <div className="md:col-span-2 flex items-center gap-2 font-label-mono text-label-mono uppercase text-primary">
            <Icon name={editingId ? "edit" : "add_circle"} className="text-sm" />
            {editingId ? "Modifier le pack" : "Créer un pack"}
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Nom</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Débutant" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Slug (optionnel)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="auto depuis le nom" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Accroche (optionnel)</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputClass} placeholder="Les fondamentaux de la cyberdéfense" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Prix Europe (€)</label>
            <input type="number" min="0" step="1" required value={form.priceEur} onChange={(e) => setForm({ ...form, priceEur: e.target.value })} className={inputClass} placeholder="40" />
          </div>
          <div>
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Prix Afrique (FCFA)</label>
            <input type="number" min="0" step="1" required value={form.priceXof} onChange={(e) => setForm({ ...form, priceXof: e.target.value })} className={inputClass} placeholder="15000" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Niveaux débloqués</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLevel(l)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    form.levels.includes(l)
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {form.levels.includes(l) ? "✓ " : ""}{l}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Avantages (un par ligne)</label>
            <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={inputClass} rows={4} placeholder={"Accès à vie aux formations Débutant\nCertificat vérifiable\nCommunauté Discord"} />
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" />
            Publié (visible sur le site)
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary" />
            Mettre en avant (« Recommandé »)
          </label>
          {error && (
            <p className="md:col-span-2 font-code-sm text-code-sm text-error flex items-center gap-2">
              <Icon name="error" className="text-sm" /> {error}
            </p>
          )}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-60">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer le pack"}
            </button>
          </div>
        </form>
      )}

      {packages === undefined && <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>}
      {packages?.length === 0 && (
        <div className="p-12 text-center">
          <button onClick={() => seedPkg({})} className="font-label-mono text-label-mono text-primary hover:underline uppercase">
            Créer les 3 packs par défaut
          </button>
        </div>
      )}

      <ol>
        {packages?.map((pkg, i) => (
          <li key={pkg._id} className={`flex items-center gap-4 px-6 py-4 border-t border-outline-variant/20 ${i % 2 ? "bg-surface-container-lowest/50" : ""}`}>
            <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums w-8">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex-grow min-w-0">
              <div className="text-on-surface font-medium truncate flex items-center gap-2">
                {pkg.name}
                {pkg.featured && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-primary/10 text-primary border-primary/30">Recommandé</span>
                )}
                {!pkg.published && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-surface-variant text-on-surface-variant border-outline-variant/40">Masqué</span>
                )}
              </div>
              <div className="text-on-surface-variant text-xs font-code-sm tabular-nums">
                {(pkg.priceEur / 100).toLocaleString("fr-FR")} € · {pkg.priceXof.toLocaleString("fr-FR")} FCFA · {pkg.levels.join(", ")}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => movePkg({ id: pkg._id, direction: "up" })} disabled={i === 0} className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors" aria-label="Monter">
                <Icon name="arrow_upward" className="text-lg" />
              </button>
              <button onClick={() => movePkg({ id: pkg._id, direction: "down" })} disabled={i === packages.length - 1} className="p-1.5 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors" aria-label="Descendre">
                <Icon name="arrow_downward" className="text-lg" />
              </button>
              <button onClick={() => openEdit(pkg)} className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors" aria-label="Modifier">
                <Icon name="edit" className="text-lg" />
              </button>
              <button
                onClick={() => { if (confirm(`Supprimer le pack « ${pkg.name} » ? Les accès accordés via ce pack seront retirés.`)) removePkg({ id: pkg._id }); }}
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
