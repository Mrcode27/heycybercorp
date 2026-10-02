import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import AdminSales from "@/components/console/AdminSales";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Ventes | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Ventes">
      <AdminGate>
        <AdminSales />
      </AdminGate>
    </AdminShell>
  );
}
