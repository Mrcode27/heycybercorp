import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminAppearance from "@/components/console/AdminAppearance";
import AnimationColors from "@/components/console/AnimationColors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Apparence | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Apparence" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="palette"
          title="Apparence"
          subtitle="Thème du site et couleurs des animations de la page d'accueil."
        />
        <div className="space-y-6">
          <AdminAppearance />
          <AnimationColors />
        </div>
      </AdminGate>
    </ConsoleSidebar>
  );
}
