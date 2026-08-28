import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import DesktopOnlyGate from "@/components/DesktopOnlyGate";
import CaseRunner from "@/components/console/CaseRunner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cas pratique | heycybercorp" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <ConsoleSidebar title="Cas pratique" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      {/* The catalogue stays mobile; only playing a case needs a keyboard. */}
      <DesktopOnlyGate>
        <CaseRunner slug={slug} />
      </DesktopOnlyGate>
    </ConsoleSidebar>
  );
}
