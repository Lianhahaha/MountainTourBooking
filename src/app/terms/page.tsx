import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LEGAL_EMAIL, type LegalSection } from "@/components/LegalPage";
import { org } from "@/data/org";

export const metadata: Metadata = {
  title: `Terms of Use — ${org.name}`,
  description: `The terms for booking a guided Mt. Apo trek with ${org.name} and using this website.`,
};

const EFFECTIVE = "October 2, 2026";

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms apply when you use this website or book a trek with {org.name}{" "}
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a registered outdoor recreation organization
          based in Davao del Sur, Philippines. By sending a booking request or using the site,
          you agree to them. If you book for a group, you agree on behalf of everyone you list.
        </p>
      </>
    ),
  },
  {
    id: "bookings",
    title: "Booking requests",
    body: (
      <>
        <p>
          Sending the booking form is a <strong>request</strong>, not a confirmed booking. You
          receive a booking reference right away. We review each request and confirm by SMS or
          email, usually within 24–48 hours. Your slot is secured once we confirm.
        </p>
        <ul>
          <li>Give accurate details for every participant and emergency contact.</li>
          <li>
            The person who books (the &ldquo;lead booker&rdquo;) is responsible for sharing these
            terms with the group and for having permission to give us their details.
          </li>
          <li>
            Dates, slot counts, and prices on the site can change. We may decline a request, for
            example when a date fills up or a participant does not meet the requirements below.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "payment",
    title: "Prices and payment",
    body: (
      <>
        <p>
          Prices are in Philippine pesos (₱) per person. The total shown when you book is an
          estimate for reference. <strong>We do not take payment on this website.</strong>{" "}
          Payment is collected in person on trek day, in cash or by GCash, as arranged when we
          confirm.
        </p>
        <p>
          Each trek listing shows what the fee includes and what it does not. Transport to the
          jump-off, personal camping gear, porter fees, and travel insurance are usually not
          included.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations, no-shows, and weather",
    body: (
      <>
        <ul>
          <li>
            Cancel <strong>7 or more days</strong> before the trek: full refund of any deposit
            paid.
          </li>
          <li>
            Cancel <strong>3–6 days</strong> before: 50% refund of any deposit paid.
          </li>
          <li>
            Cancel <strong>less than 3 days</strong> before: no refund, but you may transfer your
            slot to another person who meets the requirements.
          </li>
          <li>
            We leave at the scheduled meet-up time. Late arrivals cannot join the group on trail,
            and no-shows are not refunded.
          </li>
        </ul>
        <p>
          Safety comes first. If storms, heavy rain, a trail closure, or an advisory from PAGASA
          or the DENR makes a trek unsafe, we will move you to another date at no extra cost or
          give a full refund of any amount paid.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Age, fitness, and health",
    body: (
      <>
        <p>
          Mt. Apo is a Hard-rated, multi-day, high-altitude trek. The minimum age is 16;
          participants aged 16–17 must climb with a parent or guardian. When you book, you
          confirm that every participant is fit for this kind of trek.
        </p>
        <p>
          Tell us before the trek about any medical condition, injury, or pregnancy that could
          affect a participant&apos;s safety. Our guide may turn a participant back or end a
          trek early if continuing would put anyone at risk.
        </p>
      </>
    ),
  },
  {
    id: "trail",
    title: "On the trail",
    body: (
      <>
        <ul>
          <li>Follow the guide&apos;s instructions. Safety decisions on trail are final.</li>
          <li>
            Follow the rules of Mt. Apo Natural Park and the DENR, and practice leave-no-trace:
            carry out what you carry in.
          </li>
          <li>
            Treat the group, guides, porters, local communities, and the mountain with respect.
            We may remove a participant whose conduct endangers others, without refund.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "risk",
    title: "Risks of mountain trekking",
    body: (
      <>
        <p>
          Trekking on Mt. Apo carries real risks, including steep and slippery terrain, sudden
          weather changes, cold at summit camp, altitude, volcanic gases near sulfur vents,
          wildlife, and limited access to medical care. We plan for these risks with briefings,
          trained guides, and first-aid kits, but we cannot remove them. By joining a trek, you
          accept these risks.
        </p>
        <p>
          We carry liability insurance for organized trekking activities. We still recommend
          personal travel or accident insurance, which is not included in the trek fee.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limits of our responsibility",
    body: (
      <>
        <p>
          To the extent Philippine law allows, we are not responsible for lost or damaged
          personal belongings, for services you arrange with third parties (such as transport or
          independent porters), or for indirect losses like missed connections. Nothing in these
          terms limits liability that cannot be limited by law, including liability for our
          gross negligence.
        </p>
      </>
    ),
  },
  {
    id: "photos",
    title: "Photos and reviews",
    body: (
      <>
        <p>
          Our guides take photos during treks and may share them with the group and in the
          hike albums on this site. If you prefer not to appear, tell your guide, or email us
          later to have a photo removed.
        </p>
        <p>
          Reviews must be honest and about your own trek. We read reviews before publishing and
          may decline ones that are offensive, misleading, or share other people&apos;s
          personal information.
        </p>
      </>
    ),
  },
  {
    id: "website",
    title: "Using this website",
    body: (
      <>
        <p>
          The text, photos, and design of this site belong to {org.name} or are used with
          permission. Do not copy them for commercial use, try to access the owner dashboard,
          interfere with the site, or send automated requests to it. The site is provided as
          is; we work to keep it accurate and available, but cannot promise it will always be
          error-free.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Your personal information",
    body: (
      <p>
        How we collect and use the details you give us is explained in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and governing law",
    body: (
      <>
        <p>
          We may update these terms. The date at the top shows the latest version, and the
          version in effect when you book applies to that booking. These terms are governed by
          the laws of the Republic of the Philippines.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms: <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      effective={EFFECTIVE}
      sibling={{ href: "/privacy", label: "Privacy Policy" }}
      summary={[
        "Booking online is a request. Your slot is secured once we confirm, usually within 24–48 hours.",
        "No online payment. You pay in person on trek day, cash or GCash.",
        "Free cancellation 7+ days out; 50% at 3–6 days; slot transfer under 3 days.",
        "Unsafe weather or trail closures mean a free reschedule or full refund.",
        "Participants must be 16+ (16–17 with a guardian) and fit for a Hard-rated trek.",
      ]}
      sections={sections}
    />
  );
}
