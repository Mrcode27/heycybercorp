"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";
import AdminCases from "./AdminCases";
import AdminLabs from "./AdminLabs";
import type { AdminCasePreview, AdminChallengePreview } from "./AdminLabTester";

type Tab = "practical" | "challenge";

type PreviewData = {
  me: { name?: string; email: string };
  cases: AdminCasePreview[];
  labs: AdminChallengePreview[];
};

export default function AdminLabsWorkspace({ preview }: { preview?: PreviewData } = {}) {
  const [tab, setTab] = useState<Tab>("practical");
  const queriedMe = useQuery(api.users.current, preview ? "skip" : {});
  const queriedCases = useQuery(api.cases.adminList, preview ? "skip" : {});
  const queriedLabs = useQuery(api.labs.adminList, preview ? "skip" : {});
  const me = preview?.me ?? queriedMe;
  const cases = preview?.cases ?? queriedCases;
  const labs = preview?.labs ?? queriedLabs;

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl overflow-hidden border-primary/15">
        <div className="p-6 md:p-8 flex flex-col xl:flex-row xl:items-center gap-6 bg-[radial-gradient(circle_at_85%_0%,color-mix(in_srgb,var(--color-primary)_13%,transparent),transparent_32%)]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 shrink-0 rounded-2xl grid place-items-center border border-primary/25 bg-primary/10 text-primary shadow-[0_12px_35px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
              <Icon name="admin_panel_settings" className="text-2xl" fill />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-label-mono text-label-mono uppercase tracking-[0.16em] text-primary">Mode administrateur</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 font-code-sm text-code-sm text-primary"><i className="w-1.5 h-1.5 rounded-full bg-primary" /> Session vérifiée</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface truncate">Centre de contrôle des laboratoires</h2>
              <p className="text-on-surface-variant text-sm mt-1 truncate">{me?.name ?? me?.email ?? "Administrateur"} · aperçu isolé sans progression étudiante</p>
            </div>
          </div>

          <div className="xl:ml-auto grid grid-cols-2 gap-3 min-w-[290px]">
            <Stat icon="folder_special" value={cases?.length} label="Cas pratiques" />
            <Stat icon="flag" value={labs?.length} label="Challenges" />
          </div>
        </div>

        <nav className="grid grid-cols-2 border-t border-outline-variant/30" aria-label="Types de laboratoire">
          <TabButton active={tab === "practical"} icon="folder_special" title="Cas pratiques" count={cases?.length} description="Enquêtes, pièces et WebOS" onClick={() => setTab("practical")} />
          <TabButton active={tab === "challenge"} icon="flag" title="Challenges" count={labs?.length} description="Brief court et flag" onClick={() => setTab("challenge")} />
        </nav>
      </section>

      {tab === "practical" ? <AdminCases previewCases={preview?.cases} /> : <AdminLabs previewLabs={preview?.labs} />}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value?: number; label: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container/60 px-4 py-3 flex items-center gap-3">
      <Icon name={icon} className="text-secondary" />
      <span><strong className="block font-headline-lg-mobile text-on-surface tabular-nums">{value ?? "—"}</strong><small className="font-label-mono text-label-mono uppercase tracking-wider text-on-surface-variant">{label}</small></span>
    </div>
  );
}

function TabButton({ active, icon, title, count, description, onClick }: { active: boolean; icon: string; title: string; count?: number; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`relative min-h-20 flex items-center gap-3 px-5 md:px-7 text-left transition-colors ${active ? "bg-primary/7 text-on-surface" : "text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface"}`}>
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
      <Icon name={icon} className={active ? "text-primary" : "text-on-surface-variant"} fill={active} />
      <span className="min-w-0"><strong className="block text-sm">{title} {count === undefined ? "" : `(${count})`}</strong><small className="hidden sm:block font-code-sm text-code-sm text-on-surface-variant mt-0.5">{description}</small></span>
    </button>
  );
}
