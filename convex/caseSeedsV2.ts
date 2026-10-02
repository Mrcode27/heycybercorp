import { mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { logAudit } from "./lib/audit";
import type { Id } from "./_generated/dataModel";

/**
 * Idempotent catalogue of the "dynamic" practical cases — the ones played
 * inside the webOS by investigating a machine, not by filling a form.
 *
 * Re-running upserts every case by slug: the head is patched and the artifacts,
 * steps and student attempts for that case are replaced. That mirrors
 * `cases.adminSave` on update, and is the honest choice — after a question is
 * reworded there is no fair way to decide a previous answer still counts.
 *
 * Everything here is defensive/blue-team: the student reads evidence (process
 * lists, sockets, logs, a scan report handed to them) and decides. No step
 * walks anyone through attacking a system. The shell stays a lookup table —
 * nothing is evaluated, nothing leaves the browser — so a case's `sim` block is
 * just canned output for recon commands against its own machine.
 */

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type ArtifactKind =
  | "email" | "log" | "terminal" | "file" | "table" | "http" | "image" | "webos";
type Match = "exact" | "contains" | "keywords";

type SeedStep = {
  prompt: string;
  kind: "text" | "choice";
  choices?: string[];
  answer: string;
  accept?: string[];
  match?: Match;
  hint?: string;
  reveal?: string;
  points: number;
};
type SeedArtifact = { kind: ArtifactKind; label: string; content: string };
type SeedCase = {
  slug: string;
  title: string;
  summary: string;
  setting: string;
  guide: string;
  level: Level;
  category: string;
  icon: string;
  estimatedMinutes: number;
  isFree: boolean;
  published: boolean;
  artifacts: SeedArtifact[];
  steps: SeedStep[];
};

/** Serialise a webOS artifact body (the config the desktop reads). */
function webos(cfg: {
  user: string;
  host: string;
  cwd: string;
  incident: string;
  allowed: string[];
  files: Record<string, string>;
  sim?: Record<string, string>;
}): string {
  return JSON.stringify({
    user: cfg.user,
    host: cfg.host,
    cwd: cfg.cwd,
    incident: cfg.incident,
    apps: ["dossier", "terminal", "files", "monitor"],
    openOnStart: ["mission.txt"],
    allowed: cfg.allowed,
    files: cfg.files,
    ...(cfg.sim ? { sim: cfg.sim } : {}),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Case 1 · Débutant — compromised workstation triage
// ─────────────────────────────────────────────────────────────────────────
const POSTE_14: SeedCase = {
  slug: "poste-14-service-en-trop",
  title: "Poste 14 : un service en trop",
  summary:
    "L'EDR a signalé un poste qui contacte une adresse inconnue toutes les minutes. Trouvez le programme responsable, sa méthode de persistance et contenez-le.",
  setting:
    "11h20. L'EDR lève une alerte de balise sortante sur poste-compta-14.\n\nL'antivirus n'a rien bloqué, l'utilisateur n'a rien remarqué. On vous donne la main sur le poste en lecture seule.\n\nVotre mission : identifier le programme suspect, comprendre comment il survit à un redémarrage, puis choisir un premier confinement qui n'efface pas les preuves.",
  guide:
    "RÉPONSES\n1) updater-helper (dans /opt/.cache) — ss -tunp le relie à la socket.\n2) PID 3471 — visible dans ps et ss.\n3) Un service systemd activé : updater-helper.service (enabled).\n4) Isoler le poste, désactiver ET masquer le service, préserver mémoire et journaux.\n\nPOURQUOI\nUn nom rassurant (« updater-helper ») n'est pas une preuve de légitimité : ce qui compte est la corrélation socket → processus → persistance. Tuer le processus sans toucher au service le ferait revenir au prochain démarrage.\n\nCOMMENT CORRIGER / DURCIR\n- Isoler le poste du réseau via l'EDR (ne pas l'éteindre : la mémoire est une preuve).\n- systemctl disable --now updater-helper.service puis systemctl mask ...\n- Faire une acquisition mémoire + copie des journaux avant toute suppression.\n- Supprimer le binaire /opt/.cache/updater-helper et l'unité /etc/systemd/system/updater-helper.service.\n- Rechercher le vecteur initial (téléchargement, pièce jointe) et le même indicateur (198.51.100.23) sur le reste du parc.\n- Réinitialiser les identifiants utilisés sur ce poste ; envisager une réinstallation.",
  level: "Débutant",
  category: "Réponse à incident",
  icon: "desktop_windows",
  estimatedMinutes: 12,
  isFree: false,
  published: true,
  artifacts: [
    {
      kind: "webos",
      label: "Poste compromis — triage",
      content: webos({
        user: "analyste",
        host: "poste-compta-14",
        cwd: "/home/analyste",
        incident: "EDR-1182 · balise sortante",
        allowed: [
          "ls", "cat", "grep", "head", "tail", "wc", "tree", "whoami", "pwd", "id",
          "ps", "ss", "netstat", "systemctl", "crontab", "last", "clear", "help",
        ],
        files: {
          "mission.txt":
            "MISSION — poste-compta-14\n\n1. Quel programme suspect écoute sur un port inhabituel et contacte l'extérieur ? (ss -tunp)\n2. Quel est son PID ? (ps)\n3. Comment se relance-t-il à chaque démarrage ? (systemctl, crontab)\n4. Quel premier confinement préserve les preuves ?\n\nLe poste est monté en lecture seule. Aucune commande n'agit réellement.",
          "edr-alerte.txt":
            "EDR-1182\nHôte     : poste-compta-14 (192.0.2.14)\nRègle    : OUTBOUND_BEACON_REGULAR\nRésumé   : connexion sortante répétée vers 198.51.100.23:443, toutes les ~60 s.\nProcessus: /opt/.cache/updater-helper\nParent   : /usr/bin/bash (session utilisateur)\nAV       : aucune détection de signature.",
          "note-analyste.txt":
            "Rappel : un dossier commençant par un point (/opt/.cache) est masqué dans l'affichage par défaut. Comparez toujours un processus à son emplacement et à ses connexions, pas à son nom.",
        },
        sim: {
          ps:
            "  PID TTY      STAT   TIME COMMAND\n" +
            "    1 ?        Ss     0:04 /sbin/init\n" +
            "  642 ?        Ss     0:01 /usr/sbin/sshd -D\n" +
            " 1203 ?        Ss     0:03 /usr/sbin/cron -f\n" +
            " 2051 tty1     Sl     0:22 /usr/bin/gnome-shell\n" +
            " 3471 ?        Ssl    4:12 /opt/.cache/updater-helper --daemon --quiet\n" +
            " 4102 pts/0    R+     0:00 ps aux",
          ss:
            "Netid State  Local Address:Port   Peer Address:Port    Process\n" +
            "tcp   LISTEN 0.0.0.0:22           0.0.0.0:*            users:((\"sshd\",pid=642))\n" +
            "tcp   LISTEN 127.0.0.1:631        0.0.0.0:*            users:((\"cupsd\",pid=701))\n" +
            "tcp   LISTEN 0.0.0.0:4455         0.0.0.0:*            users:((\"updater-helper\",pid=3471))\n" +
            "tcp   ESTAB  192.0.2.14:49882     198.51.100.23:443   users:((\"updater-helper\",pid=3471))",
          netstat:
            "Proto Local Address        Foreign Address        State\n" +
            "tcp   192.0.2.14:49882     198.51.100.23:443      ESTABLISHED\n" +
            "tcp   0.0.0.0:4455         0.0.0.0:*              LISTEN",
          "systemctl status updater-helper.service":
            "● updater-helper.service - System Update Helper\n" +
            "     Loaded: loaded (/etc/systemd/system/updater-helper.service; enabled; preset: disabled)\n" +
            "     Active: active (running) since lun. 2026-09-28 08:03:11 CEST\n" +
            "   Main PID: 3471 (updater-helper)\n" +
            "     CGroup: /system.slice/updater-helper.service\n" +
            "             └─3471 /opt/.cache/updater-helper --daemon --quiet",
          systemctl:
            "Astuce : systemctl status <service>. Le service suspect porte un nom d'apparence système.",
          "crontab -l": "no crontab for analyste",
          crontab: "no crontab for analyste",
          last:
            "analyste tty1   :0    lun. sept. 28 07:58   still logged in\nreboot   system boot      lun. sept. 28 07:55",
        },
      }),
    },
  ],
  steps: [
    {
      prompt: "Quel programme suspect écoute sur un port inhabituel et contacte l'extérieur ?",
      kind: "text",
      answer: "updater-helper",
      accept: ["/opt/.cache/updater-helper"],
      match: "contains",
      hint: "ss -tunp relie chaque socket à son processus. Cherchez le programme derrière le port 4455.",
      reveal:
        "updater-helper écoute sur 4455 et maintient une connexion vers 198.51.100.23:443. Son nom imite une mise à jour système, mais il vit dans /opt/.cache — un emplacement anormal pour un service légitime.",
      points: 20,
    },
    {
      prompt: "Quel est le PID de ce programme ?",
      kind: "text",
      answer: "3471",
      accept: ["pid 3471"],
      match: "contains",
      hint: "ps ou ss l'affichent sur la même ligne que le programme.",
      reveal:
        "Le PID 3471 relie la socket sortante, le port en écoute et le binaire sur disque : c'est la même entité. Cette corrélation vaut mieux que le nom du processus.",
      points: 20,
    },
    {
      prompt: "Comment ce programme se relance-t-il à chaque démarrage du poste ?",
      kind: "choice",
      choices: [
        "Un service systemd activé (updater-helper.service)",
        "Une tâche cron de l'utilisateur",
        "Un script de session graphique",
        "Un module chargé par le noyau",
      ],
      answer: "Un service systemd activé (updater-helper.service)",
      match: "exact",
      hint: "crontab -l est vide. Interrogez l'état du service avec systemctl.",
      reveal:
        "Le service est « enabled » : il redémarre à chaque boot. Tuer le processus seul le ferait revenir. La persistance doit être neutralisée, pas seulement le symptôme.",
      points: 20,
    },
    {
      prompt: "Première action de confinement, en préservant les preuves ?",
      kind: "choice",
      choices: [
        "Isoler le poste du réseau, désactiver et masquer le service, puis conserver mémoire et journaux",
        "Éteindre le poste et supprimer le binaire immédiatement",
        "Tuer le processus et considérer l'incident clos",
        "Changer le mot de passe de l'utilisateur et laisser le poste en service",
      ],
      answer:
        "Isoler le poste du réseau, désactiver et masquer le service, puis conserver mémoire et journaux",
      match: "exact",
      hint: "Coupez la capacité de nuire sans détruire l'état utile à l'enquête.",
      reveal:
        "L'isolation réseau coupe la balise sans éteindre la machine. Désactiver + masquer le service empêche son retour. L'acquisition mémoire et la conservation des journaux permettent ensuite d'établir le vecteur initial et la portée.",
      points: 20,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Case 2 · Intermédiaire — exposed backup on a web server
// ─────────────────────────────────────────────────────────────────────────
const APPLI_FUITE: SeedCase = {
  slug: "appli-qui-a-trop-parle",
  title: "L'appli qui a trop parlé",
  summary:
    "La supervision signale un gros téléchargement depuis le serveur web. Reconstituez ce qui a été servi, à qui, pourquoi — puis choisissez la correction durable.",
  setting:
    "Le graphe de bande passante du serveur web montre un pic nocturne isolé.\n\nAucune alerte applicative, aucune erreur 500. Juste un transfert sortant inhabituel vers une seule adresse.\n\nVous disposez du journal d'accès nginx et de la configuration du site. Reconstituez l'accès et proposez la correction.",
  guide:
    "RÉPONSES\n1) 203.0.113.37 — la seule IP qui atteint /backup/.\n2) db.sql.gz (/backup/db.sql.gz) servi en 200, ~48 Mo.\n3) Le dossier /backup/ est exposé par la configuration nginx, sans authentification (autoindex on).\n4) Sortir les sauvegardes de la racine web, restreindre l'accès, et régénérer les secrets contenus dans la base.\n\nPOURQUOI\nLe fichier n'a pas été « piraté » : il était publiquement servi. Bloquer l'IP ou ajouter un robots.txt ne retire pas le fichier de la toile ; supprimer le fichier ne corrige pas la configuration qui l'exposait.\n\nCOMMENT CORRIGER / DURCIR\n- Retirer /backup/ de la racine web (déplacer les sauvegardes hors du document root).\n- Désactiver autoindex ; refuser l'accès aux répertoires sensibles.\n- Régénérer tout secret présent dans la base exportée (mots de passe applicatifs, clés d'API).\n- La base exportée contient des données personnelles : évaluer une violation RGPD et, si le risque est avéré, notifier la CNIL sous 72 h.\n- Ajouter une supervision des accès aux chemins sensibles et des transferts sortants volumineux.",
  level: "Intermédiaire",
  category: "Analyse de logs",
  icon: "dns",
  estimatedMinutes: 18,
  isFree: false,
  published: true,
  artifacts: [
    {
      kind: "webos",
      label: "Serveur web — journaux",
      content: webos({
        user: "analyste",
        host: "srv-web-02",
        cwd: "/var/log/nginx",
        incident: "SUP-77 · transfert sortant inhabituel",
        allowed: [
          "ls", "cat", "grep", "head", "tail", "wc", "tree", "whoami", "pwd",
          "ss", "systemctl", "clear", "help",
        ],
        files: {
          "mission.txt":
            "MISSION — srv-web-02\n\n1. Quelle IP a téléchargé l'archive sensible ? (grep sur access.log)\n2. Quel fichier sensible a été servi avec un code 200 ?\n3. Pourquoi ce fichier était-il accessible ? (nginx-site.conf)\n4. Quelle correction empêche durablement cet accès ?\n\nConseil : grep \"/backup/\" access.log isole les requêtes vers le dossier de sauvegarde.",
          "access.log":
            "198.51.100.5 - - [11/Sep/2026:09:01:12] \"GET / HTTP/1.1\" 200 5312\n" +
            "198.51.100.5 - - [11/Sep/2026:09:01:13] \"GET /style.css HTTP/1.1\" 200 1840\n" +
            "203.0.113.37 - - [11/Sep/2026:02:14:03] \"GET /backup/ HTTP/1.1\" 200 740\n" +
            "203.0.113.37 - - [11/Sep/2026:02:14:20] \"GET /backup/db.sql.gz HTTP/1.1\" 200 48219004\n" +
            "203.0.113.37 - - [11/Sep/2026:02:16:55] \"GET /backup/.env.bak HTTP/1.1\" 200 1204\n" +
            "198.51.100.9 - - [11/Sep/2026:09:04:41] \"GET /contact HTTP/1.1\" 200 4102\n" +
            "198.51.100.5 - - [11/Sep/2026:09:05:02] \"GET /favicon.ico HTTP/1.1\" 200 318",
          "nginx-site.conf":
            "server {\n  listen 443 ssl;\n  server_name srv-web-02.sevigne.example;\n  root /var/www/app/public;\n\n  location /backup/ {\n    # hérité d'une ancienne procédure de sauvegarde\n    autoindex on;         # <-- liste et sert le contenu du dossier\n    # aucune directive auth_basic / allow / deny\n  }\n}",
          "note-analyste.txt":
            "Le dossier /backup/ se trouve SOUS la racine web (/var/www/app/public). Tout ce qui est sous la racine est servi au public, sauf restriction explicite.",
        },
        sim: {
          ss:
            "Netid State  Local Address:Port   Peer Address:Port   Process\n" +
            "tcp   LISTEN 0.0.0.0:443          0.0.0.0:*           users:((\"nginx\"))\n" +
            "tcp   LISTEN 0.0.0.0:22           0.0.0.0:*           users:((\"sshd\"))",
          "systemctl status nginx":
            "● nginx.service - A high performance web server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n     Active: active (running)",
        },
      }),
    },
  ],
  steps: [
    {
      prompt: "Quelle adresse IP a téléchargé l'archive sensible ?",
      kind: "text",
      answer: "203.0.113.37",
      match: "contains",
      hint: "grep \"/backup/\" access.log : une seule IP y accède.",
      reveal:
        "203.0.113.37 est la seule source à atteindre /backup/, à 02h14, hors de tout trafic normal. L'heure isolée et la cible confirment qu'il ne s'agit pas d'un visiteur ordinaire.",
      points: 20,
    },
    {
      prompt: "Quel fichier sensible a été servi avec un code 200 ?",
      kind: "text",
      answer: "db.sql.gz",
      accept: ["/backup/db.sql.gz"],
      match: "contains",
      hint: "Cherchez la ligne 200 avec la taille la plus élevée (~48 Mo).",
      reveal:
        "db.sql.gz est une sauvegarde complète de la base, servie en 200 avec 48 Mo transférés. Un .env.bak a suivi : il contient très probablement des secrets de configuration.",
      points: 20,
    },
    {
      prompt: "Pourquoi ce fichier était-il accessible ?",
      kind: "choice",
      choices: [
        "Le dossier /backup/ est servi par la configuration nginx, sans authentification (autoindex on)",
        "Un attaquant a obtenu un accès administrateur au serveur",
        "Le pare-feu était désactivé cette nuit-là",
        "La base de données écoutait directement sur Internet",
      ],
      answer:
        "Le dossier /backup/ est servi par la configuration nginx, sans authentification (autoindex on)",
      match: "exact",
      hint: "Relisez nginx-site.conf : où se trouve /backup/ et qu'autorise autoindex ?",
      reveal:
        "Le dossier de sauvegarde était sous la racine web, listé et servi par autoindex, sans aucune restriction. Rien n'a été « forcé » : le fichier était public.",
      points: 20,
    },
    {
      prompt: "Quelle correction empêche durablement cet accès ?",
      kind: "choice",
      choices: [
        "Sortir les sauvegardes de la racine web, restreindre l'accès, et régénérer les secrets exposés",
        "Bloquer l'adresse 203.0.113.37 dans le pare-feu",
        "Ajouter un fichier robots.txt interdisant /backup/",
        "Supprimer db.sql.gz du dossier /backup/",
      ],
      answer:
        "Sortir les sauvegardes de la racine web, restreindre l'accès, et régénérer les secrets exposés",
      match: "exact",
      hint: "La bonne correction traite la cause (la configuration), pas seulement le symptôme.",
      reveal:
        "Bloquer l'IP ou ajouter un robots.txt ne retire pas le fichier du Web ; supprimer le fichier laisse la configuration ouverte. Il faut déplacer les sauvegardes hors de la racine, restreindre l'accès et régénérer les secrets. La base exportée contenant des données personnelles, une violation RGPD doit être évaluée (notification CNIL sous 72 h si le risque est avéré).",
      points: 20,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Case 3 · Avancé #1 — ransomware incident response
// ─────────────────────────────────────────────────────────────────────────
const RANSOMWARE: SeedCase = {
  slug: "vendredi-17h-partage-chiffre",
  title: "Vendredi 17h02 : le partage est chiffré",
  summary:
    "Le partage de fichiers devient illisible un vendredi soir. Trouvez le patient zéro, le vecteur initial, et prenez les décisions de réponse — y compris réglementaires.",
  setting:
    "Vendredi, 17h02. Les appels arrivent : plus personne n'ouvre ses fichiers sur le partage commun.\n\nLes documents portent une nouvelle extension .verrou et une note est apparue dans chaque dossier.\n\nVous coordonnez la réponse. Il faut reconstituer l'origine, décider du traitement, et déterminer les obligations réglementaires — sans aggraver la situation.",
  guide:
    "RÉPONSES\n1) poste-rh-03 — premier poste à chiffrer, d'après le journal AV.\n2) Une pièce jointe piégée ouverte depuis un email (journal-av.txt).\n3) Ne pas payer : restaurer depuis des sauvegardes hors-ligne et conserver les preuves.\n4) Notifier la CNIL sous 72 h si des données personnelles sont touchées (et informer les personnes si le risque est élevé).\n5) Isoler les postes touchés en préservant mémoire et journaux, et déconnecter le partage.\n\nPOURQUOI\nPayer ne garantit rien, finance l'attaque et n'efface pas l'obligation de notifier. La position de cybermalveillance.gouv.fr et de l'ANSSI est de ne pas payer. L'enquête (patient zéro, vecteur) conditionne l'éradication : sans elle, la restauration réinfecte.\n\nCOMMENT CORRIGER / DURCIR\n- Sauvegardes 3-2-1 avec une copie hors-ligne/immuable testée en restauration.\n- Filtrage renforcé des pièces jointes + sensibilisation au phishing.\n- Segmentation réseau et moindre privilège sur les partages (éviter qu'un poste chiffre tout).\n- EDR avec confinement réseau à distance.\n- Déposer plainte ; conserver les preuves ; déclencher le plan de reprise.",
  level: "Avancé",
  category: "Réponse à incident",
  icon: "crisis_alert",
  estimatedMinutes: 25,
  isFree: false,
  published: true,
  artifacts: [
    {
      kind: "webos",
      label: "Cellule de crise — partage chiffré",
      content: webos({
        user: "analyste",
        host: "poste-soc-01",
        cwd: "/evidence/ir-91",
        incident: "IR-91 · rançongiciel",
        allowed: [
          "ls", "cat", "grep", "head", "tail", "wc", "tree", "whoami", "pwd",
          "last", "systemctl", "clear", "help",
        ],
        files: {
          "mission.txt":
            "MISSION — IR-91\n\n1. Quel poste est le patient zéro ? (journal-av.txt)\n2. Par quel vecteur l'infection a-t-elle commencé ?\n3. Faut-il payer la rançon ?\n4. Dans quel délai et à qui notifier si des données personnelles sont touchées ?\n5. Première action de confinement préservant les preuves ?\n\nLes pièces sont en lecture seule.",
          "journal-av.txt":
            "2026-09-25 16:38  poste-rh-03  EXEC  piece_jointe_facture.docm (macro) depuis Outlook\n" +
            "2026-09-25 16:41  poste-rh-03  PROC  comportement de chiffrement de masse détecté\n" +
            "2026-09-25 16:44  srv-partage  FILE  premiers fichiers renommés en *.verrou (accès via poste-rh-03)\n" +
            "2026-09-25 16:58  srv-partage  FILE  propagation du chiffrement sur \\\\srv-partage\\commun\n" +
            "2026-09-25 17:02  —            ALERTE utilisateurs : partage illisible",
          "partage.txt":
            "\\\\srv-partage\\commun\n  rapport_annuel.xlsx.verrou\n  paie_092026.csv.verrou\n  contrats/   (chiffré)\n  LISEZMOI_RESTAURATION.txt",
          "LISEZMOI_RESTAURATION.txt":
            "[note laissée par l'attaquant — pièce à conserver, ne pas suivre ses instructions]\nVos fichiers sont chiffrés. Contactez-nous pour « récupérer » vos données.\n(Interlocuteur anonyme, paiement en cryptomonnaie exigé.)",
          "connexions.txt":
            "srv-partage — accès SMB\n16:44  poste-rh-03  utilisateur rh\\mbernard\n16:45  poste-rh-03  écritures massives (renommage .verrou)",
          "sauvegardes.txt":
            "Sauvegardes srv-partage\n  - quotidienne sur NAS (même réseau)   : CHIFFRÉE aussi\n  - hebdomadaire sur bande hors-ligne   : SAINE, testée le 2026-09-19",
        },
        sim: {
          last:
            "mbernard pts/0  poste-rh-03  ven. sept. 25 08:12   still logged in\nreboot   system boot    ven. sept. 25 07:40",
          "systemctl status srv-partage":
            "● smbd.service - Samba SMB Daemon\n     Active: active (running)\n     Note : partage \\\\srv-partage\\commun — écritures massives récentes",
        },
      }),
    },
  ],
  steps: [
    {
      prompt: "Quel poste est le patient zéro de l'infection ?",
      kind: "text",
      answer: "poste-rh-03",
      accept: ["rh-03"],
      match: "contains",
      hint: "journal-av.txt est trié par heure : cherchez le premier événement de chiffrement.",
      reveal:
        "poste-rh-03 déclenche le comportement de chiffrement à 16h41, avant toute propagation sur le partage. C'est le point de départ de la chronologie.",
      points: 20,
    },
    {
      prompt: "Par quel vecteur l'infection a-t-elle commencé ?",
      kind: "choice",
      choices: [
        "Une pièce jointe piégée ouverte depuis un email",
        "Une attaque par force brute sur un accès distant",
        "Une clé USB inconnue branchée sur un poste",
        "Une mise à jour logicielle compromise",
      ],
      answer: "Une pièce jointe piégée ouverte depuis un email",
      match: "exact",
      hint: "La toute première ligne du journal AV nomme le fichier d'origine et son application source.",
      reveal:
        "Le journal montre l'exécution d'une pièce jointe à macro reçue dans Outlook, juste avant le chiffrement. Le vecteur est la messagerie — ce qui oriente la remédiation (filtrage + sensibilisation).",
      points: 20,
    },
    {
      prompt: "Faut-il payer la rançon ?",
      kind: "choice",
      choices: [
        "Non : restaurer depuis les sauvegardes hors-ligne et conserver les preuves",
        "Oui, pour récupérer les fichiers au plus vite",
        "Payer, puis restaurer quand même par sécurité",
        "Négocier le montant avant de décider",
      ],
      answer:
        "Non : restaurer depuis les sauvegardes hors-ligne et conserver les preuves",
      match: "exact",
      hint: "Une sauvegarde hors-ligne saine existe (sauvegardes.txt). Que recommandent l'ANSSI et cybermalveillance.gouv.fr ?",
      reveal:
        "Payer ne garantit pas la récupération, finance l'activité criminelle et n'efface aucune obligation. La bande hors-ligne est saine : la restauration est possible après éradication. On ne paie pas.",
      points: 20,
    },
    {
      prompt:
        "Des données personnelles (paie, contrats) sont touchées. Dans quel délai et à qui notifier ?",
      kind: "text",
      answer: "72",
      accept: ["cnil", "soixante-douze", "72h", "72 heures"],
      match: "contains",
      hint: "RGPD, article 33 : notification à l'autorité de contrôle dans un délai précis.",
      reveal:
        "Une violation de données personnelles se notifie à la CNIL sous 72 heures (RGPD art. 33). Si le risque pour les personnes est élevé, elles doivent aussi être informées (art. 34). Déposer plainte en parallèle.",
      points: 20,
    },
    {
      prompt: "Première action de confinement préservant les preuves ?",
      kind: "choice",
      choices: [
        "Isoler les postes touchés du réseau en préservant mémoire et journaux, et déconnecter le partage",
        "Éteindre tous les postes du bâtiment immédiatement",
        "Supprimer les fichiers .verrou pour nettoyer le partage",
        "Restaurer la sauvegarde tout de suite sur les mêmes postes",
      ],
      answer:
        "Isoler les postes touchés du réseau en préservant mémoire et journaux, et déconnecter le partage",
      match: "exact",
      hint: "Couper la propagation sans détruire l'état, et restaurer seulement après éradication.",
      reveal:
        "L'isolation stoppe la propagation en conservant la mémoire et les journaux nécessaires à l'enquête. Restaurer avant d'avoir éradiqué le vecteur réinfecterait. L'ordre est : contenir, acquérir, éradiquer, restaurer.",
      points: 20,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Case 4 · Avancé #2 — authorised audit: scope and judgement
// ─────────────────────────────────────────────────────────────────────────
const AUDIT: SeedCase = {
  slug: "audit-mandate-perimetre",
  title: "L'audit mandaté : jusqu'où aller ?",
  summary:
    "Vous êtes auditeur missionné, convention signée. Le scan révèle plus que prévu. Les bonnes décisions ne sont pas techniques : elles sont de périmètre, de preuve et de droit.",
  setting:
    "Jour 1 d'un test d'intrusion externe de trois jours pour le Groupe Sévigné.\n\nLa convention est signée et sur votre bureau. Le premier scan autorisé est terminé, et ses résultats vous attendent.\n\nCe cas n'évalue pas une technique offensive : il évalue votre jugement. Respect du périmètre, preuve minimale, cadre légal, remontée au client.",
  guide:
    "RÉPONSES\n1) Ne pas y toucher : consigner la faille de l'hôte EXCLU (192.0.2.10) et prévenir le client.\n2) 192.0.2.25 — hôte dans le périmètre exposant un panneau d'administration obsolète (8443).\n3) Obtenir une preuve minimale, puis s'arrêter et tout documenter.\n4) Alerter sans délai le contact d'urgence prévu par la convention.\n5) Article 323-1 du Code pénal (accès ou maintien frauduleux dans un STAD).\n\nPOURQUOI\nLa convention EST l'autorisation. Agir hors périmètre, même sur une faille réelle, est un accès non autorisé (323-1). La preuve minimale respecte aussi la minimisation des données (RGPD) : on démontre le risque sans aspirer les données.\n\nCOMMENT APPLIQUER (côté client, après l'audit)\n- Retirer d'Internet les consoles d'administration ; les placer derrière VPN/bastion.\n- Mettre à jour les services obsolètes et activer l'authentification forte.\n- Journaliser et superviser les accès d'administration.\n- Traiter les vulnérabilités critiques en priorité, selon le rapport d'audit.",
  level: "Avancé",
  category: "Gouvernance & audit",
  icon: "policy",
  estimatedMinutes: 20,
  isFree: false,
  published: true,
  artifacts: [
    {
      kind: "webos",
      label: "Poste auditeur — mission",
      content: webos({
        user: "auditeur",
        host: "poste-audit",
        cwd: "/home/auditeur/mission",
        incident: "AUDIT · Groupe Sévigné · jour 1/3",
        allowed: [
          "ls", "cat", "grep", "head", "tail", "wc", "tree", "whoami", "pwd",
          "nmap", "clear", "help",
        ],
        files: {
          "mission.txt":
            "MISSION — audit externe Groupe Sévigné\n\n1. Le scan révèle une faille critique sur un serveur EXCLU du périmètre. Que faites-vous ?\n2. Quel hôte DANS le périmètre expose un service d'administration obsolète ?\n3. Vous obtenez un accès de démonstration. Jusqu'où aller ?\n4. Jour 1 sur 3, faille critique : attendre le rapport final ou alerter ?\n5. Quel article encadre l'accès frauduleux à un système en France ?\n\nLisez d'abord convention-audit.txt, puis resultats-scan.txt.",
          "convention-audit.txt":
            "CONVENTION D'AUDIT (extrait)\n\nPérimètre AUTORISÉ    : 192.0.2.0/24\nEXCLU du périmètre    : 192.0.2.10 (ERP de production — ne pas tester)\nFenêtre d'intervention: 09h00–18h00, jours ouvrés\nContact d'urgence     : Mme Diallo, RSSI — rssi@sevigne.example\n\nRègle 1 : aucune action en dehors du périmètre autorisé.\nRègle 2 : toute vulnérabilité critique est signalée IMMÉDIATEMENT au contact d'urgence.\nRègle 3 : preuve de concept minimale ; pas d'extraction de données réelles.",
          "resultats-scan.txt":
            "Résultats de scan — périmètre 192.0.2.0/24\n\n192.0.2.10  [HORS PÉRIMÈTRE]  8080/tcp  console-admin 1.2  (obsolète, faille critique connue)\n192.0.2.25                    22/tcp    ssh OpenSSH 9.2\n                              443/tcp   https nginx 1.24 (à jour)\n                              8443/tcp  panneau-admin 2.0  (version obsolète, exposé)\n192.0.2.40                    80/tcp    http (à jour)\n192.0.2.52                    443/tcp   https (à jour)",
          "rappel-droit.txt":
            "Rappel : en France, l'accès ou le maintien frauduleux dans un système de traitement automatisé de données (STAD) est réprimé par l'article 323-1 du Code pénal. L'autorisation écrite du client (la convention) délimite précisément ce qui est permis.",
        },
        sim: {
          "nmap 192.0.2.0/24":
            "Nmap scan report — 192.0.2.0/24\n" +
            "192.0.2.10  [HORS PÉRIMÈTRE]  8080/tcp open  console-admin 1.2 (obsolète)\n" +
            "192.0.2.25  22/tcp open ssh ; 443/tcp open https ; 8443/tcp open panneau-admin 2.0 (obsolète)\n" +
            "192.0.2.40  80/tcp open http\n" +
            "192.0.2.52  443/tcp open https",
          nmap:
            "Précisez la cible autorisée, p. ex. : nmap 192.0.2.0/24 (périmètre de la convention).",
        },
      }),
    },
  ],
  steps: [
    {
      prompt:
        "Le scan révèle une faille critique sur 192.0.2.10, EXCLU du périmètre. Que faites-vous ?",
      kind: "choice",
      choices: [
        "Ne pas y toucher : le consigner dans le rapport et prévenir immédiatement le client",
        "Tester la faille puisqu'elle est critique, pour confirmer le risque",
        "L'exploiter discrètement et le mentionner seulement à la fin",
        "L'ignorer complètement, l'hôte étant hors périmètre",
      ],
      answer:
        "Ne pas y toucher : le consigner dans le rapport et prévenir immédiatement le client",
      match: "exact",
      hint: "La convention définit ce que vous avez le droit de faire. Que dit-elle sur le hors-périmètre et sur les failles critiques ?",
      reveal:
        "Hors périmètre, vous n'avez aucune autorisation : y toucher serait un accès frauduleux (323-1), même avec de bonnes intentions. Mais une faille critique ne s'ignore pas : on la consigne et on alerte le client sans la tester.",
      points: 20,
    },
    {
      prompt: "Quel hôte DANS le périmètre expose un service d'administration obsolète ?",
      kind: "text",
      answer: "192.0.2.25",
      accept: ["8443"],
      match: "contains",
      hint: "resultats-scan.txt : cherchez un panneau d'administration dont la version est marquée obsolète, sur un hôte autorisé.",
      reveal:
        "192.0.2.25 expose un panneau-admin 2.0 obsolète sur 8443. C'est dans le périmètre : c'est une cible d'audit légitime et prioritaire.",
      points: 20,
    },
    {
      prompt: "Vous obtenez un accès de démonstration sur cet hôte autorisé. Jusqu'où aller ?",
      kind: "choice",
      choices: [
        "Obtenir une preuve minimale, puis s'arrêter et tout documenter",
        "Exporter la base de données pour mesurer l'impact réel",
        "Pivoter vers les autres machines tant que l'accès est ouvert",
        "Laisser l'accès en place pour y revenir le lendemain",
      ],
      answer: "Obtenir une preuve minimale, puis s'arrêter et tout documenter",
      match: "exact",
      hint: "La convention demande une preuve de concept minimale et interdit l'extraction de données réelles.",
      reveal:
        "La preuve minimale suffit à démontrer le risque. Aspirer des données réelles viole la convention et la minimisation (RGPD) ; pivoter ou laisser un accès ouvert dépasse le mandat. On démontre, on documente, on s'arrête.",
      points: 20,
    },
    {
      prompt: "Jour 1 sur 3, faille critique confirmée dans le périmètre. Attendre le rapport final ou alerter ?",
      kind: "choice",
      choices: [
        "Alerter sans délai le contact d'urgence prévu par la convention",
        "Attendre le rapport final du jour 3 pour tout présenter ensemble",
        "Publier la faille pour faire réagir le client",
        "Corriger soi-même la configuration du serveur",
      ],
      answer: "Alerter sans délai le contact d'urgence prévu par la convention",
      match: "exact",
      hint: "La convention prévoit une règle explicite pour les vulnérabilités critiques.",
      reveal:
        "Une faille critique exploitable ne peut pas attendre trois jours. La convention prévoit une remontée immédiate au contact d'urgence (Mme Diallo). Corriger soi-même sortirait du rôle d'auditeur.",
      points: 20,
    },
    {
      prompt: "Quel article encadre l'accès ou le maintien frauduleux dans un système en France ?",
      kind: "text",
      answer: "323-1",
      accept: ["code penal", "code pénal", "323"],
      match: "contains",
      hint: "Voir rappel-droit.txt : l'article du Code pénal sur les atteintes aux STAD.",
      reveal:
        "L'article 323-1 du Code pénal réprime l'accès et le maintien frauduleux dans un système. La convention signée est précisément ce qui rend votre intervention licite — dans son périmètre, et nulle part ailleurs.",
      points: 20,
    },
  ],
};

const CASES: SeedCase[] = [POSTE_14, APPLI_FUITE, RANSOMWARE, AUDIT];

export const seedCatalogV2 = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const existingMax = Math.max(
      0,
      ...(await ctx.db.query("cases").collect()).map((c) => c.order),
    );
    let order = existingMax;
    const results: { slug: string; created: boolean }[] = [];

    for (const def of CASES) {
      const head = {
        title: def.title,
        summary: def.summary,
        setting: def.setting,
        guide: def.guide,
        level: def.level,
        category: def.category,
        icon: def.icon,
        estimatedMinutes: def.estimatedMinutes,
        isFree: def.isFree,
        published: def.published,
      };

      const existing = await ctx.db
        .query("cases")
        .withIndex("by_slug", (q) => q.eq("slug", def.slug))
        .unique();

      let caseId: Id<"cases">;
      if (existing) {
        caseId = existing._id;
        await ctx.db.patch(caseId, head);
        for (const table of ["caseArtifacts", "caseSteps", "caseStepAttempts"] as const) {
          const old = await ctx.db
            .query(table)
            .withIndex("by_case", (q) => q.eq("caseId", caseId))
            .collect();
          for (const row of old) await ctx.db.delete(row._id);
        }
        results.push({ slug: def.slug, created: false });
      } else {
        order += 1;
        caseId = await ctx.db.insert("cases", { ...head, slug: def.slug, order });
        results.push({ slug: def.slug, created: true });
      }

      for (const [i, a] of def.artifacts.entries()) {
        await ctx.db.insert("caseArtifacts", {
          caseId,
          order: i + 1,
          kind: a.kind,
          label: a.label,
          content: a.content,
        });
      }
      for (const [i, s] of def.steps.entries()) {
        await ctx.db.insert("caseSteps", {
          caseId,
          order: i + 1,
          prompt: s.prompt,
          kind: s.kind,
          choices: s.choices ?? [],
          answer: s.answer,
          accept: s.accept,
          match: s.match,
          hint: s.hint,
          reveal: s.reveal,
          points: s.points,
        });
      }
    }

    await logAudit(ctx, "case.seeded", admin.email, `Catalogue v2 : ${results.length} cas pratiques`);
    return results;
  },
});
