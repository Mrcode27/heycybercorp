import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Connexion | heycybercorp",
};

export default function ConnexionPage() {
  return (
    <AuthShell>
      <SignIn />
    </AuthShell>
  );
}
