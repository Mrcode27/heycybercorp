"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

/** action prefix → icon + colour, so the journal scans visually. */
function actionStyle(action: string) {
  if (action.startsWith("course.")) return { icon: "school", color: "text-secondary" };
  if (action.startsWith("lesson.")) return { icon: "playlist_play", color: "text-secondary" };
  if (action.startsWith("user.")) return { icon: "manage_accounts", color: "text-primary" };
  if (action.startsWith("entitlement.")) return { icon: "key", color: "text-primary" };
  return { icon: "history", color: "text-on-surface-variant" };
}

/** The audit trail written by logAudit() in the Convex mutations. */
export default function AdminJournal() {
  const entries = useQuery(api.audit.list, {});

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Icon name="history" className="text-primary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">Journal d&apos;audit</h3>
        </div>
        {entries && (
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {entries.length} entrée{entries.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {entries === undefined && (
        <p className="p-6 text-on-surface-variant font-code-sm">Chargement…</p>
      )}
      {entries?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="verified_user" className="text-on-surface-variant text-4xl mb-3 opacity-60" />
          <p className="text-on-surface-variant">
            Journal vide. Chaque action d&apos;administration (cours, leçons, rôles, accès)
            s&apos;enregistre ici automatiquement.
          </p>
        </div>
      )}

      <ul>
        {entries?.map((e, i) => {
          const style = actionStyle(e.action);
          return (
            <li
              key={e._id}
              className={`flex items-center gap-4 px-6 py-3.5 border-t border-outline-variant/20 ${
                i % 2 ? "bg-surface-container-lowest/50" : ""
              }`}
            >
              <Icon name={style.icon} className={`${style.color} shrink-0`} />
              <div className="flex-grow min-w-0">
                <div className="text-on-surface text-sm">
                  <span className="font-code-sm text-code-sm text-primary">{e.action}</span>
                  {e.target && <span className="text-on-surface-variant"> — {e.target}</span>}
                </div>
                {e.meta && (
                  <div className="text-on-surface-variant text-xs truncate">{e.meta}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-code-sm text-code-sm text-on-surface-variant whitespace-nowrap">
                  {new Date(e._creationTime).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {e.actorClerkId && (
                  <div className="text-on-surface-variant text-[11px] font-code-sm truncate max-w-40">
                    {e.actorClerkId.slice(0, 18)}…
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
