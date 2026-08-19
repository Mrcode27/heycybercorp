import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import TarifsContent from "@/components/TarifsContent";
import { pageMetadata } from "@/lib/seo";

// Live packages + payment-result banner (useSearchParams) → render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Tarifs | heycybercorp - Excellence en Cybersécurité",
  description:
    "Nos formules de formation en cybersécurité : Débutant, Intermédiaire et Piratage Éthique. Tarifs en euros et en FCFA, paiement unique, accès à vie aux formations du niveau.",
  path: "/tarifs",
});

export default function TarifsPage() {
  return (
    <PublicShell>
      <TarifsContent />
    </PublicShell>
  );
}
