"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

function roleClasses(role: string) {
  return role === "admin"
    ? "bg-secondary/10 text-secondary border-secondary/30"
    : "bg-surface-variant text-on-surface-variant border-outline-variant/40";
}

/** Expanded row: role, suspension, and per-package access for one user. */
function UserManagePanel({
  user,
  packages,
}: {
  user: Doc<"users">;
  packages: { _id: Id<"packages">; name: string }[];
}) {
  const entitlements = useQuery(api.entitlements.forUser, { userId: user._id });
  const setRole = useMutation(api.users.setRole);
  const setSuspended = useMutation(api.users.setSuspended);
  const grant = useMutation(api.entitlements.grant);
  const revoke = useMutation(api.entitlements.revoke);

  const [packageToGrant, setPackageToGrant] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const ownedIds = new Set((entitlements ?? []).map((e) => e.packageId));
  const grantable = packages.filter((p) => !ownedIds.has(p._id));

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(cleanConvexError(err));
    }
  }

  return (
    <div className="bg-surface-container-lowest/60 border-t border-outline-variant/20 px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Role */}
      <div>
        <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-2">Rôle</div>
        <div className="flex gap-2">
          {(["student", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => run(() => setRole({ userId: user._id, role: r }))}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                user.role === r
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "border-outline-variant/40 text-on-surface-variant hover:border-primary/40"
              }`}
            >
              {r === "admin" ? "Administrateur" : "Étudiant"}
            </button>
          ))}
        </div>
      </div>

      {/* Suspension */}
      <div>
        <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-2">
          État du compte
        </div>
        <button
          onClick={() => run(() => setSuspended({ userId: user._id, suspended: !user.suspended }))}
          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
            user.suspended
              ? "bg-error/10 text-error border-error/40"
              : "border-outline-variant/40 text-on-surface-variant hover:border-error/40 hover:text-error"
          }`}
        >
          {user.suspended ? "Réactiver le compte" : "Suspendre le compte"}
        </button>
      </div>

      {/* Access */}
      <div>
        <div className="font-label-mono text-xs uppercase text-on-surface-variant mb-2">
          Packs possédés
        </div>
        {entitlements === undefined ? (
          <p className="text-on-surface-variant font-code-sm text-code-sm">Chargement…</p>
        ) : (
          <>
            {entitlements.length === 0 && (
              <p className="text-on-surface-variant text-sm mb-2">Aucun.</p>
            )}
            <ul className="flex flex-col gap-1.5 mb-3">
              {entitlements.map((e) => (
                <li key={e.packageId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-on-surface truncate">{e.packageName}</span>
                  <button
                    onClick={() =>
                      run(() => revoke({ userId: user._id, packageId: e.packageId! }))
                    }
                    className="text-on-surface-variant hover:text-error transition-colors shrink-0"
                    title="Révoquer l'accès"
                    aria-label="Révoquer"
                  >
                    <Icon name="close" className="text-sm" />
                  </button>
                </li>
              ))}
            </ul>
            {grantable.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={packageToGrant}
                  onChange={(e) => setPackageToGrant(e.target.value)}
                  className="flex-grow bg-[#000202] border border-outline-variant text-on-surface px-2 py-1.5 rounded text-xs outline-none focus:border-primary"
                >
                  <option value="">Choisir un pack…</option>
                  {grantable.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!packageToGrant}
                  onClick={() =>
                    run(async () => {
                      await grant({
                        userId: user._id,
                        packageId: packageToGrant as Id<"packages">,
                      });
                      setPackageToGrant("");
                    })
                  }
                  className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded text-xs hover:brightness-110 transition-all disabled:opacity-50"
                >
                  Accorder
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="lg:col-span-3 font-code-sm text-code-sm text-error flex items-center gap-2">
          <Icon name="error" className="text-sm" /> {error}
        </p>
      )}
    </div>
  );
}

export default function AdminUsers({ title = "Utilisateurs" }: { title?: string }) {
  const users = useQuery(api.users.listAll, {});
  const packages = useQuery(api.packages.listAll, {});
  const [expanded, setExpanded] = useState<Id<"users"> | null>(null);

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
              <th className="p-4 text-right">Gérer</th>
            </tr>
          </thead>
          {users === undefined && (
            <tbody>
              <tr>
                <td colSpan={5} className="p-6 text-on-surface-variant font-code-sm">
                  Chargement…
                </td>
              </tr>
            </tbody>
          )}
          {users?.map((u, i) => (
            <tbody key={u._id}>
              <tr
                className={`border-t border-outline-variant/20 ${
                  i % 2 ? "bg-surface-container-lowest/50" : ""
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        u.suspended ? "bg-error/20 text-error" : "bg-primary/20 text-primary"
                      }`}
                    >
                      <Icon name={u.suspended ? "person_off" : "person"} className="text-lg" fill />
                    </div>
                    <div className="min-w-0">
                      <div className="text-on-surface font-medium truncate flex items-center gap-2">
                        {u.name || "—"}
                        {u.suspended && (
                          <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-bold border rounded-sm bg-error/10 text-error border-error/30">
                            Suspendu
                          </span>
                        )}
                      </div>
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
                <td className="p-4 text-right">
                  <button
                    onClick={() => setExpanded(expanded === u._id ? null : u._id)}
                    className={`transition-colors ${
                      expanded === u._id
                        ? "text-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                    aria-label="Gérer l'utilisateur"
                  >
                    <Icon name={expanded === u._id ? "expand_less" : "manage_accounts"} className="text-lg" />
                  </button>
                </td>
              </tr>
              {expanded === u._id && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <UserManagePanel
                      user={u}
                      packages={(packages ?? []).map((p) => ({ _id: p._id, name: p.name }))}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
