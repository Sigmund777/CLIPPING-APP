import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { DEMO_TRANSCRIPT, DEMO_SUGGESTIONS, getDemoClipById, getActiveClip, formatTimestamp } from "../lib/mockData";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Play, Pause, Wand2, RefreshCw, Type,
  Zap, MessageSquare, Clock, FileVideo, Lightbulb, Sparkles,
} from "lucide-react";

const CAPTION_STYLES = ["Bold-Yellow", "Subtitled", "Karaoke", "Minimal", "Big Mood", "Beast", "Cinema"];

function VerticalPreview({ caption, onTogglePlay, playing }) {
  return (
    <div className="aspect-[9/16] w-full max-w-[340px] mx-auto bg-ink-900 border border-white/10 rounded-xl relative overflow-hidden" data-testid="clip-preview">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #CCFF0022 0%, #18181B 40%, #09090B 100%)" }} />
      <div className="absolute inset-0 dot-grid opacity-30" />
      {/* Faux waveform */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex items-end gap-1 h-32">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="w-1.5 rounded-full bg-volt" style={{ height: `${30 + Math.sin(i * 0.7) * 50 + Math.random() * 20}%`, opacity: 0.5 + Math.random() * 0.5 }} />
        ))}
      </div>
      {/* Caption */}
      <div className="absolute bottom-10 left-4 right-4 flex justify-center">
        <div className="caption-pill rounded-md px-3 py-2 max-w-[85%] text-center">
          <span className="font-heading font-semibold text-base"><span className="text-volt">3 hooks</span> that broke a million views</span>
        </div>
      </div>
      {/* Time + controls */}
      <button onClick={onTogglePlay} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity" data-testid="clip-play">
        {playing ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white fill-white" />}
      </button>
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono">9:16</div>
    </div>
  );
}

export default function ClipEditorPage() {
  const { clipId } = useParams();
  const [clip, setClip] = useState(null);
  const [activeClip, setActiveClipState] = useState(null); // AI-suggestion context from upload flow
  const [transcript, setTranscript] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTitle, setActiveTitle] = useState(0);
  const [captionStyle, setCaptionStyle] = useState("Bold-Yellow");
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Pick up the selected suggestion (real AI or sample) from localStorage if present.
    const stashed = getActiveClip();
    if (stashed && stashed.id === clipId) {
      setActiveClipState(stashed);
      if (stashed.caption_style) setCaptionStyle(stashed.caption_style);
    }
  }, [clipId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Each call independently falls back to demo data so a partial backend failure never blanks the page.
      const safeCall = async (fn, fallback) => {
        try { return (await fn()).data; } catch (_) { return fallback; }
      };
      const [c, t, s] = await Promise.all([
        safeCall(() => api.get(`/clips/${clipId}`, { timeout: 5000 }), getDemoClipById(clipId)),
        safeCall(() => api.post("/ai/transcript", { clip_id: clipId }, { timeout: 5000 }), DEMO_TRANSCRIPT),
        safeCall(() => api.post("/ai/suggestions", { clip_id: clipId }, { timeout: 5000 }), DEMO_SUGGESTIONS),
      ]);
      if (cancelled) return;
      // If we have an active clip from the upload flow, seed editor state from it.
      const stashed = getActiveClip();
      const fromActive = (stashed && stashed.id === clipId) ? stashed : null;
      const baseClip = c || getDemoClipById(clipId);
      setClip(fromActive ? { ...baseClip, title: fromActive.title, duration_seconds: fromActive.duration_seconds || baseClip.duration_seconds } : baseClip);
      setTranscript(t || DEMO_TRANSCRIPT);
      // Prepend the active clip's title to the suggestions list so it's the default selected title.
      const baseSugg = s || DEMO_SUGGESTIONS;
      if (fromActive?.title) {
        const filtered = (baseSugg.viral_titles || []).filter((t) => t !== fromActive.title);
        setSuggestions({ ...baseSugg, viral_titles: [fromActive.title, ...filtered] });
        setActiveTitle(0);
      } else {
        setSuggestions(baseSugg);
      }
      setCaptionStyle((fromActive?.caption_style) || (c && c.caption_style) || "Bold-Yellow");
    })();
    return () => { cancelled = true; };
  }, [clipId]);

  const regenerate = async () => {
    toast("Regenerating viral titles…");
    try {
      const { data } = await api.post("/ai/suggestions", { clip_id: clipId }, { timeout: 5000 });
      setSuggestions(data);
    } catch (_) {
      // Reshuffle demo titles client-side
      const shuffled = [...DEMO_SUGGESTIONS.viral_titles].sort(() => Math.random() - 0.5);
      setSuggestions({ ...DEMO_SUGGESTIONS, viral_titles: shuffled });
    }
  };

  const exportClip = async () => {
    toast.info("Export coming soon", { description: "Full 1080p 9:16 export with burnt captions ships in the next beta wave." });
  };

  if (!clip) return <DashboardLayout><div className="p-10 text-zinc-500">Loading clip…</div></DashboardLayout>;

  const currentTitle = suggestions?.viral_titles?.[activeTitle] || clip.title;

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-8" data-testid="clip-editor">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white" data-testid="back-to-dashboard">
            <ArrowLeft className="w-4 h-4" /> Back to studio
          </Link>
          <div className="flex items-center gap-3">
            {activeClip?.mode === "real_ai" ? (
              <div className="inline-flex items-center gap-1.5 bg-volt text-black rounded-full px-3 py-1 text-xs" data-testid="editor-badge-real">
                <Zap className="w-3.5 h-3.5" /> <span className="font-bold uppercase tracking-[0.15em] text-[10px]">AI analysis complete</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-3 py-1 text-xs" data-testid="editor-badge-sample">
                <Sparkles className="w-3.5 h-3.5 text-volt" /> <span className="text-volt font-medium">Sample results</span>
              </div>
            )}
            <button
              disabled
              title="Full video export is coming soon"
              className="inline-flex items-center gap-2 border border-white/10 text-zinc-400 px-5 py-2.5 rounded-md text-sm cursor-not-allowed"
              data-testid="export-clip"
            >
              <Download className="w-4 h-4" /> Export · coming soon
            </button>
          </div>
        </div>

        {activeClip && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 bg-ink-900 border border-volt/20 rounded-lg p-5" data-testid="ai-suggestion-panel">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 font-mono text-zinc-400">
                  <FileVideo className="w-3 h-3" /> <span data-testid="ai-source-filename">{activeClip.source_filename}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 font-mono text-zinc-400">
                  <Clock className="w-3 h-3" /> {formatTimestamp(activeClip.start_seconds || 0)} → {formatTimestamp(activeClip.end_seconds || 0)} · {activeClip.duration_seconds || 0}s
                </span>
                <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-volt">
                  <span className="w-1.5 h-1.5 rounded-full bg-volt" /> {activeClip.platform || "TikTok"}
                </span>
                {typeof activeClip.confidence === "number" && (
                  <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-volt">
                    <Zap className="w-3 h-3" /> Confidence {activeClip.confidence}%
                  </span>
                )}
              </div>

              {activeClip.hook && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-volt" /> Hook</div>
                  <p className="text-sm text-zinc-200" data-testid="ai-hook">{activeClip.hook}</p>
                </div>
              )}

              {activeClip.caption_text && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-volt" /> Caption · <span className="text-volt">{activeClip.caption_style || "Bold"}</span> style
                  </div>
                  <div className="text-xs text-zinc-300 bg-ink-950 border border-white/5 rounded-md p-3 whitespace-pre-line leading-relaxed max-w-xl" data-testid="ai-caption">{activeClip.caption_text}</div>
                </div>
              )}

              {activeClip.reason && (
                <div className="text-[11px] text-zinc-500 border-l-2 border-volt/30 pl-3 max-w-xl" data-testid="ai-reason">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mr-2">Why this moment</span>
                  {activeClip.reason}
                </div>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold lg:text-right whitespace-nowrap flex lg:flex-col items-center lg:items-end gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-volt" />
              <span>{activeClip.mode === "real_ai" ? "Live AI · Whisper + Claude" : "Sample data"}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: preview + titles */}
          <div className="space-y-8">
            <div>
              <input
                value={currentTitle}
                onChange={(e) => { /* allow editing locally */ setSuggestions((s) => { const next = { ...s, viral_titles: [...(s?.viral_titles || [])] }; next.viral_titles[activeTitle] = e.target.value; return next; }); }}
                className="w-full bg-transparent border-0 font-heading text-2xl sm:text-3xl font-medium tracking-tight focus:outline-none"
                data-testid="clip-title-input"
              />
              <div className="text-xs text-zinc-500 mt-1">Click to edit · Auto-saved</div>
            </div>

            <VerticalPreview caption={currentTitle} playing={playing} onTogglePlay={() => setPlaying(!playing)} />

            {/* Viral titles */}
            <div className="bg-ink-900 border border-white/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt">Hooks &amp; titles</div>
                  <h3 className="font-heading text-lg font-medium mt-1">Pick a title — or remix yours</h3>
                </div>
                <button onClick={regenerate} className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-white/10 rounded-md px-3 py-1.5" data-testid="regen-titles">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>
              <div className="space-y-2">
                {suggestions?.viral_titles?.map((t, i) => (
                  <button key={i} onClick={() => setActiveTitle(i)} className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${activeTitle === i ? "border-volt/40 bg-volt/5 text-white" : "border-white/5 hover:border-white/15 text-zinc-300"}`} data-testid={`title-option-${i}`}>
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-zinc-500 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1">{t}</span>
                      {activeTitle === i && <Wand2 className="w-3.5 h-3.5 text-volt" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: panels */}
          <div className="space-y-5">
            {/* Transcript */}
            <div className="bg-ink-900 border border-white/5 rounded-lg p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-3">Transcript</div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2" data-testid="transcript-panel">
                {transcript?.segments?.map((seg, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="font-mono text-zinc-600 shrink-0">{seg.start.toFixed(1).padStart(4, "0")}</span>
                    <span className="text-zinc-300 leading-relaxed">{seg.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption style */}
            <div className="bg-ink-900 border border-white/5 rounded-lg p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-3 flex items-center gap-2"><Type className="w-3 h-3" /> Caption style</div>
              <div className="grid grid-cols-2 gap-2" data-testid="caption-styles">
                {CAPTION_STYLES.map((s) => (
                  <button key={s} onClick={() => setCaptionStyle(s)} className={`text-xs px-3 py-2 rounded-md border transition-colors ${captionStyle === s ? "border-volt/40 bg-volt/10 text-volt" : "border-white/10 text-zinc-400 hover:text-white hover:border-white/20"}`} data-testid={`caption-style-${s}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* AI clip suggestions */}
            <div className="bg-ink-900 border border-white/5 rounded-lg p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-3">More viral moments</div>
              <div className="space-y-2.5">
                {suggestions?.clips?.slice(0, 3).map((c, i) => (
                  <div key={i} className="p-3 rounded-md bg-ink-950 border border-white/5 hover:border-volt/30 transition-colors cursor-pointer" data-testid={`suggestion-${i}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-mono text-[10px] text-zinc-500">{c.start.toFixed(0)}s – {c.end.toFixed(0)}s</div>
                      <div className="font-mono text-[10px] text-volt">{c.score}/100</div>
                    </div>
                    <div className="text-xs font-medium leading-snug">{c.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-1">{c.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
