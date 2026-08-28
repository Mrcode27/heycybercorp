import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminLabsWorkspace from "@/components/console/AdminLabsWorkspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Labs | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Labs" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="science"
          title="Laboratoires"
          subtitle="Gérez, testez et publiez les cas pratiques et les challenges depuis un seul espace."
        />
        <AdminLabsWorkspace />
      </AdminGate>
    </ConsoleSidebar>
  );
}
