/**
 * The simulated shell.
 *
 * Used twice: by the hero terminal on the homepage, and by the `terminal`
 * artifact inside a scenario case. Both get the same engine with a different
 * configuration, so a command fixed in one place is fixed in both.
 *
 * SECURITY — the two rules this module exists to guarantee:
 *
 *   1. Nothing is evaluated. Commands come from a fixed registry; user input is
 *      only ever matched against it. No `eval`, no `new Function`, no dynamic
 *      dispatch on a user-supplied string.
 *   2. Nothing leaves the browser. The shell performs no `fetch` and touches no
 *      storage. A lab that could reach the network would be attack
 *      infrastructure wearing our domain name.
 *
 * The filesystem is a plain object held in memory for the life of the
 * component. `rm` and friends mutate that copy and nothing else.
 */

export type Line = {
  type: "input" | "output" | "system" | "error" | "success";
  text: string;
};

export type ShellConfig = {
  /** Virtual files: path → contents. Flat; directories are cosmetic. */
  files: Record<string, string>;
  user: string;
  host: string;
  cwd: string;
  /**
   * Command names this shell accepts. Omit for "everything in the registry".
   * A case narrows it so `help` stays an honest contract.
   */
  allowed?: string[];
  /** Extra commands only this shell has — the site-info verbs on the homepage. */
  extras?: Record<string, Command>;
};

export type Command = {
  group: string;
  usage: string;
  desc: string;
  run: (ctx: RunContext) => Line[] | "clear";
};

export type RunContext = {
  arg: string;
  args: string[];
  cfg: ShellConfig;
  files: Record<string, string>;
  history: string[];
};

export const out = (text: string): Line[] => [{ type: "output", text }];
export const ok = (text: string): Line[] => [{ type: "success", text }];
export const err = (text: string): Line[] => [{ type: "error", text }];

/** Deterministic pseudo-random: output looks alive but never changes between renders. */
export function seeded(input: string, max: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % max;
}

function fakeIp(seed: string): string {
  return `10.${seeded(seed, 254)}.${seeded(seed + "b", 254)}.${seeded(seed + "c", 253) + 1}`;
}

function fileNames(files: Record<string, string>): string[] {
  return Object.keys(files);
}

/** Find a file case-insensitively, so `cat readme.txt` works. */
function findFile(files: Record<string, string>, name: string): string | null {
  const hit = fileNames(files).find((f) => f.toLowerCase() === name.toLowerCase());
  return hit ?? null;
}

export const BASE_COMMANDS: Record<string, Command> = {
  help: {
    group: "Système",
    usage: "help",
    desc: "liste les commandes disponibles",
    run: ({ cfg }) => {
      const names = commandNames(cfg);
      const groups = [...new Set(names.map((n) => resolve(cfg, n)!.group))];
      const lines: string[] = [];
      for (const g of groups) {
        lines.push(`\n${g.toUpperCase()}`);
        for (const n of names) {
          const c = resolve(cfg, n)!;
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
    desc: "liste les fichiers",
    run: ({ files }) => {
      const names = fileNames(files);
      return names.length ? out(names.join("   ")) : out("(répertoire vide)");
    },
  },
  cat: {
    group: "Système",
    usage: "cat <fichier>",
    desc: "affiche un fichier",
    run: ({ arg, files }) => {
      if (!arg) return err("cat: argument manquant. Usage: cat <fichier>");
      const key = findFile(files, arg);
      return key ? out(files[key]) : err(`cat: ${arg}: Aucun fichier de ce type`);
    },
  },
  grep: {
    group: "Système",
    usage: "grep <motif> <fichier>",
    desc: "cherche un motif dans un fichier",
    run: ({ args, files }) => {
      const [pattern, name] = args;
      if (!pattern || !name) return err("usage: grep <motif> <fichier>");
      const key = findFile(files, name);
      if (!key) return err(`grep: ${name}: Aucun fichier de ce type`);
      const hits = files[key]
        .split("\n")
        .filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
      return hits.length ? out(hits.join("\n")) : out(`(aucune correspondance pour « ${pattern} »)`);
    },
  },
  wc: {
    group: "Système",
    usage: "wc <fichier>",
    desc: "compte lignes, mots, caractères",
    run: ({ arg, files }) => {
      const key = arg && findFile(files, arg);
      if (!key) return err("usage: wc <fichier>");
      const body = files[key];
      const lines = body.split("\n").length;
      const words = body.split(/\s+/).filter(Boolean).length;
      return out(`${lines}  ${words}  ${body.length}  ${key}`);
    },
  },
  head: {
    group: "Système",
    usage: "head <fichier>",
    desc: "les 10 premières lignes",
    run: ({ arg, files }) => {
      const key = arg && findFile(files, arg);
      if (!key) return err("usage: head <fichier>");
      return out(files[key].split("\n").slice(0, 10).join("\n"));
    },
  },
  tail: {
    group: "Système",
    usage: "tail <fichier>",
    desc: "les 10 dernières lignes",
    run: ({ arg, files }) => {
      const key = arg && findFile(files, arg);
      if (!key) return err("usage: tail <fichier>");
      return out(files[key].split("\n").slice(-10).join("\n"));
    },
  },
  tree: {
    group: "Système",
    usage: "tree",
    desc: "arborescence",
    run: ({ cfg, files }) => {
      const names = fileNames(files);
      return out(
        [
          cfg.cwd,
          ...names.map((m, i) => `${i === names.length - 1 ? "└──" : "├──"} ${m}`),
          "",
          `${names.length} fichier(s)`,
        ].join("\n"),
      );
    },
  },
  whoami: { group: "Système", usage: "whoami", desc: "utilisateur courant", run: ({ cfg }) => out(cfg.user) },
  pwd: { group: "Système", usage: "pwd", desc: "répertoire courant", run: ({ cfg }) => out(cfg.cwd) },
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
  echo: { group: "Système", usage: "echo <texte>", desc: "affiche un texte", run: ({ arg }) => out(arg) },
  clear: { group: "Système", usage: "clear", desc: "nettoie le terminal", run: () => "clear" },
  history: {
    group: "Système",
    usage: "history",
    desc: "commandes saisies",
    run: ({ history }) =>
      out(
        history.length
          ? history.map((c, i) => `  ${String(i + 1).padStart(3)}  ${c}`).join("\n")
          : "Aucune commande dans l'historique.",
      ),
  },

  ping: {
    group: "Réseau",
    usage: "ping <hôte>",
    desc: "teste la joignabilité",
    run: ({ arg }) => {
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
    run: ({ arg }) => {
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
    run: ({ arg }) => {
      const host = arg || "target.local";
      return out(
        [
          `traceroute to ${host} (${fakeIp(host)}), 30 hops max`,
          " 1  gateway (10.0.0.1)          1.204 ms",
          " 2  edge-r1 (81.12.4.9)         8.771 ms",
          " 3  core-2 (81.12.88.14)       12.330 ms",
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
          "lo:   flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
          "      inet 127.0.0.1  netmask 255.0.0.0",
        ].join("\n"),
      ),
  },

  hashid: {
    group: "Sécurité",
    usage: "hashid <hash>",
    desc: "identifie un type d'empreinte",
    run: ({ arg }) => {
      if (!arg) return err("hashid: fournissez une empreinte.");
      const len = arg.length;
      const guess = len === 32 ? "MD5" : len === 40 ? "SHA-1" : len === 64 ? "SHA-256" : "inconnu";
      return out(
        [
          `Longueur  : ${len} caractères`,
          `Hypothèse : ${guess}`,
          guess === "MD5" || guess === "SHA-1"
            ? "⚠ Algorithme obsolète — à proscrire pour des mots de passe."
            : "Préférez bcrypt, scrypt ou Argon2 pour des mots de passe.",
        ].join("\n"),
      );
    },
  },
  sudo: {
    group: "Sécurité",
    usage: "sudo <commande>",
    desc: "exécution privilégiée (simulation)",
    run: ({ arg, cfg }) => {
      if (!arg) return err("usage: sudo <commande>");
      if (/rm\s+-rf\s+\//.test(arg)) {
        return err("Refusé. On n'apprend pas la sécurité en détruisant la machine.");
      }
      return ok(`[sudo] mot de passe pour ${cfg.user} : ****\n✓ Commande exécutée : ${arg}`);
    },
  },
};

/** Which command names this shell exposes, after the allow-list is applied. */
export function commandNames(cfg: ShellConfig): string[] {
  const all = { ...BASE_COMMANDS, ...(cfg.extras ?? {}) };
  const names = Object.keys(all);
  if (!cfg.allowed) return names;
  // `help` and `clear` are always present: a shell you cannot inspect or reset
  // is a worse experience than a slightly wider allow-list.
  const keep = new Set([...cfg.allowed, "help", "clear"]);
  return names.filter((n) => keep.has(n));
}

function resolve(cfg: ShellConfig, name: string): Command | null {
  const all = { ...BASE_COMMANDS, ...(cfg.extras ?? {}) };
  return commandNames(cfg).includes(name) ? (all[name] ?? null) : null;
}

/**
 * Execute one line. Returns the lines to append, or "clear".
 *
 * `files` is mutated in place by commands that write — the caller owns that
 * object and it never outlives the component.
 */
export function runCommand(
  cfg: ShellConfig,
  files: Record<string, string>,
  history: string[],
  raw: string,
): { lines: Line[]; clear?: true } {
  const cmd = raw.trim();
  if (!cmd) return { lines: [] };

  const lines: Line[] = [{ type: "input", text: cmd }];
  const [name, ...args] = cmd.split(/\s+/);
  const command = resolve(cfg, name.toLowerCase());

  if (!command) {
    const exists = Boolean({ ...BASE_COMMANDS, ...(cfg.extras ?? {}) }[name.toLowerCase()]);
    lines.push({
      type: "error",
      // Distinguishing "exists but not here" from "does not exist" stops a
      // scoped lab from looking broken.
      text: exists
        ? `${name} : commande non disponible dans ce laboratoire. Tapez 'help'.`
        : `${name} : commande introuvable. Tapez 'help'.`,
    });
    return { lines };
  }

  const result = command.run({ arg: args.join(" "), args, cfg, files, history });
  if (result === "clear") return { lines: [], clear: true };
  lines.push(...result);
  return { lines };
}

/** Tab completion: command names, or filenames once the verb takes one. */
export function complete(
  cfg: ShellConfig,
  files: Record<string, string>,
  input: string,
): { input?: string; suggestions?: string[] } {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    const hits = commandNames(cfg).filter((c) => c.startsWith(parts[0].toLowerCase()));
    if (hits.length === 1) return { input: hits[0] + " " };
    if (hits.length > 1) return { suggestions: hits };
    return {};
  }
  if (["cat", "grep", "wc", "head", "tail"].includes(parts[0].toLowerCase())) {
    const frag = parts[parts.length - 1].toLowerCase();
    const hits = fileNames(files).filter((f) => f.toLowerCase().startsWith(frag));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      return { input: parts.join(" ") };
    }
    if (hits.length > 1) return { suggestions: hits };
  }
  return {};
}
