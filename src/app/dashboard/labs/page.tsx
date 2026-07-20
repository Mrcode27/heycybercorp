import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import LabsView from "@/components/console/LabsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Labs Pratiques | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Labs Pratiques" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="science"
        title="Labs Pratiques"
        subtitle="Mettez vos compétences à l'épreuve dans des environnements réels."
      />
      <LabsView />
    </ConsoleSidebar>
  );
}
