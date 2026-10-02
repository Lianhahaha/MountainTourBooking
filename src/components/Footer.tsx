import Link from "next/link";
import { org } from "@/data/org";
import { Icon } from "@/components/Icon";

const columns = [
  {
    title: "Climb",
    links: [
      { href: "/#dates", label: "Upcoming dates" },
      { href: "/book?trip=private-custom", label: "Private group climb" },
      { href: "/#included", label: "Inclusions & pack list" },
      { href: "/book", label: "Book a climb" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/#about", label: "Our guide" },
      { href: "/#permits", label: "Licenses & permits" },
      { href: "/hikes", label: "Photo albums" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Use" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background text-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon name="peak" className="h-4 w-4" />
            </span>
            <span className="font-condensed text-[17px] font-bold leading-none tracking-tight">
              {org.name}
            </span>
          </Link>
          <p className="mt-2 text-[13px]">{org.tagline}</p>
          <ul className="mt-4 space-y-1.5 text-[13px]">
            <li>
              <a href={`tel:${org.contact.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                {org.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${org.contact.email}`} className="hover:text-foreground">
                {org.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-1.5">
              <Icon name="pin" className="h-3.5 w-3.5" />
              {org.contact.location}
            </li>
          </ul>
          <div className="mt-3 flex gap-4 text-[13px] font-medium">
            <a
              href={org.contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Facebook
            </a>
            <a
              href={org.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="spec-label">{col.title}</p>
              <ul className="mt-2.5 space-y-2 text-[13px]">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {org.name}. Registered &amp; licensed to operate.
          </p>
          <p className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/admin/login" className="hover:text-foreground">
              Owner login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
