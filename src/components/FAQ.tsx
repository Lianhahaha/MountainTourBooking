import { faq } from "@/data/faq";
import { Icon } from "@/components/Icon";

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border py-10 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Good to know before you go
          </h2>
          <p className="mt-1 text-sm text-muted">
            Payment, cancellations, weather, and fitness — answered.
          </p>
          <a
            href="#contact"
            className="mt-3 hidden items-center gap-1.5 text-[13px] font-medium text-accent hover:underline lg:inline-flex"
          >
            Ask something else
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {faq.map((item, index) => (
            <details key={item.question} name="faq" open={index === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-elevated [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold text-foreground">{item.question}</span>
                <Icon
                  name="chevronDown"
                  className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-[68ch] px-4 pb-4 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
