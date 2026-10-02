import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingForm } from "@/components/BookingForm";
import { Icon } from "@/components/Icon";

function BookingFormFallback() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse rounded-lg border border-border bg-surface p-8">
      <div className="h-6 w-48 rounded bg-surface-elevated" />
      <div className="mt-6 h-40 rounded bg-surface-elevated" />
    </div>
  );
}

export default function BookPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-6 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-5 max-w-2xl">
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              Book a climb
            </h1>
            <p className="mt-1 text-sm text-muted">
              Four short steps. We confirm within 24–48 hours, and you pay in person on trek
              day — cash or GCash.
            </p>
          </div>
          <Suspense fallback={<BookingFormFallback />}>
            <BookingForm />
          </Suspense>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-muted">
            <Icon name="chat" className="h-4 w-4" />
            Questions first?{" "}
            <Link href="/#contact" className="link-accent">
              Message us
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
