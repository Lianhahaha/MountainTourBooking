import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingForm } from "@/components/BookingForm";

function BookingFormFallback() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse rounded-md border border-border bg-surface p-8">
      <div className="h-6 w-48 rounded bg-surface-elevated" />
      <div className="mt-6 h-40 rounded bg-surface-elevated" />
    </div>
  );
}

export default function BookPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="booking-callout mx-auto mb-6 max-w-xl text-center">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Book a Trek</h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Complete the form below. Payment is collected in person on trek day.
            </p>
          </div>
          <Suspense fallback={<BookingFormFallback />}>
            <BookingForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted">
            Questions?{" "}
            <Link href="/#contact" className="link-accent">
              Contact us
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
