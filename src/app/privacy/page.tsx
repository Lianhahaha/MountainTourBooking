import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LEGAL_EMAIL, type LegalSection } from "@/components/LegalPage";
import { org } from "@/data/org";

export const metadata: Metadata = {
  title: `Privacy Policy — ${org.name}`,
  description: `How ${org.name} collects, uses, and protects the personal information you share when booking a Mt. Apo trek.`,
};

const EFFECTIVE = "October 2, 2026";

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        {org.name} is a registered outdoor recreation organization in Davao del Sur,
        Philippines. We decide how the personal information collected through this site is
        used, which makes us its personal information controller under the Data Privacy Act of
        2012 (Republic Act No. 10173). Contact us about privacy at{" "}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong>When you book a trek:</strong> the lead booker&apos;s full name, mobile number,
          and email; the names of other participants and the group size; an emergency contact
          name and phone number; your chosen date or preferred date and trail; any notes you add;
          and your answers to the fitness, age, safety, and payment confirmations.
        </p>
        <p>
          <strong>When you message us:</strong> your name, email, phone number, and message.
        </p>
        <p>
          <strong>When you leave a review:</strong> your name, rating, comment, and the booking it
          belongs to.
        </p>
        <p>
          <strong>Automatically:</strong> anonymous page-view statistics from Vercel Web
          Analytics, which does not use cookies or track you across sites, and standard server
          logs (such as IP address and browser type) kept by our hosting provider for security.
          Your browser also stores your light/dark theme choice and files that let the site open
          offline. We do not use advertising or tracking cookies.
        </p>
        <p>
          Notes you write may include health details (for example, a medical condition you want
          the guide to know about). This is sensitive personal information; share only what the
          guide needs, and we use it only to keep you safe on the trek.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <ul>
          <li>To review, confirm, and manage your booking, and to contact you about it.</li>
          <li>
            To register participants with park and government authorities for trail permits,
            as Mt. Apo climbs require.
          </li>
          <li>To reach your emergency contact and responders if something happens on trail.</li>
          <li>To reply to your messages.</li>
          <li>To publish reviews you submit, after we approve them.</li>
          <li>To keep the site secure and understand, in aggregate, how it is used.</li>
        </ul>
        <p>
          We rely on your booking (a contract you request), our legal obligations, our
          legitimate interest in running safe treks, and, for reviews, your consent. We do not
          sell your information or use it for advertising.
        </p>
      </>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <ul>
          <li>
            <strong>Park and government authorities</strong>, such as the DENR and the local
            government, when registering participants for permits.
          </li>
          <li>
            <strong>Service providers</strong> that run the site for us: Vercel (hosting and
            analytics), Supabase and Google Firebase (databases), and Resend (booking emails).
            They process data only on our instructions.
          </li>
          <li>
            <strong>Emergency responders</strong>, if needed to protect someone&apos;s life or
            health.
          </li>
          <li>
            <strong>Authorities</strong>, when the law requires it.
          </li>
        </ul>
        <p>
          Some providers store data on servers outside the Philippines. We use providers that
          protect data with industry-standard security.
        </p>
      </>
    ),
  },
  {
    id: "others",
    title: "Booking for other people",
    body: (
      <p>
        If you give us details about participants or an emergency contact, make sure they know
        and agree. Participants aged 16–17 must be booked with their parent or guardian&apos;s
        knowledge, and we do not knowingly collect information about children under 16.
      </p>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <p>
        We keep booking records for as long as we need them to run your trek and to meet
        accounting, permit, and legal record-keeping duties, then delete or anonymize them.
        Contact messages are deleted once they are no longer needed to answer you. You can ask
        us to delete your information sooner, unless we must keep it by law.
      </p>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        The site uses encrypted connections (HTTPS). Booking records can only be opened by the
        owner through a password-protected dashboard, and our providers secure their systems.
        No system is perfectly secure; if a breach affects your information, we will notify you
        and the National Privacy Commission as the law requires.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul>
          <li>be informed about how your information is used;</li>
          <li>access a copy of your information;</li>
          <li>correct information that is wrong or out of date;</li>
          <li>object to processing, or withdraw consent you gave;</li>
          <li>have your information erased or blocked;</li>
          <li>receive your information in a portable format; and</li>
          <li>claim damages and file a complaint with the National Privacy Commission.</li>
        </ul>
        <p>
          To use any of these rights, email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>{" "}
          with your booking reference if you have one. We may ask you to confirm your identity
          first. You can also contact the National Privacy Commission at{" "}
          <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer">
            privacy.gov.ph
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the site or the law changes. The date at the top shows the
        latest version. See also our <Link href="/terms">Terms of Use</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective={EFFECTIVE}
      sibling={{ href: "/terms", label: "Terms of Use" }}
      summary={[
        "We collect what we need to book and run your trek: names, contact details, and an emergency contact.",
        "We share participant names with park authorities for permits, and use a few service providers to run the site.",
        "No selling, no ads, no tracking cookies.",
        "You can ask to see, correct, or delete your information at any time.",
      ]}
      sections={sections}
    />
  );
}
