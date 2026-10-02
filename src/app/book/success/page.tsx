import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { org } from "@/data/org";
import { Box } from "@/components/Box";
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
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Request sent
            </h1>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Thanks for booking with {org.name}. We&apos;ll email you once your slot is
            approved.
          </p>

          <Box className="mt-6">
            <div className="p-4 sm:px-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="spec-label">Booking reference</p>
                <p className="text-xs text-muted">Keep this for your records</p>
              </div>
              <p className="tabular mt-2 break-all font-display text-2xl font-bold text-foreground">
                {id ?? "Sent — check your email"}
              </p>
              <div className="my-4 border-t border-border" />
              <p className="spec-label">What happens next</p>
              <ol className="mt-2.5 space-y-2">
                {[
                  "We review it within 24–48 hours.",
                  "You get an email with meet-up details.",
                  "Pay cash or GCash on trek day.",
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
          </Box>

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
