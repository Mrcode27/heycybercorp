import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Inscription | heycybercorp",
};

export default function InscriptionPage() {
  return (
    <AuthShell>
      <AuthForm mode="register" />
    </AuthShell>
  );
}
