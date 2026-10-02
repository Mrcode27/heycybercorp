import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminAppearance from "@/components/console/AdminAppearance";
import AnimationColors from "@/components/console/AnimationColors";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Apparence | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Apparence">
      <AdminGate>
        <SectionHeader
          icon="palette"
          title="Apparence"
          subtitle="Thème du site et couleurs des animations de la page d'accueil."
        />
        <div className="space-y-6">
          <AdminAppearance />
          <AnimationColors />
        </div>
      </AdminGate>
    </AdminShell>
  );
}
