import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminReports from "@/components/console/AdminReports";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Rapports | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Rapports">
      <AdminGate>
        <SectionHeader
          icon="assessment"
          title="Rapports & Analytics"
          subtitle="Vue d'ensemble de la performance de la plateforme."
        />
        <AdminReports />
      </AdminGate>
    </AdminShell>
  );
}
