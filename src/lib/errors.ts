/**
 * Convex wraps thrown errors as
 * "[CONVEX M(...)] [Request ID: …] Server Error Uncaught Error: <message> at handler (…)".
 * Keep only the human-readable French message for display.
 * ([\s\S] instead of the `s` regex flag — tsconfig targets pre-es2018.)
 */
export function cleanConvexError(err: unknown, fallback = "Une erreur est survenue.") {
  const raw = err instanceof Error ? err.message : String(err);
  const clean = raw
    .replace(/^[\s\S]*Uncaught Error:\s*/, "")
    .replace(/\s+at [\s\S]*$/, "")
    .trim();
  return clean || fallback;
}
