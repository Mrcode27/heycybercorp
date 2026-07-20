import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import DashboardConsole from "@/components/DashboardConsole";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tableau de bord | heycybercorp",
};

export default function DashboardPage() {
  return (
    <ConsoleSidebar title="Tableau de bord" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <DashboardConsole />
    </ConsoleSidebar>
  );
}
