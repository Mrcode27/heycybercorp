import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import CourseDetail from "@/components/CourseDetail";

// Live Convex data via client hooks — render at request time, not build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Formation | heycybercorp",
};

export default async function CourseDetailPage({
  params,
}: PageProps<"/formations/[slug]">) {
  const { slug } = await params;
  return (
    <PublicShell>
      <div className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto cyber-grid">
        <CourseDetail slug={slug} />
      </div>
    </PublicShell>
  );
}
