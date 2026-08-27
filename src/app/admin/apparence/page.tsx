import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminAppearance from "@/components/console/AdminAppearance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Apparence | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Apparence" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="palette"
          title="Apparence"
          subtitle="Basculez le site entre l'ancien et le nouveau design."
        />
        <AdminAppearance />
      </AdminGate>
    </ConsoleSidebar>
  );
}
