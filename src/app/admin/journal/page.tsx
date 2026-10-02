import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminJournal from "@/components/console/AdminJournal";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Journal | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Journal">
      <AdminGate>
        <SectionHeader
          icon="history"
          title="Journal d'audit"
          subtitle="Trace de toutes les actions d'administration."
        />
        <AdminJournal />
      </AdminGate>
    </AdminShell>
  );
}
