import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { DEMO_GENERATED_CLIPS, formatTimestamp } from "../lib/mockData";
import {
  UploadCloud, FileVideo, Sparkles, Loader2, CheckCircle2, ArrowRight,
  Flame, Clock, Scissors, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// Stage definitions (ids drive UI state)
const STAGES = [
  { id: "uploading",   label: "Uploading video",            hint: "Securely streaming your file to our pipeline." },
  { id: "analyzing",   label: "Analyzing video",            hint: "Detecting speakers, scenes, and pacing beats." },
  { id: "transcribing",label: "Generating transcript",      hint: "Whisper-grade transcription, word-by-word." },
  { id: "finding",     label: "Finding viral moments",      hint: "Scoring hooks against retention curves." },
  { id: "ready",       label: "Ready to review",            hint: "Your top clips are stacked and waiting." },
];

const PLATFORM_META = {
  TikTok: { dot: "#FFFFFF", label: "TikTok" },
  Shorts: { dot: "#FF0000", label: "YT Shorts" },
  Reels:  { dot: "#E1306C", label: "Reels" },
};

function Stage({ s, current, done, progress }) {
  const isCurrent = s.id === current;
  const isDone = done.includes(s.id);
  return (
    <div className={`flex items-start gap-4 p-4 rounded-md border transition-colors ${isCurrent ? "border-volt/40 bg-volt/5" : isDone ? "border-white/5 bg-ink-900" : "border-white/5 bg-ink-900 opacity-50"}`} data-testid={`stage-${s.id}`}>
      <div className="mt-0.5 shrink-0">
        {isCurrent
          ? <Loader2 className="w-4 h-4 text-volt animate-spin" />
          : isDone
            ? <CheckCircle2 className="w-4 h-4 text-volt" />
            : <div className="w-4 h-4 rounded-full border border-white/20" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className={`text-sm font-medium ${isCurrent || isDone ? "text-white" : "text-zinc-500"}`}>{s.label}</span>
          {s.id === "uploading" && isCurrent && <span className="text-xs font-mono text-volt shrink-0">{progress}%</span>}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">{s.hint}</div>
        {s.id === "uploading" && (isCurrent || isDone) && (
          <div className="mt-3 h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-volt transition-all duration-200 ease-out" style={{ width: `${isDone ? 100 : progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultClipCard({ clip, onOpen }) {
  return (
    <button
      onClick={() => onOpen(clip)}
      className="group text-left bg-ink-900 border border-white/5 rounded-lg p-5 hover:border-volt/40 transition-colors flex flex-col gap-4 animate-fade-up"
      data-testid={`result-clip-${clip.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-[11px] font-mono">
          <Flame className="w-3 h-3 text-volt" />
          <span className="text-volt">{clip.confidence}%</span>
          <span className="text-zinc-500">confident</span>
        </div>
        <div className="inline-flex items-center gap-1 bg-ink-950 border border-white/5 rounded-full px-2 py-1 text-[10px] font-mono text-zinc-400">
          <Clock className="w-3 h-3" />
          {formatTimestamp(clip.start_seconds)} → {formatTimestamp(clip.end_seconds)} · {clip.duration_seconds}s
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-medium leading-snug group-hover:text-volt transition-colors">{clip.title}</h3>
        <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.18em] mr-2">Hook</span>
          {clip.hook}
        </p>
      </div>

      <div className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-volt/30 pl-3">{clip.reason}</div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-1.5">
          {clip.platforms.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2 py-0.5 text-[10px] text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_META[p]?.dot || "#fff" }} />
              {PLATFORM_META[p]?.label || p}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 group-hover:text-volt transition-colors">
          Open <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

export default function UploadPage() {
  const [stage, setStage] = useState(null); // null | uploading | analyzing | transcribing | finding | ready
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);
  const nav = useNavigate();

  // Smoothly animate progress so the bar always feels real, even if backend uploads instantly or fails.
  const animateProgressTo = (target, duration = 800) => new Promise((resolve) => {
    const start = performance.now();
    const startProg = progress;
    const step = (t) => {
      const k = Math.min(1, (t - start) / duration);
      const next = Math.round(startProg + (target - startProg) * k);
      setProgress(next);
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });

  const start = async (selectedFile) => {
    setFile(selectedFile);
    setResults(null);
    setStage("uploading");
    setProgress(0);

    // Animate to ~30% while we kick off the real (or mocked) upload
    const earlyAnim = animateProgressTo(30, 700);

    // Best-effort backend upload; if it fails we still continue the demo flow.
    const realUpload = (async () => {
      try {
        const form = new FormData();
        form.append("file", selectedFile);
        await api.post("/videos/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
          onUploadProgress: (e) => {
            if (e.total) {
              const pct = Math.round((e.loaded / e.total) * 100);
              // never go backwards
              setProgress((p) => Math.max(p, Math.min(95, pct)));
            }
          },
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Upload skipped (offline mode):", e?.message);
      }
    })();

    await Promise.all([earlyAnim, realUpload]);
    await animateProgressTo(100, 500);

    // Move through analysis stages
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    setStage("analyzing");    await wait(1700);
    setStage("transcribing"); await wait(1900);
    setStage("finding");      await wait(2100);
    setStage("ready");

    // Mocked AI results (5 clips)
    setResults(DEMO_GENERATED_CLIPS);
    toast.success(`Found ${DEMO_GENERATED_CLIPS.length} viral moments`);
  };

  const reset = () => {
    setStage(null);
    setProgress(0);
    setFile(null);
    setResults(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const openClip = async (clip) => {
    // Try to persist as a real clip; either way we route to an editor that has fallback data.
    try {
      const { data } = await api.post("/clips", {
        title: clip.title,
        duration_seconds: clip.duration_seconds,
      }, { timeout: 4000 });
      nav(`/clip/${data.id}`);
    } catch (_) {
      nav(`/clip/demo-clip-1`);
    }
  };

  const openAll = async () => {
    toast.success(`Queued ${results.length} clips for export`);
    setTimeout(() => nav("/dashboard"), 700);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) start(f);
  };

  // Indices for progressive UI
  const stageIdx = STAGES.findIndex((s) => s.id === stage);
  const doneStages = stage === "ready"
    ? STAGES.map((s) => s.id)
    : STAGES.slice(0, Math.max(0, stageIdx)).map((s) => s.id);

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-5xl mx-auto" data-testid="upload-page">
        {/* ------- Dropzone ------- */}
        {!stage && (
          <>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">New clip</div>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Upload your long-form.</h1>
            <p className="mt-2 text-sm text-zinc-400">MP4, MOV, MKV up to 500MB · or paste a YouTube link below.</p>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-8 block border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors ${dragOver ? "border-volt bg-volt/5" : "border-white/10 hover:border-white/20 bg-ink-900/40"}`}
              data-testid="upload-dropzone"
            >
              <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && start(e.target.files[0])} data-testid="upload-input" />
              <div className="w-14 h-14 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-5">
                <UploadCloud className="w-6 h-6 text-volt" />
              </div>
              <h3 className="font-heading text-xl font-medium">Drag &amp; drop your video</h3>
              <p className="text-sm text-zinc-400 mt-1.5">or click to browse — we'll handle the rest</p>
              <div className="mt-6 inline-flex items-center gap-2 bg-volt text-black text-sm font-medium px-5 py-2.5 rounded-md">
                <FileVideo className="w-4 h-4" /> Choose file
              </div>
            </label>

            <div className="mt-6 flex items-center gap-2 bg-ink-900 border border-white/5 rounded-md p-3">
              <Sparkles className="w-4 h-4 text-volt shrink-0" />
              <input type="text" placeholder="…or paste a YouTube / Vimeo / Twitch URL" className="flex-1 bg-transparent text-sm focus:outline-none" data-testid="upload-url" />
              <button
                onClick={() => start({ name: "youtube-source.mp4", size: 0 })}
                className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-xs"
                data-testid="upload-ingest"
              >
                Ingest
              </button>
            </div>
          </>
        )}

        {/* ------- Pipeline (running) ------- */}
        {stage && stage !== "ready" && (
          <div data-testid="upload-pipeline">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">Processing</div>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Hookify is reading your video.</h1>
            <p className="mt-2 text-sm text-zinc-400">Sit back — this usually takes 3–5 minutes for a 1-hour file. We'll surface 3–5 viral moments when it's done.</p>

            <div className="mt-8 bg-ink-900 border border-white/5 rounded-lg p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0">
                <FileVideo className="w-5 h-5 text-volt" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{file?.name || "video.mp4"}</div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {file?.size ? (file.size / 1024 / 1024).toFixed(1) + " MB" : "Streaming source"} · started {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {STAGES.filter(s => s.id !== "ready").map((s) => (
                <Stage key={s.id} s={s} current={stage} done={doneStages} progress={progress} />
              ))}
            </div>
          </div>
        )}

        {/* ------- Results (ready) ------- */}
        {stage === "ready" && results && (
          <div data-testid="upload-results">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">Suggested clips</div>
                <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">
                  We found <span className="text-volt">{results.length} viral moments</span> in your video.
                </h1>
                <p className="mt-2 text-sm text-zinc-400">Ranked by predicted retention. Click any clip to fine-tune captions, titles and reframe — or queue them all for export.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={reset} className="inline-flex items-center gap-2 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="upload-reset">
                  <RotateCcw className="w-3.5 h-3.5" /> Upload another
                </button>
                <button onClick={openAll} className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm" data-testid="upload-export-all">
                  <Scissors className="w-3.5 h-3.5" /> Export all {results.length}
                </button>
              </div>
            </div>

            {/* Source summary strip */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Source</div>
                <div className="text-sm font-medium mt-1 truncate">{file?.name || "video.mp4"}</div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Avg confidence</div>
                <div className="text-sm font-medium mt-1 text-volt">
                  {Math.round(results.reduce((s, c) => s + c.confidence, 0) / results.length)}%
                </div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Total runtime</div>
                <div className="text-sm font-medium mt-1">{results.reduce((s, c) => s + c.duration_seconds, 0)}s of shorts</div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Platforms</div>
                <div className="text-sm font-medium mt-1">TikTok · Shorts · Reels</div>
              </div>
            </div>

            {/* Cards grid */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((c, i) => (
                <div key={c.id} style={{ animationDelay: `${i * 70}ms` }} className="contents">
                  <ResultClipCard clip={c} onOpen={openClip} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
