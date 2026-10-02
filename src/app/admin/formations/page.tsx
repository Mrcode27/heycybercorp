import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import AdminCourses from "@/components/console/AdminCourses";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Formations | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Formations">
      <AdminGate>
        <AdminCourses />
      </AdminGate>
    </AdminShell>
  );
}
