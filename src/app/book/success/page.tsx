import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { org } from "@/data/org";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center bg-background py-16">
        <div className="mx-auto max-w-lg px-4 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-primary/40 bg-primary-muted text-3xl text-primary">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">
            Request submitted!
          </h1>
          {id && (
            <p className="mt-3 text-lg font-semibold text-accent">
              Reference: {id}
            </p>
          )}
          <p className="mt-4 leading-relaxed text-muted">
            Thank you for booking with {org.name}. Your request is in the queue — the owner
            will review it and send a confirmation email to the address you provided once
            your slot is approved and scheduled.
          </p>
          <div className="mt-6 rounded-md border border-border bg-surface p-4 text-left text-sm text-foreground">
            <p className="font-semibold">What happens next?</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-muted">
              <li>Owner reviews your booking (usually 24–48 hours)</li>
              <li>You receive an email when approved with trek date & meet-up details</li>
              <li>Pay in person on trek day (cash or GCash)</li>
            </ol>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="btn-cta !py-3"
            >
              Back to Home
            </Link>
            <Link
              href="/#trips"
              className="btn-secondary text-center !py-3"
            >
              View Treks
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
