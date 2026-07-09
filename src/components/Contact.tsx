"use client";

import { useState } from "react";
import { org } from "@/data/org";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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

      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="bg-surface py-10 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Contact
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-4xl">
              Get in touch
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              Have a question that isn&apos;t about booking? Send us a message or reach out
              directly.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-foreground sm:mt-8 sm:space-y-4 sm:text-base">
              <li>
                <span className="font-semibold">Phone:</span>{" "}
                <a href={`tel:${org.contact.phone}`} className="link-accent">
                  {org.contact.phone}
                </a>
              </li>
              <li>
                <span className="font-semibold">Email:</span>{" "}
                <a href={`mailto:${org.contact.email}`} className="link-accent">
                  {org.contact.email}
                </a>
              </li>
              <li>
                <span className="font-semibold">Facebook:</span>{" "}
                <a
                  href={org.contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  Message us on Facebook
                </a>
              </li>
            </ul>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-md border border-border bg-surface p-4 sm:p-6"
          >
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field-input mt-1"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="field-input mt-1"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="field-input mt-1"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="field-input mt-1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-cta mt-5 w-full !py-2.5 sm:mt-6 sm:!py-3 disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <p className="mt-3 text-center text-sm text-muted">
                Message sent! We&apos;ll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-center text-sm text-danger">
                Something went wrong. Please try again or contact us directly.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
