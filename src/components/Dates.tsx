import Link from "next/link";
import { Box, BoxHeader } from "@/components/Box";
import { SlotMeter } from "@/components/SlotMeter";
import { Icon } from "@/components/Icon";
import { getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { cn, dateParts, difficultyColor, formatPrice } from "@/lib/utils";
import type { TrekSession, Trip } from "@/types";

const bookingSteps = [
  { title: "Request a date", body: "About 3 minutes online." },
  { title: "Get confirmed", body: "By SMS or email in 24–48 hrs." },
  { title: "Pay on trek day", body: "Cash or GCash. No online payment." },
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
    <section id="dates" className="border-b border-border py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Upcoming climbs
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Live slot counts. Pick a date or go private.
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

        <Box className="mt-6 border-done/40">
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {privateTrip.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted">{privateTrip.description}</p>
              <p className="tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-foreground">
                <span className="rounded-full border border-done/40 bg-done-muted px-2 py-0.5 text-xs font-medium text-done">
                  Private group
                </span>
                <span>
                  From <strong className="font-semibold">{formatPrice(privateTrip.price)}</strong>{" "}
                  / person
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="users" className="h-3.5 w-3.5 text-muted" />
                  Groups up to {privateTrip.maxSlots}
                </span>
              </p>
            </div>
            <Link href="/book?trip=private-custom" className="btn-secondary w-full md:w-auto">
              Request a private climb
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </Box>

        <div className="mt-7">
          <h3 className="font-display text-lg font-bold text-foreground">How booking works</h3>
          <ol className="mt-3 grid grid-cols-3 gap-3 sm:gap-6">
            {bookingSteps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col gap-2">
                {i < bookingSteps.length - 1 && (
                  <span
                    className="absolute -right-3 left-9 top-[13px] h-0.5 bg-border sm:-right-6"
                    aria-hidden
                  />
                )}
                <span className="tabular relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted sm:text-[13px]">{step.body}</p>
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
  const full = remaining === 0;

  return (
    <li
      className={cn(
        "grid grid-cols-[3.25rem_minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-4 [grid-template-areas:'tile_info_price'_'tile_avail_book']",
        "sm:gap-x-4 lg:grid-cols-[3.25rem_minmax(0,1fr)_13rem_6.5rem_auto] lg:items-center lg:gap-x-6 lg:[grid-template-areas:'tile_info_avail_price_book']",
        isNext && "bg-accent-muted/40"
      )}
    >
      <div
        className="self-start overflow-hidden rounded-md border border-border bg-background text-center [grid-area:tile] lg:self-center"
        aria-hidden
      >
        <p className="bg-accent-muted py-0.5 text-[11px] font-bold tracking-wide text-accent">
          {month}
        </p>
        <p className="tabular py-1.5 font-display text-xl font-bold leading-none text-foreground">
          {day}
        </p>
      </div>

      <div className="min-w-0 [grid-area:info]">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-semibold text-foreground">
            {weekday}, {month} {day}
          </span>
          {isNext && (
            <span className="rounded-full border border-accent/40 bg-accent-muted px-2 py-px text-[11px] font-semibold text-accent">
              Next climb
            </span>
          )}
        </p>
        <p className="tabular mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
          {session.time} meet-up
          <span className="hidden lg:inline">· {year}</span>
        </p>
        {session.notes && (
          <p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
            <Icon name="pin" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{session.notes}</span>
          </p>
        )}
      </div>

      <p className="tabular text-right [grid-area:price] lg:text-left">
        <span className="block text-base font-bold leading-tight text-foreground">
          {formatPrice(price)}
        </span>
        <span className="text-xs text-muted">per person</span>
      </p>

      <div className="min-w-0 self-center [grid-area:avail]">
        <SlotMeter maxSlots={session.maxSlots} remaining={remaining} compact />
      </div>

      <div className="self-center [grid-area:book]">
        {full ? (
          <span className="btn-secondary !min-h-[36px] cursor-not-allowed !px-3.5 !py-1.5 opacity-60">
            Full
          </span>
        ) : (
          <Link
            href={`/book?trip=${trip.id}&session=${session.id}`}
            className={cn(
              isNext ? "btn-cta-sm" : "btn-secondary !min-h-[36px] !px-3.5 !py-1.5",
              "whitespace-nowrap"
            )}
            aria-label={`Book ${weekday}, ${month} ${day}`}
          >
            Book
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}
