import React from "react";
import { Upload, Wand2, Download } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Drop your long-form",
    body: "Upload a podcast, livestream VOD, webinar, or YouTube link up to 4 hours. Our pipeline transcribes, diarises and indexes it in seconds.",
  },
  {
    n: "02",
    icon: Wand2,
    title: "Let the AI cook",
    body: "Claude 4.5 reads the transcript, scores hooks for retention, isolates self-contained moments and proposes viral titles you'd actually post.",
  },
  {
    n: "03",
    icon: Download,
    title: "Export ready-to-post",
    body: "9:16 reframe, animated captions, brand-safe music. One click ships to TikTok, Shorts, Reels, or your scheduler. No timeline scrubbing.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-28" data-testid="section-how">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-4">How it works</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">From raw VOD to posted in three honest steps.</h2>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-ink-900 p-8 lg:p-10 hover:bg-ink-800/70 transition-colors group" data-testid={`step-${s.n}`}>
              <div className="flex items-start justify-between mb-12">
                <span className="font-mono text-xs text-zinc-500">{s.n} / 03</span>
                <div className="w-10 h-10 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center group-hover:bg-volt group-hover:border-volt transition-colors">
                  <s.icon className="w-4 h-4 text-volt group-hover:text-black transition-colors" />
                </div>
              </div>
              <h3 className="font-heading text-xl font-medium">{s.title}</h3>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
