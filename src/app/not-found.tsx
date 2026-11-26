import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-muted">
          <Icon name="question" className="h-5 w-5" />
        </span>
        <p className="mt-4 tabular text-sm font-semibold text-muted">404</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          That link may have moved or the page no longer exists.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-cta">
            Back to home
          </Link>
          <Link href="/hikes" className="btn-secondary">
            See photo albums
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
