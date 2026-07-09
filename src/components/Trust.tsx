import Image from "next/image";
import { licenses } from "@/data/licenses";

export function Trust() {
  return (
    <section id="trust" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Trust & Legal
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Licensed to operate
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            We are a registered and licensed outdoor recreation organization. All
            permits and certifications are current and available for review.
          </p>
        </div>

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {licenses.map((doc) => (
            <div
              key={doc.id}
              className="w-[85vw] shrink-0 snap-center overflow-hidden rounded-md border border-border bg-surface sm:w-auto"
            >
              <div className="relative aspect-[4/3] bg-surface-elevated">
                <Image
                  src={doc.image}
                  alt={doc.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {doc.issuer}
                </p>
                <h3 className="mt-1 font-semibold text-foreground">{doc.title}</h3>
                <p className="mt-2 text-sm text-muted">{doc.description}</p>
                {doc.validUntil && (
                  <p className="mt-2 text-xs text-muted">
                    Valid until: {doc.validUntil}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Full document copies available upon request for schools, companies, and partners.
        </p>
      </div>
    </section>
  );
}
