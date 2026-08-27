"use client";

import { useEffect, useRef, useState } from "react";

type Line = { type: "input" | "output" | "system" | "error"; text: string };

// A small simulated filesystem for the training node.
const FILES: Record<string, string> = {
  "README.txt":
    "Bienvenue sur le noeud d'entrainement heycybercorp.\nTapez 'help' pour lister les commandes disponibles.",
  "intrusion_testing.sh":
    "#!/bin/bash\n# Module 01 - Test d'intrusion\necho 'Scan des ports en cours...'\nnmap -sV target.local",
  "soc_operations.py":
    "# Module 02 - SOC & detection\nfrom siem import analyze\nanalyze('/var/log/auth.log')  # detection d'anomalies",
  "crypto_analysis.c":
    "/* Module 03 - Cryptographie */\nint main() {\n  aes_decrypt(payload, key);\n  return 0;\n}",
  "forensic_tools.go":
    "// Module 04 - Forensic\npackage main\nfunc carve(disk string) { /* recuperation memoire */ }",
  "flag.txt": "HCL{c3_n_est_qu3_l3_d3but_d3_v0tr3_f0rm4t10n}",
};

const MODULES = Object.keys(FILES);

const BANNER: Line[] = [
  { type: "output", text: "$ ssh admin@heycybercorp-academy" },
  { type: "system", text: "Connecting to secure training node..." },
  { type: "output", text: "✓ Authenticated via SecureID" },
  { type: "system", text: "Tapez 'help' pour commencer." },
];

export default function HeroTerminal() {
  const [history, setHistory] = useState<Line[]>(BANNER);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  function run(raw: string) {
    const cmd = raw.trim();
    const out: Line[] = [{ type: "input", text: cmd }];

    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");

    switch (name) {
      case "":
        break;
      case "help":
        out.push({
          type: "output",
          text: [
            "Commandes disponibles :",
            "  help            — affiche cette aide",
            "  ls              — liste les modules disponibles",
            "  cat <fichier>   — affiche le contenu d'un fichier",
            "  whoami          — utilisateur courant",
            "  pwd             — repertoire courant",
            "  clear           — nettoie le terminal",
            "  nmap <cible>    — scan de ports (simulation)",
            "  sudo <cmd>      — execution privilegiee (simulation)",
          ].join("\n"),
        });
        break;
      case "ls":
        out.push({ type: "output", text: MODULES.join("   ") });
        break;
      case "cat":
        if (!arg) {
          out.push({ type: "error", text: "cat: argument manquant. Usage: cat <fichier>" });
        } else {
          const key = MODULES.find((f) => f.toLowerCase() === arg.toLowerCase());
          out.push({
            type: key ? "output" : "error",
            text: key ? FILES[key] : `cat: ${arg}: Aucun fichier de ce type`,
          });
        }
        break;
      case "whoami":
        out.push({ type: "output", text: "admin" });
        break;
      case "pwd":
        out.push({ type: "output", text: "/home/admin/training" });
        break;
      case "echo":
        out.push({ type: "output", text: arg });
        break;
      case "nmap":
        out.push({
          type: "output",
          text: [
            `Starting Nmap scan on ${arg || "target.local"}...`,
            "PORT     STATE  SERVICE",
            "22/tcp   open   ssh",
            "80/tcp   open   http",
            "443/tcp  open   https",
            "Scan terminé — 3 ports ouverts détectés.",
          ].join("\n"),
        });
        break;
      case "sudo":
        out.push({
          type: "output",
          text: arg
            ? `[sudo] mot de passe pour admin: ****\n✓ Commande privilégiée exécutée : ${arg}`
            : "usage: sudo <commande>",
        });
        break;
      case "clear":
        setHistory([]);
        setInput("");
        return;
      default:
        out.push({
          type: "error",
          text: `${name}: commande introuvable. Tapez 'help'.`,
        });
    }

    setHistory((h) => [...h, ...out]);
    if (cmd) setCmdLog((l) => [...l, cmd]);
    setLogIndex(-1);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdLog.length === 0) return;
      const next = logIndex < 0 ? cmdLog.length - 1 : Math.max(0, logIndex - 1);
      setLogIndex(next);
      setInput(cmdLog[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (logIndex < 0) return;
      const next = logIndex + 1;
      if (next >= cmdLog.length) {
        setLogIndex(-1);
        setInput("");
      } else {
        setLogIndex(next);
        setInput(cmdLog[next]);
      }
    }
  }

  return (
    <div className="terminal-container rounded-lg p-1 shadow-2xl overflow-hidden border border-outline-variant">
      <div className="bg-console-bar px-4 py-2 flex items-center gap-2 border-b border-outline-variant/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error" />
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <div className="w-3 h-3 rounded-full bg-primary" />
        </div>
        <div className="flex-1 text-center font-label-mono text-xs text-on-console opacity-70">
          heycybercorp_terminal -- v2.0.4
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="p-6 font-code-sm text-code-sm text-primary-fixed-dim bg-console h-[340px] overflow-y-auto no-scrollbar cursor-text"
      >
        {history.map((line, i) => {
          if (line.type === "input") {
            return (
              <p key={i} className="mb-1 whitespace-pre-wrap break-words">
                <span className="text-secondary">admin@heycybercorp:~$</span>{" "}
                {line.text}
              </p>
            );
          }
          if (line.type === "system") {
            return (
              <p key={i} className="mb-1 text-on-surface-variant italic whitespace-pre-wrap break-words">
                {line.text}
              </p>
            );
          }
          if (line.type === "error") {
            return (
              <p key={i} className="mb-2 text-error whitespace-pre-wrap break-words">
                {line.text}
              </p>
            );
          }
          return (
            <p key={i} className="mb-2 whitespace-pre-wrap break-words">
              {line.text}
            </p>
          );
        })}

        {/* Live input line */}
        <div className="flex items-center">
          <span className="text-secondary shrink-0">admin@heycybercorp:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal interactif"
            className="flex-1 ml-2 bg-transparent border-none outline-none text-primary-fixed-dim font-code-sm text-code-sm"
          />
        </div>
      </div>
    </div>
  );
}
