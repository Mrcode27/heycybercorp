import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminPackages from "@/components/console/AdminPackages";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Packs | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Packs">
      <AdminGate>
        <SectionHeader
          icon="sell"
          title="Packs & Tarifs"
          subtitle="Les offres achetables. Chaque pack débloque les formations des niveaux qu'il couvre."
        />
        <AdminPackages />
      </AdminGate>
    </AdminShell>
  );
}
