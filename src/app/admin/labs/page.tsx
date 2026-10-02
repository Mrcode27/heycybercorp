import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminLabsWorkspace from "@/components/console/AdminLabsWorkspace";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Labs | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Labs">
      <AdminGate>
        <SectionHeader
          icon="science"
          title="Laboratoires"
          subtitle="Gérez, testez et publiez les cas pratiques et les challenges depuis un seul espace."
        />
        <AdminLabsWorkspace />
      </AdminGate>
    </AdminShell>
  );
}
