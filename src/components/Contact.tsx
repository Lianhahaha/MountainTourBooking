"use client";

import { useState } from "react";
import Link from "next/link";
import { org } from "@/data/org";
import { Icon } from "@/components/Icon";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let message = "Failed";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
      setStatus("success");
      setErrorMsg("");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed");
      setStatus("error");
    }
  }

  const channels = [
    {
      icon: "phone" as const,
      label: "Call or text",
      value: org.contact.phone,
      href: `tel:${org.contact.phone.replace(/\s/g, "")}`,
    },
    {
      icon: "mail" as const,
      label: "Email",
      value: org.contact.email,
      href: `mailto:${org.contact.email}`,
    },
    {
      icon: "chat" as const,
      label: "Facebook",
      value: "Message us on Facebook",
      href: org.contact.facebook,
      external: true,
    },
  ];

  return (
    <section id="contact" className="bg-surface py-10 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-12">
        <div>
          <h2 className="font-condensed text-2xl font-bold text-foreground sm:text-3xl">
            Questions? Message us
          </h2>
          <p className="mt-1 text-sm text-muted">
            For anything that isn&apos;t a booking. We usually reply within a day.
          </p>

          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated"
                >
                  <Icon name={c.icon} className="h-[18px] w-[18px] shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-muted">{c.label}</span>
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {c.value}
                    </span>
                  </span>
                  <Icon
                    name={c.external ? "external" : "arrowRight"}
                    className="h-4 w-4 shrink-0 text-muted"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface-elevated p-4 sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="block text-[13px] font-medium text-foreground">
                Name
              </label>
              <input
                id="contact-name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-[13px] font-medium text-foreground">
                Mobile number
              </label>
              <input
                id="contact-phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+63 9XX XXX XXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="contact-email" className="block text-[13px] font-medium text-foreground">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="contact-message" className="block text-[13px] font-medium text-foreground">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="field-input mt-1 resize-y"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-cta mt-4 w-full disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>

          <div role="status" aria-live="polite">
            {status === "success" && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-primary">
                <Icon name="check" className="h-4 w-4" />
                Message sent. We&apos;ll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-center text-sm text-danger">
                {errorMsg || "Couldn't send your message. Try again, or call or email us directly."}
              </p>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted">
            We only use your details to reply. See our{" "}
            <Link href="/privacy" className="link-accent">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </section>
  );
}
