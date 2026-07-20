import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { DASHBOARD_NAV } from "@/components/consoleNav";
import SectionHeader from "@/components/console/SectionHeader";
import StudentCourses from "@/components/console/StudentCourses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mes Formations | heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Mes Formations" subtitle="Espace Étudiant" items={DASHBOARD_NAV}>
      <SectionHeader
        icon="school"
        title="Mes Formations"
        subtitle="Vos formations achetées, accessibles à vie."
      />
      <StudentCourses />
    </ConsoleSidebar>
  );
}
