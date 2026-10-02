import AdminShell from "@/components/AdminShell";
import { adminMetadata } from "@/lib/adminAuth";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminFreeVideos from "@/components/console/AdminFreeVideos";

export const dynamic = "force-dynamic";

export const generateMetadata = adminMetadata("Vidéos gratuites | Admin heycybercorp");

export default function Page() {
  return (
    <AdminShell title="Vidéos gratuites">
      <AdminGate>
        <SectionHeader
          icon="smart_display"
          title="Vidéos gratuites"
          subtitle="Contenu YouTube affiché gratuitement sur la page d'accueil."
        />
        <AdminFreeVideos />
      </AdminGate>
    </AdminShell>
  );
}
