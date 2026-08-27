import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminLabs from "@/components/console/AdminLabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Labs | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Labs" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="science"
          title="Labs pratiques"
          subtitle="Créez les challenges, définissez le flag et suivez les résolutions."
        />
        <AdminLabs />
      </AdminGate>
    </ConsoleSidebar>
  );
}
