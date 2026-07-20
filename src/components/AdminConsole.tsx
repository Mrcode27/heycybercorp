import AdminGate from "./console/AdminGate";
import AdminStats from "./console/AdminStats";
import AdminCourses from "./console/AdminCourses";
import AdminUsers from "./console/AdminUsers";

/** Admin overview — KPIs + course management + users, all live. */
export default function AdminConsole() {
  return (
    <AdminGate>
      <AdminStats />
      <div className="flex flex-col gap-8">
        <AdminCourses />
        <AdminUsers />
      </div>
    </AdminGate>
  );
}
