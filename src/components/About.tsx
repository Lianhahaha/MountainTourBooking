import { org } from "@/data/org";
import { licenses } from "@/data/licenses";
import { HangTag } from "@/components/HangTag";
import { Icon } from "@/components/Icon";

export function About() {
  return (
    <section id="about" className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 className="font-condensed text-2xl font-bold text-foreground sm:text-3xl">
              Who leads your climb
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted">
              {org.guideBio}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {org.stats.map((stat) => (
                <div key={stat.label} className="bg-background px-3 py-2">
                  <dt className="text-[11px] font-medium text-muted">{stat.label}</dt>
                  <dd className="tabular font-condensed text-lg font-bold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Guide credentials">
              {org.credentials.map((cred) => (
                <li
                  key={cred}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[13px] text-foreground"
                >
                  <Icon name="check" className="h-3.5 w-3.5 text-primary" />
                  {cred}
                </li>
              ))}
            </ul>
          </div>

          <div className="woven rounded-lg border border-border bg-surface p-5">
            <h3 className="font-condensed text-lg font-bold text-foreground">
              What to expect on the trail
            </h3>
            <ol className="mt-3 space-y-2.5">
              {org.whatToExpect.map((item, i) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="tabular mt-px w-4 shrink-0 text-right text-[13px] font-bold text-muted">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div id="permits" className="mt-10 scroll-mt-20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <h3 className="font-condensed text-xl font-bold text-foreground sm:text-2xl">
                Licensed to operate
              </h3>
              <p className="mt-1 max-w-xl text-sm text-muted">
                A registered, licensed outdoor recreation organization. All permits and
                certifications are current and available for review.
              </p>
            </div>
            <p className="text-[13px] text-muted sm:max-w-xs sm:text-right">
              Schools, companies, and partners can request full document copies.
            </p>
          </div>

          <ul className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {licenses.map((doc) => (
              <li key={doc.id}>
                <HangTag size="sm" centerHole className="h-full" faceClassName="flex flex-col">
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
                    <p className="spec-label leading-snug">{doc.issuer}</p>
                    <p className="mt-1 font-condensed text-[17px] font-bold leading-tight text-foreground">
                      {doc.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {doc.description}
                    </p>
                    {doc.validUntil && (
                      <div className="mt-auto pt-3">
                        <div className="stitch mb-2.5" />
                        <p className="tabular flex items-center gap-1.5 text-xs text-foreground">
                          <Icon name="shield" className="h-3.5 w-3.5 text-primary" />
                          Valid until {doc.validUntil}
                        </p>
                      </div>
                    )}
                  </div>
                </HangTag>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
