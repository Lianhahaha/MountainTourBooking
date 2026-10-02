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
import { getAvailableTrekSessions, getSessionSlotsRemaining } from "@/lib/trek-sessions-file";
import { getAllHikingDays } from "@/lib/hiking-days-file";
import { dateParts } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trip = getScheduledTrips()[0];
  const [sessions, hikingDays, reviews] = await Promise.all([
    getAvailableTrekSessions(),
    getAllHikingDays(),
    getApprovedReviews(),
  ]);
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

  return (
    <>
      <Header />
      <SectionTabs tabs={tabs} />
      <main className="has-sticky-bar">
        <Hero trip={trip} next={next} moreDates={Math.max(0, sessions.length - 1)} />
        <Dates trip={trip} privateTrip={getPrivateTrip()} sessions={sessions} />
        {trip && <Inclusions trip={trip} />}
        <About />
        <RecentClimbs days={hikingDays} />
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
