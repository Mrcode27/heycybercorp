#!/usr/bin/env node
/**
 * Copy the mail settings from .env.local onto the Convex deployment.
 *
 * Why this exists: the emails are sent from a Convex action, and Convex
 * actions read their own deployment environment — they never see .env.local.
 * Editing .env.local alone would look right and do nothing, which is a nasty
 * way to lose an afternoon. This script closes that gap in one command.
 *
 *   npm run mail:sync            → dev deployment (localhost + Vercel preview)
 *   npm run mail:sync -- --prod  → production deployment (www.heycybercorp.fr)
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");

/** Keys we own. SMTP_USER + SMTP_PASSWORD are the only mandatory ones. */
const KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM", "MAIL_TO"];
const SECRET = new Set(["SMTP_PASSWORD"]);

const prod = process.argv.includes("--prod");
const target = prod ? "production" : "dev";

if (!existsSync(ENV_FILE)) {
  console.error(`✖ ${ENV_FILE} introuvable.`);
  process.exit(1);
}

/** Minimal .env parser: KEY=VALUE, optional quotes, # comments, blank lines. */
function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnv(readFileSync(ENV_FILE, "utf8"));
const present = KEYS.filter((k) => (env[k] ?? "").trim() !== "");

if (!present.includes("SMTP_USER") || !present.includes("SMTP_PASSWORD")) {
  console.error(
    "✖ SMTP_USER et SMTP_PASSWORD doivent être renseignés dans .env.local.\n" +
      "  SMTP_PASSWORD est un mot de passe d'application Google (16 caractères),\n" +
      "  pas le mot de passe du compte : https://myaccount.google.com/apppasswords",
  );
  process.exit(1);
}

// Google shows app passwords as "abcd efgh ijkl mnop"; the spaces are purely
// cosmetic. Strip them here so a copy-paste with spaces still works.
const appPassword = env.SMTP_PASSWORD.replace(/\s+/g, "");
if (appPassword.length !== 16) {
  console.warn(
    `⚠ SMTP_PASSWORD fait ${appPassword.length} caractères ; ` +
      "un mot de passe d'application Google en fait 16. Vérifiez que ce n'est " +
      "pas le mot de passe du compte.",
  );
}

console.log(`Cible : déploiement ${target}\n`);
for (const key of present) {
  const value = key === "SMTP_PASSWORD" ? appPassword : env[key].trim();
  const args = ["convex", "env", "set", key, value];
  if (prod) args.push("--prod");
  try {
    execFileSync("npx", args, { cwd: ROOT, stdio: "pipe", shell: true });
    console.log(`  ✔ ${key} = ${SECRET.has(key) ? "•".repeat(12) : value}`);
  } catch (err) {
    console.error(`  ✖ ${key} — ${err.stderr?.toString().trim() || err.message}`);
    process.exit(1);
  }
}

console.log(
  `\nTerminé. Vérifiez avec :\n` +
    `  npx convex run email:diagnose${prod ? " --prod" : ""}\n` +
    `  npx convex run email:sendTest${prod ? " --prod" : ""}`,
);
