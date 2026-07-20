"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";

/** Renders children only for admins; otherwise a loading or restricted state. */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const me = useQuery(api.users.current);

  if (me === undefined) {
    return <p className="text-on-surface-variant font-code-sm">Chargement…</p>;
  }
  if (me === null || me.role !== "admin") {
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <Icon name="lock" className="text-error text-4xl mb-3" fill />
        <h2 className="font-headline-lg-mobile text-on-surface mb-2">Accès restreint</h2>
        <p className="text-on-surface-variant">
          Cette section est réservée aux administrateurs.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
