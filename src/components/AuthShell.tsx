import Link from "next/link";
import Icon from "@/components/Icon";

/** Centered branded shell for auth pages. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center cyber-grid px-margin-mobile py-16">
      <Link
        href="/"
        className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter mb-8 flex items-center gap-2"
      >
        <Icon name="shield" fill />
        heycybercorp
      </Link>
      {children}
      <Link
        href="/"
        className="mt-8 text-on-surface-variant hover:text-primary transition-colors text-sm flex items-center gap-1"
      >
        <Icon name="arrow_back" className="text-sm" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
