import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminBroadcast from "@/components/console/AdminBroadcast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Diffusion | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Diffusion" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="campaign"
          title="Diffusion d'annonces"
          subtitle="Envoyez des notifications en application et par email à tous les utilisateurs."
        />
        <AdminBroadcast />
      </AdminGate>
    </ConsoleSidebar>
  );
}

