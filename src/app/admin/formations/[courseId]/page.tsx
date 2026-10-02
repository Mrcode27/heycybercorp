import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import AdminLessons from "@/components/console/AdminLessons";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Leçons | Admin heycybercorp");

/** Per-course lesson manager: add, edit, reorder, delete lessons. */
export default async function Page({
  params,
}: PageProps<"/admin/formations/[courseId]">) {
  const { courseId } = await params;
  return (
    <AdminShell title="Leçons">
      <AdminGate>
        <AdminLessons courseId={courseId} />
      </AdminGate>
    </AdminShell>
  );
}
