import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HangTag } from "@/components/HangTag";
import { Icon } from "@/components/Icon";

export const LEGAL_EMAIL = "projectneodevscoe@gmail.com";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function LegalPage({
  title,
  effective,
  summary,
  sections,
  sibling,
}: {
  title: string;
  effective: string;
  summary: string[];
  sections: LegalSection[];
  sibling: { href: string; label: string };
}) {
  return (
    <>
      <Header />
      <main className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5" aria-hidden>
              /
            </span>
            <span className="text-foreground">{title}</span>
          </nav>

          <h1 className="mt-3 font-condensed text-3xl font-extrabold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="tabular mt-1.5 text-[13px] text-muted">
            Effective {effective} · Questions:{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="link-accent">
              {LEGAL_EMAIL}
            </a>
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <details className="group rounded-lg border border-border bg-surface lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  On this page
                  <Icon
                    name="chevronDown"
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                  />
                </summary>
                <Toc sections={sections} className="px-2 pb-2" />
              </details>
              <div className="hidden lg:block">
                <p className="spec-label px-2">On this page</p>
                <Toc sections={sections} className="mt-2" />
                <Link
                  href={sibling.href}
                  className="mt-4 flex items-center gap-1.5 px-2 text-[13px] font-medium text-accent hover:underline"
                >
                  {sibling.label}
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>

            <div className="min-w-0 max-w-[70ch]">
              <HangTag size="sm" className="mt-2">
                <div className="px-4 pb-4 pt-3 sm:px-5">
                  <p className="spec-label pl-6">The short version</p>
                  <ul className="mt-3 space-y-1.5">
                    {summary.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </HangTag>

              <div className="legal mt-8">
                {sections.map((section, i) => (
                  <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`}>
                    <h2 id={`${section.id}-h`}>
                      <span className="tabular mr-2 text-muted">{i + 1}.</span>
                      {section.title}
                    </h2>
                    {section.body}
                  </section>
                ))}
              </div>

              <div className="mt-10 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
                Also read our{" "}
                <Link href={sibling.href} className="link-accent font-medium">
                  {sibling.label}
                </Link>
                . Questions about either? Email{" "}
                <a href={`mailto:${LEGAL_EMAIL}`} className="link-accent font-medium">
                  {LEGAL_EMAIL}
                </a>
                .
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Toc({ sections, className }: { sections: LegalSection[]; className?: string }) {
  return (
    <ol className={className}>
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <span className="tabular w-4 shrink-0 text-right">{i + 1}.</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
