import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const DESCRIPTION =
  "Formations de pointe en cybersécurité pour les talents africains et européens. Du débutant au hacking éthique avancé.";

export const metadata: Metadata = {
  // Without metadataBase, every relative og:image/canonical resolves against
  // localhost at build time and ships broken absolute URLs.
  metadataBase: new URL(SITE_URL),
  title: "heycybercorp | Maîtrisez l'Art de la Cyberdéfense",
  description: DESCRIPTION,
  // Child pages override this with their own path; the root claims the origin.
  alternates: { canonical: "/" },
  // Single source of truth: the favicon (browser tab), bookmark icon and Apple
  // touch icon all point at /public/logo.png. Replace that one file and every
  // icon — plus the navbar logo, which loads the same path — updates everywhere.
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "heycybercorp | Maîtrisez l'Art de la Cyberdéfense",
    description: DESCRIPTION,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "heycybercorp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "heycybercorp | Maîtrisez l'Art de la Cyberdéfense",
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Material Symbols icon font (icon fonts can't be self-hosted via next/font) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="font-body-md text-on-surface antialiased selection:bg-primary/30 selection:text-primary" suppressHydrationWarning>
        <ClerkProvider
          signInUrl="/connexion"
          signUpUrl="/inscription"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: "#009150",
              colorBackground: "#121a17",
            },
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}