"use client";

import { useState } from "react";
import Icon from "../Icon";
import Terminal from "../shell/Terminal";
import WebOS, { type WebOSConfig } from "./WebOS";
import type { DossierData } from "./DossierApp";
import type { ShellConfig } from "@/lib/shell";

/**
 * Renders one piece of a case's evidence.
 *
 * SECURITY — every artifact body is authored by an admin and rendered as
 * **text**. Nothing here uses `dangerouslySetInnerHTML`, so a compromised admin
 * account cannot turn a case into script execution in every student's browser.
 * `image` artifacts must be same-origin or `data:` — the enforced CSP blocks
 * third-party hosts, and that is deliberate.
 */

export type Artifact = {
  _id: string;
  kind: "email" | "log" | "terminal" | "file" | "table" | "http" | "image" | "webos";
  label: string;
  content: string;
};

const KIND_ICON: Record<Artifact["kind"], string> = {
  email: "mail",
  log: "receipt_long",
  terminal: "terminal",
  file: "folder",
  table: "table_rows",
  http: "http",
  image: "image",
  webos: "desktop_windows",
};

/** Artifacts whose content is JSON. A malformed body must not blank the case. */
function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function CaseArtifact({
  artifact,
  dossier,
}: {
  artifact: Artifact;
  /** The case's questions — passed to the webOS so its Dossier app can answer. */
  dossier?: DossierData;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-3 border-b border-outline-variant/30 text-left"
      >
        <Icon name={KIND_ICON[artifact.kind]} className="text-secondary text-lg" />
        <span className="flex-1 font-label-mono text-label-mono uppercase tracking-wider text-on-surface">
          {artifact.label}
        </span>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          className="text-on-surface-variant text-lg"
        />
      </button>
      {open && <Body artifact={artifact} dossier={dossier} />}
    </div>
  );
}

function Body({ artifact, dossier }: { artifact: Artifact; dossier?: DossierData }) {
  switch (artifact.kind) {
    case "email":
      return <EmailBody content={artifact.content} />;
    case "log":
      return <LogBody content={artifact.content} />;
    case "terminal":
      return <TerminalBody content={artifact.content} />;
    case "table":
      return <TableBody content={artifact.content} />;
    case "file":
      return <FileBody content={artifact.content} />;
    case "image":
      return <ImageBody content={artifact.content} label={artifact.label} />;
    case "webos":
      return <WebOSBody content={artifact.content} dossier={dossier} />;
    case "http":
    default:
      return (
        <pre className="p-5 font-code-sm text-code-sm text-on-surface-variant whitespace-pre-wrap break-words overflow-x-auto">
          {artifact.content}
        </pre>
      );
  }
}

/**
 * An email: headers are the evidence, so they are shown collapsed but complete.
 * Format authored as `Header: value` lines, a blank line, then the body.
 */
function EmailBody({ content }: { content: string }) {
  const [showHeaders, setShowHeaders] = useState(false);
  const { headers, body } = (() => {
    const idx = content.indexOf("\n\n");
    if (idx === -1) return { headers: [] as [string, string][], body: content };
    const head = content.slice(0, idx).split("\n");
    const rest = content.slice(idx + 2);
    const parsed: [string, string][] = head.map((l) => {
      const c = l.indexOf(":");
      return c === -1 ? [l, ""] : [l.slice(0, c).trim(), l.slice(c + 1).trim()];
    });
    return { headers: parsed, body: rest };
  })();

  const primary = ["From", "To", "Subject", "Date", "Reply-To"];
  const shown = headers.filter(([k]) => primary.includes(k));
  const hidden = headers.filter(([k]) => !primary.includes(k));

  return (
    <div>
      <div className="px-5 py-4 border-b border-outline-variant/20 space-y-1">
        {shown.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[90px_1fr] gap-3 text-sm">
            <span className="font-label-mono text-label-mono uppercase text-on-surface-variant">
              {k}
            </span>
            <span className="text-on-surface break-all">{v}</span>
          </div>
        ))}
        {hidden.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHeaders(!showHeaders)}
            className="font-code-sm text-code-sm text-secondary hover:underline pt-2"
          >
            {showHeaders ? "Masquer" : "Afficher"} les en-têtes techniques ({hidden.length})
          </button>
        )}
        {showHeaders && (
          <pre className="mt-2 p-3 bg-surface-container-low rounded font-code-sm text-code-sm text-on-surface-variant whitespace-pre-wrap break-all overflow-x-auto">
            {hidden.map(([k, v]) => `${k}: ${v}`).join("\n")}
          </pre>
        )}
      </div>
      <div className="p-5 text-on-surface whitespace-pre-wrap break-words">{body}</div>
    </div>
  );
}

/** A log: line-numbered with a filter, because scanning is the skill. */
function LogBody({ content }: { content: string }) {
  const [filter, setFilter] = useState("");
  const lines = content.split("\n");
  const shown = filter
    ? lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  return (
    <div>
      <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center gap-2">
        <Icon name="search" className="text-on-surface-variant text-sm" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer les lignes…"
          spellCheck={false}
          className="flex-1 bg-transparent border-none outline-none font-code-sm text-code-sm text-on-surface"
        />
        <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
          {shown.length}/{lines.length}
        </span>
      </div>
      <div className="max-h-96 overflow-auto no-scrollbar bg-terminal">
        <pre className="p-4 font-code-sm text-code-sm text-on-terminal">
          {shown.map((l, i) => (
            <div key={i} className="hover:bg-on-terminal/5 px-1 whitespace-pre-wrap break-all">
              {l}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/**
 * A scoped shell. The case declares its own filesystem and command allow-list;
 * `@/lib/shell` guarantees nothing is evaluated and nothing reaches the network.
 */
function TerminalBody({ content }: { content: string }) {
  const cfg = (() => {
    const parsed = parseJson<Partial<ShellConfig>>(content, {});
    return {
      files: parsed.files ?? {},
      user: parsed.user ?? "analyste",
      host: parsed.host ?? "poste-soc",
      cwd: parsed.cwd ?? "/home/analyste",
      allowed: parsed.allowed,
    } satisfies ShellConfig;
  })();

  return (
    <div className="p-4">
      <Terminal
        config={cfg}
        height="h-[300px]"
        title={`${cfg.user}@${cfg.host}`}
        motd={[{ type: "system", text: "Tapez 'help' pour la liste des commandes disponibles." }]}
      />
    </div>
  );
}

/**
 * The full simulated desktop. Content is the same JSON as a `terminal`
 * artifact, plus optional `apps` and `openOnStart`.
 */
function WebOSBody({ content, dossier }: { content: string; dossier?: DossierData }) {
  const parsed = parseJson<Partial<WebOSConfig>>(content, {});
  const cfg: WebOSConfig = {
    files: parsed.files ?? {},
    user: parsed.user ?? "analyste",
    host: parsed.host ?? "poste-soc",
    cwd: parsed.cwd ?? "/home/analyste",
    allowed: parsed.allowed,
    apps: parsed.apps,
    openOnStart: parsed.openOnStart,
    incident: parsed.incident,
    dossier,
  };
  return <WebOS config={cfg} />;
}

/** A sortable table. Content is JSON: `{ columns: string[], rows: string[][] }`. */
function TableBody({ content }: { content: string }) {
  const data = parseJson<{ columns: string[]; rows: string[][] }>(content, {
    columns: [],
    rows: [],
  });
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);

  const rows = sort
    ? [...data.rows].sort(
        (a, b) => (a[sort.col] ?? "").localeCompare(b[sort.col] ?? "") * sort.dir,
      )
    : data.rows;

  if (data.columns.length === 0) {
    return <p className="p-5 font-code-sm text-code-sm text-error">Tableau illisible.</p>;
  }

  return (
    <div className="overflow-x-auto no-scrollbar max-h-96">
      <table className="w-full text-left">
        <thead className="sticky top-0">
          <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
            {data.columns.map((c, i) => (
              <th key={c} className="p-3">
                <button
                  type="button"
                  onClick={() =>
                    setSort((s) =>
                      s?.col === i ? { col: i, dir: s.dir === 1 ? -1 : 1 } : { col: i, dir: 1 },
                    )
                  }
                  className="hover:text-on-surface transition-colors inline-flex items-center gap-1"
                >
                  {c}
                  {sort?.col === i && (
                    <Icon
                      name={sort.dir === 1 ? "arrow_upward" : "arrow_downward"}
                      className="text-[12px]"
                    />
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-code-sm text-code-sm">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-outline-variant/20">
              {r.map((cell, j) => (
                <td key={j} className="p-3 text-on-surface-variant whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A file tree with preview. Content is JSON: `{ "path/name": "contents" }`. */
function FileBody({ content }: { content: string }) {
  const files = parseJson<Record<string, string>>(content, {});
  const names = Object.keys(files);
  const [selected, setSelected] = useState(names[0] ?? null);

  if (names.length === 0) {
    return <p className="p-5 font-code-sm text-code-sm text-error">Aucun fichier.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
      <div className="border-b sm:border-b-0 sm:border-r border-outline-variant/20 p-2 max-h-96 overflow-auto no-scrollbar">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSelected(n)}
            className={`w-full text-left px-3 py-2 rounded font-code-sm text-code-sm transition-colors ${
              selected === n
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <pre className="p-4 font-code-sm text-code-sm text-on-surface-variant whitespace-pre-wrap break-words max-h-96 overflow-auto no-scrollbar">
        {selected ? files[selected] : ""}
      </pre>
    </div>
  );
}

/**
 * A screenshot. Same-origin or `data:` only — the production CSP blocks other
 * hosts, so an external URL would render as a broken image rather than fail
 * silently. The note below says so, because an author needs to know.
 */
function ImageBody({ content, label }: { content: string; label: string }) {
  const src = content.trim();
  const external = /^https?:\/\//i.test(src) && !src.startsWith("/");
  return (
    <div className="p-4">
      {external ? (
        <p className="font-code-sm text-code-sm text-error">
          Image externe refusée par la politique de sécurité du site. Hébergez-la dans /public.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- author-supplied path or data URI; next/image needs a build-time known domain.
        <img src={src} alt={label} className="max-w-full rounded-lg border border-outline-variant/30" />
      )}
    </div>
  );
}
