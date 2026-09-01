"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import Icon from "./Icon";

/**
 * The console bell.
 *
 * Both counts come from live Convex queries, so a reply lands in the panel
 * without a refresh. The unread badge is capped at 9+ rather than showing a
 * true count: past a handful the exact number stops being information.
 */

const ICONS: Record<string, string> = {
  message: "forum",
  system: "campaign",
  purchase: "shopping_bag",
  certificate: "workspace_premium",
};

/** Relative time, French, without pulling in a date library for four cases. */
function ago(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(timestamp).toLocaleDateString("fr-FR");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Skip the list query entirely until the panel is opened — the badge only
  // needs the count, and this component renders on every console page.
  const unread = useQuery(api.notifications.unreadCount, {}) ?? 0;
  const items = useQuery(api.notifications.listMine, open ? {} : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-on-surface-variant transition-colors hover:text-primary"
        aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="notifications" fill={unread > 0} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-code-sm text-[10px] font-bold leading-none text-on-error">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 px-4 py-3">
            <span className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead({})}
                className="font-code-sm text-code-sm text-primary transition-opacity hover:opacity-80"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {items === undefined && (
              <p className="px-4 py-6 font-code-sm text-code-sm text-on-surface-variant">
                Chargement…
              </p>
            )}
            {items?.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Icon
                  name="notifications_off"
                  className="mb-2 text-3xl text-on-surface-variant opacity-50"
                />
                <p className="font-code-sm text-code-sm text-on-surface-variant">
                  Aucune notification.
                </p>
              </div>
            )}

            <ul>
              {items?.map((n) => {
                const isUnread = n.readAt === undefined;
                const body = (
                  <>
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isUnread ? "bg-primary/15 text-primary" : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      <Icon name={ICONS[n.kind] ?? "notifications"} className="text-base" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-body-md text-on-surface">{n.title}</span>
                      {n.body && (
                        <span className="block truncate font-code-sm text-code-sm text-on-surface-variant">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-0.5 block font-code-sm text-code-sm text-on-surface-variant/70">
                        {ago(n._creationTime)}
                      </span>
                    </span>
                    {isUnread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    )}
                  </>
                );

                const className = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-variant/60 ${
                  isUnread ? "" : "opacity-70"
                }`;

                const onActivate = () => {
                  if (isUnread) void markRead({ id: n._id as Id<"notifications"> });
                  setOpen(false);
                };

                return (
                  <li key={n._id} className="border-t border-outline-variant/20 first:border-t-0">
                    {n.href ? (
                      <Link href={n.href} className={className} onClick={onActivate}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" className={className} onClick={onActivate}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
