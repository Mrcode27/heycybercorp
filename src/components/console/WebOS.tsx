"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Icon from "../Icon";
import Terminal from "../shell/Terminal";
import DossierApp, { type DossierData } from "./DossierApp";
import type { ShellConfig } from "@/lib/shell";
import styles from "./WebOS.module.css";

/** Safe, client-side Linux workstation simulation for scenario labs. */
export type WebOSConfig = ShellConfig & {
  apps?: AppId[];
  openOnStart?: string[];
  dossier?: DossierData;
  incident?: string;
};

type AppId = "dossier" | "terminal" | "files" | "monitor";
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

const APP_META: Record<AppId, { title: string; icon: string; w: number; h: number; tone: string }> = {
  dossier: { title: "Centre d’investigation", icon: "folder_shared", w: 660, h: 590, tone: "#4ade80" },
  terminal: { title: "Terminal", icon: "terminal", w: 760, h: 470, tone: "#22d3ee" },
  files: { title: "Fichiers", icon: "folder", w: 690, h: 470, tone: "#fbbf24" },
  monitor: { title: "Télémétrie système", icon: "monitoring", w: 510, h: 420, tone: "#c084fc" },
};

const BOOT_LINES: { text: string; status?: "ok" | "info"; delay: number }[] = [
  { text: "HCC Secure Workstation 24.08 LTS", status: "info", delay: 130 },
  { text: "Linux 6.8.0-hcc-amd64 · x86_64 · Secure Boot active", delay: 100 },
  { text: "Chargement de l’image analyste en mémoire", status: "ok", delay: 120 },
  { text: "Montage de /evidence en lecture seule", status: "ok", delay: 110 },
  { text: "Initialisation de systemd-journald", status: "ok", delay: 90 },
  { text: "Activation de NetworkManager", status: "ok", delay: 105 },
  { text: "Démarrage du collecteur SIEM", status: "ok", delay: 120 },
  { text: "Démarrage de la sonde de détection", status: "ok", delay: 110 },
  { text: "Vérification de l’intégrité des pièces", status: "ok", delay: 135 },
  { text: "Chargement de l’espace de travail du dossier", status: "ok", delay: 130 },
  { text: "Isolation réseau du laboratoire confirmée", status: "ok", delay: 125 },
  { text: "Ouverture du gestionnaire de session", status: "ok", delay: 250 },
];

const DEFAULT_APPS: AppId[] = ["terminal", "files", "monitor"];

function normaliseApps(config: WebOSConfig): AppId[] {
  const declared = config.apps?.filter((app): app is AppId => app in APP_META) ?? DEFAULT_APPS;
  const apps = [...new Set(declared)];
  // Older case JSON predates the Dossier app. Dossier data is authoritative.
  if (config.dossier && !apps.includes("dossier")) apps.unshift("dossier");
  return apps;
}

export default function WebOS({ config }: { config: WebOSConfig }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const enteredFullscreen = useRef(false);

  const quit = useCallback(async () => {
    enteredFullscreen.current = false;
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The browser may already be leaving fullscreen after Escape.
      }
    }
    setPhase("idle");
  }, []);

  async function launch() {
    setPhase("boot");
    const el = rootRef.current;
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen();
        enteredFullscreen.current = true;
      } catch {
        // Fixed positioning is the supported embedded-browser fallback.
      }
    }
  }

  useEffect(() => {
    const handleFullscreen = () => {
      if (enteredFullscreen.current && !document.fullscreenElement) {
        enteredFullscreen.current = false;
        setPhase("idle");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  return (
    <div ref={rootRef} className={phase === "idle" ? styles.host : styles.fullscreenHost}>
      {phase === "idle" ? (
        <LaunchCard config={config} onLaunch={launch} />
      ) : (
        <Session config={config} phase={phase} setPhase={setPhase} onQuit={quit} />
      )}
    </div>
  );
}

function LaunchCard({ config, onLaunch }: { config: WebOSConfig; onLaunch: () => void }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const fileCount = Object.keys(config.files).length;
  const caseTitle = config.dossier?.title ?? config.incident ?? "Environnement d’analyse";
  return (
    <section className={styles.launchCard} aria-label="Lancer le poste Linux simulé">
      <div className={styles.launchGlow} />
      <div className={styles.launchContent}>
        <div className={styles.launchEyebrow}>
          <span className={styles.liveDot} /> LAB ENVIRONMENT · READY
        </div>
        <div className={styles.launchMark}><Icon name="deployed_code" className="text-[34px]" fill /></div>
        <p className={styles.launchKicker}>HCC SECURE WORKSTATION</p>
        <h3 className={styles.launchTitle}>{caseTitle}</h3>
        <p className={styles.launchCopy}>
          Un poste Linux isolé, préparé pour l’investigation. Analysez les pièces,
          interrogez les journaux et rendez votre décision depuis la machine.
        </p>

        <div className={styles.specGrid}>
          <Spec icon="dns" label="Hôte" value={config.host} />
          <Spec icon="person" label="Session" value={config.user} />
          <Spec icon="inventory_2" label="Pièces" value={String(fileCount).padStart(2, "0")} />
          <Spec icon="shield_lock" label="Réseau" value="ISOLÉ" positive />
        </div>

        <button type="button" onClick={() => setGuideOpen(true)} className={styles.launchButton}>
          <span className={styles.launchButtonIcon}><Icon name="menu_book" className="text-[20px]" /></span>
          <span><strong>Lire le manuel et démarrer</strong><small>Prise en main · puis plein écran</small></span>
          <Icon name="arrow_forward" className="ml-auto text-[18px]" />
        </button>
        <p className={styles.launchFootnote}>
          Simulation locale sécurisée · aucune commande n’est exécutée sur votre appareil
        </p>
      </div>

      <div className={styles.launchPreview} aria-hidden="true">
        <div className={styles.previewTopbar}>
          <span>Activités</span><span>03:14</span><span className={styles.previewStatus}>● ● ●</span>
        </div>
        <div className={styles.previewWallpaper}>
          <div className={styles.previewBadge}>HCC / SOC</div>
          <div className={styles.previewWindow}>
            <div className={styles.previewWindowBar}>
              <span className={styles.previewWindowIcon}>›_</span>
              analyste@{config.host}
              <span>— □ ×</span>
            </div>
            <div className={styles.previewTerminal}>
              <span className={styles.previewGreen}>analyste@{config.host}</span>:~$ grep Accepted auth.log<br />
              <span>Mar 12 03:12:48 sshd[2240]: Accepted password...</span><br />
              <span className={styles.previewGreen}>analyste@{config.host}</span>:~$ <i />
            </div>
          </div>
          <div className={styles.previewDock}>
            {normaliseApps(config).map((app) => (
              <span key={app} style={{ "--app-tone": APP_META[app].tone } as CSSProperties}>
                <Icon name={APP_META[app].icon} className="text-[17px]" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {guideOpen && (
        <WorkstationGuide
          caseTitle={caseTitle}
          host={config.host}
          onBack={() => setGuideOpen(false)}
          onContinue={onLaunch}
        />
      )}
    </section>
  );
}

function WorkstationGuide({ caseTitle, host, onBack, onContinue, inSession = false }: {
  caseTitle: string;
  host: string;
  onBack: () => void;
  onContinue?: () => void;
  inSession?: boolean;
}) {
  return (
    <div className={`${styles.guideOverlay} ${inSession ? styles.guideInSession : ""}`} role="dialog" aria-modal="true" aria-label="Manuel du poste WebOS">
      <div className={styles.guidePanel}>
        <header className={styles.guideHeader}>
          <div className={styles.guideBrand}><Icon name="shield_lock" fill /><span>HCC LAB OPERATIONS</span></div>
          <span className={styles.guideEdition}>GUIDE / 01</span>
        </header>

        <div className={styles.guideIntro}>
          <div className={styles.guideIcon}><Icon name="menu_book" /></div>
          <div><p>MANUEL DE PRISE EN MAIN</p><h2>Avant d’ouvrir le poste</h2><span>{caseTitle} · {host}</span></div>
        </div>

        <div className={styles.guideSteps}>
          <GuideStep number="01" icon="folder_shared" title="Commencez par le Dossier">
            Lisez la mission et les objectifs. Chaque réponse validée y fait avancer votre score sans quitter le bureau.
          </GuideStep>
          <GuideStep number="02" icon="terminal" title="Analysez les pièces">
            Les applications Fichiers et Terminal consultent les mêmes preuves. Utilisez <kbd>ls</kbd>, <kbd>cat</kbd> et <kbd>grep</kbd> pour enquêter.
          </GuideStep>
          <GuideStep number="03" icon="mouse" title="Travaillez comme sur Linux">
            Double-cliquez sur une pièce pour l’ouvrir. Déplacez les fenêtres par leur barre et faites un clic droit sur le bureau pour les actions rapides.
          </GuideStep>
        </div>

        <div className={styles.guideControls}>
          <div><kbd>CLIC</kbd><span>sélectionner</span></div>
          <div><kbd>2× CLIC</kbd><span>ouvrir</span></div>
          <div><kbd>CLIC DROIT</kbd><span>menu d’actions</span></div>
          <div><kbd>ESC</kbd><span>quitter le poste</span></div>
        </div>

        <div className={styles.guideSafety}><Icon name="verified_user" /><span><strong>Simulation sécurisée</strong> Toutes les commandes et toutes les preuves restent dans ce laboratoire en lecture seule.</span></div>

        <footer className={styles.guideActions}>
          {!inSession && <button type="button" onClick={onBack}><Icon name="arrow_back" /> Retour</button>}
          <button type="button" onClick={onContinue ?? onBack} className={styles.guideContinue}>
            {inSession ? "Retourner au bureau" : "J’ai compris · démarrer"}<Icon name={inSession ? "desktop_windows" : "power_settings_new"} />
          </button>
        </footer>
      </div>
    </div>
  );
}

function GuideStep({ number, icon, title, children }: { number: string; icon: string; title: string; children: ReactNode }) {
  return (
    <article className={styles.guideStep}>
      <span className={styles.guideNumber}>{number}</span>
      <div className={styles.guideStepIcon}><Icon name={icon} /></div>
      <div><h3>{title}</h3><p>{children}</p></div>
    </article>
  );
}

function Spec({ icon, label, value, positive = false }: { icon: string; label: string; value: string; positive?: boolean }) {
  return (
    <div className={styles.spec}>
      <Icon name={icon} className={styles.specIcon} />
      <span><small>{label}</small><strong className={positive ? styles.positive : ""}>{value}</strong></span>
    </div>
  );
}

function Session({ config, phase, setPhase, onQuit }: {
  config: WebOSConfig;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  onQuit: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (phase === "desktop") return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onQuit(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onQuit, phase]);

  return (
    <div className={styles.session}>
      {phase === "boot" && <BootScreen host={config.host} onDone={() => setPhase("login")} />}
      {phase === "login" && <LoginScreen user={config.user} host={config.host} onEnter={() => setPhase("desktop")} />}
      {phase === "desktop" && <Desktop config={config} onQuit={onQuit} />}
    </div>
  );
}

function BootScreen({ host, onDone }: { host: string; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const completed = Math.min(shown, BOOT_LINES.length);
  const percent = Math.round((completed / BOOT_LINES.length) * 100);

  useEffect(() => {
    if (shown >= BOOT_LINES.length) {
      const timer = window.setTimeout(onDone, 520);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setShown((value) => value + 1), BOOT_LINES[shown].delay);
    return () => window.clearTimeout(timer);
  }, [onDone, shown]);

  return (
    <div className={styles.bootScreen}>
      <div className={styles.bootNoise} />
      <div className={styles.bootShell}>
        <div className={styles.bootHeader}>
          <div className={styles.bootLogo}><Icon name="shield_lock" className="text-[24px]" fill /></div>
          <div><strong>heycybercorp</strong><span>Secure Lab Runtime</span></div>
          <div className={styles.bootMeta}><span>NODE</span><strong>{host.toUpperCase()}</strong></div>
        </div>

        <div className={styles.bootBody}>
          <div className={styles.bootConsole}>
            <div className={styles.bootConsoleTop}><span>INITIALISATION</span><span>{String(completed).padStart(2, "0")}/{BOOT_LINES.length}</span></div>
            <div className={styles.bootLines} aria-live="polite">
              {BOOT_LINES.slice(0, shown).map((line, index) => (
                <div key={`${line.text}-${index}`} className={styles.bootLine}>
                  <span className={line.status === "ok" ? styles.bootOk : styles.bootTime}>
                    {line.status === "ok" ? "[  OK  ]" : `[${String(index).padStart(2, "0")}.0${index}]`}
                  </span>
                  <span>{line.text}</span>
                </div>
              ))}
              {shown < BOOT_LINES.length && <span className={styles.bootCursor} />}
            </div>
          </div>

          <aside className={styles.bootAside}>
            <div className={styles.bootRing} style={{ "--progress": `${percent * 3.6}deg` } as CSSProperties}>
              <div><strong>{percent}%</strong><span>prêt</span></div>
            </div>
            <div className={styles.bootChecks}>
              <p><Icon name="verified_user" /> Environnement isolé</p>
              <p><Icon name="lock" /> Pièces en lecture seule</p>
              <p><Icon name="lan" /> Réseau simulé</p>
            </div>
          </aside>
        </div>

        <div className={styles.bootProgress}><span style={{ width: `${percent}%` }} /></div>
        <div className={styles.bootFooter}>
          <span>ESC · quitter</span>
          <button type="button" onClick={onDone}>Passer l’initialisation <Icon name="arrow_forward" /></button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ user, host, onEnter }: { user: string; host: string; onEnter: () => void }) {
  const clock = useClock();
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") onEnter(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onEnter]);

  return (
    <div className={styles.loginScreen}>
      <WallpaperDecor />
      <div className={styles.loginTop}>
        <div className={styles.osBrand}><Icon name="shield_lock" fill /> HCC Workstation</div>
        <div className={styles.loginIndicators}><Icon name="network_wifi" /><Icon name="volume_up" /><Icon name="battery_full" /></div>
      </div>
      <div className={styles.loginClock}><strong>{clock.time}</strong><span>{clock.longDate}</span></div>
      <button type="button" onClick={onEnter} className={styles.loginCard} aria-label="Ouvrir la session analyste">
        <div className={styles.avatar}><Icon name="person" fill /></div>
        <div className={styles.loginIdentity}><strong>{user}</strong><span>{user}@{host}</span></div>
        <div className={styles.loginAction}><Icon name="arrow_forward" /></div>
        <p><span className={styles.liveDot} /> Session d’investigation prête</p>
      </button>
      <p className={styles.loginHint}>Cliquez sur le profil ou appuyez sur Entrée</p>
      <div className={styles.loginBottom}>LAB-SEGMENT-04 · environnement surveillé</div>
    </div>
  );
}

function useClock() {
  const [value, setValue] = useState({ time: "--:--", shortDate: "", longDate: "" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setValue({
        time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        shortDate: now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        longDate: now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      });
    };
    tick();
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, []);
  return value;
}

function WallpaperDecor() {
  return (
    <div className={styles.wallpaperDecor} aria-hidden="true">
      <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
      <div className={styles.wallpaperGrid} /><div className={styles.wallpaperMonogram}>HCC</div>
    </div>
  );
}

function Desktop({ config, onQuit }: { config: WebOSConfig; onQuit: () => void }) {
  const apps = useMemo(() => normaliseApps(config), [config]);
  const clock = useClock();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [files] = useState(() => ({ ...config.files }));
  const nextZ = useRef(40);
  const [overview, setOverview] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file?: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [wins, setWins] = useState<Win[]>(() => {
    const initial: Win[] = [];
    let z = 20;
    if (config.dossier) initial.push({ id: "dossier", app: "dossier", ...APP_META.dossier, x: 118, y: 74, z: z++, min: false, max: false });
    if (apps.includes("terminal")) initial.push({ id: "terminal", app: "terminal", ...APP_META.terminal, x: 570, y: 145, z: z++, min: false, max: false });
    if (!config.dossier) {
      for (const [index, name] of (config.openOnStart ?? []).entries()) {
        if (!(name in config.files)) continue;
        initial.push({ id: `text:${name}`, app: "text", title: name, icon: "description", file: name, x: 150 + index * 34, y: 100 + index * 30, w: 620, h: 470, z: z++, min: false, max: false });
      }
    }
    return initial;
  });

  const solved = config.dossier?.steps.filter((step) => step.solved).length ?? 0;
  const total = config.dossier?.steps.length ?? 0;

  const focus = useCallback((id: string) => {
    const z = ++nextZ.current;
    setWins((current) => current.map((win) => win.id === id ? { ...win, z, min: false } : win));
  }, []);

  const open = useCallback((app: AppId | "text", file?: string) => {
    setContextMenu(null);
    setOverview(false);
    const id = app === "text" ? `text:${file}` : app;
    const current = wins.find((win) => win.id === id);
    if (current) { focus(id); return; }
    const meta = app === "text" ? { title: file ?? "Document", icon: "description", w: 650, h: 500 } : APP_META[app];
    const z = ++nextZ.current;
    setWins((items) => [
      ...items,
      { id, app, file, title: meta.title, icon: meta.icon, x: 132 + (items.length % 5) * 38, y: 76 + (items.length % 5) * 32, w: meta.w, h: meta.h, z, min: false, max: false },
    ]);
  }, [focus, wins]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (contextMenu) { setContextMenu(null); return; }
        if (guideOpen) { setGuideOpen(false); return; }
        if (exitOpen) { setExitOpen(false); return; }
        setOverview(false);
        setExitOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [contextMenu, exitOpen, guideOpen]);

  const showContextMenu = useCallback((event: ReactMouseEvent, file?: string) => {
    event.preventDefault();
    event.stopPropagation();
    const bounds = surfaceRef.current?.getBoundingClientRect();
    const rawX = event.clientX - (bounds?.left ?? 0);
    const rawY = event.clientY - (bounds?.top ?? 0);
    setContextMenu({
      x: Math.max(10, Math.min(rawX, (bounds?.width ?? window.innerWidth) - 252)),
      y: Math.max(44, Math.min(rawY, (bounds?.height ?? window.innerHeight) - 310)),
      file,
    });
  }, []);

  const patch = (id: string, change: Partial<Win>) =>
    setWins((items) => items.map((win) => win.id === id ? { ...win, ...change } : win));

  return (
    <div
      ref={surfaceRef}
      className={styles.desktop}
      onContextMenu={(event) => showContextMenu(event)}
      onPointerDown={(event) => {
        if (contextMenu && !(event.target as HTMLElement).closest("[data-context-menu]")) setContextMenu(null);
      }}
    >
      <WallpaperDecor />
      <header className={styles.topbar}>
        <button type="button" onClick={() => setOverview((value) => !value)} className={overview ? styles.topbarActive : ""}>
          <span className={styles.brandGlyph}><Icon name="shield_lock" fill /></span> Activités
        </button>
        <div className={styles.workspaceLabel}><span /> INCIDENT WORKSPACE</div>
        <button type="button" className={styles.topClock}>{clock.time}<span>{clock.shortDate}</span></button>
        <div className={styles.topStatus}>
          <span className={styles.securePill}><Icon name="shield_lock" /> ISOLÉ</span>
          <Icon name="network_wifi" /><Icon name="volume_up" /><Icon name="battery_full" />
          <button type="button" onClick={() => setExitOpen(true)} aria-label="Quitter le poste"><Icon name="power_settings_new" /></button>
        </div>
      </header>

      <aside className={styles.caseWidget}>
        <div className={styles.caseWidgetTop}><span className={styles.liveDot} /> DOSSIER ACTIF</div>
        <strong>{config.dossier?.title ?? config.incident ?? "Session d’analyse"}</strong>
        <p>{config.host} · {Object.keys(files).length} pièces montées</p>
        {total > 0 && <><div className={styles.widgetProgress}><span style={{ width: `${Math.round((solved / total) * 100)}%` }} /></div><small>{solved}/{total} objectifs validés</small></>}
      </aside>

      <div className={styles.desktopFiles}>
        {Object.keys(files).slice(0, 7).map((name) => (
          <button key={name} type="button" onClick={() => setSelectedFile(name)} onDoubleClick={() => open("text", name)} onContextMenu={(event) => { setSelectedFile(name); showContextMenu(event, name); }} className={selectedFile === name ? styles.desktopFileSelected : ""}>
            <span className={styles.fileIcon}><Icon name={name.endsWith(".log") ? "receipt_long" : name.endsWith(".csv") ? "table_view" : "description"} /></span>
            <span>{name}</span>
          </button>
        ))}
      </div>

      <nav className={styles.dock} aria-label="Applications">
        <div className={styles.dockBrand}><Icon name="deployed_code" fill /></div><div className={styles.dockDivider} />
        {apps.map((app) => {
          const running = wins.some((win) => win.id === app);
          return (
            <button key={app} type="button" onClick={() => open(app)} title={APP_META[app].title} style={{ "--app-tone": APP_META[app].tone } as CSSProperties} className={running ? styles.dockRunning : ""}>
              <Icon name={APP_META[app].icon} /><span className={styles.dockTooltip}>{APP_META[app].title}</span>
            </button>
          );
        })}
        <div className={styles.dockDivider} />
        <button type="button" onClick={() => setOverview((value) => !value)} title="Toutes les fenêtres"><Icon name="grid_view" /><span className={styles.dockTooltip}>Toutes les fenêtres</span></button>
      </nav>

      {wins.filter((win) => !win.min).map((win) => (
        <Window key={win.id} win={win} bounds={surfaceRef} onFocus={() => focus(win.id)} onClose={() => setWins((items) => items.filter((item) => item.id !== win.id))} onMinimise={() => patch(win.id, { min: true })} onToggleMax={() => patch(win.id, { max: !win.max })} onMove={(x, y) => patch(win.id, { x, y })}>
          {win.app === "terminal" && (
            <Terminal config={{ ...config, files }} filesystem={files} height="h-full" className="h-full border-0 shadow-none rounded-none p-0" title={`${config.user}@${config.host} — hccsh`} motd={[
              { type: "system", text: `HCC Secure Shell · session isolée sur ${config.host}` },
              { type: "system", text: "Tapez 'help' pour les commandes autorisées. Le dossier se trouve dans l’application verte." },
            ]} />
          )}
          {win.app === "files" && <FilesApp files={files} onOpen={(file) => open("text", file)} />}
          {win.app === "text" && <TextApp file={win.file} body={win.file ? files[win.file] ?? "" : ""} />}
          {win.app === "monitor" && <MonitorApp host={config.host} />}
          {win.app === "dossier" && config.dossier && <DossierApp dossier={config.dossier} />}
        </Window>
      ))}

      {overview && (
        <div className={styles.overview} onClick={() => setOverview(false)}>
          <div className={styles.overviewHeader}><span>Vue d’ensemble</span><small>{wins.length} fenêtre{wins.length > 1 ? "s" : ""} · cliquez pour reprendre</small></div>
          <div className={styles.overviewGrid}>
            {wins.map((win) => (
              <button key={win.id} type="button" onClick={(event) => { event.stopPropagation(); focus(win.id); setOverview(false); }}>
                <span className={styles.overviewPreview} style={{ "--app-tone": win.app === "text" ? "#fbbf24" : APP_META[win.app].tone } as CSSProperties}><Icon name={win.icon} /><i /><i /><i /></span>
                <strong>{win.title}</strong><small>{win.min ? "Réduite" : "Ouverte"}</small>
              </button>
            ))}
            {wins.length === 0 && <p>Aucune fenêtre ouverte. Utilisez le dock à gauche.</p>}
          </div>
        </div>
      )}

      {wins.some((win) => win.min) && (
        <div className={styles.minimisedTray}>{wins.filter((win) => win.min).map((win) => <button key={win.id} type="button" onClick={() => focus(win.id)}><Icon name={win.icon} /><span>{win.title}</span></button>)}</div>
      )}
      <div className={styles.escapeHint}><kbd>CLIC DROIT</kbd><span>actions</span><i /><kbd>ESC</kbd><span>quitter</span></div>

      {contextMenu && (
        <div data-context-menu className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }} role="menu" aria-label={contextMenu.file ? `Actions pour ${contextMenu.file}` : "Actions du bureau"}>
          <div className={styles.contextHeader}><span>{contextMenu.file ? "PIÈCE SÉLECTIONNÉE" : "HCC WORKSTATION"}</span><small>{contextMenu.file ?? config.host}</small></div>
          {contextMenu.file ? (
            <>
              <button type="button" role="menuitem" onClick={() => open("text", contextMenu.file)}><Icon name="open_in_new" /><span><strong>Ouvrir</strong><small>Visionneuse sécurisée</small></span></button>
              {apps.includes("files") && <button type="button" role="menuitem" onClick={() => open("files")}><Icon name="folder" /><span><strong>Afficher dans Fichiers</strong><small>/evidence</small></span></button>}
              <button type="button" role="menuitem" onClick={() => { void navigator.clipboard?.writeText(contextMenu.file ?? ""); setContextMenu(null); }}><Icon name="content_copy" /><span><strong>Copier le nom</strong><small>{contextMenu.file}</small></span></button>
            </>
          ) : (
            <>
              {config.dossier && <button type="button" role="menuitem" onClick={() => open("dossier")}><Icon name="folder_shared" /><span><strong>Ouvrir le Dossier</strong><small>Mission et objectifs</small></span></button>}
              {apps.includes("terminal") && <button type="button" role="menuitem" onClick={() => open("terminal")}><Icon name="terminal" /><span><strong>Nouveau terminal</strong><small>HCC Secure Shell</small></span></button>}
              {apps.includes("files") && <button type="button" role="menuitem" onClick={() => open("files")}><Icon name="folder" /><span><strong>Ouvrir Fichiers</strong><small>/evidence</small></span></button>}
              {apps.includes("monitor") && <button type="button" role="menuitem" onClick={() => open("monitor")}><Icon name="monitoring" /><span><strong>Télémétrie système</strong><small>État du laboratoire</small></span></button>}
              <div className={styles.contextDivider} />
              <button type="button" role="menuitem" onClick={() => { setSelectedFile(null); setContextMenu(null); }}><Icon name="refresh" /><span><strong>Actualiser le bureau</strong><small>Réinitialiser la sélection</small></span></button>
            </>
          )}
          <div className={styles.contextDivider} />
          <button type="button" role="menuitem" onClick={() => { setContextMenu(null); setGuideOpen(true); }}><Icon name="menu_book" /><span><strong>Manuel du poste</strong><small>Commandes et navigation</small></span></button>
          <button type="button" role="menuitem" onClick={() => { setContextMenu(null); setExitOpen(true); }} className={styles.contextDanger}><Icon name="power_settings_new" /><span><strong>Quitter l’environnement</strong><small>Progression conservée</small></span></button>
        </div>
      )}

      {guideOpen && <WorkstationGuide caseTitle={config.dossier?.title ?? config.incident ?? "Session d’analyse"} host={config.host} onBack={() => setGuideOpen(false)} inSession />}

      {exitOpen && (
        <div className={styles.exitOverlay} role="dialog" aria-modal="true" aria-label="Quitter le poste">
          <div className={styles.exitCard}>
            <div className={styles.exitIcon}><Icon name="power_settings_new" /></div>
            <p>SESSION D’ANALYSE</p><h2>Quitter le poste sécurisé ?</h2>
            <span>Votre progression validée est conservée. L’état des fenêtres sera réinitialisé.</span>
            <div><button type="button" onClick={() => setExitOpen(false)}>Reprendre</button><button type="button" onClick={onQuit}>Quitter l’environnement</button></div>
            <small>Appuyez de nouveau sur Échap pour reprendre</small>
          </div>
        </div>
      )}
    </div>
  );
}

function Window({ win, bounds, children, onFocus, onClose, onMinimise, onToggleMax, onMove }: {
  win: Win;
  bounds: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimise: () => void;
  onToggleMax: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (win.max) return;
    onFocus();
    drag.current = { dx: event.clientX - win.x, dy: event.clientY - win.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || win.max) return;
    const box = bounds.current?.getBoundingClientRect();
    onMove(
      Math.max(76, Math.min((box?.width ?? 1440) - 220, event.clientX - drag.current.dx)),
      Math.max(42, Math.min((box?.height ?? 900) - 100, event.clientY - drag.current.dy)),
    );
  }
  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const style: CSSProperties = win.max
    ? { left: 86, top: 46, width: "calc(100% - 104px)", height: "calc(100% - 64px)", zIndex: win.z }
    : { left: win.x, top: win.y, width: `min(${win.w}px, calc(100vw - 112px))`, height: `min(${win.h}px, calc(100vh - 94px))`, zIndex: win.z };

  return (
    <section className={styles.window} style={style} onMouseDown={onFocus} aria-label={win.title}>
      <div className={styles.windowBar} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onDoubleClick={onToggleMax}>
        <div className={styles.windowAppIcon}><Icon name={win.icon} /></div>
        <div className={styles.windowTitle}><strong>{win.title}</strong><span>{win.app === "terminal" ? "session isolée" : "HCC Workstation"}</span></div>
        <div className={styles.windowControls} onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onMinimise} aria-label="Réduire"><Icon name="remove" /></button>
          <button type="button" onClick={onToggleMax} aria-label={win.max ? "Restaurer" : "Agrandir"}><Icon name={win.max ? "filter_none" : "crop_square"} /></button>
          <button type="button" onClick={onClose} aria-label="Fermer" className={styles.closeButton}><Icon name="close" /></button>
        </div>
      </div>
      <div className={styles.windowBody}>{children}</div>
    </section>
  );
}

function FilesApp({ files, onOpen }: { files: Record<string, string>; onOpen: (name: string) => void }) {
  const names = Object.keys(files);
  const [selected, setSelected] = useState(names[0] ?? null);
  return (
    <div className={styles.filesApp}>
      <aside>
        <p>EMPLACEMENTS</p>
        <button type="button" className={styles.fileNavActive}><Icon name="home" /> Dossier personnel</button>
        <button type="button"><Icon name="folder_shared" /> Pièces du dossier</button>
        <button type="button"><Icon name="schedule" /> Récents</button>
        <p>VOLUMES</p><button type="button"><Icon name="lock" /> evidence-ro</button>
        <div className={styles.storage}><span><i style={{ width: "31%" }} /></span><small>2,4 Go libres</small></div>
      </aside>
      <main>
        <div className={styles.filesToolbar}>
          <div><button type="button"><Icon name="arrow_back" /></button><button type="button"><Icon name="arrow_forward" /></button></div>
          <span><Icon name="home" /> / home / analyste / dossier</span><button type="button"><Icon name="search" /></button>
        </div>
        <div className={styles.fileHeader}><span>Nom</span><span>Taille</span><span>Type</span></div>
        <div className={styles.fileRows}>
          {names.map((name) => (
            <button key={name} type="button" onClick={() => setSelected(name)} onDoubleClick={() => onOpen(name)} className={selected === name ? styles.fileRowSelected : ""}>
              <span><Icon name={name.endsWith(".log") ? "receipt_long" : name.endsWith(".csv") ? "table_view" : "description"} /> {name}</span>
              <span>{files[name].length} o</span><span>{name.split(".").pop()?.toUpperCase() ?? "FICHIER"}</span>
            </button>
          ))}
        </div>
        <footer>{names.length} élément{names.length > 1 ? "s" : ""} · volume monté en lecture seule</footer>
      </main>
    </div>
  );
}

function TextApp({ file, body }: { file?: string; body: string }) {
  const lines = body.split("\n");
  return (
    <div className={styles.textApp}>
      <div className={styles.textToolbar}>
        <span><Icon name="lock" /> Lecture seule</span><strong>{file ?? "Document sans titre"}</strong>
        <div><button type="button"><Icon name="search" /></button><button type="button"><Icon name="more_vert" /></button></div>
      </div>
      <div className={styles.textDocument}>
        <div className={styles.lineNumbers}>{lines.map((_, index) => <span key={index}>{index + 1}</span>)}</div>
        <pre>{body || "(fichier vide)"}</pre>
      </div>
      <footer>UTF-8 · LF · {lines.length} lignes</footer>
    </div>
  );
}

function MonitorApp({ host }: { host: string }) {
  const metrics = [
    { label: "Processeur", value: 18, icon: "memory", tone: "#22d3ee" },
    { label: "Mémoire", value: 43, icon: "developer_board", tone: "#4ade80" },
    { label: "Stockage", value: 31, icon: "hard_drive", tone: "#fbbf24" },
  ];
  return (
    <div className={styles.monitorApp}>
      <div className={styles.monitorHero}>
        <div><span className={styles.liveDot} /> SYSTÈME NOMINAL</div><strong>{host}</strong>
        <p>HeyOS 24.08 · noyau 6.8.0-hcc · uptime 00:18:42</p>
      </div>
      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{ "--metric": metric.tone } as CSSProperties}>
            <Icon name={metric.icon} /><span>{metric.label}</span><strong>{metric.value}%</strong>
            <i><b style={{ width: `${metric.value}%` }} /></i>
          </div>
        ))}
      </div>
      <div className={styles.processTable}>
        <div><span>PROCESSUS</span><span>PID</span><span>CPU</span></div>
        <p><span>siem-collector</span><span>1042</span><span>3.2%</span></p>
        <p><span>ids-sensor</span><span>1088</span><span>1.8%</span></p>
        <p><span>hccsh</span><span>1337</span><span>0.4%</span></p>
      </div>
    </div>
  );
}
