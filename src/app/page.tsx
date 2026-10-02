import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Dates } from "@/components/Dates";
import { Inclusions } from "@/components/Inclusions";
import { Reviews } from "@/components/Reviews";
import { Trust } from "@/components/Trust";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { StickyBookButton } from "@/components/StickyBookButton";
import { getPrivateTrip, getScheduledTrips } from "@/data/trips";
import { getAvailableTrekSessions } from "@/lib/trek-sessions-file";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trip = getScheduledTrips()[0];
  const sessions = await getAvailableTrekSessions();
  const [next] = sessions;

  return (
    <>
      <Header />
      <main className="has-sticky-bar">
        <Hero trip={trip} next={next} moreDates={Math.max(0, sessions.length - 1)} />
        <Dates trip={trip} privateTrip={getPrivateTrip()} sessions={sessions} />
        {trip && <Inclusions trip={trip} />}
        <About />
        <Reviews />
        <Trust />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <StickyBookButton />
    </>
  );
}
