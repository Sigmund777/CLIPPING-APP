import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    cadence: "forever",
    blurb: "For creators testing the waters.",
    features: [
      "5 clips per month",
      "Up to 30-min uploads",
      "Standard captions",
      "720p exports",
      "Watermark on export",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$24",
    cadence: "per month",
    blurb: "For working creators shipping weekly.",
    features: [
      "120 clips per month",
      "Up to 4-hour uploads",
      "All 7 caption styles",
      "1080p watermark-free exports",
      "Viral score & A/B titles",
      "Brand kits (3 presets)",
    ],
    cta: "Start 7-day trial",
    featured: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$79",
    cadence: "per month",
    blurb: "For podcasts, teams and agencies.",
    features: [
      "Unlimited clips",
      "Up to 8-hour uploads",
      "Custom caption styles",
      "4K exports + API access",
      "Speaker diarisation",
      "Priority queue & dedicated CSM",
    ],
    cta: "Start 7-day trial",
    featured: false,
  },
];

export default function PricingCards({ inSection = true }) {
  const Wrapper = inSection ? "section" : "div";
  return (
    <Wrapper id="pricing" className={inSection ? "relative py-28" : ""} data-testid="section-pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-4">Pricing</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">Plans built around how much you actually ship.</h2>
          <p className="mt-4 text-zinc-400">Cancel anytime. Yearly saves 22%. All plans include unlimited exports to TikTok, Shorts and Reels.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-lg p-8 border ${p.featured ? "bg-volt text-black border-volt" : "bg-ink-900 border-white/5"}`}
              data-testid={`plan-${p.id}`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-8 bg-black text-volt text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-sm">Most popular</div>
              )}
              <div className={`text-xs font-bold uppercase tracking-[0.2em] ${p.featured ? "text-black/60" : "text-zinc-500"}`}>{p.name}</div>
              <div className="mt-4 flex items-end gap-1">
                <span className={`font-heading text-5xl font-medium ${p.featured ? "text-black" : "text-white"}`}>{p.price}</span>
                {p.cadence && <span className={`text-sm mb-2 ${p.featured ? "text-black/60" : "text-zinc-500"}`}>/{p.cadence}</span>}
              </div>
              <p className={`mt-3 text-sm ${p.featured ? "text-black/70" : "text-zinc-400"}`}>{p.blurb}</p>

              <Link
                to="/signup"
                className={`mt-7 block text-center rounded-md py-3 text-sm font-medium transition-colors ${
                  p.featured ? "bg-black text-volt hover:bg-zinc-900" : "bg-volt text-black hover:bg-volt-300"
                }`}
                data-testid={`plan-${p.id}-cta`}
              >
                {p.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${p.featured ? "text-black/80" : "text-zinc-300"}`}>
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.featured ? "text-black" : "text-volt"}`} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}
