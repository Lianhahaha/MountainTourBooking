import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getHikingDayById } from "@/lib/hiking-days-file";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export default async function HikeDayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const day = await getHikingDayById(id);
  if (!day) notFound();

  const [featured, ...rest] = day.photos ?? [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href="/hikes"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            All albums
          </Link>

          <p className="tabular mt-4 text-[13px] font-medium text-muted">{formatDate(day.date)}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            {day.title}
          </h1>
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted sm:text-[15px]">
            {day.summary}
          </p>

          {featured && (
            <figure className="mt-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-surface sm:aspect-[21/9]">
                <Image
                  src={featured.src}
                  alt={featured.alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
              <figcaption className="mt-1.5 text-xs text-muted">{featured.alt}</figcaption>
            </figure>
          )}

          {rest.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3 lg:gap-x-3">
              {rest.map((photo) => (
                <figure key={photo.id}>
                  <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                  <figcaption className="mt-1 line-clamp-2 text-xs text-muted">{photo.alt}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2.5 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">Want to be in the next album?</p>
            <Link href="/#dates" className="btn-cta-sm">
              See upcoming dates
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
