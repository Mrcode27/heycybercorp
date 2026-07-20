import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only these areas require authentication. Everything else — the marketing
// site and the auth pages themselves — stays public.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    // Send unauthenticated visitors to the French sign-in page (not Clerk's /sign-in default).
    await auth.protect({
      unauthenticatedUrl: new URL("/connexion", request.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
