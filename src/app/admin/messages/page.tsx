import type { Metadata } from "next";
import ConsoleSidebar from "@/components/ConsoleSidebar";
import { ADMIN_NAV } from "@/components/consoleNav";
import AdminGate from "@/components/console/AdminGate";
import SectionHeader from "@/components/console/SectionHeader";
import AdminMessages from "@/components/console/AdminMessages";
import AdminConversations from "@/components/console/AdminConversations";
import AdminNotifyEmail from "@/components/console/AdminNotifyEmail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Messages | Admin heycybercorp" };

export default function Page() {
  return (
    <ConsoleSidebar title="Messages" subtitle="Console SOC" items={ADMIN_NAV}>
      <AdminGate>
        <SectionHeader
          icon="mail"
          title="Messages"
          subtitle="Messagerie avec les étudiants, et demandes reçues depuis le site."
        />
        {/* Where these messages get emailed — set next to the messages
            themselves, since that is where the question arises. */}
        <AdminNotifyEmail />
        <div className="space-y-6">
          <AdminConversations />
          <AdminMessages />
        </div>
      </AdminGate>
    </ConsoleSidebar>
  );
}
