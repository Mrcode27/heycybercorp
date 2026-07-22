import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminMessages from "@/components/console/AdminMessages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Messages | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Messages" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="mail"
          title="Messages"
          subtitle="Demandes de contact et de devis reçues depuis le site."
        />
        <AdminMessages />
      </AdminGate>
    </ConsoleSidebar>
  );
}
