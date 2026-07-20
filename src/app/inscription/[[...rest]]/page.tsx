import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Inscription | heycybercorp",
};

export default function InscriptionPage() {
  return (
    <AuthShell>
      <SignUp />
    </AuthShell>
  );
}
