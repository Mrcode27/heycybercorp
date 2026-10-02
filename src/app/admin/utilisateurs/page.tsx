import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import AdminUsers from "@/components/console/AdminUsers";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Utilisateurs | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Utilisateurs">
      <AdminGate>
        <AdminUsers title="Tous les utilisateurs" />
      </AdminGate>
    </AdminShell>
  );
}
