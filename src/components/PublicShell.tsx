import Navbar from "./Navbar";
import Footer from "./Footer";

/** Shared chrome (nav + footer) for public marketing pages. */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
