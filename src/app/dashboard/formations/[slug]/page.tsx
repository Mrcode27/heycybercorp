import type { Metadata } from "next";
import CoursePlayer from "@/components/console/CoursePlayer";

// Live Convex data via client hooks — render at request time, not build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lecteur de cours | heycybercorp",
};

export default async function CoursePlayerPage({
  params,
}: PageProps<"/dashboard/formations/[slug]">) {
  const { slug } = await params;
  return <CoursePlayer slug={slug} />;
}
