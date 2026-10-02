import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAllHikingDays } from "@/lib/hiking-days-file";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function HikesPage() {
  const days = await getAllHikingDays();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Photo albums
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Photos and notes from each hiking day on Mt. Apo.
          </p>

          {days.length === 0 ? (
            <p className="mt-8 rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No albums posted yet. Check back after the next climb.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {days.map((day, index) => {
                const photos = day.photos ?? [];
                const featured = photos[0];
                const rest = photos.slice(1, 5);

                return (
                  <article
                    key={day.id}
                    className="overflow-hidden rounded-md border border-border bg-surface"
                  >
                    <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                      {featured && (
                        <Link
                          href={`/hikes/${day.id}`}
                          className="relative block aspect-[16/10] md:aspect-auto md:min-h-[280px]"
                        >
                          <Image
                            src={featured.src}
                            alt={featured.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 55vw"
                            priority={index === 0}
                          />
                        </Link>
                      )}
                      <div className="flex flex-col p-4 sm:p-6">
                        <p className="tabular text-[13px] font-medium text-muted">
                          {formatDate(day.date)}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
                          <Link href={`/hikes/${day.id}`} className="hover:text-accent">
                            {day.title}
                          </Link>
                        </h2>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                          {day.summary}
                        </p>
                        {photos.length > 0 && (
                          <Link
                            href={`/hikes/${day.id}`}
                            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
                          >
                            <Icon name="camera" className="h-4 w-4" />
                            View all {photos.length} photos
                          </Link>
                        )}
                      </div>
                    </div>

                    {rest.length > 0 && (
                      <div className="grid grid-cols-4 gap-px border-t border-border bg-border">
                        {rest.map((photo) => (
                          <div key={photo.id} className="relative aspect-[4/3] bg-surface">
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              fill
                              className="object-cover"
                              sizes="25vw"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
