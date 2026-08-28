import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import CasesCatalogue from "@/components/console/CasesCatalogue";
import LabsView from "@/components/console/LabsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Labs Pratiques | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Labs Pratiques" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="science"
        title="Cas pratiques"
        subtitle="Un incident, des preuves, une décision. Comme en poste."
      />
      {/* Browsing works on any screen; playing a case is gated to desktop. */}
      <CasesCatalogue />

      <SectionHeader
        icon="flag"
        title="Challenges"
        subtitle="Épreuves courtes à flag unique."
      />
      <LabsView />
    </ConsoleSidebar>
  );
}
