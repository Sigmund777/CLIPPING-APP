import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "./ui/dialog";
import { Upload, Wand2, Scissors, Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import JoinBetaDialog from "./JoinBetaDialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const STEPS = [
  {
    icon: Upload,
    label: "01 · Upload",
    title: "Drop a long-form file (or audio).",
    body: "MP4, MOV, MP3, WAV, M4A under 25 MB. The beta keeps things small so processing is fast.",
  },
  {
    icon: Wand2,
    label: "02 · Transcribe",
    title: "We transcribe with Whisper.",
    body: "Real word-by-word transcript with second-level timestamps. No fluff, no fake stats — just the text.",
  },
  {
    icon: Scissors,
    label: "03 · Find moments",
    title: "Claude Sonnet 4.5 scores the beats.",
    body: "Returns 3–5 honest clip ideas with hook, caption, platform recommendation and a confidence score.",
  },
  {
    icon: Sparkles,
    label: "04 · Edit & save",
    title: "Open any idea in the editor.",
    body: "Tweak title, hook, caption and platform. Save to your workspace and track status (Idea → Posted).",
  },
];

export default function WatchDemoDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const cur = STEPS[step];
  const Icon = cur.icon;

  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleOpenChange = (n) => {
    setOpen(n);
    if (!n) setTimeout(() => setStep(0), 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-ink-900 border-white/10 text-white sm:max-w-lg p-0 overflow-hidden" data-testid="walkthrough-dialog">
        <VisuallyHidden.Root>
          <DialogTitle>Hookify walkthrough</DialogTitle>
          <DialogDescription>90-second walkthrough of the Hookify beta experience.</DialogDescription>
        </VisuallyHidden.Root>
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Early access beta · 90-sec walkthrough</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 py-6 min-h-[260px]">
          <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mb-5">
            <Icon className="w-5 h-5 text-volt" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt mb-2">{cur.label}</div>
          <h3 className="font-heading text-2xl font-medium tracking-tight">{cur.title}</h3>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{cur.body}</p>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === step ? "bg-volt w-6" : "bg-white/15 w-3"}`} />
            ))}
          </div>
          {step < total - 1 ? (
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={prev} className="inline-flex items-center gap-1.5 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 px-3 py-2 rounded-md text-xs transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              <button onClick={next} className="inline-flex items-center gap-2 bg-volt text-black font-medium px-4 py-2 rounded-md text-xs hover:bg-volt-300 transition-colors" data-testid="walkthrough-next">
                Next <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/upload"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 border border-volt/40 text-volt hover:bg-volt/10 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                data-testid="walkthrough-try-upload"
              >
                Try upload demo
              </Link>
              <JoinBetaDialog
                trigger={
                  <button className="inline-flex items-center gap-2 bg-volt text-black font-medium px-4 py-2 rounded-md text-xs hover:bg-volt-300 transition-colors" data-testid="walkthrough-request-access">
                    <Sparkles className="w-3.5 h-3.5" /> Request beta access
                  </button>
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
