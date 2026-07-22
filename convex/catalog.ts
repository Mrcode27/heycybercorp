import { mutation } from "./_generated/server";

type Level = "Débutant" | "Intermédiaire" | "Avancé";

/**
 * One-time real catalogue setup for heycybercorp.
 * Upserts the 3 packages (by slug) and their courses, and removes the old
 * placeholder demo courses. Idempotent — safe to re-run.
 *
 * Run with:  npx convex run catalog:setup
 */

const PACKAGES: {
  slug: string;
  name: string;
  tagline: string;
  priceEur: number; // cents
  priceXof: number; // FCFA
  levels: Level[];
  featured: boolean;
  order: number;
  features: string[];
}[] = [
  {
    slug: "debutant",
    name: "Débutant",
    tagline: "Les fondamentaux pour bien démarrer",
    priceEur: 4000,
    priceXof: 15000,
    levels: ["Débutant"],
    featured: false,
    order: 1,
    features: [
      "Introduction à la Cybersécurité",
      "Installer son Environnement de Hacking Éthique",
      "Introduction au Hacking Éthique",
      "Les Outils Essentiels du Pentester",
      "Sécurité des Réseaux Wi-Fi",
      "Gouvernance, Risques et Conformité (GRC)",
    ],
  },
  {
    slug: "intermediaire",
    name: "Intermédiaire",
    tagline: "Passez à la pratique offensive et défensive",
    priceEur: 6000,
    priceXof: 30000,
    levels: ["Intermédiaire"],
    featured: true,
    order: 2,
    features: [
      "Test d'Intrusion Réseau (Pentest)",
      "Linux pour la Cybersécurité",
      "Red Team & Blue Team",
      "OSINT — Renseignement en Sources Ouvertes",
      "Créer son Laboratoire de Hacking",
    ],
  },
  {
    slug: "avance",
    name: "Piratage Éthique",
    tagline: "Techniques avancées, cadre 100% éthique",
    priceEur: 8000,
    priceXof: 45000,
    levels: ["Avancé"],
    featured: false,
    order: 3,
    features: [
      "Sécurité Wi-Fi Offensive : Attaques et Contre-mesures",
      "Sécurité des Comptes TikTok : Menaces et Protection",
      "Sécurité des Comptes Facebook : Menaces et Protection",
      "Sécurité des Comptes Instagram : Menaces et Protection",
    ],
  },
];

const COURSES: { slug: string; title: string; level: Level; description: string }[] = [
  // ---- Pack Débutant ----
  {
    slug: "introduction-cybersecurite",
    title: "Introduction à la Cybersécurité",
    level: "Débutant",
    description:
      "Les concepts fondamentaux de la cybersécurité : menaces, vulnérabilités, principes de défense et hygiène numérique.",
  },
  {
    slug: "environnement-hacking-ethique",
    title: "Installer son Environnement de Hacking Éthique",
    level: "Débutant",
    description:
      "Mettez en place une machine virtuelle, Kali Linux et les outils de base pour pratiquer en toute sécurité et légalité.",
  },
  {
    slug: "introduction-hacking-ethique",
    title: "Introduction au Hacking Éthique",
    level: "Débutant",
    description:
      "Découvrez la démarche du hacker éthique : cadre légal, méthodologie de test d'intrusion et état d'esprit défensif.",
  },
  {
    slug: "outils-essentiels-pentest",
    title: "Les Outils Essentiels du Pentester",
    level: "Débutant",
    description:
      "Prise en main des outils incontournables (Nmap, Wireshark, Burp Suite…) utilisés lors des tests de sécurité autorisés.",
  },
  {
    slug: "securite-wifi",
    title: "Sécurité des Réseaux Wi-Fi",
    level: "Débutant",
    description:
      "Comprendre le fonctionnement et les faiblesses des réseaux Wi-Fi pour mieux les protéger au quotidien.",
  },
  {
    slug: "gouvernance-risques-conformite",
    title: "Gouvernance, Risques et Conformité (GRC)",
    level: "Débutant",
    description:
      "Les bases de la GRC : politiques de sécurité, gestion des risques et normes de conformité en entreprise.",
  },

  // ---- Pack Intermédiaire ----
  {
    slug: "pentest-reseau",
    title: "Test d'Intrusion Réseau (Pentest)",
    level: "Intermédiaire",
    description:
      "Méthodologie complète d'un test d'intrusion réseau autorisé : reconnaissance, scan, exploitation et rapport.",
  },
  {
    slug: "linux-cybersecurite",
    title: "Linux pour la Cybersécurité",
    level: "Intermédiaire",
    description:
      "Maîtrisez la ligne de commande, le scripting et l'administration Linux appliqués à la sécurité offensive et défensive.",
  },
  {
    slug: "red-team-blue-team",
    title: "Red Team & Blue Team",
    level: "Intermédiaire",
    description:
      "Les deux facettes de la sécurité : simuler des attaques (Red Team) et bâtir la défense et la détection (Blue Team).",
  },
  {
    slug: "osint",
    title: "OSINT — Renseignement en Sources Ouvertes",
    level: "Intermédiaire",
    description:
      "Collecter et analyser des informations publiques de façon éthique dans le cadre d'une évaluation de sécurité.",
  },
  {
    slug: "laboratoire-hacking",
    title: "Créer son Laboratoire de Hacking",
    level: "Intermédiaire",
    description:
      "Montez un environnement de test réaliste et isolé pour vous entraîner légalement aux techniques d'attaque et de défense.",
  },

  // ---- Pack Piratage Éthique (niveau Avancé) ----
  {
    slug: "securite-wifi-offensive",
    title: "Sécurité Wi-Fi Offensive : Attaques et Contre-mesures",
    level: "Avancé",
    description:
      "Techniques d'audit avancées des réseaux Wi-Fi, dans un cadre strictement autorisé, et mesures de protection efficaces.",
  },
  {
    slug: "securite-compte-tiktok",
    title: "Sécurité des Comptes TikTok : Menaces et Protection",
    level: "Avancé",
    description:
      "Comprendre le phishing et l'ingénierie sociale ciblant les comptes TikTok pour mieux les protéger. Cadre défensif et légal uniquement.",
  },
  {
    slug: "securite-compte-facebook",
    title: "Sécurité des Comptes Facebook : Menaces et Protection",
    level: "Avancé",
    description:
      "Analyser les techniques de compromission (phishing, réutilisation de mots de passe) visant Facebook et apprendre à s'en défendre.",
  },
  {
    slug: "securite-compte-instagram",
    title: "Sécurité des Comptes Instagram : Menaces et Protection",
    level: "Avancé",
    description:
      "Reconnaître et prévenir les attaques ciblant les comptes Instagram : phishing, faux support, sécurisation et double authentification.",
  },
];

// Placeholder demo courses shipped earlier — removed so only the real catalogue remains.
const DEMO_SLUGS = [
  "introduction-reseaux-securises",
  "ligne-de-commande-linux",
  "cryptographie-appliquee",
  "pentest-web",
  "soc-incident-response",
  "reverse-engineering",
];

export const setup = mutation({
  args: {},
  handler: async (ctx) => {
    // 1) Upsert packages by slug
    for (const p of PACKAGES) {
      const existing = await ctx.db
        .query("packages")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .unique();
      const doc = {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        priceEur: p.priceEur,
        priceXof: p.priceXof,
        features: p.features,
        levels: p.levels,
        published: true,
        featured: p.featured,
        order: p.order,
      };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("packages", doc);
    }

    // 2) Remove leftover demo courses (+ their lessons & progress)
    let removed = 0;
    for (const slug of DEMO_SLUGS) {
      const course = await ctx.db
        .query("courses")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!course) continue;
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect();
      for (const l of lessons) await ctx.db.delete(l._id);
      const prog = await ctx.db
        .query("progress")
        .filter((q) => q.eq(q.field("courseId"), course._id))
        .collect();
      for (const pr of prog) await ctx.db.delete(pr._id);
      await ctx.db.delete(course._id);
      removed++;
    }

    // 3) Upsert real courses by slug
    let created = 0;
    for (const c of COURSES) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_slug", (q) => q.eq("slug", c.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          title: c.title,
          level: c.level,
          description: c.description,
          published: true,
        });
      } else {
        await ctx.db.insert("courses", {
          slug: c.slug,
          title: c.title,
          level: c.level,
          description: c.description,
          azureContainer: "course-videos",
          published: true,
        });
        created++;
      }
    }

    return `Packages: ${PACKAGES.length} · Cours créés: ${created}/${COURSES.length} · Démos supprimés: ${removed}.`;
  },
});
