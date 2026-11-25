import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Dates } from "@/components/Dates";
import { Inclusions } from "@/components/Inclusions";
import { RecentClimbs } from "@/components/RecentClimbs";
import { Reviews } from "@/components/Reviews";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { StickyBookButton } from "@/components/StickyBookButton";
import { SectionTabs, type SectionTab } from "@/components/SectionTabs";
import { faq } from "@/data/faq";
import { getApprovedReviews } from "@/lib/reviews";
import { getPrivateTrip, getScheduledTrips } from "@/data/trips";
import { getAvailableTrekSessionsResult, getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { getAllHikingDaysResult } from "@/lib/hiking-days-file";
import { dateParts } from "@/lib/utils";
import { siteUrl } from "@/lib/site";
import { org } from "@/data/org";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trip = getScheduledTrips()[0];
  const [sessionsResult, albumsResult, reviews] = await Promise.all([
    getAvailableTrekSessionsResult(),
    getAllHikingDaysResult(),
    getApprovedReviews(),
  ]);
  const sessions = sessionsResult.sessions;
  const [next] = sessions;
  const nextParts = next ? dateParts(next.date) : null;

  const tabs: SectionTab[] = [
    { id: "overview", label: "Overview", icon: "home" },
    { id: "dates", label: "Dates", icon: "calendar", count: sessions.length },
    ...(trip ? [{ id: "included", label: "Inclusions", icon: "backpack" } as SectionTab] : []),
    { id: "about", label: "About", icon: "shield" },
    ...(reviews.length > 0
      ? [{ id: "reviews", label: "Reviews", icon: "star", count: reviews.length } as SectionTab]
      : []),
    { id: "faq", label: "FAQ", icon: "question", count: faq.length },
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: org.name,
    description: org.description,
    url: siteUrl(),
    telephone: org.contact.phone,
    email: org.contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Davao del Sur",
      addressCountry: "PH",
    },
    sameAs: [org.contact.facebook, org.contact.instagram],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <SectionTabs tabs={tabs} />
      <main className="has-sticky-bar">
        <Hero trip={trip} next={next} moreDates={Math.max(0, sessions.length - 1)} />
        <Dates trip={trip} privateTrip={getPrivateTrip()} sessions={sessions} error={sessionsResult.error} />
        {trip && <Inclusions trip={trip} />}
        <About />
        <RecentClimbs days={albumsResult.days} />
        <Reviews reviews={reviews} />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <StickyBookButton
        next={
          trip && next && nextParts
            ? {
                label: `${nextParts.weekday.slice(0, 3)} ${nextParts.month} ${nextParts.day}`,
                slotsLeft: getSessionSlotsRemaining(next),
                href: `/book?trip=${trip.id}&session=${next.id}`,
              }
            : undefined
        }
      />
    </>
  );
}
