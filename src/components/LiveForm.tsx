"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "./Icon";
import { cleanConvexError } from "@/lib/errors";

type LiveFormProps = {
  /** "contact" or "devis" — how the message is tagged in the admin inbox. */
  kind: "contact" | "devis";
  children: React.ReactNode;
  className?: string;
  submitLabel: string;
  submitClassName: string;
  submitIcon?: string;
};

// Inlined at build time — mirrors the guard in ConvexClientProvider.
const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Client form wrapper that stores submissions in Convex (messages table).
 * Reads its fields from the children's `name` attributes:
 *   nom (required) · email (required) · message (required) · sujet (optional)
 * Any other named field (entreprise, effectif, type…) is appended to the body.
 */
export default function LiveForm(props: LiveFormProps) {
  // Without a Convex deployment the hooks below would throw during prerender;
  // fall back to a visibly-disabled form instead of crashing the page.
  if (!convexConfigured) {
    return (
      <form className={props.className} onSubmit={(e) => e.preventDefault()}>
        {props.children}
        <button type="submit" className={props.submitClassName} disabled>
          {props.submitLabel}
          {props.submitIcon && <Icon name={props.submitIcon} />}
        </button>
        <p className="font-code-sm text-code-sm text-on-surface-variant">
          Formulaire indisponible — backend non configuré.
        </p>
      </form>
    );
  }
  return <LiveFormInner {...props} />;
}

function LiveFormInner({
  kind,
  children,
  className = "",
  submitLabel,
  submitClassName,
  submitIcon,
}: LiveFormProps) {
  const submitMessage = useMutation(api.messages.submit);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const known = new Set(["nom", "email", "sujet", "message"]);
    const extras: string[] = [];
    for (const [key, value] of data.entries()) {
      if (!known.has(key) && String(value).trim()) {
        extras.push(`${key[0].toUpperCase()}${key.slice(1)} : ${String(value).trim()}`);
      }
    }
    const message = String(data.get("message") ?? "").trim();
    const body = extras.length > 0 ? `${message}\n\n— ${extras.join("\n— ")}` : message;

    setState("sending");
    setError(null);
    try {
      await submitMessage({
        kind,
        name: String(data.get("nom") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        subject:
          String(data.get("sujet") ?? "").trim() ||
          (kind === "devis" ? "Demande de devis" : undefined),
        body,
      });
      setState("sent");
      form.reset();
    } catch (err) {
      setError(cleanConvexError(err));
      setState("error");
    }
  }

  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
      <button type="submit" disabled={state === "sending"} className={submitClassName}>
        {state === "sending" ? "Transmission…" : submitLabel}
        {submitIcon && <Icon name={submitIcon} />}
      </button>
      {state === "sent" && (
        <p className="font-code-sm text-code-sm text-primary flex items-center gap-2">
          <Icon name="check_circle" className="text-sm" fill />
          Requête transmise — nos experts vous répondront sous 24h.
        </p>
      )}
      {state === "error" && error && (
        <p className="font-code-sm text-code-sm text-error flex items-center gap-2">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}
    </form>
  );
}
