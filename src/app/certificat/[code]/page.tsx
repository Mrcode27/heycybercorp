import type { Metadata } from "next";
import CertificateView from "@/components/CertificateView";

// Live Convex data via client hooks — render at request time, not build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification de certificat | heycybercorp",
};

/**
 * Public verification page: anyone with the code (recruiter, employer) can
 * confirm a diploma is genuine. Also the printable version for the student.
 */
export default async function CertificatePage({
  params,
}: PageProps<"/certificat/[code]">) {
  const { code } = await params;
  return <CertificateView code={decodeURIComponent(code)} />;
}
