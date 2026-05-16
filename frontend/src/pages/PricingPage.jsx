import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PricingCards from "../components/PricingCards";
import FAQ from "../components/FAQ";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white" data-testid="pricing-page">
      <Navbar />
      <div className="pt-16">
        <PricingCards />
      </div>
      <FAQ />
      <Footer />
    </div>
  );
}
