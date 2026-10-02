import { notFound } from "next/navigation";
import ConsoleSidebar from "./ConsoleSidebar";
import { ADMIN_NAV } from "./consoleNav";
import { getServerAdmin } from "@/lib/adminAuth";

/**
 * Frame for every admin page. Anyone who isn't an admin gets the site's plain
 * 404, so the admin nav and section titles are never sent to them. Rendered by
 * each page rather than a layout: layouts don't re-render on navigation, pages
 * do, so the check runs on every admin route.
 */
export default async function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (!(await getServerAdmin())) notFound();

  return (
    <ConsoleSidebar title={title} subtitle="Console SOC" items={ADMIN_NAV}>
      {children}
    </ConsoleSidebar>
  );
}
