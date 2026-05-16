import React from "react";
import { Captions, Languages, BarChart3, Scissors, Layers, Bot } from "lucide-react";

const BENTO_IMG = "https://static.prod-images.emergentagent.com/jobs/125d395e-5f31-405e-a930-761de29c625f/images/0d83e133163afc420c1be19373c8808d79739edfc9638e6a73ff8ddc93ba96aa.png";

export default function Features() {
  return (
    <section id="features" className="relative py-28" data-testid="section-features">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-4">The studio</div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">A clipping workflow that thinks like an editor.</h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-sm">
            Not another auto-chopper. ClipForge is built on context — it understands stories, beats, and what makes a viewer stop scrolling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 auto-rows-fr">
          {/* Big bento: 9:16 phone preview */}
          <div className="lg:col-span-3 lg:row-span-2 bg-ink-900 border border-white/5 rounded-lg p-8 relative overflow-hidden min-h-[420px]" data-testid="feature-preview">
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `url(${BENTO_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-3">9:16 vertical preview</div>
              <h3 className="font-heading text-2xl sm:text-3xl font-medium max-w-md">See your short the way the algorithm will see it.</h3>
              <p className="mt-3 text-sm text-zinc-400 max-w-md">Live-preview captions, safe zones, reframe and pacing — pixel-perfect to what gets uploaded.</p>
            </div>
          </div>

          <div className="lg:col-span-3 bg-ink-900 border border-white/5 rounded-lg p-7" data-testid="feature-transcript">
            <Bot className="w-5 h-5 text-volt mb-5" />
            <h3 className="font-heading text-xl font-medium">AI transcript &amp; diarisation</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">Whisper-grade accuracy, speaker labels, timestamps and editable text — even on noisy stream audio.</p>
            <div className="mt-5 bg-ink-950 border border-white/5 rounded-md p-4 font-mono text-[11px] text-zinc-400 space-y-2">
              <div><span className="text-volt">00:24</span> · Host: "If your hook doesn't slap..."</div>
              <div><span className="text-volt">00:29</span> · Guest: "Algorithm rewards the first three frames."</div>
              <div><span className="text-zinc-600">00:33</span> · Host: "Exactly. Static = death."</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-ink-900 border border-white/5 rounded-lg p-7" data-testid="feature-score">
            <BarChart3 className="w-5 h-5 text-volt mb-5" />
            <h3 className="font-heading text-xl font-medium">Viral score</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">Every suggested clip gets a 0-100 retention score before you commit to editing it.</p>
            <div className="mt-5 flex items-end gap-1.5 h-16">
              {[40, 62, 88, 51, 96, 72, 84, 47, 78, 91].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: h > 80 ? "#CCFF00" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-ink-900 border border-white/5 rounded-lg p-7" data-testid="feature-captions">
            <Captions className="w-5 h-5 text-volt mb-5" />
            <h3 className="font-heading text-xl font-medium">Word-by-word captions</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">7 broadcast-tested caption styles. Brand fonts, emoji bursts, keyword highlights — all auto-timed.</p>
          </div>

          <div className="lg:col-span-2 bg-ink-900 border border-white/5 rounded-lg p-7" data-testid="feature-titles">
            <Scissors className="w-5 h-5 text-volt mb-5" />
            <h3 className="font-heading text-xl font-medium">Hook &amp; title generator</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">Twelve title variants per clip, ranked by predicted CTR. Steal one, or remix them.</p>
          </div>

          <div className="lg:col-span-2 bg-ink-900 border border-white/5 rounded-lg p-7" data-testid="feature-languages">
            <Languages className="w-5 h-5 text-volt mb-5" />
            <h3 className="font-heading text-xl font-medium">29 languages</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">From Tagalog to Tamil — captions, translations and dubbing for global audiences.</p>
          </div>

          <div className="lg:col-span-4 bg-ink-900 border border-white/5 rounded-lg p-7 flex flex-col sm:flex-row sm:items-center gap-6" data-testid="feature-stack">
            <Layers className="w-8 h-8 text-volt shrink-0" />
            <div>
              <h3 className="font-heading text-xl font-medium">Built for the creator stack</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">Native exports for CapCut, Premiere, Descript, Riverside, Streamyard. API access on the Pro plan for the truly unhinged.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
