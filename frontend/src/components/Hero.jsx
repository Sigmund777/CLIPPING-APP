import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import JoinBetaDialog from "./JoinBetaDialog";
import WatchDemoDialog from "./WatchDemoDialog";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/125d395e-5f31-405e-a930-761de29c625f/images/a4d8d1aebf84e409a66aade962912ad10e28a226f6226ecc9d1112c6d5eb9c67.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32" data-testid="hero">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div
        className="absolute -top-32 right-0 w-[55%] h-[120%] opacity-50 pointer-events-none"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 mb-8 text-xs text-zinc-300 bg-white/5 backdrop-blur" data-testid="hero-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
            <span className="font-mono">Early access beta · Whisper + Claude Sonnet 4.5</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05]" data-testid="hero-title">
            Turn long videos into <br />
            <span className="text-volt">short-form clip ideas,</span> <br />
            hooks, captions, and timestamps.
          </h1>

          <p className="mt-7 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed" data-testid="hero-subtitle">
            Drop a podcast, stream VOD, or audio file. Hookify transcribes it and surfaces 3–5 real clip ideas with hooks, captions and platform recommendations. Built for the creator stack — real export tools coming soon.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/signup" className="inline-flex items-center gap-2 bg-volt text-black font-medium px-6 py-3.5 rounded-md hover:bg-volt-300 transition-colors group" data-testid="hero-cta-primary">
              Try the beta free
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <JoinBetaDialog
              trigger={
                <button
                  className="inline-flex items-center gap-2 border border-volt/40 text-volt hover:bg-volt/10 transition-colors font-medium px-5 py-3.5 rounded-md text-sm"
                  data-testid="hero-join-beta"
                >
                  <Sparkles className="w-4 h-4" /> Join beta
                </button>
              }
            />
            <WatchDemoDialog
              trigger={
                <button className="inline-flex items-center gap-2 text-zinc-300 hover:text-white px-4 py-3.5 group" data-testid="hero-cta-secondary">
                  <span className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center group-hover:border-volt/50 transition-colors">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </span>
                  Watch the 90-sec walkthrough
                </button>
              }
            />
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" /> Early access beta</span>
            <span>·</span>
            <span>Real transcription powered by OpenAI Whisper</span>
            <span>·</span>
            <span>Real clip suggestions via Claude Sonnet 4.5</span>
          </div>
        </div>
      </div>
    </section>
  );
}
