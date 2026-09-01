"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

/** Must match MAX_COLORS in convex/settings.ts — the mutation rejects more. */
const MAX_COLORS = 8;

/** Must match DEFAULT_RING_COLORS / DEFAULT_FLUID_COLORS in convex/settings.ts. */
const DEFAULT_RINGS = ["#08723d", "#087f97"];
const DEFAULT_FLUID = ["#2aa561", "#0097b2", "#08723d", "#00c2a8"];

const HEX = /^#[0-9a-fA-F]{6}$/;

type Which = "rings" | "fluid";

const PICKERS: {
  key: Which;
  name: string;
  icon: string;
  desc: string;
  order: string;
}[] = [
  {
    key: "rings",
    name: "Anneaux du héros",
    icon: "radio_button_checked",
    desc: "Les cercles concentriques animés derrière le titre de la page d'accueil.",
    order: "Du premier anneau (au centre) au dernier (à l'extérieur).",
  },
  {
    key: "fluid",
    name: "Curseur fluide",
    icon: "gesture",
    desc: "La traînée qui suit la souris sur le reste de la page d'accueil.",
    order: "Une couleur est tirée au hasard dans la liste à chaque mouvement.",
  },
];

/**
 * One swatch: a native colour input stacked under a hex field.
 *
 * The native picker is what people actually reach for, and the text field is
 * what makes a brand hex paste-able. They edit the same value.
 */
function Swatch({
  value,
  onChange,
  onRemove,
  canRemove,
  index,
}: {
  value: string;
  onChange: (next: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}) {
  const valid = HEX.test(value);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label className="sr-only" htmlFor={`swatch-${index}`}>
          Couleur {index + 1}
        </label>
        <input
          id={`swatch-${index}`}
          type="color"
          // A colour input rejects anything that is not #rrggbb, so a
          // half-typed hex in the text field must not be pushed into it.
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-16 w-full cursor-pointer rounded-lg border border-outline-variant/40 bg-transparent p-1"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Retirer la couleur ${index + 1}`}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/50 bg-surface text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
          >
            <Icon name="close" className="text-sm" />
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-invalid={!valid}
        className={`w-full rounded border bg-field p-2 text-center font-code-sm text-code-sm uppercase outline-none transition-colors ${
          valid
            ? "border-outline-variant text-on-surface focus:border-secondary"
            : "border-error text-error"
        }`}
      />
    </div>
  );
}

/** A live preview of how the list will be walked, as a single gradient bar. */
function GradientBar({ colors }: { colors: string[] }) {
  const usable = colors.filter((c) => HEX.test(c));
  if (usable.length === 0) return null;
  const background =
    usable.length === 1
      ? usable[0]
      : `linear-gradient(to right, ${usable.join(", ")})`;
  return (
    <div
      className="h-3 w-full rounded-full border border-outline-variant/40"
      style={{ background }}
      aria-hidden
    />
  );
}

function Picker({
  spec,
  saved,
  fallback,
  onSave,
  busy,
}: {
  spec: (typeof PICKERS)[number];
  saved: string[] | undefined;
  fallback: string[];
  onSave: (colors: string[]) => Promise<void>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<string[]>(fallback);
  const [dirty, setDirty] = useState(false);
  const [seededKey, setSeededKey] = useState<string | null>(null);

  // The server is the source of truth, so the draft re-seeds whenever the
  // saved palette changes — on first load, and when another admin saves in a
  // second tab. Adjusting state during render rather than in an effect is
  // React's documented way to do this; keying on the joined value (not the
  // array identity) is what makes it settle after one pass.
  const savedKey = saved?.join(",") ?? null;
  if (saved && savedKey !== seededKey) {
    setSeededKey(savedKey);
    // Never clobber edits in progress: a live update must not eat what the
    // admin is halfway through typing.
    if (!dirty) setDraft(saved);
  }

  const edit = (next: string[]) => {
    setDraft(next);
    setDirty(true);
  };

  const allValid = draft.length > 0 && draft.every((c) => HEX.test(c));

  return (
    <section className="rounded-xl border border-outline-variant/40 p-5">
      <div className="mb-4 flex items-start gap-3">
        <Icon name={spec.icon} className="mt-0.5 text-secondary" fill />
        <div className="min-w-0">
          <h4 className="font-headline-lg-mobile text-on-surface">{spec.name}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant">{spec.desc}</p>
          <p className="mt-1 font-code-sm text-code-sm text-on-surface-variant/80">{spec.order}</p>
        </div>
      </div>

      <div className="mb-4">
        <GradientBar colors={draft} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {draft.map((color, i) => (
          <Swatch
            key={i}
            index={i}
            value={color}
            canRemove={draft.length > 1}
            onChange={(next) => edit(draft.map((c, j) => (j === i ? next : c)))}
            onRemove={() => edit(draft.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => edit([...draft, draft[draft.length - 1] ?? "#08723d"])}
          disabled={draft.length >= MAX_COLORS}
          className="flex items-center gap-1.5 rounded-lg border border-outline-variant/50 px-3 py-2 font-code-sm text-code-sm text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
        >
          <Icon name="add" className="text-sm" />
          Ajouter une couleur
        </button>
        <button
          type="button"
          onClick={() => edit(fallback)}
          className="flex items-center gap-1.5 rounded-lg border border-outline-variant/50 px-3 py-2 font-code-sm text-code-sm text-on-surface-variant transition-colors hover:border-secondary/50 hover:text-secondary"
        >
          <Icon name="restart_alt" className="text-sm" />
          Couleurs d&apos;origine
        </button>
        <button
          type="button"
          onClick={async () => {
            await onSave(draft.map((c) => c.toLowerCase()));
            setDirty(false);
          }}
          disabled={!allValid || busy || !dirty}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary transition-all hover:brightness-110 disabled:opacity-40"
        >
          <Icon name="save" className="text-sm" fill />
          {busy ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
        </button>
      </div>

      {!allValid && (
        <p className="mt-3 flex items-center gap-1.5 font-code-sm text-code-sm text-error">
          <Icon name="error" className="text-sm" />
          Chaque couleur doit être au format #rrggbb.
        </p>
      )}
      <p className="mt-3 font-code-sm text-code-sm text-on-surface-variant">
        {draft.length} / {MAX_COLORS} couleurs.
      </p>
    </section>
  );
}

/**
 * Colour control for the two landing-page animations.
 *
 * Saving writes to Convex, which every visitor's page is already subscribed
 * to — the animations repaint live, with no deploy and nothing to rebuild.
 */
export default function AnimationColors() {
  const settings = useQuery(api.settings.get);
  const setColors = useMutation(api.settings.setAnimationColors);
  const [busy, setBusy] = useState<Which | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(which: Which, colors: string[]) {
    setBusy(which);
    setError(null);
    try {
      await setColors(which === "rings" ? { ringColors: colors } : { fluidColors: colors });
    } catch (err) {
      setError(cleanConvexError(err, "L'enregistrement des couleurs a échoué."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div className="flex items-center gap-3 border-b border-outline-variant/30 p-6">
        <Icon name="animation" className="text-primary" fill />
        <div>
          <h3 className="font-headline-lg-mobile text-on-surface">
            Couleurs des animations
          </h3>
          <p className="font-code-sm text-code-sm text-on-surface-variant">
            Page d&apos;accueil. S&apos;applique immédiatement à tous les visiteurs.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {PICKERS.map((spec) => (
          <Picker
            key={spec.key}
            spec={spec}
            saved={spec.key === "rings" ? settings?.ringColors : settings?.fluidColors}
            fallback={spec.key === "rings" ? DEFAULT_RINGS : DEFAULT_FLUID}
            busy={busy === spec.key}
            onSave={(colors) => save(spec.key, colors)}
          />
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 px-6 pb-6 font-code-sm text-code-sm text-error">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
}
