import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import AdminUsers from "@/components/console/AdminUsers";

export const metadata: Metadata = { title: "Utilisateurs | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Utilisateurs" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <AdminUsers title="Tous les utilisateurs" />
      </AdminGate>
    </ConsoleSidebar>
  );
}
