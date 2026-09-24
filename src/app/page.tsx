import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Trips } from "@/components/Trips";
import { Reviews } from "@/components/Reviews";
import { Trust } from "@/components/Trust";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { StickyBookButton } from "@/components/StickyBookButton";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Trips />
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
