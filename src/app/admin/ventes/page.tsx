import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import AdminSales from "@/components/console/AdminSales";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ventes | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Ventes" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <AdminSales />
      </AdminGate>
    </ConsoleSidebar>
  );
}
