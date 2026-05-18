import React from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Zap, Sparkles, Building2 } from "lucide-react";

export const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: "$0",
    cadence: "forever",
    blurb: "For creators testing what Hookify can do.",
    features: [
      "60 minutes of source video / month",
      "3–5 AI clip ideas per upload",
      "Real Whisper + Claude analysis",
      "720p exports (watermarked)",
      "Workspace + saved clips",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: "$12",
    cadence: "per month",
    blurb: "For solo creators publishing weekly.",
    features: [
      "180 minutes of source video / month",
      "Unlimited clip ideas",
      "1080p exports, no watermark",
      "Caption presets & brand tone",
      "Email support",
    ],
    cta: "Start with Starter",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "$29",
    cadence: "per month",
    blurb: "For working creators shipping daily.",
    features: [
      "500 minutes of source video / month",
      "Virality scoring on every clip",
      "Branding kit (logos, colors, fonts)",
      "Per-clip analytics",
      "Priority render queue",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    icon: Building2,
    price: "$79",
    cadence: "per month",
    blurb: "For podcasts, teams and agencies.",
    features: [
      "2,000 minutes of source video / month",
      "Team seats (up to 5)",
      "Priority + parallel processing",
      "Speaker diarisation",
      "API access + dedicated success",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

export default function PricingCards({ inSection = true }) {
  const Wrapper = inSection ? "section" : "div";
  return (
    <Wrapper id="pricing" className={inSection ? "relative py-28" : ""} data-testid="section-pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300 mb-4">Pricing</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">Plans built around how much you actually ship.</h2>
          <p className="mt-4 text-zinc-400">Cancel anytime. All paid plans include unlimited exports to TikTok, YouTube Shorts and Instagram Reels.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl p-7 border ${p.featured ? "border-purple/60 bg-gradient-to-br from-purple/15 via-ink-900 to-ink-900 ring-brand" : "bg-ink-900 border-white/5"}`}
                data-testid={`plan-${p.id}`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-7 btn-brand text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-md">Most popular</div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.featured ? "btn-brand" : "bg-purple/10 border border-purple/20"}`}>
                    <Icon className={`w-4 h-4 ${p.featured ? "text-white" : "text-purple-300"}`} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">{p.name}</div>
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-heading text-4xl font-medium text-white">{p.price}</span>
                  {p.cadence && <span className="text-xs mb-2 text-zinc-500">/{p.cadence}</span>}
                </div>
                <p className="mt-3 text-sm text-zinc-400 min-h-[44px]">{p.blurb}</p>

                <Link
                  to="/signup"
                  className={`mt-6 block text-center rounded-md py-3 text-sm font-medium transition-all ${
                    p.featured ? "btn-brand" : "border border-white/10 hover:border-purple/40 hover:bg-purple/5 text-zinc-200"
                  }`}
                  data-testid={`plan-${p.id}-cta`}
                >
                  {p.cta}
                </Link>

                <ul className="mt-7 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.featured ? "text-volt" : "text-purple-300"}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-zinc-500">
          Stripe checkout coming soon — for now every plan starts in Free mode. Reply to your welcome email and we'll grade you up.
        </div>
      </div>
    </Wrapper>
  );
}
