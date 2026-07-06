import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import FormationsCatalogue from "@/components/FormationsCatalogue";

export const metadata: Metadata = {
  title: "heycybercorp | Catalogue des Formations",
};

export default function FormationsPage() {
  return (
    <PublicShell>
      <div className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto cyber-grid">
        <FormationsCatalogue />
      </div>
    </PublicShell>
  );
}
