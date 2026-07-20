import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import StudentPurchases from "@/components/console/StudentPurchases";

export const metadata: Metadata = { title: "Mes achats | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Mes achats" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="shopping_bag"
        title="Mes achats"
        subtitle="Historique de vos commandes et reçus."
      />
      <StudentPurchases />
    </ConsoleSidebar>
  );
}
