import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminLabs from "@/components/console/AdminLabs";
import AdminCases from "@/components/console/AdminCases";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Labs | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Labs" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="folder_open"
          title="Cas pratiques"
          subtitle="Une mise en situation, des pièces, des étapes vérifiées côté serveur."
        />
        <AdminCases />

        <div className="mt-14">
          <SectionHeader
            icon="flag"
            title="Challenges à flag"
            subtitle="Épreuves courtes : un brief, un flag."
          />
          <AdminLabs />
        </div>
      </AdminGate>
    </ConsoleSidebar>
  );
}
