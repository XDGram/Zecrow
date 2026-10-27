import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Custody from "@/components/Custody";
import Disputes from "@/components/Disputes";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import ZcashBackground from "@/components/ZcashBackground";

export default function Home() {
  return (
    <>
      <ZcashBackground />
      <div className="relative z-10">
        <Nav />
        <main>
          <Hero />
          <HowItWorks />
          <Custody />
          <Disputes />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
