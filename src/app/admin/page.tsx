import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminConsole from "@/components/AdminConsole";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Admin | heycybercorp");

export default function AdminPage() {
  return (
    <AdminShell title="Panneau d'Administration">
      <AdminConsole />
    </AdminShell>
  );
}
