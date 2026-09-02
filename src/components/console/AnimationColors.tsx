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
/** Must match DEFAULT_CYBER_RAIN_COLORS in convex/settings.ts. */
const DEFAULT_RAIN = ["#6add93", "#66d5f1"];

const HEX = /^#[0-9a-fA-F]{6}$/;

type Which = "rings" | "fluid" | "rain";
/** Must match HeroAnimation in convex/settings.ts. */
type HeroAnimation = "rings" | "ringField" | "cursorRing";
type FluidColorMode = "rainbow" | "sequence";

/** How the fluid trail picks a colour for each stroke. */
const FLUID_MODES: { key: FluidColorMode; name: string; desc: string; icon: string }[] = [
  {
    key: "sequence",
    name: "Couleur après couleur",
    icon: "palette",
    desc: "Chaque trait prend la couleur suivante de la liste ci-dessous, dans l'ordre.",
  },
  {
    key: "rainbow",
    name: "Arc-en-ciel",
    icon: "gradient",
    desc: "Chaque trait prend une teinte différente sur tout le spectre. La liste est ignorée.",
  },
];

/** The three hero backgrounds. Only the selected one is ever downloaded. */
const HERO_OPTIONS: {
  key: HeroAnimation;
  name: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: "rings",
    name: "Anneaux concentriques",
    icon: "radio_button_checked",
    desc: "Des cercles lumineux qui s'étendent en boucle et suivent légèrement la souris.",
  },
  {
    key: "ringField",
    name: "Champ de particules",
    icon: "scatter_plot",
    desc: "Un disque de barres bleues, vertes et jaunes qui respire comme une méduse ; le curseur creuse un vide à son centre et comprime le disque autour de lui.",
  },
  {
    key: "cursorRing",
    name: "Anneau de capsules",
    icon: "flare",
    desc: "Un champ dense de capsules lumineuses : un anneau suit le curseur, les éclaire en dégradé et les pousse vers l'extérieur.",
  },
];

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
    order: "Utilisée en mode « couleur après couleur », dans cet ordre.",
  },
  {
    key: "rain",
    name: "Pluie de données",
    icon: "grain",
    desc: "La pluie numérique de la défense cyber, derrière la page sous le héros.",
    order: "Les gouttes alternent ces couleurs, colonne par colonne.",
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
 * Colour controls for the landing-page animations and the ambient rain.
 *
 * Saving writes to Convex, which every visitor's page is already subscribed
 * to — the animations repaint live, with no deploy and nothing to rebuild.
 */
export default function AnimationColors() {
  const settings = useQuery(api.settings.get);
  const setColors = useMutation(api.settings.setAnimationColors);
  const setHeroAnimation = useMutation(api.settings.setHeroAnimation);
  const setFluidColorMode = useMutation(api.settings.setFluidColorMode);
  const setFluidEnabled = useMutation(api.settings.setFluidEnabled);
  const setFluidDensity = useMutation(api.settings.setFluidDensity);
  const setCyberRain = useMutation(api.settings.setCyberRain);
  const setCyberRainOpacity = useMutation(api.settings.setCyberRainOpacity);
  const [busy, setBusy] = useState<Which | null>(null);
  const [heroBusy, setHeroBusy] = useState<HeroAnimation | null>(null);
  const [modeBusy, setModeBusy] = useState<FluidColorMode | null>(null);
  const [enabledBusy, setEnabledBusy] = useState(false);
  const [density, setDensity] = useState<number | null>(null);
  const [densityBusy, setDensityBusy] = useState(false);
  const [rainBusy, setRainBusy] = useState(false);
  const [rainOpacity, setRainOpacity] = useState<number | null>(null);
  const [rainOpacityBusy, setRainOpacityBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseHero(key: HeroAnimation) {
    if (settings?.heroAnimation === key) return;
    setHeroBusy(key);
    setError(null);
    try {
      await setHeroAnimation({ heroAnimation: key });
    } catch (err) {
      setError(cleanConvexError(err, "Le changement d'animation a échoué."));
    } finally {
      setHeroBusy(null);
    }
  }

  async function chooseFluidMode(key: FluidColorMode) {
    if (settings?.fluidColorMode === key) return;
    setModeBusy(key);
    setError(null);
    try {
      await setFluidColorMode({ fluidColorMode: key });
    } catch (err) {
      setError(cleanConvexError(err, "Le changement de mode a échoué."));
    } finally {
      setModeBusy(null);
    }
  }

  async function chooseFluidEnabled(enabled: boolean) {
    if (settings?.fluidEnabled === enabled) return;
    setEnabledBusy(true);
    setError(null);
    try {
      await setFluidEnabled({ fluidEnabled: enabled });
    } catch (err) {
      setError(cleanConvexError(err, "Le changement a échoué."));
    } finally {
      setEnabledBusy(false);
    }
  }

  async function chooseRain(enabled: boolean) {
    if (settings?.cyberRain === enabled) return;
    setRainBusy(true);
    setError(null);
    try {
      await setCyberRain({ cyberRain: enabled });
    } catch (err) {
      setError(cleanConvexError(err, "Le changement a échoué."));
    } finally {
      setRainBusy(false);
    }
  }

  async function saveDensity() {
    if (density === null || settings?.fluidDensity === density) return;
    setDensityBusy(true);
    setError(null);
    try {
      await setFluidDensity({ fluidDensity: density });
    } catch (err) {
      setError(cleanConvexError(err, "L'enregistrement de la densité a échoué."));
    } finally {
      setDensityBusy(false);
    }
  }

  async function saveRainOpacity() {
    if (rainOpacity === null || settings?.cyberRainOpacity === rainOpacity) return;
    setRainOpacityBusy(true);
    setError(null);
    try {
      await setCyberRainOpacity({ cyberRainOpacity: rainOpacity });
    } catch (err) {
      setError(cleanConvexError(err, "L'enregistrement de l'opacité a échoué."));
    } finally {
      setRainOpacityBusy(false);
    }
  }

  async function save(which: Which, colors: string[]) {
    setBusy(which);
    setError(null);
    try {
      await setColors(
        which === "rings"
          ? { ringColors: colors }
          : which === "fluid"
            ? { fluidColors: colors }
            : { cyberRainColors: colors },
      );
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
        <section className="rounded-xl border border-outline-variant/40 p-5">
          <div className="mb-4 flex items-start gap-3">
            <Icon name="animation" className="mt-0.5 text-secondary" fill />
            <div className="min-w-0">
              <h4 className="font-headline-lg-mobile text-on-surface">Animation du héros</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Le fond animé derrière le titre. Une seule est chargée par visiteur.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HERO_OPTIONS.map((option) => {
              const isActive = settings?.heroAnimation === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => chooseHero(option.key)}
                  disabled={heroBusy !== null || settings === undefined}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Icon name={option.icon} className="text-secondary" fill />
                    {isActive && (
                      <span className="flex items-center gap-1 font-code-sm text-code-sm text-primary">
                        <Icon name="check_circle" className="text-sm" fill /> Actif
                      </span>
                    )}
                  </div>
                  <div className="font-body-md text-on-surface">{option.name}</div>
                  <p className="mt-1 font-code-sm text-code-sm text-on-surface-variant">
                    {option.desc}
                  </p>
                  {heroBusy === option.key && (
                    <p className="mt-2 font-code-sm text-code-sm text-on-surface-variant">
                      Application…
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 font-code-sm text-code-sm text-on-surface-variant/80">
            Les trois utilisent la palette « Anneaux du héros » ci-dessous.
          </p>
        </section>

        <section className="rounded-xl border border-outline-variant/40 p-5">
          <div className="mb-4 flex items-start gap-3">
            <Icon name="gesture" className="mt-0.5 text-secondary" fill />
            <div className="min-w-0">
              <h4 className="font-headline-lg-mobile text-on-surface">
                Couleurs du curseur fluide
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Comment la traînée choisit sa couleur à chaque mouvement.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FLUID_MODES.map((mode) => {
              const isActive = settings?.fluidColorMode === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => chooseFluidMode(mode.key)}
                  disabled={modeBusy !== null || settings === undefined}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Icon name={mode.icon} className="text-secondary" fill />
                    {isActive && (
                      <span className="flex items-center gap-1 font-code-sm text-code-sm text-primary">
                        <Icon name="check_circle" className="text-sm" fill /> Actif
                      </span>
                    )}
                  </div>
                  <div className="font-body-md text-on-surface">{mode.name}</div>
                  <p className="mt-1 font-code-sm text-code-sm text-on-surface-variant">
                    {mode.desc}
                  </p>
                  {modeBusy === mode.key && (
                    <p className="mt-2 font-code-sm text-code-sm text-on-surface-variant">
                      Application…
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/40 p-5">
          <div className="mb-4 flex items-start gap-3">
            <Icon name="water_drop" className="mt-0.5 text-secondary" fill />
            <div className="min-w-0">
              <h4 className="font-headline-lg-mobile text-on-surface">
                Curseur fluide activé&nbsp;?
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Coupe la traînée pour tous les visiteurs. Chaque visiteur peut aussi la
                couper pour lui-même avec la pastille «&nbsp;FX CURSEUR&nbsp;» en bas de la page.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { enabled: true, name: "Activé", icon: "check_circle" },
              { enabled: false, name: "Désactivé", icon: "cancel" },
            ].map((option) => {
              const isActive = (settings?.fluidEnabled ?? true) === option.enabled;
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => chooseFluidEnabled(option.enabled)}
                  disabled={enabledBusy || settings === undefined}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Icon name={option.icon} className="text-secondary" fill />
                    {isActive && (
                      <span className="flex items-center gap-1 font-code-sm text-code-sm text-primary">
                        <Icon name="check_circle" className="text-sm" fill /> Actif
                      </span>
                    )}
                  </div>
                  <div className="font-body-md text-on-surface">{option.name}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/40 p-5">
          <div className="mb-4 flex items-start gap-3">
            <Icon name="tune" className="mt-0.5 text-secondary" fill />
            <div className="min-w-0">
              <h4 className="font-headline-lg-mobile text-on-surface">
                Densité du curseur fluide
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Quelle quantité de fluide chaque mouvement laisse derrière lui. 55 est
                le réglage d&apos;origine.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={density ?? settings?.fluidDensity ?? 55}
              onChange={(e) => setDensity(Number(e.target.value))}
              disabled={settings === undefined}
              className="flex-1 accent-[color:var(--color-primary)]"
            />
            <span className="w-12 text-right font-code-sm text-code-sm text-on-surface-variant tabular-nums">
              {density ?? settings?.fluidDensity ?? 55}
            </span>
            <button
              type="button"
              onClick={saveDensity}
              disabled={
                densityBusy ||
                density === null ||
                settings === undefined ||
                settings?.fluidDensity === density
              }
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary transition-all hover:brightness-110 disabled:opacity-40"
            >
              <Icon name="save" className="text-sm" fill />
              {densityBusy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/40 p-5">
          <div className="mb-4 flex items-start gap-3">
            <Icon name="security" className="mt-0.5 text-secondary" fill />
            <div className="min-w-0">
              <h4 className="font-headline-lg-mobile text-on-surface">
                Défense cyber ambiante
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                La pluie de données (pluie numérique) qui défile derrière la page sous le
                héros, avec des alertes d&apos;intrusion bloquées. Reste derrière le contenu.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { enabled: true, name: "Activée", icon: "check_circle" },
              { enabled: false, name: "Désactivée", icon: "cancel" },
            ].map((option) => {
              const isActive = (settings?.cyberRain ?? true) === option.enabled;
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => chooseRain(option.enabled)}
                  disabled={rainBusy || settings === undefined}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Icon name={option.icon} className="text-secondary" fill />
                    {isActive && (
                      <span className="flex items-center gap-1 font-code-sm text-code-sm text-primary">
                        <Icon name="check_circle" className="text-sm" fill /> Actif
                      </span>
                    )}
                  </div>
                  <div className="font-body-md text-on-surface">{option.name}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-outline-variant/40 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Icon name="opacity" className="text-secondary" fill />
              <div className="min-w-0">
                <h5 className="font-headline-lg-mobile text-on-surface sm:text-base">
                  Opacité de la pluie
                </h5>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  À quel point la pluie se détache du fond. 45 est le réglage d&apos;origine.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={rainOpacity ?? settings?.cyberRainOpacity ?? 45}
                onChange={(e) => setRainOpacity(Number(e.target.value))}
                disabled={settings === undefined}
                className="flex-1 accent-[color:var(--color-primary)]"
              />
              <span className="w-12 text-right font-code-sm text-code-sm text-on-surface-variant tabular-nums">
                {rainOpacity ?? settings?.cyberRainOpacity ?? 45}
              </span>
              <button
                type="button"
                onClick={saveRainOpacity}
                disabled={
                  rainOpacityBusy ||
                  rainOpacity === null ||
                  settings === undefined ||
                  settings?.cyberRainOpacity === rainOpacity
                }
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary transition-all hover:brightness-110 disabled:opacity-40"
              >
                <Icon name="save" className="text-sm" fill />
                {rainOpacityBusy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </section>

        {PICKERS.map((spec) => (
          <Picker
            key={spec.key}
            spec={spec}
            saved={
              spec.key === "rings"
                ? settings?.ringColors
                : spec.key === "fluid"
                  ? settings?.fluidColors
                  : settings?.cyberRainColors
            }
            fallback={
              spec.key === "rings"
                ? DEFAULT_RINGS
                : spec.key === "fluid"
                  ? DEFAULT_FLUID
                  : DEFAULT_RAIN
            }
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
