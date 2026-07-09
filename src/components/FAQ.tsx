"use client";

import { useState } from "react";
import { faq } from "@/data/faq";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-background py-10 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            FAQ & Policies
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-4xl">
            Good to know before you go
          </h2>
        </div>

        <div className="mt-8 divide-y divide-border rounded-md border border-border bg-surface sm:mt-10">
          {faq.map((item, index) => (
            <div key={item.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5 sm:py-4"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="pr-4 text-sm font-medium text-foreground sm:text-base">{item.question}</span>
                <span className="shrink-0 text-muted">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-3 text-sm leading-relaxed text-muted sm:px-5 sm:pb-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
