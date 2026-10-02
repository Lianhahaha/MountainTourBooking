import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { org } from "@/data/org";
import { HangTag } from "@/components/HangTag";
import { Icon } from "@/components/Icon";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <>
      <Header />
      <main className="bg-background py-10 sm:py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="check" className="h-5 w-5" />
            </span>
            <h1 className="font-condensed text-3xl font-extrabold text-foreground">
              Request sent
            </h1>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Thank you for booking with {org.name}. Your request is in the queue — we&apos;ll
            review it and email a confirmation to the address you gave once your slot is
            approved.
          </p>

          <HangTag size="sm" className="mt-6">
            <div className="px-4 pb-4 pt-3 sm:px-5">
              <div className="flex items-baseline justify-between gap-3 pl-6">
                <p className="spec-label">Booking reference</p>
                <p className="text-xs text-muted">Keep this for your records</p>
              </div>
              <p className="tabular mt-2 break-all font-condensed text-2xl font-bold text-foreground">
                {id ?? "Sent — check your email"}
              </p>
              <div className="stitch my-4" />
              <p className="spec-label">What happens next</p>
              <ol className="mt-2.5 space-y-2">
                {[
                  "We review your booking, usually within 24–48 hours.",
                  "You get an email with your trek date and meet-up details once approved.",
                  "Pay in person on trek day — cash or GCash.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-foreground">
                    <span className="tabular w-4 shrink-0 text-right font-bold text-muted">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </HangTag>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/" className="btn-cta flex-1">
              Back to home
            </Link>
            <Link href="/#included" className="btn-secondary flex-1">
              See the pack list
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
