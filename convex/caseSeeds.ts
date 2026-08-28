import { mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { logAudit } from "./lib/audit";

/**
 * Idempotent content migration for the first advanced webOS investigation.
 * It is admin-gated because it writes published catalogue content.
 */
export const seedAdvancedWebOS = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const slug = "02h37-exfiltration-lente";
    const existing = await ctx.db
      .query("cases")
      .withIndex("by_slug", (query) => query.eq("slug", slug))
      .unique();
    if (existing) return { created: false, caseId: existing._id, slug };

    const allCases = await ctx.db.query("cases").collect();
    const order = Math.max(0, ...allCases.map((item) => item.order)) + 1;
    const caseId = await ctx.db.insert("cases", {
      title: "02h37 : exfiltration lente",
      slug,
      summary:
        "Un poste comptable émet des requêtes DNS régulières et anormalement longues. Distinguez la télémétrie légitime d’une fuite discrète.",
      setting:
        "02h37. La sonde réseau remonte une anomalie à faible volume sur client-fin-07.\n\nAucun transfert HTTP, aucun stockage cloud, aucune alerte antivirus. Pourtant, toutes les soixante secondes, le poste envoie une série de requêtes DNS à forte entropie.\n\nVous prenez la main sur le poste SOC en lecture seule. Votre mission : attribuer le trafic, reconstituer le mécanisme et choisir un confinement qui préserve les preuves.",
      level: "Avancé",
      category: "Détection & réponse",
      icon: "dns",
      estimatedMinutes: 22,
      isFree: false,
      published: true,
      order,
    });

    const files = {
      "mission.txt": [
        "DOSSIER IR-27 — EXFILTRATION À FAIBLE DÉBIT",
        "============================================",
        "",
        "Alerte initiale : 02:37:04 UTC",
        "Segment         : FINANCE-VLAN-24",
        "Périmètre       : journaux DNS, EDR et processus (lecture seule)",
        "",
        "Objectifs",
        "  1. Identifier la source du trafic anormal.",
        "  2. Qualifier le canal d'exfiltration.",
        "  3. Relier le trafic à un processus local.",
        "  4. Identifier le fichier potentiellement exposé.",
        "  5. Proposer le premier confinement sans détruire les preuves.",
        "",
        "Commandes utiles",
        "  grep sync-check dns.log",
        "  grep ESTABLISHED edr.log",
        "  grep 4182 processus.txt",
      ].join("\n"),
      "dns.log": [
        "02:32:02 resolver query src=10.24.8.41 type=A q=updates.assurlibre.test rcode=NOERROR",
        "02:33:18 resolver query src=10.24.8.17 type=A q=ntp.assurlibre.test rcode=NOERROR",
        "02:34:51 resolver query src=10.24.8.52 type=AAAA q=mail.assurlibre.test rcode=NOERROR",
        "02:35:00 resolver query src=10.24.8.17 type=TXT q=JBSWY3DPEHPK3PXP-001.sync-check.test rcode=NOERROR bytes=243",
        "02:35:01 resolver query src=10.24.8.17 type=TXT q=KRSXG5DSNFXGOIDB-002.sync-check.test rcode=NOERROR bytes=241",
        "02:35:02 resolver query src=10.24.8.17 type=TXT q=MFRGGZDFMZTWQ2LK-003.sync-check.test rcode=NOERROR bytes=244",
        "02:36:00 resolver query src=10.24.8.17 type=TXT q=ON2XEZJAMZXXE3DE-004.sync-check.test rcode=NOERROR bytes=242",
        "02:36:01 resolver query src=10.24.8.17 type=TXT q=ORUGS4ZANFZSAYJA-005.sync-check.test rcode=NOERROR bytes=245",
        "02:36:02 resolver query src=10.24.8.17 type=TXT q=PAIE2026AOUTFINS-006.sync-check.test rcode=NOERROR bytes=239",
        "02:37:00 resolver query src=10.24.8.17 type=TXT q=Q3F1YXJ0ZXJseV8x-007.sync-check.test rcode=NOERROR bytes=246",
        "02:37:01 resolver query src=10.24.8.17 type=TXT q=U2FsdGVkX19maW5h-008.sync-check.test rcode=NOERROR bytes=244",
        "02:37:04 ids alert src=10.24.8.17 rule=DNS_HIGH_ENTROPY_BURST score=92 domain=sync-check.test",
      ].join("\n"),
      "edr.log": [
        "02:34:58 client-fin-07 process_start pid=4182 user=svc-sync image=/usr/bin/python3 parent=systemd",
        "02:34:59 client-fin-07 file_open pid=4182 path=/srv/export/paie-aout.csv mode=READ",
        "02:35:00 client-fin-07 net_connect pid=4182 proto=UDP dst=10.24.0.53:53 state=ESTABLISHED",
        "02:35:00 client-fin-07 dns_query pid=4182 domain=sync-check.test type=TXT",
        "02:36:00 client-fin-07 dns_query pid=4182 domain=sync-check.test type=TXT",
        "02:37:00 client-fin-07 dns_query pid=4182 domain=sync-check.test type=TXT",
      ].join("\n"),
      "processus.txt": [
        "  PID USER      START   COMMAND",
        " 1042 root      00:01   /usr/local/bin/siem-collector --read-only",
        " 1088 root      00:01   /usr/local/bin/ids-sensor --interface eth0",
        " 3120 svc-back  01:00   /usr/bin/backup-agent --target vault-02",
        " 4182 svc-sync  02:34   /usr/bin/python3 /opt/sync/telemetry.py --batch 180",
        " 4227 analyste  02:38   hccsh",
        "",
        "FD ouverts pour PID 4182",
        "  4r REG /srv/export/paie-aout.csv",
        "  5u UDP client-fin-07:48722 -> resolver-01:53",
      ].join("\n"),
      "inventaire.csv": [
        "hostname,ip,role,proprietaire,criticite",
        "client-fin-07,10.24.8.17,poste comptabilité,service paie,haute",
        "client-fin-12,10.24.8.41,poste comptabilité,trésorerie,moyenne",
        "srv-files-02,10.24.8.52,partage finance,infrastructure,haute",
      ].join("\n"),
      "chronologie.txt": [
        "02:34:58  Démarrage de telemetry.py par le compte de service svc-sync",
        "02:34:59  Ouverture en lecture de /srv/export/paie-aout.csv",
        "02:35:00  Première rafale de requêtes TXT vers sync-check.test",
        "02:36:00  Deuxième rafale — périodicité 60 secondes",
        "02:37:04  Déclenchement de la règle DNS_HIGH_ENTROPY_BURST",
        "02:38:11  Ouverture de la session analyste en lecture seule",
      ].join("\n"),
    };

    await ctx.db.insert("caseArtifacts", {
      caseId,
      order: 1,
      kind: "webos",
      label: "Poste SOC — analyse d’exfiltration",
      content: JSON.stringify({
        user: "analyste",
        host: "soc-ir-04",
        cwd: "/evidence/ir-27",
        incident: "IR-27 · DNS anomaly",
        apps: ["dossier", "terminal", "files", "monitor"],
        openOnStart: ["mission.txt"],
        allowed: ["ls", "cat", "grep", "wc", "head", "tail", "tree", "whoami", "pwd", "ps", "netstat", "clear", "help"],
        files,
      }),
    });

    const steps = [
      {
        prompt: "Quelle adresse IP est à l’origine des rafales DNS anormales ?",
        kind: "text" as const,
        choices: [],
        answer: "10.24.8.17",
        accept: [],
        match: "contains" as const,
        hint: "Filtrez dns.log sur le domaine signalé par l’IDS.",
        reveal: "L’inventaire associe 10.24.8.17 à client-fin-07, un poste du service paie. La criticité métier change immédiatement la priorité de l’alerte.",
        points: 20,
      },
      {
        prompt: "Quel mécanisme d’exfiltration ces requêtes révèlent-elles ? Répondez avec vos mots.",
        kind: "text" as const,
        choices: [],
        answer: "dns",
        accept: ["tunnel"],
        match: "keywords" as const,
        hint: "Les sous-domaines longs transportent-ils seulement un nom d’hôte ?",
        reveal: "Un tunnel DNS encode des fragments de données dans des requêtes autorisées par presque tous les réseaux. Le faible débit et la périodicité visent à rester sous les seuils volumétriques.",
        points: 20,
      },
      {
        prompt: "Quel PID relie les requêtes DNS au poste local ?",
        kind: "text" as const,
        choices: [],
        answer: "4182",
        accept: ["PID 4182"],
        match: "contains" as const,
        hint: "edr.log associe chaque requête à un identifiant de processus.",
        reveal: "Le PID 4182 appartient à telemetry.py, démarré par un compte de service. Un nom rassurant n’est pas une preuve de légitimité : la corrélation processus-fichier-réseau l’emporte.",
        points: 20,
      },
      {
        prompt: "Quel fichier a été ouvert juste avant la première rafale ?",
        kind: "text" as const,
        choices: [],
        answer: "paie-aout.csv",
        accept: ["/srv/export/paie-aout.csv"],
        match: "contains" as const,
        hint: "Cherchez file_open dans edr.log ou les descripteurs ouverts du processus.",
        reveal: "Le fichier paie-aout.csv contient vraisemblablement des données personnelles et financières. La réponse à incident doit désormais intégrer l’évaluation d’une violation de données.",
        points: 20,
      },
      {
        prompt: "Décision : quelle première action contient l’incident tout en préservant les preuves ?",
        kind: "choice" as const,
        choices: [
          "Éteindre immédiatement client-fin-07 et supprimer telemetry.py",
          "Isoler client-fin-07, bloquer sync-check.test au DNS et préserver mémoire et journaux",
          "Bloquer uniquement le domaine et attendre la prochaine rafale",
          "Changer le mot de passe de svc-sync sans interrompre le poste",
        ],
        answer: "Isoler client-fin-07, bloquer sync-check.test au DNS et préserver mémoire et journaux",
        accept: [],
        match: "exact" as const,
        hint: "Le confinement doit couper le canal sans effacer l’état utile à l’enquête.",
        reveal: "L’isolation EDR coupe l’exfiltration sans éteindre la machine. Le blocage DNS protège le reste du parc ; l’acquisition mémoire et la conservation des journaux permettent ensuite de mesurer l’exposition et d’identifier le vecteur initial.",
        points: 20,
      },
    ];

    for (const [index, step] of steps.entries()) {
      await ctx.db.insert("caseSteps", { caseId, order: index + 1, ...step });
    }

    await logAudit(ctx, "case.seeded", admin.email, `Advanced webOS case: ${slug}`);
    return { created: true, caseId, slug };
  },
});
