import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import {
  DEMO_TRANSCRIPT, DEMO_SUGGESTIONS, getDemoClipById, getActiveClip,
  setActiveClip, formatTimestamp, saveClip, CLIP_STATUSES, PLATFORM_OPTIONS,
  CAPTION_STYLE_OPTIONS,
} from "../lib/mockData";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Play, Pause, Wand2, RefreshCw, Type,
  Zap, MessageSquare, Clock, FileVideo, Lightbulb, Sparkles, Save,
  Film, Loader2, CheckCircle2, AlertCircle,
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
  const nav = useNavigate();
  const [clip, setClip] = useState(null);
  const [activeClip, setActiveClipState] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTitle, setActiveTitle] = useState(0);
  const [captionStyle, setCaptionStyle] = useState("Bold-Yellow");
  const [playing, setPlaying] = useState(false);

  // Editable fields (seeded from activeClip when available)
  const [editTitle, setEditTitle] = useState("");
  const [editHook, setEditHook] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editPlatform, setEditPlatform] = useState("TikTok");
  const [editStatus, setEditStatus] = useState("Idea");
  const [noClipSelected, setNoClipSelected] = useState(false);

  // Render pipeline state
  const [renderJob, setRenderJob] = useState(null);   // current job from /api/render
  const [renderError, setRenderError] = useState("");
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    const stashed = getActiveClip();
    if (!clipId || clipId === "none") {
      if (!stashed) setNoClipSelected(true);
      return;
    }
    if (stashed && stashed.id === clipId) {
      setActiveClipState(stashed);
      setEditTitle(stashed.title || "");
      setEditHook(stashed.hook || "");
      setEditCaption(stashed.caption_text || "");
      setEditPlatform(stashed.platform || "TikTok");
      setEditStatus(stashed.status || "Idea");
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

  const exportClip = async () => { /* legacy stub — replaced by startRender */ };

  // ---------- Real render pipeline ----------
  const canRender = !!(activeClip?.project_id && activeClip?.render_ready);

  const startRender = async () => {
    if (!canRender) {
      toast.error("Render unavailable", { description: "This clip has no stored source video. Re-upload to enable rendering." });
      return;
    }
    setRendering(true);
    setRenderError("");
    setRenderJob(null);
    try {
      const { data } = await api.post("/render/start", {
        project_id: activeClip.project_id,
        start_seconds: activeClip.start_seconds,
        end_seconds: activeClip.end_seconds,
        title: editTitle || activeClip.title || "Hookify clip",
        caption_text: editCaption || activeClip.caption_text || activeClip.hook || "",
        platform: editPlatform || activeClip.platform || "TikTok",
      }, { timeout: 15000 });
      setRenderJob(data);
      toast.success("Rendering started", { description: "We'll keep you posted on progress." });
      pollRender(data.id);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || "Render could not start.";
      setRenderError(String(detail));
      toast.error("Render failed to start", { description: String(detail) });
    } finally {
      setRendering(false);
    }
  };

  const pollRender = async (jobId) => {
    let attempts = 0;
    const maxAttempts = 240; // 240 * 3s = 12 minutes max
    const tick = async () => {
      attempts += 1;
      try {
        const { data } = await api.get(`/render/${jobId}`, { timeout: 6000 });
        setRenderJob(data);
        if (data.status === "ready") {
          toast.success("Clip ready", { description: "Download your 9:16 MP4." });
          return;
        }
        if (data.status === "failed") {
          setRenderError(data.error || "Render failed.");
          toast.error("Render failed", { description: data.error || "Try again." });
          return;
        }
      } catch (_) { /* keep polling — transient errors are fine */ }
      if (attempts < maxAttempts) setTimeout(tick, 3000);
    };
    setTimeout(tick, 1500);
  };

  const downloadRender = async () => {
    if (!renderJob?.id || renderJob.status !== "ready") return;
    try {
      const { data } = await api.get(`/render/${renderJob.id}/download-url`, { timeout: 8000 });
      if (!data?.url) throw new Error("No URL returned");
      const link = document.createElement("a");
      link.href = data.url;
      link.target = "_blank";
      link.rel = "noopener";
      // Download attribute hints the browser to save instead of navigate.
      link.download = (editTitle || "hookify-clip").replace(/[^A-Za-z0-9._-]+/g, "-") + ".mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Could not start download", { description: err?.response?.data?.detail || err?.message });
    }
  };

  const handleSaveClip = () => {
    if (!activeClip) {
      toast.error("No clip to save", { description: "Open an idea from your upload first." });
      return;
    }
    const merged = {
      ...activeClip,
      title: editTitle || activeClip.title,
      hook: editHook,
      caption_text: editCaption,
      caption_style: captionStyle,
      platform: editPlatform,
      status: editStatus,
      project_id: activeClip.project_id || null,
      render_ready: !!activeClip.render_ready,
      render_job_id: renderJob?.id || activeClip.render_job_id || null,
    };
    saveClip(merged);
    setActiveClip(merged);
    setActiveClipState(merged);
    toast.success("Clip saved", { description: "Find it in your Workspace on the dashboard." });
  };

  if (noClipSelected) {
    return (
      <DashboardLayout>
        <div className="px-6 lg:px-10 py-20 max-w-xl mx-auto text-center" data-testid="editor-empty">
          <div className="w-14 h-14 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-6 h-6 text-volt" />
          </div>
          <h1 className="font-heading text-3xl font-medium tracking-tight">No clip selected yet.</h1>
          <p className="mt-2 text-sm text-zinc-400">Upload a video on the Upload page — we'll surface 3–5 clip ideas you can open here to edit and save.</p>
          <button onClick={() => nav("/upload")} className="mt-6 inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm" data-testid="editor-empty-upload">
            Go to upload
          </button>
        </div>
      </DashboardLayout>
    );
  }

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
              onClick={renderJob?.status === "ready" ? downloadRender : startRender}
              disabled={!canRender || rendering || (renderJob && !["ready", "failed"].includes(renderJob.status))}
              title={canRender ? "" : "Re-upload through /upload to enable real rendering."}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm transition-colors ${
                renderJob?.status === "ready"
                  ? "bg-volt text-black hover:bg-volt-300 font-medium"
                  : canRender
                    ? "bg-volt text-black hover:bg-volt-300 font-medium disabled:opacity-60"
                    : "border border-white/10 text-zinc-500 cursor-not-allowed"
              }`}
              data-testid="export-clip"
            >
              {renderJob?.status === "ready"
                ? (<><Download className="w-4 h-4" /> Download MP4</>)
                : (renderJob && !["ready", "failed"].includes(renderJob.status))
                  ? (<><Loader2 className="w-4 h-4 animate-spin" /> {renderJob.stage_label || "Rendering…"}</>)
                  : canRender
                    ? (<><Film className="w-4 h-4" /> Generate clip</>)
                    : (<><Download className="w-4 h-4" /> Render unavailable</>)
              }
            </button>
          </div>
        </div>

        {activeClip && (
          <div className="mb-6 bg-ink-900 border border-volt/20 rounded-lg p-5 space-y-5" data-testid="ai-suggestion-panel">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 font-mono text-zinc-400">
                <FileVideo className="w-3 h-3" /> <span data-testid="ai-source-filename">{activeClip.source_filename}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 font-mono text-zinc-400">
                <Clock className="w-3 h-3" /> {formatTimestamp(activeClip.start_seconds || 0)} → {formatTimestamp(activeClip.end_seconds || 0)} · {activeClip.duration_seconds || 0}s
              </span>
              {typeof activeClip.confidence === "number" && (
                <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-volt">
                  <Zap className="w-3 h-3" /> Confidence {activeClip.confidence}%
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">
                <Lightbulb className="w-3 h-3 text-volt" /> {activeClip.mode === "real_ai" ? "Live AI · Whisper + Claude" : "Sample data"}
              </span>
            </div>

            {/* ----- editable form ----- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none"
                  data-testid="edit-title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-volt" /> Hook</label>
                <input
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none"
                  data-testid="edit-hook"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-volt" /> Caption · {captionStyle} style</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={4}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none resize-none font-mono whitespace-pre-line"
                  data-testid="edit-caption"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Platform</label>
                <select
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none"
                  data-testid="edit-platform"
                >
                  {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 block">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none"
                  data-testid="edit-status"
                >
                  {CLIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {activeClip.reason && (
              <div className="text-[11px] text-zinc-500 border-l-2 border-volt/30 pl-3" data-testid="ai-reason">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mr-2">Why this moment</span>
                {activeClip.reason}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-zinc-500">Edits save locally to your Workspace.</span>
              <button
                onClick={handleSaveClip}
                className="inline-flex items-center gap-2 bg-volt text-black font-medium px-4 py-2 rounded-md hover:bg-volt-300 transition-colors text-sm"
                data-testid="save-clip-btn"
              >
                <Save className="w-3.5 h-3.5" /> Save clip
              </button>
            </div>
          </div>
        )}

        {/* Render pipeline status panel */}
        {(renderJob || renderError) && (
          <div className="mb-6 bg-ink-900 border border-volt/20 rounded-lg p-5" data-testid="render-panel">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {renderJob?.status === "ready" ? (
                  <CheckCircle2 className="w-4 h-4 text-volt" />
                ) : renderJob?.status === "failed" || renderError ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Loader2 className="w-4 h-4 text-volt animate-spin" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt">Render pipeline</div>
                  <div className="text-sm font-medium mt-0.5">
                    {renderJob?.stage_label || (renderError ? "Render failed" : "Starting…")}
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                {renderJob?.progress != null ? `${renderJob.progress}%` : ""}
                {renderJob?.size_bytes ? ` · ${(renderJob.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${renderJob?.status === "failed" ? "bg-red-500" : "bg-volt"}`}
                style={{ width: `${renderJob?.progress || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              {renderJob?.status === "ready" && (
                <span className="text-volt">Your 9:16 MP4 is ready in object storage. Click Download MP4 above.</span>
              )}
              {(renderJob?.status === "failed" || renderError) && (
                <span className="text-red-300">{renderError || renderJob?.error}{" "}
                  <button onClick={startRender} className="underline hover:text-white" data-testid="render-retry">Retry</button>
                </span>
              )}
              {renderJob && !["ready", "failed"].includes(renderJob.status) && (
                <>v1 pipeline · centered 9:16 crop · burnt-in captions · audio re-encoded to AAC. Smart reframing & fancy captions ship later.</>
              )}
            </div>
          </div>
        )}

        {!canRender && activeClip && (
          <div className="mb-6 bg-ink-900 border border-white/10 rounded-lg p-4 flex items-start gap-3 text-xs" data-testid="render-unavailable-hint">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-zinc-500" />
            <div className="text-zinc-400">
              Real render needs the source video in storage. Re-upload through the Upload page — the analyzer now persists your source automatically, then "Generate clip" will produce a downloadable 9:16 MP4.
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
                {suggestions?.clips?.slice(0, 3).map((c, i) => {
                  const start = typeof c.start_seconds === "number" ? c.start_seconds : (c.start || 0);
                  const end = typeof c.end_seconds === "number" ? c.end_seconds : (c.end || 0);
                  const label = c.platform || c.caption_style || `${Math.max(0, Math.round(end - start))}s`;
                  return (
                    <div
                      key={c.id || i}
                      className="p-3 rounded-md bg-ink-950 border border-white/5 hover:border-volt/30 transition-colors cursor-pointer"
                      data-testid={`suggestion-${i}`}
                      onClick={() => {
                        setActiveClip({
                          ...c,
                          start_seconds: start,
                          end_seconds: end,
                          duration_seconds: c.duration_seconds || Math.max(0, Math.round(end - start)),
                          source_filename: activeClip?.source_filename || clip?.source_video || "demo-source.mp4",
                          mode: activeClip?.mode || "demo",
                        });
                        toast("Loaded into editor", { description: c.title });
                        nav(`/clip/${c.id || `gen-${i}`}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="font-mono text-[10px] text-zinc-500">{Math.round(start)}s – {Math.round(end)}s</div>
                        <div className="font-mono text-[10px] text-volt">{label}</div>
                      </div>
                      <div className="text-xs font-medium leading-snug">{c.title}</div>
                      {c.reason && <div className="text-[11px] text-zinc-500 mt-1">{c.reason}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
