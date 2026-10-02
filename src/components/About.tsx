import { org } from "@/data/org";
import { licenses } from "@/data/licenses";
import { Box, BoxHeader } from "@/components/Box";
import { Icon } from "@/components/Icon";

export function About() {
  return (
    <section id="about" className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Who leads your climb
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted">
              {org.guideBio}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
              {org.stats.map((stat) => (
                <div key={stat.label} className="bg-background px-3 py-2">
                  <dt className="text-[11px] font-medium text-muted">{stat.label}</dt>
                  <dd className="tabular font-display text-lg font-bold text-foreground">
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

          <div className="rounded-md border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-bold text-foreground">
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
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
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

          <Box className="mt-5">
            <BoxHeader>
              <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Icon name="shield" className="h-4 w-4 text-primary" />
                Licenses &amp; permits
              </span>
              <span className="text-xs text-muted">{licenses.length} on file</span>
            </BoxHeader>
            <ul className="divide-y divide-border">
              {licenses.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted">{doc.issuer}</p>
                    <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-muted">
                      {doc.description}
                    </p>
                  </div>
                  {doc.validUntil && (
                    <span className="tabular shrink-0 self-start whitespace-nowrap rounded-full border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary">
                      Valid until {doc.validUntil}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Box>
        </div>
      </div>
    </section>
  );
}
