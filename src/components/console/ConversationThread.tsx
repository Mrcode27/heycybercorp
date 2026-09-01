"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

/**
 * The messages of one conversation, plus the box to answer in.
 *
 * Shared by both sides of the messaging feature. The only thing that differs
 * is which bubbles read as "mine", which is why `viewerRole` is a prop rather
 * than something this component works out for itself — the admin view has to
 * render a student's thread without becoming that student.
 */

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationThread({
  conversationId,
  viewerRole,
  disabled,
  disabledReason,
  onSend,
  placeholder = "Écrivez votre message…",
}: {
  conversationId: Id<"conversations">;
  viewerRole: "student" | "admin";
  disabled?: boolean;
  disabledReason?: string;
  /** Resolves when the message is committed. Convex mutations resolve to null. */
  onSend: (body: string) => Promise<unknown>;
  placeholder?: string;
}) {
  const messages = useQuery(api.conversations.messages, { conversationId });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the conversation down as it grows, the way a chat is expected to
  // behave. `messages?.length` rather than `messages` so a no-op refetch of
  // identical data does not yank the view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages?.length, conversationId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(body);
      setDraft("");
    } catch (err) {
      setError(cleanConvexError(err, "L'envoi a échoué."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages === undefined && (
          <p className="font-code-sm text-code-sm text-on-surface-variant">Chargement…</p>
        )}
        {messages?.map((m) => {
          const mine = m.authorRole === viewerRole;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  mine
                    ? "bg-primary/15 border border-primary/25"
                    : "bg-surface-variant border border-outline-variant/30"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                    {m.authorRole === "admin" ? "heycybercorp" : "Étudiant"}
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant/70">
                    {formatTime(m._creationTime)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words font-body-md text-body-md text-on-surface">
                  {m.body}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="border-t border-outline-variant/30 p-4"
        aria-label="Répondre"
      >
        {disabled ? (
          <p className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant">
            <Icon name="lock" className="text-sm" />
            {disabledReason ?? "Cette conversation est clôturée."}
          </p>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a new line — the convention
                // every chat box already trained people on.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(e as unknown as React.FormEvent);
                }
              }}
              rows={3}
              maxLength={5000}
              placeholder={placeholder}
              className="w-full resize-y rounded border border-outline-variant bg-field p-3 font-body-md text-on-surface outline-none transition-colors focus:border-secondary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-code-sm text-code-sm text-on-surface-variant/70">
                Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
              </span>
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 font-bold text-on-secondary transition-all hover:brightness-110 disabled:opacity-40"
              >
                <Icon name="send" className="text-sm" fill />
                {busy ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </>
        )}
        {error && (
          <p className="mt-2 flex items-center gap-1.5 font-code-sm text-code-sm text-error">
            <Icon name="error" className="text-sm" />
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
