"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import Terminal from "../shell/Terminal";
import type { ShellConfig } from "@/lib/shell";

/**
 * A simulated desktop: the case's whole environment in one panel.
 *
 * Nothing here emulates an operating system. It is a stage set built from
 * ordinary React, CSS and the shell in `@/lib/shell` — windows that drag, a
 * dock that launches apps, a file manager and a terminal that share one
 * in-memory filesystem. That is enough to feel like a workstation, and it costs
 * nothing per student.
 *
 * The briefing lives *inside* the environment, as `question.txt`, so a student
 * can re-read the assignment with `cat question.txt` or by opening it in the
 * file manager rather than scrolling away from the desktop.
 *
 * SECURITY: the terminal is the same registry-driven shell used everywhere
 * else — it evaluates nothing and makes no network call. The file manager
 * renders file bodies as text.
 */

export type WebOSConfig = ShellConfig & {
  /** Which dock apps to expose. Defaults to terminal + files + monitor. */
  apps?: AppId[];
  /** Files opened in a viewer as soon as the desktop boots. */
  openOnStart?: string[];
};

type AppId = "terminal" | "files" | "monitor";

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
  terminal: { title: "Terminal", icon: "terminal", w: 620, h: 380 },
  files: { title: "Fichiers", icon: "folder", w: 460, h: 320 },
  monitor: { title: "Moniteur", icon: "monitoring", w: 380, h: 260 },
};

export default function WebOS({ config }: { config: WebOSConfig }) {
  const apps = config.apps ?? ["terminal", "files", "monitor"];

  // One filesystem shared by the terminal and the file manager, so a file
  // written in one is visible in the other. Lazy state rather than a ref: the
  // object must survive re-renders, and reading a ref during render is unsafe.
  const [files] = useState(() => ({ ...config.files }));

  // The desktop boots with its windows already open. Computing them in the
  // state initialiser rather than in an effect avoids a first paint with an
  // empty desktop followed by a synchronous re-render.
  const [wins, setWins] = useState<Win[]>(() => {
    const initial: Win[] = [];
    let z = 10;
    if (apps.includes("terminal")) {
      initial.push({
        id: "terminal",
        app: "terminal",
        ...APP_META.terminal,
        x: 24,
        y: 56,
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
        x: 320 + i * 28,
        y: 150 + i * 28,
        w: 420,
        h: 300,
        z: z++,
        min: false,
        max: false,
      });
    }
    return initial;
  });
  const [top, setTop] = useState(20);
  const surfaceRef = useRef<HTMLDivElement>(null);

  function focus(id: string) {
    setTop((t) => t + 1);
    setWins((w) => w.map((x) => (x.id === id ? { ...x, z: top + 1, min: false } : x)));
  }

  function open(app: AppId | "text", file?: string) {
    const id = app === "text" ? `text:${file}` : app;
    const existing = wins.find((w) => w.id === id);
    if (existing) return focus(id);
    const meta =
      app === "text"
        ? { title: file ?? "Fichier", icon: "description", w: 440, h: 320 }
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
        x: 60 + (w.length % 5) * 30,
        y: 80 + (w.length % 5) * 26,
        w: meta.w,
        h: meta.h,
        z: top + 1,
        min: false,
        max: false,
      },
    ]);
  }

  function close(id: string) {
    setWins((w) => w.filter((x) => x.id !== id));
  }

  function patch(id: string, p: Partial<Win>) {
    setWins((w) => w.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  return (
    <div
      ref={surfaceRef}
      className="relative h-[620px] overflow-hidden bg-terminal select-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 15%, rgba(0,145,80,0.20), transparent 55%)," +
          "radial-gradient(circle at 80% 80%, rgba(0,145,80,0.10), transparent 50%)," +
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)," +
          "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 40px 40px, 40px 40px",
      }}
    >
      <TopBar user={config.user} host={config.host} />

      {wins
        .filter((w) => !w.min)
        .map((w) => (
          <Window
            key={w.id}
            win={w}
            bounds={surfaceRef}
            onFocus={() => focus(w.id)}
            onClose={() => close(w.id)}
            onMinimise={() => patch(w.id, { min: true })}
            onToggleMax={() => patch(w.id, { max: !w.max })}
            onMove={(x, y) => patch(w.id, { x, y })}
          >
            {w.app === "terminal" && (
              <Terminal
                config={{ ...config, files }}
                height="h-full"
                className="h-full border-0 shadow-none p-0"
                title={`${config.user}@${config.host}`}
                motd={[
                  { type: "system", text: "Session ouverte. 'help' liste les commandes." },
                  { type: "system", text: "Le dossier est dans question.txt — 'cat question.txt'." },
                ]}
              />
            )}
            {w.app === "files" && <FilesApp files={files} onOpen={(f) => open("text", f)} />}
            {w.app === "text" && (
              <pre className="p-4 h-full overflow-auto no-scrollbar font-code-sm text-code-sm text-on-terminal whitespace-pre-wrap break-words">
                {w.file ? (files[w.file] ?? "(fichier vide)") : ""}
              </pre>
            )}
            {w.app === "monitor" && <MonitorApp host={config.host} />}
          </Window>
        ))}

      <Dock
        apps={apps}
        wins={wins}
        onOpen={(a) => open(a)}
        onRestore={(id) => focus(id)}
      />
    </div>
  );
}

function TopBar({ user, host }: { user: string; host: string }) {
  const [clock, setClock] = useState("--:--");
  // Set after mount only: rendering a real clock on the server would mismatch.
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-x-0 top-0 h-9 z-[999] bg-terminal-bar/90 backdrop-blur border-b border-outline-variant/30 flex items-center px-3 gap-3">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="font-label-mono text-[11px] text-on-terminal uppercase tracking-wider">
        HeyOS
      </span>
      <span className="font-code-sm text-[11px] text-on-terminal/60">
        {user}@{host}
      </span>
      <div className="flex-1" />
      <span className="font-code-sm text-[11px] text-on-terminal/60">session chiffrée</span>
      <span className="font-code-sm text-[11px] text-on-terminal tabular-nums">{clock}</span>
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

  function onPointerDown(e: React.PointerEvent) {
    onFocus();
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const box = bounds.current?.getBoundingClientRect();
    const maxX = (box?.width ?? 1200) - 120;
    const maxY = (box?.height ?? 620) - 80;
    onMove(
      Math.max(0, Math.min(maxX, e.clientX - drag.current.dx)),
      Math.max(36, Math.min(maxY, e.clientY - drag.current.dy)),
    );
  }
  function stop(e: React.PointerEvent) {
    drag.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  const style: React.CSSProperties = win.max
    ? { left: 8, top: 44, width: "calc(100% - 16px)", height: "calc(100% - 96px)", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      className="absolute rounded-lg overflow-hidden border border-outline-variant/50 bg-terminal shadow-2xl flex flex-col"
      style={style}
      onMouseDown={onFocus}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onDoubleClick={onToggleMax}
        className="h-9 shrink-0 bg-terminal-bar flex items-center gap-2 px-3 cursor-grab active:cursor-grabbing border-b border-outline-variant/30"
      >
        <Icon name={win.icon} className="text-on-terminal/70 text-sm" />
        <span className="flex-1 font-label-mono text-[11px] text-on-terminal/80 truncate">
          {win.title}
        </span>
        <button
          type="button"
          aria-label="Réduire"
          onClick={onMinimise}
          className="w-3 h-3 rounded-full bg-secondary hover:brightness-125"
        />
        <button
          type="button"
          aria-label="Agrandir"
          onClick={onToggleMax}
          className="w-3 h-3 rounded-full bg-primary hover:brightness-125"
        />
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-error hover:brightness-125"
        />
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
    <div className="h-full overflow-auto no-scrollbar p-2">
      {names.length === 0 && (
        <p className="p-3 font-code-sm text-code-sm text-on-terminal/60">Répertoire vide.</p>
      )}
      {names.map((n) => (
        <button
          key={n}
          type="button"
          onDoubleClick={() => onOpen(n)}
          onClick={() => onOpen(n)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-left font-code-sm text-code-sm text-on-terminal/85 hover:bg-on-terminal/10 transition-colors"
        >
          <Icon
            name={n.endsWith(".log") ? "receipt_long" : "description"}
            className="text-primary text-base"
          />
          <span className="flex-1 truncate">{n}</span>
          <span className="text-on-terminal/40">{files[n].length} o</span>
        </button>
      ))}
    </div>
  );
}

/** Flavour only — a workstation with no telemetry panel looks like a mockup. */
function MonitorApp({ host }: { host: string }) {
  const bars = [
    { label: "CPU", value: 12 },
    { label: "MEM", value: 41 },
    { label: "NET", value: 8 },
    { label: "DSK", value: 63 },
  ];
  return (
    <div className="h-full p-4 space-y-3 font-code-sm text-code-sm text-on-terminal/80">
      <div className="text-on-terminal">{host}</div>
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between mb-1">
            <span>{b.label}</span>
            <span className="tabular-nums">{b.value}%</span>
          </div>
          <div className="h-1.5 bg-on-terminal/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${b.value}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-2 text-on-terminal/40">uptime 42j · 1 session active</p>
    </div>
  );
}

function Dock({
  apps,
  wins,
  onOpen,
  onRestore,
}: {
  apps: AppId[];
  wins: Win[];
  onOpen: (a: AppId) => void;
  onRestore: (id: string) => void;
}) {
  const minimised = wins.filter((w) => w.min);
  return (
    <div className="absolute inset-x-0 bottom-0 z-[999] h-14 bg-terminal-bar/90 backdrop-blur border-t border-outline-variant/30 flex items-center justify-center gap-2 px-3">
      {apps.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onOpen(a)}
          title={APP_META[a].title}
          className="w-10 h-10 rounded-lg bg-on-terminal/10 hover:bg-primary/25 flex items-center justify-center transition-colors"
        >
          <Icon name={APP_META[a].icon} className="text-on-terminal" />
        </button>
      ))}
      {minimised.length > 0 && <div className="w-px h-7 bg-outline-variant/40 mx-1" />}
      {minimised.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onRestore(w.id)}
          title={w.title}
          className="h-10 px-3 rounded-lg bg-on-terminal/10 hover:bg-primary/25 flex items-center gap-2 transition-colors font-code-sm text-code-sm text-on-terminal/80"
        >
          <Icon name={w.icon} className="text-sm" />
          <span className="max-w-24 truncate">{w.title}</span>
        </button>
      ))}
    </div>
  );
}
