"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import Terminal from "../shell/Terminal";
import type { ShellConfig } from "@/lib/shell";

/**
 * The case environment: a simulated Linux workstation that boots, logs in and
 * hands the student a desktop.
 *
 * Nothing is emulated. It is React, CSS and the shell from `@/lib/shell` — no
 * kernel, no VM, no WebAssembly image to download, and no server cost per
 * student. What it buys is the framing: an analyst does not meet a case as a
 * text box on a web page, they meet it on a machine.
 *
 * The briefing lives inside the environment as `question.txt`, opened at login
 * and re-readable with `cat question.txt` or from the file manager, so the
 * assignment never scrolls away.
 *
 * SECURITY: the terminal is the same registry-driven shell used everywhere
 * else. It evaluates nothing and performs no network request; the file manager
 * renders file bodies as text.
 */

export type WebOSConfig = ShellConfig & {
  apps?: AppId[];
  /** Files opened automatically once the session starts. */
  openOnStart?: string[];
};

type AppId = "terminal" | "files" | "monitor";
type Phase = "idle" | "boot" | "login" | "desktop";

type Win = {
  id: string;
  app: AppId | "text";
  title: string;
  icon: string;
  file?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  min: boolean;
  max: boolean;
};

const APP_META: Record<AppId, { title: string; icon: string; w: number; h: number }> = {
  terminal: { title: "Terminal", icon: "terminal", w: 720, h: 440 },
  files: { title: "Fichiers", icon: "folder", w: 520, h: 380 },
  monitor: { title: "Moniteur système", icon: "monitoring", w: 420, h: 300 },
};

/**
 * The boot log. Deliberately the real shape of a systemd start-up — an analyst
 * recognises these lines, and recognition is the point of the whole exercise.
 */
const BOOT_LINES: { text: string; ok?: boolean; delay: number }[] = [
  { text: "HeyOS 6.8.0-hcc — amorçage depuis le disque local", delay: 120 },
  { text: "[    0.000000] Linux version 6.8.0-hcc (build@heycybercorp)", delay: 90 },
  { text: "[    0.104882] Command line: ro quiet splash", delay: 70 },
  { text: "[    0.412331] Memory: 8192MB available", delay: 70 },
  { text: "[    0.998210] Loading initial ramdisk…", delay: 140 },
  { text: "Started Journal Service", ok: true, delay: 110 },
  { text: "Mounted /var/log", ok: true, delay: 90 },
  { text: "Started udev Kernel Device Manager", ok: true, delay: 90 },
  { text: "Started Network Manager", ok: true, delay: 110 },
  { text: "Reached target Network", ok: true, delay: 90 },
  { text: "Started OpenSSH Daemon", ok: true, delay: 100 },
  { text: "Started SIEM Collector", ok: true, delay: 110 },
  { text: "Started Intrusion Detection Sensor", ok: true, delay: 110 },
  { text: "Reached target Multi-User System", ok: true, delay: 130 },
  { text: "Démarrage du gestionnaire de session…", delay: 260 },
];

export default function WebOS({ config }: { config: WebOSConfig }) {
  const [phase, setPhase] = useState<Phase>("idle");
  return phase === "idle" ? (
    <LaunchCard config={config} onLaunch={() => setPhase("boot")} />
  ) : (
    <Session config={config} phase={phase} setPhase={setPhase} />
  );
}

/** What the case shows before the machine is started. */
function LaunchCard({ config, onLaunch }: { config: WebOSConfig; onLaunch: () => void }) {
  const fileCount = Object.keys(config.files).length;
  return (
    <div className="p-8 md:p-10 text-center">
      <div className="w-16 h-16 rounded-xl bg-surface-variant flex items-center justify-center mx-auto mb-5">
        <Icon name="dns" className="text-primary text-3xl" fill />
      </div>
      <h3 className="font-headline-lg-mobile text-on-surface mb-2">
        Poste d&apos;analyse — {config.host}
      </h3>
      <p className="text-on-surface-variant max-w-md mx-auto mb-2">
        Une station HeyOS avec terminal, gestionnaire de fichiers et moniteur.
        Le dossier de la nuit vous attend dans <code className="text-primary">question.txt</code>.
      </p>
      <p className="font-code-sm text-code-sm text-on-surface-variant mb-7">
        {config.user}@{config.host} · {fileCount} fichier{fileCount > 1 ? "s" : ""} · lecture seule
      </p>
      <button
        type="button"
        onClick={onLaunch}
        className="px-7 py-3.5 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all inline-flex items-center gap-2 glow-primary"
      >
        <Icon name="play_arrow" className="text-lg" fill />
        Lancer l&apos;environnement
      </button>
      <p className="font-code-sm text-code-sm text-on-surface-variant/70 mt-4">
        S&apos;ouvre en plein écran · clavier requis
      </p>
    </div>
  );
}

function Session({
  config,
  phase,
  setPhase,
}: {
  config: WebOSConfig;
  phase: Phase;
  setPhase: (p: Phase) => void;
}) {
  // The page behind must not scroll while the desktop owns the screen.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0f0c] text-white overflow-hidden">
      {phase === "boot" && <BootScreen onDone={() => setPhase("login")} />}
      {phase === "login" && (
        <LoginScreen user={config.user} host={config.host} onEnter={() => setPhase("desktop")} />
      )}
      {phase === "desktop" && <Desktop config={config} onQuit={() => setPhase("idle")} />}
    </div>
  );
}

function BootScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= BOOT_LINES.length) {
      const t = setTimeout(onDone, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((n) => n + 1), BOOT_LINES[shown].delay);
    return () => clearTimeout(t);
  }, [shown, onDone]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [shown]);

  return (
    <div className="h-full w-full bg-black p-6 md:p-10 overflow-hidden font-code-sm text-code-sm">
      <div className="max-w-4xl">
        {BOOT_LINES.slice(0, shown).map((l, i) => (
          <p key={i} className="mb-0.5 text-[#c9d5cc] whitespace-pre-wrap">
            {l.ok && <span className="text-[#3ddc84]">[  OK  ] </span>}
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
        {shown < BOOT_LINES.length && (
          <span className="inline-block w-2 h-4 bg-[#3ddc84] align-middle animate-pulse" />
        )}
      </div>
      <button
        type="button"
        onClick={onDone}
        className="fixed bottom-6 right-8 font-code-sm text-code-sm text-white/30 hover:text-white/70 transition-colors"
      >
        passer ▸
      </button>
    </div>
  );
}

/** A GDM-style greeter: clock, avatar, one action. */
function LoginScreen({
  user,
  host,
  onEnter,
}: {
  user: string;
  host: string;
  onEnter: () => void;
}) {
  const clock = useClock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnter]);

  return (
    <button
      type="button"
      onClick={onEnter}
      aria-label="Ouvrir la session"
      className="h-full w-full flex flex-col items-center justify-center cursor-default"
      style={{ background: WALLPAPER }}
    >
      <div className="text-[84px] leading-none font-light tracking-tight">{clock.time}</div>
      <div className="text-lg text-white/70 mt-2 mb-16 capitalize">{clock.date}</div>

      <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 backdrop-blur">
        <Icon name="person" className="text-white/80 text-5xl" fill />
      </div>
      <div className="text-xl mb-1">{user}</div>
      <div className="font-code-sm text-code-sm text-white/50 mb-10">{host}</div>

      <div className="px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur text-sm">
        Cliquez ou appuyez sur Entrée pour ouvrir la session
      </div>
    </button>
  );
}

const WALLPAPER =
  "radial-gradient(circle at 25% 20%, rgba(0,145,80,0.35), transparent 55%)," +
  "radial-gradient(circle at 78% 78%, rgba(0,110,70,0.28), transparent 52%)," +
  "linear-gradient(160deg, #08130d 0%, #0a1a12 45%, #050b08 100%)";

function useClock() {
  const [v, setV] = useState({ time: "--:--", date: "" });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setV({
        time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        date: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      });
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return v;
}

function Desktop({ config, onQuit }: { config: WebOSConfig; onQuit: () => void }) {
  const apps = config.apps ?? ["terminal", "files", "monitor"];
  const clock = useClock();
  const surfaceRef = useRef<HTMLDivElement>(null);

  // One filesystem behind every app, so a file written in the terminal shows up
  // in the file manager. Lazy state: it must survive re-renders untouched.
  const [files] = useState(() => ({ ...config.files }));

  const [wins, setWins] = useState<Win[]>(() => {
    const initial: Win[] = [];
    let z = 10;
    if (apps.includes("terminal")) {
      initial.push({
        id: "terminal",
        app: "terminal",
        ...APP_META.terminal,
        x: 96,
        y: 96,
        z: z++,
        min: false,
        max: false,
      });
    }
    for (const [i, name] of (config.openOnStart ?? []).entries()) {
      if (!(name in config.files)) continue;
      initial.push({
        id: `text:${name}`,
        app: "text",
        title: name,
        icon: "description",
        file: name,
        x: 860 + i * 30,
        y: 150 + i * 30,
        w: 460,
        h: 420,
        z: z++,
        min: false,
        max: false,
      });
    }
    return initial;
  });
  const [top, setTop] = useState(30);
  const [overview, setOverview] = useState(false);

  function focus(id: string) {
    setTop((t) => t + 1);
    setWins((w) => w.map((x) => (x.id === id ? { ...x, z: top + 1, min: false } : x)));
  }

  function open(app: AppId | "text", file?: string) {
    setOverview(false);
    const id = app === "text" ? `text:${file}` : app;
    if (wins.some((w) => w.id === id)) return focus(id);
    const meta =
      app === "text"
        ? { title: file ?? "Fichier", icon: "description", w: 480, h: 400 }
        : APP_META[app];
    setTop((t) => t + 1);
    setWins((w) => [
      ...w,
      {
        id,
        app,
        file,
        title: meta.title,
        icon: meta.icon,
        x: 150 + (w.length % 6) * 34,
        y: 110 + (w.length % 6) * 30,
        w: meta.w,
        h: meta.h,
        z: top + 1,
        min: false,
        max: false,
      },
    ]);
  }

  const patch = (id: string, p: Partial<Win>) =>
    setWins((w) => w.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <div ref={surfaceRef} className="h-full w-full relative" style={{ background: WALLPAPER }}>
      {/* ---- Top bar (GNOME shell) ---- */}
      <div className="absolute inset-x-0 top-0 h-8 z-[400] bg-black/45 backdrop-blur-md flex items-center px-3 text-[13px]">
        <button
          type="button"
          onClick={() => setOverview((o) => !o)}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            overview ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          Activités
        </button>
        <div className="flex-1" />
        <button type="button" className="px-3 py-0.5 rounded hover:bg-white/10 tabular-nums">
          {clock.time} · <span className="capitalize">{clock.date}</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5 text-white/80">
          <Icon name="network_wifi" className="text-[17px]" />
          <Icon name="volume_up" className="text-[17px]" />
          <Icon name="battery_full" className="text-[17px]" />
          <button
            type="button"
            onClick={onQuit}
            title="Fermer la session"
            className="ml-1 px-2 py-0.5 rounded hover:bg-error/30 flex items-center gap-1"
          >
            <Icon name="power_settings_new" className="text-[17px]" />
          </button>
        </div>
      </div>

      {/* ---- Desktop icons ---- */}
      <div className="absolute top-14 left-28 z-[100] space-y-1">
        {Object.keys(files)
          .slice(0, 8)
          .map((name) => (
            <button
              key={name}
              type="button"
              onDoubleClick={() => open("text", name)}
              onClick={() => open("text", name)}
              className="w-28 p-2 rounded-lg flex flex-col items-center gap-1 hover:bg-white/10 transition-colors"
            >
              <Icon
                name={name.endsWith(".log") ? "receipt_long" : "description"}
                className="text-[34px] text-white/85"
              />
              <span className="text-[11px] text-white/85 text-center leading-tight break-all">
                {name}
              </span>
            </button>
          ))}
      </div>

      {/* ---- Dash (left dock) ---- */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-[400] flex flex-col gap-2 p-2 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10">
        {apps.map((a) => {
          const running = wins.some((w) => w.id === a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => open(a)}
              title={APP_META[a].title}
              className="relative w-12 h-12 rounded-xl bg-white/10 hover:bg-primary/40 flex items-center justify-center transition-colors"
            >
              <Icon name={APP_META[a].icon} className="text-white text-[22px]" />
              {running && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
        <div className="h-px bg-white/15 mx-1 my-1" />
        <button
          type="button"
          onClick={() => setOverview((o) => !o)}
          title="Applications"
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-primary/40 flex items-center justify-center transition-colors"
        >
          <Icon name="apps" className="text-white text-[22px]" />
        </button>
      </div>

      {/* ---- Windows ---- */}
      {wins
        .filter((w) => !w.min)
        .map((w) => (
          <Window
            key={w.id}
            win={w}
            bounds={surfaceRef}
            onFocus={() => focus(w.id)}
            onClose={() => setWins((s) => s.filter((x) => x.id !== w.id))}
            onMinimise={() => patch(w.id, { min: true })}
            onToggleMax={() => patch(w.id, { max: !w.max })}
            onMove={(x, y) => patch(w.id, { x, y })}
          >
            {w.app === "terminal" && (
              <Terminal
                config={{ ...config, files }}
                height="h-full"
                className="h-full border-0 shadow-none rounded-none p-0"
                title={`${config.user}@${config.host}`}
                motd={[
                  { type: "system", text: "Session ouverte. 'help' liste les commandes." },
                  { type: "system", text: "Le dossier : cat question.txt" },
                ]}
              />
            )}
            {w.app === "files" && <FilesApp files={files} onOpen={(f) => open("text", f)} />}
            {w.app === "text" && (
              <pre className="p-5 h-full overflow-auto no-scrollbar font-code-sm text-code-sm text-[#d3e2d6] whitespace-pre-wrap break-words bg-[#0d1a12]">
                {w.file ? (files[w.file] ?? "(fichier vide)") : ""}
              </pre>
            )}
            {w.app === "monitor" && <MonitorApp host={config.host} />}
          </Window>
        ))}

      {/* ---- Activities overview ---- */}
      {overview && (
        <div
          className="absolute inset-0 top-8 z-[350] bg-black/70 backdrop-blur-lg p-10 overflow-auto"
          onClick={() => setOverview(false)}
        >
          <p className="text-center text-white/60 text-sm mb-8">
            Fenêtres ouvertes — cliquez pour revenir
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {wins.length === 0 && (
              <p className="text-white/50 text-sm">Aucune fenêtre ouverte.</p>
            )}
            {wins.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  focus(w.id);
                  setOverview(false);
                }}
                className="w-56 rounded-xl bg-white/10 border border-white/15 hover:border-primary/60 p-4 text-left transition-colors"
              >
                <Icon name={w.icon} className="text-white/85 text-2xl mb-2" />
                <div className="text-sm text-white truncate">{w.title}</div>
                <div className="text-[11px] text-white/50">{w.min ? "réduite" : "ouverte"}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Minimised windows, bottom centre ---- */}
      {wins.some((w) => w.min) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] flex gap-2 p-1.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/10">
          {wins
            .filter((w) => w.min)
            .map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => focus(w.id)}
                className="px-3 py-1.5 rounded-lg hover:bg-white/15 flex items-center gap-2 text-[12px] text-white/85 transition-colors"
              >
                <Icon name={w.icon} className="text-[15px]" />
                <span className="max-w-32 truncate">{w.title}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function Window({
  win,
  bounds,
  children,
  onFocus,
  onClose,
  onMinimise,
  onToggleMax,
  onMove,
}: {
  win: Win;
  bounds: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimise: () => void;
  onToggleMax: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  function down(e: React.PointerEvent) {
    onFocus();
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const box = bounds.current?.getBoundingClientRect();
    onMove(
      Math.max(0, Math.min((box?.width ?? 1400) - 160, e.clientX - drag.current.dx)),
      Math.max(32, Math.min((box?.height ?? 800) - 60, e.clientY - drag.current.dy)),
    );
  }
  function up(e: React.PointerEvent) {
    drag.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  const style: React.CSSProperties = win.max
    ? { left: 76, top: 40, width: "calc(100% - 92px)", height: "calc(100% - 56px)", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      className="absolute rounded-xl overflow-hidden border border-white/15 bg-[#0d1a12] shadow-2xl flex flex-col"
      style={style}
      onMouseDown={onFocus}
    >
      {/* GNOME header bar: title centred, controls on the right. */}
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={onToggleMax}
        className="h-10 shrink-0 bg-[#16241b] flex items-center px-3 gap-2 cursor-grab active:cursor-grabbing border-b border-white/10"
      >
        <Icon name={win.icon} className="text-white/60 text-[17px]" />
        <span className="flex-1 text-center text-[13px] text-white/85 truncate font-medium">
          {win.title}
        </span>
        <button
          type="button"
          aria-label="Réduire"
          onClick={onMinimise}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <Icon name="remove" className="text-[15px] text-white/80" />
        </button>
        <button
          type="button"
          aria-label="Agrandir"
          onClick={onToggleMax}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <Icon name={win.max ? "close_fullscreen" : "open_in_full"} className="text-[13px] text-white/80" />
        </button>
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-error flex items-center justify-center"
        >
          <Icon name="close" className="text-[15px] text-white/80" />
        </button>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function FilesApp({
  files,
  onOpen,
}: {
  files: Record<string, string>;
  onOpen: (name: string) => void;
}) {
  const names = Object.keys(files);
  return (
    <div className="h-full overflow-auto no-scrollbar bg-[#0d1a12]">
      <div className="px-4 py-2 border-b border-white/10 text-[12px] text-white/50 font-code-sm">
        {names.length} élément{names.length > 1 ? "s" : ""}
      </div>
      <div className="p-2">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onDoubleClick={() => onOpen(n)}
            onClick={() => onOpen(n)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-colors"
          >
            <Icon
              name={n.endsWith(".log") ? "receipt_long" : "description"}
              className="text-primary text-xl"
            />
            <span className="flex-1 truncate text-[13px] text-white/85">{n}</span>
            <span className="text-[11px] text-white/40 font-code-sm">{files[n].length} o</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Flavour only — a workstation with no telemetry looks like a mock-up. */
function MonitorApp({ host }: { host: string }) {
  const bars = [
    { label: "Processeur", value: 12 },
    { label: "Mémoire", value: 41 },
    { label: "Réseau", value: 8 },
    { label: "Disque", value: 63 },
  ];
  return (
    <div className="h-full p-5 space-y-3.5 bg-[#0d1a12] text-[12px] text-white/75">
      <div className="text-white text-[13px]">{host}</div>
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between mb-1">
            <span>{b.label}</span>
            <span className="tabular-nums">{b.value}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${b.value}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-2 text-white/40">uptime 42 j · 1 session active</p>
    </div>
  );
}
