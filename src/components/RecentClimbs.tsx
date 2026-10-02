import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { formatDate } from "@/lib/utils";
import { seedHikingDays, type HikingDay } from "@/data/hiking-days";

// Seed albums are stock placeholders, not real climbs; the landing page only
// features albums the owner has posted.
const seedIds = new Set(seedHikingDays.map((d) => d.id));

export function RecentClimbs({ days }: { days: HikingDay[] }) {
  const latest = days.find((d) => !seedIds.has(d.id) && (d.photos ?? []).length > 0);
  if (!latest) return null;

  // Even counts keep the 2-column grid free of holes.
  const count = latest.photos.length >= 4 ? 4 : latest.photos.length >= 2 ? 2 : 1;
  const photos = latest.photos.slice(0, count);

  return (
    <section id="photos" className="border-b border-border bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            From our last climb
          </h2>
          <Link
            href="/hikes"
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-accent hover:underline"
          >
            All albums
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start lg:gap-8">
          <div>
            <p className="tabular text-[13px] font-medium text-muted">{formatDate(latest.date)}</p>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground sm:text-xl">
              {latest.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{latest.summary}</p>
            <Link
              href={`/hikes/${latest.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-accent"
            >
              <Icon name="camera" className="h-4 w-4" />
              View all {latest.photos.length} photos
            </Link>
          </div>

          <ul
            className={
              "grid gap-1.5 " +
              (count === 4 ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-2" : count === 2 ? "grid-cols-2" : "")
            }
          >
            {photos.map((photo) => (
              <li
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-elevated"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 30vw"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
