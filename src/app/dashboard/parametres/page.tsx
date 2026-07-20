import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import StudentSettings from "@/components/console/StudentSettings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Paramètres | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Paramètres" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="settings"
        title="Paramètres"
        subtitle="Gérez votre compte et vos préférences."
      />
      <StudentSettings />
    </ConsoleSidebar>
  );
}
