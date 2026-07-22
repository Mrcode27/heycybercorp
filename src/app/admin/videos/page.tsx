import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminFreeVideos from "@/components/console/AdminFreeVideos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vidéos gratuites | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Vidéos gratuites" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="smart_display"
          title="Vidéos gratuites"
          subtitle="Contenu YouTube affiché gratuitement sur la page d'accueil."
        />
        <AdminFreeVideos />
      </AdminGate>
    </ConsoleSidebar>
  );
}
