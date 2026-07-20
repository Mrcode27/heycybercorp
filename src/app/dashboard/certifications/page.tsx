import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import CertificationsView from "@/components/console/CertificationsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Certifications | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Certifications" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="workspace_premium"
        title="Certifications"
        subtitle="Validez vos acquis avec des certifications reconnues."
      />
      <CertificationsView />
    </ConsoleSidebar>
  );
}
