import Link from "next/link";
import { org } from "@/data/org";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface text-muted">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-foreground sm:text-lg">{org.name}</p>
          <p className="mt-2 text-sm leading-relaxed">{org.tagline}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Contact</p>
          <ul className="mt-2 space-y-1.5 text-sm sm:mt-3 sm:space-y-2">
            <li>{org.contact.phone}</li>
            <li>{org.contact.email}</li>
            <li>{org.contact.location}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Follow</p>
          <div className="mt-2 flex gap-4 text-sm sm:mt-3">
            <a
              href={org.contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              Facebook
            </a>
            <a
              href={org.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              Instagram
            </a>
          </div>
          <Link
            href="/book"
            className="btn-cta-sm mt-4 w-full justify-center sm:w-auto"
          >
            Book a Trek
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {org.name}. Registered &amp; licensed to operate.{" "}
        <Link href="/admin/login" className="link-accent">
          Owner login
        </Link>
      </div>
    </footer>
  );
}
