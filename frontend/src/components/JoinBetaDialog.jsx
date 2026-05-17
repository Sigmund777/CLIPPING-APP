import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogTrigger, DialogFooter,
} from "./ui/dialog";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const CREATOR_TYPES = [
  "Podcaster",
  "YouTuber",
  "Twitch / live streamer",
  "Educator / coach",
  "Agency / team",
  "Other",
];

const PLATFORM_OPTIONS = ["TikTok", "YouTube Shorts", "Instagram Reels", "All three"];
const VOLUME_OPTIONS = ["1–2 / week", "3–5 / week", "6–10 / week", "10+ / week"];

/**
 * JoinBetaDialog
 * Self-contained early-access form. No backend call — submission is
 * persisted in localStorage and a friendly success state is shown.
 *
 * Props:
 *   trigger: ReactNode rendered as the opener (DialogTrigger asChild).
 */
export default function JoinBetaDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [platform, setPlatform] = useState("");
  const [volume, setVolume] = useState("");
  const [pain, setPain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName(""); setEmail(""); setType(""); setPlatform(""); setVolume(""); setPain("");
    setSubmitting(false); setSubmitted(false); setError("");
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setTimeout(reset, 250); // wait for dialog close animation
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !type || !pain.trim()) {
      setError("Fill all four fields so we can tailor the beta to you.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email looks off — double-check it?");
      return;
    }
    setSubmitting(true);

    // Persist locally so the demo can showcase "you're on the list" on repeat visits.
    try {
      const payload = { name, email, type, platform, volume, pain, submitted_at: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem("hookify_beta_signups") || "[]");
      localStorage.setItem("hookify_beta_signups", JSON.stringify([...existing, payload]));
    } catch (_) {}

    // Tiny artificial delay so the spinner is visible.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
    toast.success("You're on the Hookify beta list");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="bg-ink-900 border-white/10 text-white sm:max-w-md p-0 overflow-hidden"
        data-testid="join-beta-dialog"
      >
        {!submitted ? (
          <form onSubmit={submit}>
            <DialogHeader className="p-6 pb-2 space-y-2">
              <div className="inline-flex items-center gap-2 border border-volt/20 bg-volt/5 rounded-full px-2.5 py-1 w-fit">
                <Sparkles className="w-3 h-3 text-volt" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Early access</span>
              </div>
              <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Join the Hookify beta.</DialogTitle>
              <DialogDescription className="text-sm text-zinc-400 leading-relaxed">
                We're rolling out real uploads, live AI clipping and verified accounts in waves. Tell us who you are and we'll send you the keys.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="beta-name" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Your name</label>
                <input
                  id="beta-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Reyes"
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors"
                  data-testid="beta-name"
                />
              </div>

              <div>
                <label htmlFor="beta-email" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Work email</label>
                <input
                  id="beta-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors"
                  data-testid="beta-email"
                />
              </div>

              <div>
                <label htmlFor="beta-type" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Creator type</label>
                <select
                  id="beta-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors appearance-none"
                  data-testid="beta-type"
                >
                  <option value="">Choose what fits best…</option>
                  {CREATOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="beta-platform" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Main platform</label>
                  <select
                    id="beta-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors appearance-none"
                    data-testid="beta-platform"
                  >
                    <option value="">Pick one…</option>
                    {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="beta-volume" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Long-form / week</label>
                  <select
                    id="beta-volume"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors appearance-none"
                    data-testid="beta-volume"
                  >
                    <option value="">Pick one…</option>
                    {VOLUME_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="beta-pain" className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Your biggest editing pain</label>
                <textarea
                  id="beta-pain"
                  value={pain}
                  onChange={(e) => setPain(e.target.value)}
                  placeholder="e.g. Picking which podcast moment actually pops — takes me 4 hours per episode."
                  rows={3}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors resize-none"
                  data-testid="beta-pain"
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2" data-testid="beta-error">{error}</div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6 pt-2 sm:justify-between items-center gap-3">
              <div className="text-[11px] text-zinc-500">Beta submissions are stored locally in this beta build.</div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm disabled:opacity-60 shrink-0"
                data-testid="beta-submit"
              >
                {submitting ? "Sending…" : <>Request access <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="p-8 text-center" data-testid="beta-success">
            <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-5 h-5 text-volt" />
            </div>
            <h2 className="font-heading text-2xl font-medium tracking-tight">You're on the beta list.</h2>
            <p className="mt-2 text-sm text-zinc-400">We'll email <span className="text-zinc-300">{email}</span> the moment access opens.</p>
            <p className="mt-3 text-[11px] text-zinc-600">Beta submissions are stored locally in this beta build.</p>
            <div className="mt-6 inline-flex items-center gap-2 border border-white/10 rounded-md px-4 py-2 text-xs text-zinc-400">
              <Sparkles className="w-3 h-3 text-volt" /> Meanwhile, keep exploring demo mode.
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 block mx-auto text-xs text-zinc-500 hover:text-white"
              data-testid="beta-close"
            >
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
