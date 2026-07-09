import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAllHikingDays } from "@/lib/hiking-days-file";
import { formatDate } from "@/lib/utils";

export default async function HikesPage() {
  const days = await getAllHikingDays();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Hike Log
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              Past treks on Mt. Apo
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Photo albums and summaries from each hiking day with Tikling.
            </p>
          </div>

          {days.length === 0 ? (
            <p className="mt-12 text-center text-muted">No hiking days posted yet. Check back soon.</p>
          ) : (
            <div className="mt-12 space-y-10">
              {days.map((day, index) => {
                const featured = day.photos[0];
                const rest = day.photos.slice(1, 5);

                return (
                  <article
                    key={day.id}
                    className="overflow-hidden rounded-md border border-border bg-surface"
                  >
                    <div className="grid lg:grid-cols-2">
                      {featured && (
                        <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[320px]">
                          <Image
                            src={featured.src}
                            alt={featured.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority={index === 0}
                          />
                        </div>
                      )}
                      <div className="flex flex-col p-6 sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                          {formatDate(day.date)}
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-foreground">{day.title}</h2>
                        <p className="mt-4 flex-1 leading-relaxed text-muted">{day.summary}</p>
                        <Link
                          href={`/hikes/${day.id}`}
                          className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline"
                        >
                          View all {day.photos.length} photos →
                        </Link>
                      </div>
                    </div>

                    {rest.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 border-t border-border sm:grid-cols-4">
                        {rest.map((photo) => (
                          <div key={photo.id} className="relative aspect-[4/3]">
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
