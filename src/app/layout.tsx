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
  // Icons come from the app-directory file convention (src/app/favicon.ico,
  // icon.png, apple-icon.png) — Next emits the <link> tags with correct sizes
  // and types, and serves /favicon.ico for browsers that request it directly.
  // Those files are the square, dark-backed crop of public/logo.png, which
  // stays as-is for the navbar.
  // og:image / twitter:image come from src/app/opengraph-image.png and
  // twitter-image.png (1200x630) — Next emits the URL plus correct width,
  // height and type, so the dimensions can't drift out of sync with the file.
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "heycybercorp | Maîtrisez l'Art de la Cyberdéfense",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "heycybercorp | Maîtrisez l'Art de la Cyberdéfense",
    description: DESCRIPTION,
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