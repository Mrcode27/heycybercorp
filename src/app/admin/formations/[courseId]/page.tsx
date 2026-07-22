import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import AdminLessons from "@/components/console/AdminLessons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Leçons | Admin heycybercorp" };

/** Per-course lesson manager: add, edit, reorder, delete lessons. */
export default async function Page({
  params,
}: PageProps<"/admin/formations/[courseId]">) {
  const { courseId } = await params;
  return (
    <ConsoleSidebar title="Leçons" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <AdminLessons courseId={courseId} />
      </AdminGate>
    </ConsoleSidebar>
  );
}
