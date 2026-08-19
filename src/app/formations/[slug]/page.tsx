import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import PublicShell from "@/components/PublicShell";
import CourseDetail from "@/components/CourseDetail";
import CourseJsonLd from "@/components/seo/CourseJsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo";

// Live Convex data via client hooks — render at request time, not build time.
export const dynamic = "force-dynamic";

/**
 * Per-course metadata. Previously every one of these pages shipped the same
 * static title, which made 15 courses look like 15 duplicates to a crawler.
 */
export async function generateMetadata({
  params,
}: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  try {
    const detail = await fetchQuery(api.courses.detail, { slug });
    if (!detail) return { title: "Formation | heycybercorp" };

    const { course } = detail;
    return pageMetadata({
      title: `${course.title} | Formation ${course.level} — heycybercorp`,
      description: course.description,
      path: `/formations/${slug}`,
    });
  } catch {
    // Never let a Convex hiccup fail the whole page render.
    return { title: "Formation | heycybercorp" };
  }
}

/** Single place the page and its metadata both read the course from. */
function fetchCourse(slug: string) {
  return fetchQuery(api.courses.detail, { slug });
}

export default async function CourseDetailPage({
  params,
}: PageProps<"/formations/[slug]">) {
  const { slug } = await params;

  // Structured data only — the interactive body stays client-side because
  // `courses.detail` includes per-user ownership state. Only the fetch is
  // guarded: JSX built inside a try/catch would not actually be caught by it.
  let detail: Awaited<ReturnType<typeof fetchCourse>> = null;
  try {
    detail = await fetchCourse(slug);
  } catch {
    detail = null;
  }

  return (
    <PublicShell>
      {detail ? (
        <BreadcrumbJsonLd
          items={[
            { name: "Accueil", path: "/" },
            { name: "Formations", path: "/formations" },
            { name: detail.course.title, path: `/formations/${slug}` },
          ]}
        />
      ) : null}
      {detail ? (
        <CourseJsonLd
          title={detail.course.title}
          description={detail.course.description}
          slug={slug}
          level={detail.course.level}
          priceEurCents={detail.pkg?.priceEur ?? null}
        />
      ) : null}
      <div className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto cyber-grid">
        <CourseDetail slug={slug} />
      </div>
    </PublicShell>
  );
}
