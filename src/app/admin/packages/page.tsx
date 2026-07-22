import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminPackages from "@/components/console/AdminPackages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Packs | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Packs" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="sell"
          title="Packs & Tarifs"
          subtitle="Les offres achetables. Chaque pack débloque les formations des niveaux qu'il couvre."
        />
        <AdminPackages />
      </AdminGate>
    </ConsoleSidebar>
  );
}
