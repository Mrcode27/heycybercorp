import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminJournal from "@/components/console/AdminJournal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Journal | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Journal" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="history"
          title="Journal d'audit"
          subtitle="Trace de toutes les actions d'administration."
        />
        <AdminJournal />
      </AdminGate>
    </ConsoleSidebar>
  );
}
