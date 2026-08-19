import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import PublicShell from "@/components/PublicShell";
import FormationsCatalogue from "@/components/FormationsCatalogue";
import CourseListJsonLd from "@/components/seo/CourseListJsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";

// Live Convex data — render at request time, not build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "heycybercorp | Catalogue des Formations",
  description:
    "Le catalogue complet des formations heycybercorp : fondamentaux de la cybersécurité, OSINT, sécurité des réseaux, hacking éthique et gouvernance. Du débutant à l'expert.",
  path: "/formations",
});

export default async function FormationsPage() {
  // One round-trip: preload for the client component, then read the same result
  // synchronously for the structured data — no second query.
  const preloaded = await preloadQuery(api.courses.listPublished, {});
  const courses = preloadedQueryResult(preloaded);

  return (
    <PublicShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formations", path: "/formations" },
        ]}
      />
      <CourseListJsonLd courses={courses} />
      <div className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto cyber-grid">
        <FormationsCatalogue preloaded={preloaded} />
      </div>
    </PublicShell>
  );
}
