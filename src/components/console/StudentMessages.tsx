"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";
import ConversationThread, { formatTime } from "./ConversationThread";

/**
 * A student's messaging with the admin team.
 *
 * Two panes on desktop, one at a time on mobile: picking a thread there hides
 * the list, because a 40%-wide thread on a phone is unusable.
 */
export default function StudentMessages() {
  const conversations = useQuery(api.conversations.listMine, {});
  const start = useMutation(api.conversations.start);
  const send = useMutation(api.conversations.send);
  const markRead = useMutation(api.conversations.markRead);

  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = conversations?.find((c) => c._id === activeId) ?? null;

  // Opening a thread is what marks it read — not merely having it selected in
  // a list, and not the notification, which is a separate record.
  useEffect(() => {
    if (active && active.unreadForStudent > 0) {
      void markRead({ conversationId: active._id });
    }
  }, [active, markRead]);

  async function createThread(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = await start({ subject, body });
      setSubject("");
      setBody("");
      setComposing(false);
      setActiveId(id);
    } catch (err) {
      setError(cleanConvexError(err, "L'envoi a échoué."));
    } finally {
      setBusy(false);
    }
  }

  const listPane = (
    <aside
      className={`flex flex-col border-outline-variant/30 md:w-80 md:shrink-0 md:border-r ${
        activeId || composing ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="border-b border-outline-variant/30 p-4">
        <button
          type="button"
          onClick={() => {
            setComposing(true);
            setActiveId(null);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-on-primary transition-all hover:brightness-110"
        >
          <Icon name="edit_square" className="text-sm" fill />
          Nouveau message
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations === undefined && (
          <p className="p-4 font-code-sm text-code-sm text-on-surface-variant">Chargement…</p>
        )}
        {conversations?.length === 0 && (
          <div className="p-8 text-center">
            <Icon name="forum" className="mb-2 text-3xl text-on-surface-variant opacity-50" />
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Aucune conversation. Écrivez-nous, nous répondons dans la journée.
            </p>
          </div>
        )}
        <ul>
          {conversations?.map((c) => (
            <li key={c._id} className="border-t border-outline-variant/20 first:border-t-0">
              <button
                type="button"
                onClick={() => {
                  setActiveId(c._id);
                  setComposing(false);
                }}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-variant/60 ${
                  activeId === c._id ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate font-body-md text-on-surface">
                    {c.subject}
                  </span>
                  {c.unreadForStudent > 0 && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Non lu" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant">
                  <span>{formatTime(c.lastMessageAt)}</span>
                  {c.status === "closed" && (
                    <span className="rounded border border-outline-variant/40 px-1.5">clôturée</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <div className="glass-card flex h-[70vh] min-h-[30rem] overflow-hidden rounded-xl">
      {listPane}

      <div className={`min-w-0 flex-1 flex-col ${activeId || composing ? "flex" : "hidden md:flex"}`}>
        {composing ? (
          <form onSubmit={createThread} className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setComposing(false)}
                className="text-on-surface-variant hover:text-primary md:hidden"
                aria-label="Retour"
              >
                <Icon name="arrow_back" />
              </button>
              <h3 className="font-headline-lg-mobile text-on-surface">Nouveau message</h3>
            </div>
            <label className="mb-1 font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
              Sujet
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={140}
              required
              placeholder="Question sur le pack Intermédiaire"
              className="mb-4 w-full rounded border border-outline-variant bg-field p-3 text-on-surface outline-none transition-colors focus:border-secondary"
            />
            <label className="mb-1 font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              required
              rows={8}
              placeholder="Décrivez votre demande…"
              className="mb-4 w-full flex-1 resize-none rounded border border-outline-variant bg-field p-3 text-on-surface outline-none transition-colors focus:border-secondary"
            />
            {error && (
              <p className="mb-3 flex items-center gap-1.5 font-code-sm text-code-sm text-error">
                <Icon name="error" className="text-sm" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-bold text-on-secondary transition-all hover:brightness-110 disabled:opacity-40"
            >
              <Icon name="send" className="text-sm" fill />
              {busy ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        ) : active ? (
          <>
            <div className="flex items-center gap-3 border-b border-outline-variant/30 p-4">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="text-on-surface-variant hover:text-primary md:hidden"
                aria-label="Retour"
              >
                <Icon name="arrow_back" />
              </button>
              <div className="min-w-0">
                <h3 className="truncate font-headline-lg-mobile text-on-surface">
                  {active.subject}
                </h3>
                <p className="font-code-sm text-code-sm text-on-surface-variant">
                  {active.status === "closed" ? "Conversation clôturée" : "Conversation ouverte"}
                </p>
              </div>
            </div>
            <ConversationThread
              conversationId={active._id}
              viewerRole="student"
              disabled={active.status === "closed"}
              disabledReason="Cette conversation est clôturée. Ouvrez-en une nouvelle pour nous réécrire."
              onSend={(text) => send({ conversationId: active._id, body: text })}
            />
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center md:flex">
            <Icon name="forum" className="mb-3 text-4xl text-on-surface-variant opacity-50" />
            <p className="font-body-md text-on-surface-variant">
              Sélectionnez une conversation, ou écrivez-nous.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
