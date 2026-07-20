import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import AdminCourses from "@/components/console/AdminCourses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Formations | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Formations" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <AdminCourses />
      </AdminGate>
    </ConsoleSidebar>
  );
}
