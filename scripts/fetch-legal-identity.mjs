#!/usr/bin/env node
/**
 * Fill the LEGAL block in src/lib/site.ts from the French company registry,
 * so the legal notice is populated without anyone typing an address twice.
 *
 *   npm run legal:fetch -- 123456789        (your SIREN, 9 digits)
 *
 * Source: recherche-entreprises.api.gouv.fr — the government's open company
 * search. Free, no key, authoritative. Whatever it returns is what the state
 * already publishes about the company, which is exactly what a legal notice is
 * meant to reproduce.
 *
 * What it CANNOT fill, because no registry exposes it:
 *   • capital social — held by the INPI, not this API. Only needed for a
 *     société (SAS/SARL/SA); an entreprise individuelle has none.
 *   • the consumer mediator — a paid subscription you choose yourself.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_TS = resolve(ROOT, "src/lib/site.ts");

const siren = (process.argv[2] || "").replace(/\s/g, "");
if (!/^\d{9}$/.test(siren)) {
  console.error(
    "✖ Usage : npm run legal:fetch -- <SIREN>\n" +
      "  Le SIREN fait 9 chiffres. Il figure sur votre avis de situation INSEE\n" +
      "  ou sur annuaire-entreprises.data.gouv.fr.",
  );
  process.exit(1);
}

/** INSEE legal-form codes → the label a legal notice should show. */
const FORMS = {
  1000: "Entrepreneur individuel",
  5202: "Société en nom collectif",
  5306: "Société en commandite simple",
  5410: "SARL",
  5415: "SARL",
  5426: "SARL",
  5498: "EURL",
  5499: "SARL",
  5505: "SA",
  5510: "SA",
  5515: "SA",
  5599: "SA",
  5710: "SAS",
  5720: "SASU",
  5785: "SAS",
  6540: "SCI",
  9220: "Association déclarée",
};

/** Fall back on the code family when the exact code isn't listed. */
function legalForm(code) {
  const c = String(code ?? "");
  if (FORMS[c]) return FORMS[c];
  if (c.startsWith("1")) return "Entrepreneur individuel";
  if (c.startsWith("54")) return "SARL";
  if (c.startsWith("57")) return "SAS";
  if (c.startsWith("55")) return "SA";
  if (c.startsWith("92")) return "Association déclarée";
  return "";
}

/**
 * French intracommunity VAT = FR + 2-digit key + SIREN, the key being
 * (12 + 3 × (SIREN mod 97)) mod 97. Computed only if the API omits it.
 */
function vatFromSiren(s) {
  const key = (12 + 3 * (Number(s) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${s}`;
}

/**
 * The open API is rate-limited per IP and answers 429 in bursts, so a single
 * attempt is not a reliable answer. Back off and retry before giving up.
 */
async function search(url, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const r = await fetch(url);
    if (r.ok) return r;
    if (r.status !== 429 && r.status < 500) return r;
    const wait = 2000 * (i + 1);
    console.log(`  … API occupée (HTTP ${r.status}), nouvel essai dans ${wait / 1000}s`);
    await new Promise((ok) => setTimeout(ok, wait));
  }
  return fetch(url);
}

const res = await search(
  `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&per_page=1`,
);
if (!res.ok) {
  console.error(
    `✖ API indisponible (HTTP ${res.status}). Réessayez dans une minute — ` +
      "le service public limite le nombre d'appels.",
  );
  process.exit(1);
}
const found = (await res.json()).results?.[0];
if (!found || found.siren !== siren) {
  console.error(`✖ Aucune entreprise trouvée pour le SIREN ${siren}.`);
  process.exit(1);
}
if (found.etat_administratif && found.etat_administratif !== "A") {
  console.warn("⚠ Cette entreprise est signalée comme CESSÉE au registre.");
}

const siege = found.siege ?? {};
// A director who legally represents the company is the publication director.
const boss = (found.dirigeants ?? []).find((d) =>
  /président|gérant|directeur général/i.test(d.qualite ?? ""),
);
const director = boss
  ? [boss.prenoms, boss.nom]
      .filter(Boolean)
      .join(" ")
      .replace(/\s*\([^)]*\)/g, "") // the registry repeats the surname in parens
      .replace(/\s+/g, " ")
      .trim()
  : "";

const identity = {
  companyName: found.nom_raison_sociale || found.nom_complet || "heycybercorp",
  legalForm: legalForm(found.nature_juridique),
  capital: "",
  siren,
  rcsCity: toTitle(siege.libelle_commune || ""),
  // `tva` is not reliably a VAT string here — accept it only when it looks
  // like one, otherwise derive it from the SIREN.
  vatNumber: /^FR[0-9A-Z]{2}\d{9}$/.test(String(found.tva ?? ""))
    ? String(found.tva)
    : vatFromSiren(siren),
  address: toTitle(siege.adresse || ""),
  publicationDirector: toTitle(director),
  mediator: { name: "", url: "" },
};

/** The registry SHOUTS everything; a legal notice shouldn't. */
function toTitle(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/(^|[\s'-])([a-zà-ÿ])/g, (_, sep, ch) => sep + ch.toUpperCase())
    .trim();
}

// The registry is loosely typed — a field can arrive null, numeric or boolean.
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const block = `export const LEGAL: LegalIdentity = {
  companyName: "${esc(identity.companyName)}",
  legalForm: "${esc(identity.legalForm)}",
  capital: "${esc(identity.capital)}",
  siren: "${esc(identity.siren)}",
  rcsCity: "${esc(identity.rcsCity)}",
  vatNumber: "${esc(identity.vatNumber)}",
  address: "${esc(identity.address)}",
  publicationDirector: "${esc(identity.publicationDirector)}",
  mediator: { name: "${esc(identity.mediator.name)}", url: "${esc(identity.mediator.url)}" },
};`;

const source = readFileSync(SITE_TS, "utf8");
const pattern = /export const LEGAL: LegalIdentity = \{[\s\S]*?\n\};/;
if (!pattern.test(source)) {
  console.error("✖ Bloc LEGAL introuvable dans src/lib/site.ts — rien modifié.");
  process.exit(1);
}
writeFileSync(SITE_TS, source.replace(pattern, block), "utf8");

console.log(`✔ src/lib/site.ts mis à jour depuis le registre :\n`);
for (const [k, v] of Object.entries(identity)) {
  if (k === "mediator") continue;
  console.log(`  ${k.padEnd(22)} ${v || "—"}`);
}

const société = /SAS|SARL|SA$|EURL|SASU|SCI/.test(identity.legalForm);
console.log("\nReste à renseigner à la main :");
if (société) {
  console.log("  • capital  — montant des statuts (obligatoire pour une société)");
} else {
  console.log("  • capital  — sans objet pour une entreprise individuelle");
}
if (!identity.publicationDirector) {
  console.log("  • publicationDirector — le registre n'a pas publié de dirigeant");
}
console.log("  • mediator — médiateur de la consommation (art. L612-1), à souscrire");
