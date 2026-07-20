import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminReports from "@/components/console/AdminReports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Rapports | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Rapports" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="assessment"
          title="Rapports & Analytics"
          subtitle="Vue d'ensemble de la performance de la plateforme."
        />
        <AdminReports />
      </AdminGate>
    </ConsoleSidebar>
  );
}
