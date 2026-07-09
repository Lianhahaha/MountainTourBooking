import Image from "next/image";
import Link from "next/link";
import { getScheduledTrips, getPrivateTrip } from "@/data/trips";
import { getAvailableTrekSessions, getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { formatDate, formatPrice, difficultyColor, cn } from "@/lib/utils";

export async function Trips() {
  const scheduled = getScheduledTrips();
  const privateTrip = getPrivateTrip();
  const sessions = await getAvailableTrekSessions();

  return (
    <section id="trips" className="bg-background py-12 text-foreground sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Upcoming Treks
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-4xl">Choose your adventure</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:text-base">
            Scheduled group treks with transparent slot availability — or request a private group booking.
          </p>
        </div>

        {(() => {
          const trip = scheduled[0];
          if (!trip) return null;

          if (sessions.length > 0) {
            return (
              <div className="mt-12 overflow-hidden rounded-md border border-border bg-surface">
                {/* Trek overview — shown once so it's not repeated per date */}
                <div className="grid lg:grid-cols-2">
                  <div className="relative aspect-[16/10] lg:aspect-auto">
                    <Image
                      src={trip.image}
                      alt={trip.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          difficultyColor(trip.difficulty)
                        )}
                      >
                        {trip.difficulty}
                      </span>
                      <span className="text-xs text-muted">{trip.duration}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-bold">{trip.title}</h3>
                    <p className="mt-1 text-sm text-muted">{trip.location}</p>
                    <p className="mt-4 text-lg font-bold text-foreground">
                      {formatPrice(trip.price)}
                      <span className="text-sm font-normal text-muted"> / person</span>
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {sessions.length} upcoming date{sessions.length !== 1 ? "s" : ""} below
                    </p>
                  </div>
                </div>

                {/* Compact date cards — one per session */}
                <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
                  {sessions.map((session) => {
                    const slots = getSessionSlotsRemaining(session);
                    return (
                      <article
                        key={session.id}
                        className="flex flex-col gap-2.5 bg-surface p-3 sm:gap-3 sm:p-5"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="booking-date-badge !px-2 !py-1 !text-[10px] sm:!px-2.5 sm:!text-xs">
                            {formatDate(session.date)}
                          </span>
                          <span className="booking-time-badge !px-2 !py-1 !text-[10px] sm:!px-2.5 sm:!text-xs">
                            {session.time}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "booking-slots-badge self-start !text-[10px] sm:!text-xs",
                            slots <= 3 && "booking-slots-low"
                          )}
                        >
                          {slots} slot{slots !== 1 ? "s" : ""} left
                        </span>

                        {session.notes && (
                          <p className="text-xs leading-relaxed text-muted line-clamp-2 sm:text-sm">
                            {session.notes}
                          </p>
                        )}

                        <Link
                          href={`/book?trip=${trip.id}&session=${session.id}`}
                          className="btn-cta-sm mt-auto w-full text-center !px-2 !py-1.5 !text-xs sm:w-auto sm:self-start sm:!px-4 sm:!py-2 sm:!text-sm"
                        >
                          Book this date
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {scheduled.map((t) => (
                <article
                  key={t.id}
                  className="flex flex-col overflow-hidden rounded-md border border-border bg-surface sm:col-span-2 lg:col-span-3"
                >
                  <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold text-muted">
                      No dates yet
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          difficultyColor(t.difficulty)
                        )}
                      >
                        {t.difficulty}
                      </span>
                      <span className="text-xs text-muted">{t.duration}</span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
                    <p className="mt-1 text-sm text-muted">{t.location}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-2">
                      {t.description}
                    </p>

                    <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {formatPrice(t.price)}
                          <span className="text-sm font-normal text-muted"> / person</span>
                        </p>
                        <p className="mt-1 text-xs text-muted">Check back for new dates</p>
                      </div>
                      <span className="cursor-not-allowed rounded-md border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-muted">
                        No dates
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          );
        })()}

        <div className="mt-10 overflow-hidden rounded-md border border-border bg-surface">
          <div className="grid lg:grid-cols-2">
            <div className="relative aspect-video lg:aspect-auto">
              <Image
                src={privateTrip.image}
                alt={privateTrip.title}
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
            <div className="p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Private Group
              </p>
              <h3 className="mt-2 text-xl font-bold sm:text-2xl">{privateTrip.title}</h3>
              <p className="mt-3 text-sm text-muted sm:text-base">{privateTrip.description}</p>
              <p className="mt-3 text-sm text-muted">
                From {formatPrice(privateTrip.price)} / person · Groups up to {privateTrip.maxSlots}
              </p>
              <Link
                href="/book?trip=private-custom"
                className="btn-cta mt-5 w-full text-center sm:mt-6 sm:w-auto"
              >
                Request Private Trek
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
