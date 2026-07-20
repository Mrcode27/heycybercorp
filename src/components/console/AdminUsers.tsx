"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

function roleClasses(role: string) {
  return role === "admin"
    ? "bg-secondary/10 text-secondary border-secondary/30"
    : "bg-surface-variant text-on-surface-variant border-outline-variant/40";
}

export default function AdminUsers({ title = "Utilisateurs" }: { title?: string }) {
  const users = useQuery(api.users.listAll, {});

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <Icon name="group" className="text-primary" fill />
          <h3 className="font-headline-lg-mobile text-on-surface">{title}</h3>
        </div>
        {users && (
          <span className="font-code-sm text-code-sm text-on-surface-variant tabular-nums">
            {users.length} compte{users.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-high font-label-mono text-label-mono uppercase text-on-surface-variant text-xs">
              <th className="p-4">Utilisateur</th>
              <th className="p-4 hidden md:table-cell">Région</th>
              <th className="p-4">Rôle</th>
              <th className="p-4 hidden sm:table-cell">Inscrit</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md">
            {users === undefined && (
              <tr>
                <td colSpan={4} className="p-6 text-on-surface-variant font-code-sm">
                  Chargement…
                </td>
              </tr>
            )}
            {users?.map((u, i) => (
              <tr
                key={u._id}
                className={`border-t border-outline-variant/20 ${
                  i % 2 ? "bg-surface-container-lowest/50" : ""
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Icon name="person" className="text-lg" fill />
                    </div>
                    <div className="min-w-0">
                      <div className="text-on-surface font-medium truncate">{u.name || "—"}</div>
                      <div className="text-on-surface-variant text-xs truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-on-surface-variant">
                  {u.region ?? "—"}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded border ${roleClasses(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 hidden sm:table-cell text-on-surface-variant font-code-sm text-code-sm">
                  {new Date(u._creationTime).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
