"use client";

import { useEffect, useRef, useState } from "react";

type Line = { type: "input" | "output" | "system" | "error" | "success"; text: string };

/** A small simulated filesystem for the training node. */
const FILES: Record<string, string> = {
  "README.txt":
    "Bienvenue sur le noeud d'entrainement heycybercorp.\nTapez 'help' pour lister les commandes, 'formations' pour le catalogue.",
  "intrusion_testing.sh":
    "#!/bin/bash\n# Module 01 - Test d'intrusion\necho 'Scan des ports en cours...'\nnmap -sV target.local",
  "soc_operations.py":
    "# Module 02 - SOC & detection\nfrom siem import analyze\nanalyze('/var/log/auth.log')  # detection d'anomalies",
  "crypto_analysis.c":
    "/* Module 03 - Cryptographie */\nint main() {\n  aes_decrypt(payload, key);\n  return 0;\n}",
  "forensic_tools.go":
    "// Module 04 - Forensic\npackage main\nfunc carve(disk string) { /* recuperation memoire */ }",
  "osint_recon.py":
    "# Module 05 - OSINT\nfrom recon import footprint\nfootprint('exemple.fr', passive=True)",
  "flag.txt": "HCL{c3_n_est_qu3_l3_d3but_d3_v0tr3_f0rm4t10n}",
};

const MODULES = Object.keys(FILES);

/**
 * Every command in one registry rather than a switch: `help` is generated from
 * it, and tab-completion reads the same list, so a new command can never be
 * missing from either.
 *
 * Everything here is theatre. Each handler returns a hardcoded string — there
 * is no network, no shell, and nothing that touches a real host. It exists to
 * make the hero feel like the subject the site teaches.
 */
type Command = {
  group: "Système" | "Réseau" | "Sécurité" | "heycybercorp" | "Divers";
  usage: string;
  desc: string;
  run: (arg: string, args: string[]) => Line[] | "clear";
};

const out = (text: string): Line[] => [{ type: "output", text }];
const ok = (text: string): Line[] => [{ type: "success", text }];
const err = (text: string): Line[] => [{ type: "error", text }];

/** Deterministic pseudo-random so output looks alive but never re-renders differently. */
function seeded(input: string, max: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % max;
}

function fakeIp(seed: string): string {
  return `10.${seeded(seed, 254)}.${seeded(seed + "b", 254)}.${seeded(seed + "c", 253) + 1}`;
}

const COMMANDS: Record<string, Command> = {
  // ---- Système ----
  help: {
    group: "Système",
    usage: "help [groupe]",
    desc: "liste les commandes disponibles",
    run: (arg) => {
      const groups = [...new Set(Object.values(COMMANDS).map((c) => c.group))];
      const wanted = groups.find((g) => g.toLowerCase() === arg.toLowerCase());
      const show = wanted ? [wanted] : groups;
      const lines: string[] = [];
      for (const g of show) {
        lines.push(`\n${g.toUpperCase()}`);
        for (const c of Object.values(COMMANDS)) {
          if (c.group !== g) continue;
          lines.push(`  ${c.usage.padEnd(22)}— ${c.desc}`);
        }
      }
      lines.push("\nTab complète · ↑/↓ rappelle · Ctrl+L nettoie");
      return out(lines.join("\n").trim());
    },
  },
  ls: {
    group: "Système",
    usage: "ls",
    desc: "liste les modules du noeud",
    run: () => out(MODULES.join("   ")),
  },
  cat: {
    group: "Système",
    usage: "cat <fichier>",
    desc: "affiche le contenu d'un fichier",
    run: (arg) => {
      if (!arg) return err("cat: argument manquant. Usage: cat <fichier>");
      const key = MODULES.find((f) => f.toLowerCase() === arg.toLowerCase());
      return key ? out(FILES[key]) : err(`cat: ${arg}: Aucun fichier de ce type`);
    },
  },
  tree: {
    group: "Système",
    usage: "tree",
    desc: "arborescence du noeud",
    run: () =>
      out(
        [
          "/home/admin/training",
          ...MODULES.map((m, i) => `${i === MODULES.length - 1 ? "└──" : "├──"} ${m}`),
          "",
          `${MODULES.length} fichiers, 0 répertoires`,
        ].join("\n"),
      ),
  },
  whoami: { group: "Système", usage: "whoami", desc: "utilisateur courant", run: () => out("admin") },
  pwd: {
    group: "Système",
    usage: "pwd",
    desc: "répertoire courant",
    run: () => out("/home/admin/training"),
  },
  uname: {
    group: "Système",
    usage: "uname",
    desc: "informations noyau",
    run: () => out("HeyOS 6.8.0-hcc #1 SMP x86_64 GNU/Linux"),
  },
  uptime: {
    group: "Système",
    usage: "uptime",
    desc: "durée de fonctionnement",
    run: () => out("up 42 days, 7:13,  1 user,  load average: 0.08, 0.04, 0.01"),
  },
  ps: {
    group: "Système",
    usage: "ps",
    desc: "processus actifs",
    run: () =>
      out(
        [
          "  PID TTY          TIME CMD",
          " 1042 pts/0    00:00:01 siem-collector",
          " 1088 pts/0    00:00:00 ids-sensor",
          " 1190 pts/0    00:00:03 packet-capture",
          " 1337 pts/0    00:00:00 bash",
        ].join("\n"),
      ),
  },
  neofetch: {
    group: "Système",
    usage: "neofetch",
    desc: "carte d'identité du noeud",
    run: () =>
      out(
        [
          "       ▄▄▄▄▄       admin@heycybercorp-academy",
          "     ▄█████████▄    ─────────────────────────",
          "    ██  ▀███▀  ██   OS      : HeyOS 6.8.0-hcc",
          "    ██   ███   ██   Shell   : hccsh 2.1.0",
          "     ▀█████████▀    Uptime  : 42 days",
          "       ▀▀▀▀▀        Modules : " + MODULES.length,
          "                    Niveau  : Débutant → Avancé",
        ].join("\n"),
      ),
  },
  echo: { group: "Système", usage: "echo <texte>", desc: "affiche un texte", run: (arg) => out(arg) },
  clear: { group: "Système", usage: "clear", desc: "nettoie le terminal", run: () => "clear" },

  // ---- Réseau ----
  ping: {
    group: "Réseau",
    usage: "ping <hôte>",
    desc: "teste la joignabilité d'un hôte",
    run: (arg) => {
      const host = arg || "target.local";
      const ip = fakeIp(host);
      const t = (n: number) => (10 + seeded(host + n, 40) / 10).toFixed(1);
      return out(
        [
          `PING ${host} (${ip}) 56(84) bytes of data.`,
          `64 bytes from ${ip}: icmp_seq=1 ttl=64 time=${t(1)} ms`,
          `64 bytes from ${ip}: icmp_seq=2 ttl=64 time=${t(2)} ms`,
          `64 bytes from ${ip}: icmp_seq=3 ttl=64 time=${t(3)} ms`,
          "",
          `--- ${host} ping statistics ---`,
          "3 packets transmitted, 3 received, 0% packet loss",
        ].join("\n"),
      );
    },
  },
  nmap: {
    group: "Réseau",
    usage: "nmap <cible>",
    desc: "scan de ports (simulation)",
    run: (arg) => {
      const target = arg || "target.local";
      return out(
        [
          `Starting Nmap 7.94 on ${target} (${fakeIp(target)})`,
          "PORT     STATE    SERVICE      VERSION",
          "22/tcp   open     ssh          OpenSSH 9.2",
          "80/tcp   open     http         nginx 1.24.0",
          "443/tcp  open     https        nginx 1.24.0",
          "3306/tcp filtered mysql",
          "",
          "Scan terminé — 3 ports ouverts, 1 filtré.",
        ].join("\n"),
      );
    },
  },
  traceroute: {
    group: "Réseau",
    usage: "traceroute <hôte>",
    desc: "trace le chemin réseau",
    run: (arg) => {
      const host = arg || "target.local";
      return out(
        [
          `traceroute to ${host} (${fakeIp(host)}), 30 hops max`,
          " 1  gateway (10.0.0.1)          1.204 ms",
          " 2  edge-r1.fr (81.12.4.9)      8.771 ms",
          " 3  core-par2 (81.12.88.14)    12.330 ms",
          ` 4  ${host} (${fakeIp(host)})  14.902 ms`,
        ].join("\n"),
      );
    },
  },
  netstat: {
    group: "Réseau",
    usage: "netstat",
    desc: "connexions établies",
    run: () =>
      out(
        [
          "Proto Local Address        Foreign Address      State",
          "tcp   10.0.0.24:22         10.0.0.1:51204       ESTABLISHED",
          "tcp   10.0.0.24:443        104.18.2.7:44120     ESTABLISHED",
          "tcp   10.0.0.24:8080       0.0.0.0:*            LISTEN",
        ].join("\n"),
      ),
  },
  ifconfig: {
    group: "Réseau",
    usage: "ifconfig",
    desc: "interfaces réseau",
    run: () =>
      out(
        [
          "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
          "      inet 10.0.0.24  netmask 255.255.255.0",
          "      RX packets 918442  TX packets 771903",
          "lo:   flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
          "      inet 127.0.0.1  netmask 255.0.0.0",
        ].join("\n"),
      ),
  },
  whois: {
    group: "Réseau",
    usage: "whois <domaine>",
    desc: "informations d'enregistrement",
    run: (arg) => {
      const d = arg || "heycybercorp.fr";
      return out(
        [
          `domain:      ${d}`,
          "registrar:   HeyCyber Registrar SAS",
          "status:      ACTIVE",
          "created:     2026-07-06",
          "nameserver:  ns1.vercel-dns.com",
        ].join("\n"),
      );
    },
  },
  curl: {
    group: "Réseau",
    usage: "curl <url>",
    desc: "requête HTTP (simulation)",
    run: (arg) => {
      if (!arg) return err("curl: try 'curl <url>'");
      return out(
        [
          `> GET ${arg}`,
          "< HTTP/2 200",
          "< content-type: text/html; charset=utf-8",
          "< strict-transport-security: max-age=63072000",
          "< content-security-policy: default-src 'self'",
          "",
          "En-têtes de sécurité présents. Bonne configuration.",
        ].join("\n"),
      );
    },
  },

  // ---- Sécurité ----
  scan: {
    group: "Sécurité",
    usage: "scan <cible>",
    desc: "audit de vulnérabilités (simulation)",
    run: (arg) => {
      const t = arg || "target.local";
      return out(
        [
          `Analyse de ${t} …`,
          "[✓] TLS 1.3 négocié, certificat valide",
          "[✓] En-têtes HSTS et CSP présents",
          "[!] Version du serveur exposée dans l'en-tête Server",
          "[!] Cookie de session sans attribut SameSite",
          "",
          "2 observations mineures. Aucune faille critique détectée.",
        ].join("\n"),
      );
    },
  },
  hashid: {
    group: "Sécurité",
    usage: "hashid <hash>",
    desc: "identifie un type de hash",
    run: (arg) => {
      if (!arg) return err("hashid: fournissez un hash à analyser.");
      const len = arg.length;
      const guess =
        len === 32 ? "MD5" : len === 40 ? "SHA-1" : len === 64 ? "SHA-256" : "inconnu";
      return out(
        [
          `Analyse de : ${arg.slice(0, 48)}${len > 48 ? "…" : ""}`,
          `Longueur   : ${len} caractères`,
          `Hypothèse  : ${guess}`,
          guess === "MD5" || guess === "SHA-1"
            ? "⚠ Algorithme obsolète — à proscrire pour des mots de passe."
            : "Utilisez bcrypt, scrypt ou Argon2 pour stocker des mots de passe.",
        ].join("\n"),
      );
    },
  },
  harden: {
    group: "Sécurité",
    usage: "harden",
    desc: "checklist de durcissement",
    run: () =>
      out(
        [
          "Checklist de durcissement :",
          "  [✓] Authentification multifacteur",
          "  [✓] Principe du moindre privilège",
          "  [✓] Journalisation centralisée",
          "  [ ] Sauvegardes testées (restaurez-les vraiment)",
          "  [ ] Revue des accès trimestrielle",
        ].join("\n"),
      ),
  },
  audit: {
    group: "Sécurité",
    usage: "audit",
    desc: "posture de sécurité du noeud",
    run: () =>
      out(
        [
          "Posture globale : 82/100",
          "  Chiffrement       ████████░░  88",
          "  Contrôle d'accès  ███████░░░  76",
          "  Détection         ████████░░  84",
          "  Réponse incident  ███████░░░  79",
        ].join("\n"),
      ),
  },
  sudo: {
    group: "Sécurité",
    usage: "sudo <commande>",
    desc: "exécution privilégiée (simulation)",
    run: (arg) => {
      if (!arg) return err("usage: sudo <commande>");
      if (/rm\s+-rf\s+\//.test(arg)) {
        return err("Refusé. On n'apprend pas la sécurité en détruisant la machine.");
      }
      return ok(`[sudo] mot de passe pour admin: ****\n✓ Commande privilégiée exécutée : ${arg}`);
    },
  },

  // ---- heycybercorp ----
  formations: {
    group: "heycybercorp",
    usage: "formations",
    desc: "catalogue des formations",
    run: () =>
      out(
        [
          "Parcours disponibles :",
          "  Débutant       — fondamentaux, hygiène numérique, premiers outils",
          "  Intermédiaire  — pentest réseau, Linux, Red/Blue team, OSINT",
          "  Avancé         — Wi-Fi offensif, sécurité des comptes, forensic",
          "",
          "→ heycybercorp.fr/formations",
        ].join("\n"),
      ),
  },
  packs: {
    group: "heycybercorp",
    usage: "packs",
    desc: "packs et tarifs",
    run: () =>
      out(
        [
          "Un achat unique débloque à vie toutes les formations du niveau.",
          "Paiement sécurisé par Stripe, carte bancaire et autres moyens.",
          "",
          "→ heycybercorp.fr/tarifs",
        ].join("\n"),
      ),
  },
  contact: {
    group: "heycybercorp",
    usage: "contact",
    desc: "nous joindre",
    run: () =>
      out(["Email   : heycyberpro@gmail.com", "Bureaux : Paris · Douala", "", "→ heycybercorp.fr/contact"].join("\n")),
  },
  certif: {
    group: "heycybercorp",
    usage: "certif",
    desc: "certificats vérifiables",
    run: () =>
      out(
        [
          "Chaque formation terminée délivre un certificat au code unique,",
          "vérifiable publiquement sur heycybercorp.fr/certificat/<code>.",
        ].join("\n"),
      ),
  },

  // ---- Divers ----
  banner: {
    group: "Divers",
    usage: "banner",
    desc: "affiche la bannière",
    run: () =>
      out(
        [
          " _   _ _____   _____   ____ _   _ ____  _____ ____",
          "| | | | ____| |_   _| / ___| | | | __ )| ____|  _ \\",
          "| |_| |  _|     | |  | |   | |_| |  _ \\|  _| | |_) |",
          "|  _  | |___    | |  | |___|  _  | |_) | |___|  _ <",
          "|_| |_|_____|   |_|   \\____|_| |_|____/|_____|_| \\_\\",
          "",
          "        Académie de cyberdéfense · v2.1.0",
        ].join("\n"),
      ),
  },
  fortune: {
    group: "Divers",
    usage: "fortune",
    desc: "une maxime de sécurité",
    run: (_, args) => {
      const quotes = [
        "La sécurité n'est pas un produit, c'est un processus.",
        "Un mot de passe partagé n'est plus un mot de passe.",
        "La sauvegarde que vous n'avez jamais restaurée n'existe pas.",
        "L'attaquant n'a besoin d'avoir raison qu'une seule fois.",
        "Chiffrez comme si le disque allait être volé. Il le sera.",
        "Le maillon faible porte souvent un badge d'employé.",
      ];
      return out(quotes[seeded(args.join(" ") + quotes.length, quotes.length)]);
    },
  },
  matrix: {
    group: "Divers",
    usage: "matrix",
    desc: "pluie de caractères",
    run: () => {
      const chars = "01アイウエオカキクケコ#$%&@";
      const rows = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 46 }, (_, c) => chars[seeded(`${r}:${c}`, chars.length)]).join(""),
      );
      return out(rows.join("\n"));
    },
  },
  history: {
    group: "Divers",
    usage: "history",
    desc: "commandes saisies",
    run: () => out("__HISTORY__"),
  },
  exit: {
    group: "Divers",
    usage: "exit",
    desc: "ferme la session",
    run: () =>
      out("Session close. Rechargez la page pour rouvrir le noeud — ou continuez à taper."),
  },
};

const BANNER: Line[] = [
  { type: "output", text: "$ ssh admin@heycybercorp-academy" },
  { type: "system", text: "Connecting to secure training node…" },
  { type: "success", text: "✓ Authenticated via SecureID" },
  { type: "system", text: `${Object.keys(COMMANDS).length} commandes chargées. Tapez 'help'.` },
];

export default function HeroTerminal() {
  const [history, setHistory] = useState<Line[]>(BANNER);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  function run(raw: string) {
    const cmd = raw.trim();
    const lines: Line[] = [{ type: "input", text: cmd }];
    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");

    if (name === "") {
      setInput("");
      return;
    }

    const command = COMMANDS[name.toLowerCase()];
    if (!command) {
      const near = Object.keys(COMMANDS).find((c) => c.startsWith(name.slice(0, 2).toLowerCase()));
      lines.push({
        type: "error",
        text: `${name}: commande introuvable.${near ? ` Vouliez-vous dire '${near}' ?` : ""} Tapez 'help'.`,
      });
    } else {
      const result = command.run(arg, args);
      if (result === "clear") {
        setHistory([]);
        setInput("");
        return;
      }
      // `history` needs the log, which lives in state rather than the registry.
      for (const line of result) {
        if (line.text === "__HISTORY__") {
          lines.push({
            type: "output",
            text: cmdLog.length
              ? cmdLog.map((c, i) => `  ${String(i + 1).padStart(3)}  ${c}`).join("\n")
              : "Aucune commande dans l'historique.",
          });
        } else {
          lines.push(line);
        }
      }
    }

    setHistory((h) => [...h, ...lines]);
    if (cmd) setCmdLog((l) => [...l, cmd]);
    setLogIndex(-1);
    setInput("");
  }

  /** Tab completes a command name, or a filename once the verb is `cat`. */
  function complete() {
    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      const hits = Object.keys(COMMANDS).filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (hits.length === 1) setInput(hits[0] + " ");
      else if (hits.length > 1) setHistory((h) => [...h, { type: "system", text: hits.join("   ") }]);
      return;
    }
    if (parts[0].toLowerCase() === "cat") {
      const frag = parts[1].toLowerCase();
      const hits = MODULES.filter((f) => f.toLowerCase().startsWith(frag));
      if (hits.length === 1) setInput(`cat ${hits[0]}`);
      else if (hits.length > 1) setHistory((h) => [...h, { type: "system", text: hits.join("   ") }]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input);
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
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
      <div className="bg-terminal-bar px-4 py-2 flex items-center gap-2 border-b border-outline-variant/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error" />
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <div className="w-3 h-3 rounded-full bg-primary" />
        </div>
        <div className="flex-1 text-center font-label-mono text-xs text-on-terminal opacity-70">
          admin@heycybercorp — hccsh 2.1.0
        </div>
        <div className="flex items-center gap-1.5 font-label-mono text-[10px] text-on-terminal opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="terminal-scanlines terminal-sweep relative p-6 font-code-sm text-code-sm text-primary-fixed-dim bg-terminal h-[340px] overflow-y-auto no-scrollbar cursor-text"
      >
        {history.map((line, i) => {
          if (line.type === "input") {
            return (
              <p key={i} className="mb-1 whitespace-pre-wrap break-words">
                <span className="text-secondary">admin@heycybercorp:~$</span> {line.text}
              </p>
            );
          }
          if (line.type === "system") {
            return (
              <p key={i} className="mb-1 text-on-terminal/70 italic whitespace-pre-wrap break-words">
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
          if (line.type === "success") {
            return (
              <p key={i} className="mb-2 text-primary whitespace-pre-wrap break-words">
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
        <div className="flex items-center relative z-10">
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
