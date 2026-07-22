"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";

const KIND_LABEL = { contact: "Contact", devis: "Devis" } as const;

function statusClasses(status: string) {
  switch (status) {
    case "new":
      return "bg-primary/10 text-primary border-primary/30";
    case "read":
      return "bg-surface-variant text-on-surface-variant border-outline-variant/40";
    default:
      return "bg-secondary/10 text-secondary border-secondary/30"; // archived
  }
}

/** Inbox for contact + quote submissions stored by convex/messages.ts. */
export default function AdminMessages() {
  const messages = useQuery(api.messages.listAll, {});
  const setStatus = useMutation(api.messages.setStatus);
  const remove = useMutation(api.messages.remove);
  const [openId, setOpenId] = useState<Id<"messages"> | null>(null);

  const newCount = (messages ?? []).filter((m) => m.status === "new").length;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Icon name="mail" className="text-primary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">Boîte de réception</h3>
        </div>
        {messages && (
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {newCount} nouveau{newCount > 1 ? "x" : ""} / {messages.length}
          </span>
        )}
      </div>

      {messages === undefined && (
        <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
      )}
      {messages?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="inbox" className="text-on-surface-variant text-4xl mb-3 opacity-60" />
          <p className="text-on-surface-variant">
            Aucun message. Les formulaires Contact et Devis du site arrivent ici.
          </p>
        </div>
      )}

      <ul>
        {messages?.map((m, i) => {
          const open = openId === m._id;
          return (
            <li
              key={m._id}
              className={`border-t border-outline-variant/20 ${
                i % 2 ? "bg-surface-container-lowest/50" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenId(open ? null : m._id);
                  if (!open && m.status === "new") {
                    setStatus({ id: m._id, status: "read" });
                  }
                }}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-surface-variant/30 transition-colors"
              >
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm shrink-0 ${
                    m.kind === "devis"
                      ? "bg-secondary/10 text-secondary border-secondary/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {KIND_LABEL[m.kind]}
                </span>
                <div className="flex-grow min-w-0">
                  <div
                    className={`truncate ${
                      m.status === "new" ? "text-on-surface font-bold" : "text-on-surface"
                    }`}
                  >
                    {m.subject || m.body.slice(0, 80)}
                  </div>
                  <div className="text-on-surface-variant text-xs truncate">
                    {m.name} · {m.email}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded border shrink-0 ${statusClasses(m.status)}`}>
                  {m.status === "new" ? "Nouveau" : m.status === "read" ? "Lu" : "Archivé"}
                </span>
                <span className="font-code-sm text-code-sm text-on-surface-variant whitespace-nowrap hidden sm:block">
                  {new Date(m._creationTime).toLocaleDateString("fr-FR")}
                </span>
                <Icon
                  name={open ? "expand_less" : "expand_more"}
                  className="text-on-surface-variant shrink-0"
                />
              </button>

              {open && (
                <div className="px-6 pb-5">
                  <div className="bg-[#000202] border border-outline-variant/40 rounded-lg p-4 mb-3">
                    <p className="text-on-surface whitespace-pre-wrap text-sm">{m.body}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? "votre message")}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:brightness-110 transition-all"
                    >
                      <Icon name="reply" className="text-sm" />
                      Répondre par email
                    </a>
                    <button
                      onClick={() =>
                        setStatus({ id: m._id, status: m.status === "archived" ? "read" : "archived" })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs hover:border-secondary/50 hover:text-secondary transition-all"
                    >
                      <Icon name={m.status === "archived" ? "unarchive" : "archive"} className="text-sm" />
                      {m.status === "archived" ? "Désarchiver" : "Archiver"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer définitivement ce message ?")) remove({ id: m._id });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs hover:border-error/50 hover:text-error transition-all"
                    >
                      <Icon name="delete" className="text-sm" />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
