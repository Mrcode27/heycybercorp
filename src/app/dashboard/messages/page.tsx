import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import StudentMessages from "@/components/console/StudentMessages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Messagerie | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Messagerie" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="forum"
        title="Messagerie"
        subtitle="Écrivez à l'équipe heycybercorp et suivez ses réponses."
      />
      <StudentMessages />
    </ConsoleSidebar>
  );
}
