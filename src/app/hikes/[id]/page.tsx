import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getHikingDayById } from "@/lib/hiking-days-file";
import { formatDate } from "@/lib/utils";

export default async function HikeDayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const day = await getHikingDayById(id);
  if (!day) notFound();

  const [featured, ...rest] = day.photos;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/hikes" className="text-sm text-accent hover:underline">
            ← All hikes
          </Link>

          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent">
            {formatDate(day.date)}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{day.title}</h1>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">{day.summary}</p>

          {featured && (
            <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-md border border-border bg-surface">
              <Image
                src={featured.src}
                alt={featured.alt}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-sm text-white">{featured.alt}</p>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
              {rest.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs text-white">{photo.alt}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
