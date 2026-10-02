import { org } from "@/data/org";
import { licenses } from "@/data/licenses";
import { Box, BoxHeader } from "@/components/Box";
import { Icon } from "@/components/Icon";

export function About() {
  return (
    <section id="about" className="border-b border-border py-8 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Your guide</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted">{org.guideBio}</p>

          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
            {org.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse bg-background px-3 py-2">
                <dt className="text-[11px] text-muted">{stat.label}</dt>
                <dd className="tabular font-display text-lg font-bold leading-tight text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Guide credentials">
            {org.credentials.map((cred) => (
              <li
                key={cred}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground"
              >
                <Icon name="check" className="h-3.5 w-3.5 text-success" />
                {cred}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-semibold text-foreground">On every climb</h3>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {org.whatToExpect.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px] text-foreground">
                <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div id="permits" className="scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Licensed to operate
          </h2>
          <p className="mt-1 text-sm text-muted">Full copies on request for schools and companies.</p>

          <Box className="mt-4">
            <BoxHeader>
              <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Icon name="shield" className="h-4 w-4 text-success" />
                Licenses &amp; permits
              </span>
              <span className="text-xs text-muted">{licenses.length} on file</span>
            </BoxHeader>
            <ul className="divide-y divide-border">
              {licenses.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-foreground">{doc.title}</p>
                    <p className="truncate text-xs text-muted">{doc.issuer}</p>
                  </div>
                  {doc.validUntil && (
                    <span className="tabular shrink-0 whitespace-nowrap rounded-full border border-success/40 px-2 py-0.5 text-[11px] font-medium text-success">
                      Until {doc.validUntil.replace(/^([A-Za-z]{3})[A-Za-z]*/, "$1")}
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
