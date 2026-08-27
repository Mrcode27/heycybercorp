"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import ConvexClientProvider from "./ConvexClientProvider";
import ThemeSync from "./ThemeSync";

/**
 * Reads the theme currently applied to <html>.
 *
 * Clerk's own widgets have to be told which palette to use, but the
 * authoritative value lives in Convex — and Convex can only be reached from
 * INSIDE ClerkProvider, since its auth depends on Clerk. Rather than untangle
 * that, this watches the `data-theme` attribute that the head script (from
 * cache) and ThemeSync (from Convex) both write. Whoever sets it last wins,
 * and Clerk follows.
 */
function useDocumentTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

/**
 * Auth + data providers for the whole app, kept together so Clerk's appearance
 * can track the site theme. `children` is still rendered on the server: it is
 * passed in as a prop, so this being a client component does not drag the page
 * tree into the browser bundle.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  const theme = useDocumentTheme();

  return (
    <ClerkProvider
      signInUrl="/connexion"
      signUpUrl="/inscription"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={
        theme === "light"
          ? {
              // Clerk's default (light) base, tinted with the logo's green.
              variables: { colorPrimary: "#00620b", colorBackground: "#ffffff" },
            }
          : {
              theme: dark,
              variables: { colorPrimary: "#009150", colorBackground: "#121a17" },
            }
      }
    >
      <ConvexClientProvider>
        <ThemeSync />
        {children}
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
