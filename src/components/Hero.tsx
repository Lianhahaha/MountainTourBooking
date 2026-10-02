import Link from "next/link";
import { org } from "@/data/org";
import { summitSpecs } from "@/data/trips";
import { Box, BoxHeader } from "@/components/Box";
import { SlotMeter } from "@/components/SlotMeter";
import { Icon } from "@/components/Icon";
import { getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { dateParts, formatPrice } from "@/lib/utils";
import type { TrekSession, Trip } from "@/types";

const reassurances = [
  { icon: "shield", text: "Licensed operator" },
  { icon: "check", text: "Confirmed in 24–48 hrs" },
  { icon: "users", text: "Pay on trek day" },
] as const;

export function Hero({
  trip,
  next,
  moreDates,
}: {
  trip: Trip | undefined;
  next: TrekSession | undefined;
  moreDates: number;
}) {
  return (
    <section id="overview" className="relative border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-4 px-4 pb-7 pt-5 [grid-template-areas:'title'_'tag'_'body'] sm:px-6 sm:pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] md:pb-14 md:pt-14 md:[grid-template-areas:'title_tag'_'body_tag'] lg:gap-x-16">
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.02] tracking-tight text-foreground [grid-area:title] sm:text-5xl md:self-end md:text-[2.75rem] lg:text-[3.5rem]">
          {org.tagline}
        </h1>

        <div className="[grid-area:tag] md:self-center">
          {trip && next ? (
            <NextClimbTag trip={trip} session={next} moreDates={moreDates} />
          ) : (
            <NoDatesTag />
          )}
        </div>

        <div className="[grid-area:body] md:self-start">
          <p className="max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
            {org.shortDescription}
          </p>

          <ul className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-5 md:grid-cols-3 xl:grid-cols-5">
            {summitSpecs.map((spec) => (
              <li
                key={spec.label}
                className="flex flex-col gap-0.5 bg-background px-2.5 py-2 last:col-span-2 sm:px-3 sm:last:col-span-1 md:last:col-span-2 xl:last:col-span-1"
              >
                <span className="flex items-center gap-1.5 text-muted">
                  <Icon name={spec.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-[11px] font-medium">{spec.label}</span>
                </span>
                <span className="tabular font-display text-[15px] font-bold text-foreground sm:text-base">
                  {spec.value}
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
            {reassurances.map((r) => (
              <li key={r.text} className="flex items-center gap-2">
                <Icon name={r.icon} className="h-4 w-4 shrink-0 text-success" />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NextClimbTag({
  trip,
  session,
  moreDates,
}: {
  trip: Trip;
  session: TrekSession;
  moreDates: number;
}) {
  const { month, day, weekday, year } = dateParts(session.date);
  const remaining = getSessionSlotsRemaining(session);
  const price = session.price ?? trip.price;

  return (
    <Box className="shadow-[var(--shadow)]">
      <BoxHeader>
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Icon name="calendar" className="h-4 w-4 text-muted" />
          Next climb
        </span>
        <span className="truncate text-xs text-muted">{trip.title}</span>
      </BoxHeader>
      <div className="p-4 sm:p-5">
        <p className="tabular font-display text-[3.5rem] font-extrabold leading-[0.85] tracking-tight text-foreground sm:text-6xl">
          <span className="text-muted">{month}</span>
          <span className="ml-2">{day}</span>
        </p>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <span className="font-semibold text-foreground">
            {weekday}, {year}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {session.time} meet-up
          </span>
        </p>

        <div className="mt-4">
          <SlotMeter maxSlots={session.maxSlots} remaining={remaining} animate />
        </div>

        {session.notes && (
          <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-muted">
            <Icon name="pin" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {session.notes}
          </p>
        )}

        <div className="my-4 border-t border-border" />

        <div className="flex items-end justify-between gap-3">
          <p className="tabular font-display text-3xl font-bold leading-none text-foreground">
            {formatPrice(price)}
            <span className="ml-1.5 font-sans text-[13px] font-normal text-muted">/ person</span>
          </p>
          {moreDates > 0 && (
            <a href="#dates" className="text-[13px] font-medium text-accent hover:underline">
              +{moreDates} more date{moreDates === 1 ? "" : "s"}
            </a>
          )}
        </div>

        <Link
          id="hero-book"
          href={`/book?trip=${trip.id}&session=${session.id}`}
          className="btn-cta mt-4 w-full !py-3 text-[15px]"
        >
          Book this date
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </Box>
  );
}

function NoDatesTag() {
  return (
    <Box className="shadow-[var(--shadow)]">
      <BoxHeader>
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Icon name="calendar" className="h-4 w-4 text-muted" />
          Next climb
        </span>
      </BoxHeader>
      <div className="p-4 sm:p-5">
        <p className="font-display text-3xl font-bold leading-tight text-foreground">
          New group dates coming soon
        </p>
        <p className="mt-2 text-sm text-muted">
          Dates are posted here first. Planning with your own group? Request a private
          climb on the date you want.
        </p>
        <div className="my-4 border-t border-border" />
        <div className="flex flex-col gap-2">
          <Link id="hero-book" href="/book?trip=private-custom" className="btn-cta w-full">
            Request a private climb
          </Link>
          <a href="#contact" className="btn-secondary w-full">
            Ask about dates
          </a>
        </div>
      </div>
    </Box>
  );
}
