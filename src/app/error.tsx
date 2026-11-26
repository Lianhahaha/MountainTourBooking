"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only safe identifier to log; never print user data.
    console.error("Unhandled page error", error.digest ?? error.message);
  }, [error]);

  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-muted text-danger">
          <Icon name="close" className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This page could not load. Try again, or head back to the home page. If it keeps
          happening, message us and we&apos;ll help.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-cta">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
