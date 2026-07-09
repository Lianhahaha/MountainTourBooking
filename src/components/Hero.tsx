import Link from "next/link";
import { org } from "@/data/org";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 dark:opacity-20"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent sm:via-background/85 sm:to-background/50" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-32">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
          Registered & Licensed
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {org.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base font-medium leading-snug text-muted sm:text-2xl">
          {org.tagline}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-lg">
          {org.shortDescription}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href="#trips" className="btn-cta w-full text-center sm:w-auto">
            View Upcoming Treks
          </a>
          <Link href="/book" className="btn-secondary w-full text-center sm:w-auto">
            Book a Trek
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-6 sm:max-w-md sm:gap-4 sm:pt-8">
          {org.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
