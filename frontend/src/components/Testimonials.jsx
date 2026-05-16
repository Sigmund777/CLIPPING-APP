import React from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "We were paying two editors $6k/month to chop our podcast. Cancelled both, Hookify does it better. Our Reels reach doubled in 6 weeks.",
    name: "Marcus Halloway",
    role: "Host · The Founders Lab Podcast",
    img: "https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxwb2RjYXN0ZXIlMjBtaWNyb3Bob25lfGVufDB8fHx8MTc3ODkxNjgwMnww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote: "I stream 30 hours a week. Hookify surfaces the moments I forgot happened — and the viral scores are genuinely predictive.",
    name: "Riya Anand",
    role: "Twitch Partner · @riyaplays",
    img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxwb2RjYXN0ZXIlMjBtaWNyb3Bob25lfGVufDB8fHx8MTc3ODkxNjgwMnww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote: "The hook scoring alone is worth the subscription. It's like having a TikTok strategist on staff who never sleeps.",
    name: "Daniel Okafor",
    role: "Creator · 1.2M YouTube",
    img: "https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxwb2RjYXN0ZXIlMjBtaWNyb3Bob25lfGVufDB8fHx8MTc3ODkxNjgwMnww&ixlib=rb-4.1.0&q=85",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-28 border-y border-white/5 bg-ink-900/40" data-testid="section-testimonials">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-4">Loved by creators</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">Trusted on stages where every second counts.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="bg-ink-900 border border-white/5 rounded-lg p-7 flex flex-col gap-6 hover:border-zinc-700/60 transition-colors" data-testid={`testimonial-${i}`}>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-3.5 h-3.5 text-volt fill-volt" />)}
              </div>
              <blockquote className="text-base text-zinc-200 leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
