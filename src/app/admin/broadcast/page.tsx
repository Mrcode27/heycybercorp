import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminBroadcast from "@/components/console/AdminBroadcast";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Diffusion | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Diffusion">
      <AdminGate>
        <SectionHeader
          icon="campaign"
          title="Diffusion d'annonces"
          subtitle="Envoyez des notifications en application et par email à tous les utilisateurs."
        />
        <AdminBroadcast />
      </AdminGate>
    </AdminShell>
  );
}

