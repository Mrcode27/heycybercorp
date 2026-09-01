"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";
import ConversationThread, { formatTime } from "./ConversationThread";

/**
 * The admin side of in-app messaging.
 *
 * Threads are not assigned to an individual admin — any admin can answer any
 * thread, so this is a shared queue rather than a personal inbox. Replying
 * clears the unread flag, because answering is also reading.
 */
export default function AdminConversations() {
  const conversations = useQuery(api.conversations.listAll, {});
  const reply = useMutation(api.conversations.reply);
  const setStatus = useMutation(api.conversations.setStatus);
  const remove = useMutation(api.conversations.remove);
  const markRead = useMutation(api.conversations.markRead);

  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = conversations?.find((c) => c._id === activeId) ?? null;
  const waiting = (conversations ?? []).filter((c) => c.unreadForAdmin > 0).length;

  useEffect(() => {
    if (active && active.unreadForAdmin > 0) {
      void markRead({ conversationId: active._id });
    }
  }, [active, markRead]);

  async function guard(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(cleanConvexError(err, "L'opération a échoué."));
    }
  }

  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 p-6">
        <div className="flex items-center gap-3">
          <Icon name="forum" className="text-primary" fill />
          <div>
            <h3 className="font-headline-lg-mobile text-on-surface">Messagerie</h3>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Conversations avec les étudiants connectés.
            </p>
          </div>
        </div>
        {conversations && (
          <span className="font-code-sm text-code-sm tabular-nums text-on-surface-variant">
            {waiting} en attente / {conversations.length}
          </span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 border-b border-outline-variant/30 px-6 py-3 font-code-sm text-code-sm text-error">
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}

      <div className="flex h-[70vh] min-h-[30rem]">
        <aside
          className={`flex flex-col border-outline-variant/30 md:w-80 md:shrink-0 md:border-r ${
            activeId ? "hidden md:flex" : "flex flex-1"
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations === undefined && (
              <p className="p-4 font-code-sm text-code-sm text-on-surface-variant">Chargement…</p>
            )}
            {conversations?.length === 0 && (
              <div className="p-8 text-center">
                <Icon name="forum" className="mb-2 text-3xl text-on-surface-variant opacity-50" />
                <p className="font-code-sm text-code-sm text-on-surface-variant">
                  Aucune conversation. Les étudiants écrivent depuis leur espace.
                </p>
              </div>
            )}
            <ul>
              {conversations?.map((c) => (
                <li key={c._id} className="border-t border-outline-variant/20 first:border-t-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(c._id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-variant/60 ${
                      activeId === c._id ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-body-md text-on-surface">
                        {c.subject}
                      </span>
                      {c.unreadForAdmin > 0 && (
                        <span className="mt-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-code-sm text-[10px] font-bold leading-none text-on-error">
                          {c.unreadForAdmin > 9 ? "9+" : c.unreadForAdmin}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate font-code-sm text-code-sm text-on-surface-variant">
                      {c.studentName || c.studentEmail}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant/70">
                      <span>{formatTime(c.lastMessageAt)}</span>
                      {c.status === "closed" && (
                        <span className="rounded border border-outline-variant/40 px-1.5">
                          clôturée
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className={`min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <>
              <div className="flex items-start gap-3 border-b border-outline-variant/30 p-4">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="mt-1 text-on-surface-variant hover:text-primary md:hidden"
                  aria-label="Retour"
                >
                  <Icon name="arrow_back" />
                </button>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-headline-lg-mobile text-on-surface">
                    {active.subject}
                  </h4>
                  <p className="truncate font-code-sm text-code-sm text-on-surface-variant">
                    {active.studentName
                      ? `${active.studentName} · ${active.studentEmail}`
                      : active.studentEmail}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      guard(() =>
                        setStatus({
                          conversationId: active._id,
                          status: active.status === "open" ? "closed" : "open",
                        }),
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-outline-variant/50 px-3 py-2 font-code-sm text-code-sm text-on-surface-variant transition-colors hover:border-secondary/50 hover:text-secondary"
                  >
                    <Icon
                      name={active.status === "open" ? "check_circle" : "lock_open"}
                      className="text-sm"
                    />
                    {active.status === "open" ? "Clôturer" : "Rouvrir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Supprimer définitivement cette conversation ?")) return;
                      void guard(async () => {
                        await remove({ conversationId: active._id });
                        setActiveId(null);
                      });
                    }}
                    aria-label="Supprimer la conversation"
                    className="rounded-lg border border-outline-variant/50 px-3 py-2 text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
                  >
                    <Icon name="delete" className="text-sm" />
                  </button>
                </div>
              </div>
              <ConversationThread
                conversationId={active._id}
                viewerRole="admin"
                placeholder="Répondre à l'étudiant…"
                onSend={(text) => reply({ conversationId: active._id, body: text })}
              />
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center md:flex">
              <Icon name="forum" className="mb-3 text-4xl text-on-surface-variant opacity-50" />
              <p className="font-body-md text-on-surface-variant">
                Sélectionnez une conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
