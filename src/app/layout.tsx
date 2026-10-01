import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pageAlternates } from "@/lib/seo";

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
  "Formations en cybersécurité accessibles en France : fondamentaux, sécurité des réseaux et hacking éthique. Découvrez les parcours et les tarifs en euros de heycybercorp.";

export const metadata: Metadata = {
  // Without metadataBase, every relative og:image/canonical resolves against
  // localhost at build time and ships broken absolute URLs.
  metadataBase: new URL(SITE_URL),
  title: "Formation cybersécurité en France | heycybercorp",
  description: DESCRIPTION,
  // Child pages override this with their own path; the root claims the origin.
  alternates: pageAlternates(""),
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
    title: "Formation cybersécurité en France | heycybercorp",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Formation cybersécurité en France | heycybercorp",
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
      lang="fr-FR"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/*
          Paint the admin-chosen theme before first paint, from the value the
          previous visit cached. Without this the page would render in the
          default dark palette and snap to light once Convex answers. Runs
          before <body> exists, hence documentElement. Convex still has the
          final word a moment later — see ThemeSync.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('hcc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
      <body className="font-body-md text-on-surface antialiased selection:bg-primary/30 selection:text-primary" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}