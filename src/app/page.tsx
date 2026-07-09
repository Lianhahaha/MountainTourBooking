import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyBookButton } from "@/components/StickyBookButton";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Trips } from "@/components/Trips";
import { Trust } from "@/components/Trust";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Trips />
        <Trust />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <StickyBookButton />
    </>
  );
}
