import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
import PricingCards from "../components/PricingCards";
import FAQ from "../components/FAQ";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white" data-testid="landing-page">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <PricingCards />
      {/* Final CTA strip */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight max-w-2xl">Your next viral clip is buried in a file you already own.</h2>
          <Link to="/signup" className="bg-volt text-black font-medium px-7 py-4 rounded-md hover:bg-volt-300 transition-colors text-sm shrink-0" data-testid="final-cta">Forge it free — no card needed</Link>
        </div>
      </section>
      <FAQ />
      <Footer />
    </div>
  );
}
