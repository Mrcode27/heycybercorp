import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminConsole from "@/components/AdminConsole";

export const metadata: Metadata = {
  title: "Admin | heycybercorp",
};

export default function AdminPage() {
  return (
    <ConsoleSidebar title="Panneau d'Administration" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminConsole />
    </ConsoleSidebar>
  );
}
