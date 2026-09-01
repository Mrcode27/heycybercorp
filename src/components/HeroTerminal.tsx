"use client";

import Terminal from "./shell/Terminal";
import {
  out,
  seeded,
  type Command,
  type Line,
  type ShellConfig,
} from "@/lib/shell";

/**
 * The homepage terminal.
 *
 * Everything mechanical — parsing, history, Tab completion, the base command
 * set — comes from `@/lib/shell`, shared with the `terminal` artifact inside
 * scenario cases. What lives here is only what is specific to the hero: a small
 * demo filesystem and the verbs that answer questions about heycybercorp.
 */

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

/** Verbs the hero has and a case never needs. */
const EXTRAS: Record<string, Command> = {
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
          "       ▀▀▀▀▀        Niveau  : Débutant → Avancé",
        ].join("\n"),
      ),
  },
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
  matrix: {
    group: "Divers",
    usage: "matrix",
    desc: "pluie de caractères",
    run: () => {
      const chars = "01アイウエオカキクケコ#$%&@";
      return out(
        Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 46 }, (_, c) => chars[seeded(`${r}:${c}`, chars.length)]).join(""),
        ).join("\n"),
      );
    },
  },
  fortune: {
    group: "Divers",
    usage: "fortune",
    desc: "une maxime de sécurité",
    run: ({ args }) => {
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
          "Paiement sécurisé par Stripe.",
          "",
          "→ heycybercorp.fr/tarifs",
        ].join("\n"),
      ),
  },
  labs: {
    group: "heycybercorp",
    usage: "labs",
    desc: "les cas pratiques",
    run: () =>
      out(
        [
          "Des mises en situation réelles : un incident, des preuves, une décision.",
          "Deux cas sont en accès libre.",
          "",
          "→ heycybercorp.fr/dashboard/labs  (sur ordinateur)",
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
};

const CONFIG: ShellConfig = {
  files: FILES,
  user: "admin",
  host: "heycybercorp",
  cwd: "/home/admin/training",
  extras: EXTRAS,
};

const MOTD: Line[] = [
  { type: "output", text: "$ ssh admin@heycybercorp-academy" },
  { type: "system", text: "Connecting to secure training node…" },
  { type: "success", text: "✓ Authenticated via SecureID" },
  { type: "system", text: "Tapez 'help' pour lister les commandes." },
];

const DEMO_COMMANDS = ["help", "formations", "labs", "neofetch"] as const;

export default function HeroTerminal() {
  return <Terminal config={CONFIG} motd={MOTD} demoCommands={DEMO_COMMANDS} />;
}
