import Link from "next/link";
import { org } from "@/data/org";
import { summitSpecs } from "@/data/trips";
import { HangTag } from "@/components/HangTag";
import { SlotMeter } from "@/components/SlotMeter";
import { Icon } from "@/components/Icon";
import { getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { dateParts, formatPrice } from "@/lib/utils";
import type { TrekSession, Trip } from "@/types";

const reassurances = [
  { icon: "shield", text: "Registered & licensed operator" },
  { icon: "check", text: "Confirmed within 24–48 hours" },
  { icon: "users", text: "Pay on trek day — cash or GCash" },
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
    <section className="relative border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-5 px-4 pb-8 pt-6 [grid-template-areas:'title'_'tag'_'body'] sm:px-6 sm:pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] md:pb-14 md:pt-14 md:[grid-template-areas:'title_tag'_'body_tag'] lg:gap-x-16">
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.02] tracking-tight text-foreground [grid-area:title] sm:text-5xl md:self-end lg:text-[3.5rem]">
          {org.tagline}
        </h1>

        <div className="pt-6 [grid-area:tag] md:self-center md:pt-8">
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

          <ul className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
            {summitSpecs.map((spec) => (
              <li
                key={spec.label}
                className="flex flex-col gap-0.5 bg-background px-2.5 py-2 max-sm:last:col-span-2 sm:px-3"
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

          <ul className="mt-5 flex flex-col gap-2 text-[13px] text-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
            {reassurances.map((r) => (
              <li key={r.text} className="flex items-center gap-2">
                <Icon name={r.icon} className="h-4 w-4 shrink-0 text-primary" />
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
    <HangTag size="lg" string>
      <div className="px-5 pb-5 pt-4 sm:px-6">
        <div className="flex items-start justify-between gap-3 pl-9">
          <p className="spec-label pt-1">Next climb</p>
          <p className="text-right text-[13px] font-medium text-muted">{trip.title}</p>
        </div>

        <div className="mt-4 flex items-end gap-4">
          <p className="tabular font-display text-[4.25rem] font-extrabold leading-[0.85] tracking-tight text-foreground sm:text-[5rem]">
            {month}
            <span className="ml-2 text-primary">{day}</span>
          </p>
          <div className="pb-1 text-[13px] leading-snug">
            <p className="font-semibold text-foreground">
              {weekday}, {year}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-muted">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {session.time} meet-up
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SlotMeter maxSlots={session.maxSlots} remaining={remaining} animate />
        </div>

        {session.notes && (
          <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-muted">
            <Icon name="pin" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {session.notes}
          </p>
        )}

        <div className="stitch my-4" />

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
          href={`/book?trip=${trip.id}&session=${session.id}`}
          className="btn-cta mt-4 w-full !py-3 text-[15px]"
        >
          Book this date
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </HangTag>
  );
}

function NoDatesTag() {
  return (
    <HangTag size="lg" string>
      <div className="px-5 pb-5 pt-4 sm:px-6">
        <p className="spec-label pl-9 pt-1">Next climb</p>
        <p className="mt-5 font-display text-3xl font-bold leading-tight text-foreground">
          New group dates coming soon
        </p>
        <p className="mt-2 text-sm text-muted">
          Dates are posted here first. Planning with your own group? Request a private
          climb on the date you want.
        </p>
        <div className="stitch my-4" />
        <div className="flex flex-col gap-2">
          <Link href="/book?trip=private-custom" className="btn-cta w-full">
            Request a private climb
          </Link>
          <a href="#contact" className="btn-secondary w-full">
            Ask about dates
          </a>
        </div>
      </div>
    </HangTag>
  );
}
