import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import TarifsContent from "@/components/TarifsContent";

export const metadata: Metadata = {
  title: "Tarifs | heycybercorp - Excellence en Cybersécurité",
};

export default function TarifsPage() {
  return (
    <PublicShell>
      <TarifsContent />
    </PublicShell>
  );
}
