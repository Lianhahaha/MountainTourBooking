import { org } from "@/data/org";

export function About() {
  return (
    <section id="about" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              About Us
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              Meet {org.guideName}
            </h2>
            <p className="mt-4 leading-relaxed text-muted">{org.guideBio}</p>

            <div className="mt-8">
              <p className="font-semibold text-foreground">Guide credentials</p>
              <ul className="mt-3 space-y-2">
                {org.credentials.map((cred) => (
                  <li key={cred} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 text-muted">✓</span>
                    {cred}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface p-8">
            <h3 className="text-lg font-semibold text-foreground">What to expect</h3>
            <ul className="mt-4 space-y-3">
              {org.whatToExpect.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-xs font-semibold text-accent">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
