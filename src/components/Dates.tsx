import Link from "next/link";
import { Box, BoxHeader } from "@/components/Box";
import { SlotMeter } from "@/components/SlotMeter";
import { Icon } from "@/components/Icon";
import { getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { cn, dateParts, difficultyColor, formatPrice } from "@/lib/utils";
import type { TrekSession, Trip } from "@/types";

const bookingSteps = [
  {
    title: "Pick a date and send your request",
    body: "Fill in your group's details and accept the safety confirmations. Takes about 3 minutes.",
  },
  {
    title: "We confirm within 24–48 hours",
    body: "You get a booking reference right away, then a confirmation by SMS or email.",
  },
  {
    title: "Pay on trek day",
    body: "Cash or GCash at the meet-up. Nothing is charged on this website.",
  },
];

export function Dates({
  trip,
  privateTrip,
  sessions,
}: {
  trip: Trip | undefined;
  privateTrip: Trip;
  sessions: TrekSession[];
}) {
  return (
    <section id="dates" className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Upcoming climbs
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Group treks with live slot counts. Pick a date, or plan a private climb for your own
          group.
        </p>

        {trip && sessions.length > 0 ? (
          <Box className="mt-5">
            <BoxHeader className="flex-wrap">
              <span className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="font-semibold text-foreground">{trip.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    difficultyColor(trip.difficulty)
                  )}
                >
                  {trip.difficulty}
                </span>
                <span className="text-muted">{trip.duration}</span>
              </span>
              <span className="text-xs text-muted">
                {sessions.length} date{sessions.length === 1 ? "" : "s"} open
              </span>
            </BoxHeader>
            <ul className="divide-y divide-border">
              {sessions.map((session, i) => (
                <DateRow key={session.id} trip={trip} session={session} isNext={i === 0} />
              ))}
            </ul>
          </Box>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No group dates are posted right now. New dates show up here first — or{" "}
            <Link href="/book?trip=private-custom" className="link-accent font-medium">
              request a private climb
            </Link>{" "}
            on your own schedule.
          </div>
        )}

        <Box className="mt-6 border-accent/40">
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8">
            <div>
              <span className="inline-flex rounded-full border border-accent/40 px-2 py-0.5 text-xs font-medium text-accent">
                Private group
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">
                {privateTrip.title}
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                {privateTrip.description}
              </p>
              <p className="tabular mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-foreground">
                <span>
                  From <strong className="font-semibold">{formatPrice(privateTrip.price)}</strong>{" "}
                  / person
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="users" className="h-3.5 w-3.5 text-muted" />
                  Groups up to {privateTrip.maxSlots}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar" className="h-3.5 w-3.5 text-muted" />
                  Your choice of date
                </span>
              </p>
            </div>
            <Link href="/book?trip=private-custom" className="btn-secondary w-full md:w-auto">
              Request a private climb
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </Box>

        <div className="mt-10">
          <h3 className="font-display text-lg font-bold text-foreground">How booking works</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-3 md:gap-6">
            {bookingSteps.map((step, i) => (
              <li key={step.title} className="relative flex gap-3 md:flex-col md:gap-2.5">
                {i < bookingSteps.length - 1 && (
                  <>
                    <span
                      className="absolute -bottom-3 left-[13px] top-9 w-0.5 bg-border md:hidden"
                      aria-hidden
                    />
                    <span
                      className="absolute -right-4 left-10 top-[13px] hidden h-0.5 bg-border md:block"
                      aria-hidden
                    />
                  </>
                )}
                <span className="tabular relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function DateRow({
  trip,
  session,
  isNext,
}: {
  trip: Trip;
  session: TrekSession;
  isNext: boolean;
}) {
  const { month, day, weekday, year } = dateParts(session.date);
  const remaining = getSessionSlotsRemaining(session);
  const price = session.price ?? trip.price;

  return (
    <li className="grid gap-x-5 gap-y-2.5 px-4 py-3.5 md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,14rem)_auto] md:items-center">
      <div className="flex items-baseline gap-2.5 md:block">
        <p className="tabular font-display text-[1.75rem] font-extrabold leading-none tracking-tight text-foreground">
          {month} <span className="text-primary">{day}</span>
        </p>
        <p className="text-xs text-muted md:mt-1">
          {weekday}, {year}
        </p>
      </div>

      <div className="min-w-0 text-[13px]">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground">
          <span className="tabular flex items-center gap-1.5">
            <Icon name="clock" className="h-3.5 w-3.5 text-muted" />
            {session.time} meet-up
          </span>
          {isNext && (
            <span className="rounded-full border border-primary/40 px-1.5 py-px text-[11px] font-medium text-primary">
              Next
            </span>
          )}
        </p>
        {session.notes && <p className="mt-0.5 line-clamp-2 text-muted">{session.notes}</p>}
      </div>

      <SlotMeter maxSlots={session.maxSlots} remaining={remaining} compact />

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <p className="tabular text-sm font-semibold text-foreground">
          {formatPrice(price)}
          <span className="ml-1 text-xs font-normal text-muted">/ person</span>
        </p>
        <Link
          href={`/book?trip=${trip.id}&session=${session.id}`}
          className="btn-cta-sm"
          aria-label={`Book ${weekday}, ${month} ${day}`}
        >
          Book
        </Link>
      </div>
    </li>
  );
}
