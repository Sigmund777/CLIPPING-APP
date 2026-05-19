import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api, { formatApiErrorDetail } from "../lib/api";
import { supabase, SOURCES_BUCKET } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import {
  formatTimestamp,
  getActiveTemplate, clearActiveTemplate, loadSettings, setActiveClip,
} from "../lib/mockData";
import {
  UploadCloud, FileVideo, Sparkles, Loader2, CheckCircle2, ArrowRight,
  Clock, RotateCcw, Wand2, MessageSquare, X, AlertCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";

// Stage definitions — order matches the real processing pipeline.
const STAGES = [
  { id: "uploading",    label: "Uploading",            hint: "Securely streaming your file to your private storage bucket." },
  { id: "extracting",   label: "Extracting audio",     hint: "Pulling the audio track for transcription." },
  { id: "transcribing", label: "Transcribing",         hint: "Whisper is reading your audio word-by-word." },
  { id: "finding",      label: "Finding clip moments", hint: "Scoring beats against retention patterns." },
  { id: "hooks",        label: "Generating hooks",     hint: "Drafting hook lines, titles, and caption ideas." },
  { id: "ready",        label: "Complete",             hint: "Suggestions are below." },
];

const MAX_BYTES = 500 * 1024 * 1024;            // 500 MB cap on direct-to-storage upload
const ANALYZE_BYTES = 100 * 1024 * 1024;        // 100 MB cap on what backend will analyze
const REAL_AI_EXTS = ["mp4", "mov", "mp3", "wav", "m4a", "webm"];

// Upload a file to Supabase Storage with XHR so we can track progress.
// Uses the user's access token to satisfy the bucket's RLS policy.
async function uploadWithProgress(file, key, onProgress) {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  const url = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/${SOURCES_BUCKET}/${encodeURI(key)}`;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // Supabase requires both the API key AND the user's bearer token for storage writes.
    xhr.setRequestHeader("apikey", process.env.REACT_APP_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        // Parse a friendlier message from Supabase's error body.
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText || "{}");
          if (body.message) msg = body.message;
          if (String(body.message || "").toLowerCase().includes("row-level security")) {
            msg = "Supabase Storage RLS rejected the upload. Paste storage_fix.sql in your Supabase SQL Editor to install the upload policies, then retry.";
          }
        } catch (_) {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

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
    <div className="bg-ink-900 border border-white/5 rounded-lg p-6 flex flex-col gap-5 animate-fade-up hover:border-zinc-700/60 transition-colors" data-testid={`result-clip-${clip.id}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-zinc-400">
          <Clock className="w-3 h-3" />
          {formatTimestamp(clip.start_seconds)} → {formatTimestamp(clip.end_seconds)} · {clip.duration_seconds}s
        </div>
        <div className="flex items-center gap-1.5">
          {typeof clip.confidence === "number" && (
            <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-[10px] text-volt" title="AI confidence">
              <Zap className="w-3 h-3" /> {clip.confidence}%
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-[10px] text-volt">
            <span className="w-1.5 h-1.5 rounded-full bg-volt" /> {clip.platform}
          </span>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1">Title idea</div>
        <h3 className="font-heading text-lg font-medium leading-snug">{clip.title}</h3>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-volt" /> Hook</div>
        <p className="text-sm text-zinc-200 leading-relaxed">{clip.hook}</p>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-volt" /> Caption · <span className="text-volt">{clip.caption_style}</span> style
        </div>
        <div className="text-xs text-zinc-300 bg-ink-950 border border-white/5 rounded-md p-3 whitespace-pre-line leading-relaxed">{clip.caption_text}</div>
      </div>

      <div className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-volt/30 pl-3">{clip.reason}</div>

      <button
        onClick={() => onOpen(clip)}
        className="mt-auto inline-flex items-center justify-center gap-2 bg-volt text-black font-medium rounded-md py-2.5 text-sm hover:bg-volt-300 transition-colors"
        data-testid={`result-open-${clip.id}`}
      >
        Open in editor <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function UploadPage() {
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState(null);
  const [resultMode, setResultMode] = useState(null); // "real_ai" | "demo"
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTemplate, setActiveTpl] = useState(getActiveTemplate());
  const [settings] = useState(loadSettings());
  const [responseMeta, setResponseMeta] = useState(null);
  const inputRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    setActiveTpl(getActiveTemplate());
  }, []);

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

  // ----- Removed demo mode (legacy beta path) -----

  const { user } = useAuth();

  // --------------------------------------------------------------------------
  // REAL AI MODE — direct-to-Supabase upload, then backend transcribes + suggests.
  // --------------------------------------------------------------------------
  const startRealAI = async (selectedFile) => {
    // Frontend validation
    const ext = (selectedFile.name || "").split(".").pop().toLowerCase();
    if (!REAL_AI_EXTS.includes(ext)) {
      toast.error(`Unsupported format ".${ext}"`, { description: "Use mp4, mov, mp3, wav, or m4a." });
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      toast.error("File too large", { description: "Max upload size is 500 MB." });
      return;
    }
    if (selectedFile.size > ANALYZE_BYTES) {
      toast.error("Too large to analyze", { description: "Whisper accepts files up to 100 MB. Trim and try again." });
      return;
    }
    if (!user?.id) {
      toast.error("You're not signed in.");
      return;
    }

    setFile(selectedFile);
    setResults(null);
    setErrorMsg("");
    setResultMode(null);
    setStage("uploading");
    setProgress(0);

    // 1. Upload directly to Supabase Storage (bypasses Vercel's 4.5 MB body limit).
    const safeName = `${Date.now()}-${(selectedFile.name || "video").replace(/[^A-Za-z0-9._-]+/g, "-")}`;
    const sourceKey = `${user.id}/${safeName}`;

    try {
      // The supabase-js v2 client does not currently expose progress on .upload().
      // We use the underlying fetch via signed URL OR we wrap with a manual XHR.
      await uploadWithProgress(selectedFile, sourceKey, (pct) => {
        setProgress(Math.min(35, Math.round(pct * 0.35)));
      });
    } catch (err) {
      setErrorMsg("Upload failed: " + (err?.message || "unknown error"));
      toast.error("Upload failed", { description: err?.message || "Please retry." });
      setStage(null);
      return;
    }

    // 2. Drive UI stages while the backend analyzes.
    let stageTimers = [];
    const runStageProgression = () => {
      stageTimers.push(setTimeout(() => { setStage("extracting"); setProgress(45); }, 0));
      stageTimers.push(setTimeout(() => { setStage("transcribing"); setProgress(60); }, 3500));
      stageTimers.push(setTimeout(() => { setStage("finding"); setProgress(78); }, 11000));
      stageTimers.push(setTimeout(() => { setStage("hooks"); setProgress(90); }, 20000));
    };
    runStageProgression();

    // 3. Call backend analyze with the source_key.
    let response;
    try {
      response = await api.post("/ai/analyze", {
        source_key: sourceKey,
        filename: selectedFile.name,
        content_type: selectedFile.type || "video/mp4",
      }, { timeout: 240000 });
      await animateProgressTo(100, 400);
    } catch (err) {
      stageTimers.forEach(clearTimeout);
      const detail = formatApiErrorDetail(err?.response?.data?.detail) || err?.message || "AI processing failed.";
      setErrorMsg(detail);
      setStage(null);
      setResults(null);
      setResultMode(null);
      toast.error("AI analysis failed", { description: detail });
      return;
    }
    stageTimers.forEach(clearTimeout);

    const data = response?.data || {};
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    if (suggestions.length < 1) {
      const msg = "AI returned no clip suggestions. Try a longer or clearer recording.";
      setErrorMsg(msg);
      setStage(null);
      setResults(null);
      setResultMode(null);
      toast.error("No usable suggestions", { description: msg });
      return;
    }
    setStage("ready");
    setResults(suggestions);
    setResultMode("real_ai");
    setResponseMeta({
      project_id: data.project_id || null,
      render_ready: !!data.render_ready,
      storage_error: data.storage_error || null,
    });
    toast.success("AI analysis complete", { description: `${suggestions.length} real clip ideas from your transcript.` });
  };

  const start = async (selectedFile) => {
    if (!selectedFile || !selectedFile.size) {
      toast.error("Please pick a valid video or audio file.");
      return;
    }
    await startRealAI(selectedFile);
  };

  const reset = () => {
    setStage(null); setProgress(0); setFile(null); setResults(null);
    setResultMode(null); setErrorMsg(""); setResponseMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClearTemplate = () => {
    clearActiveTemplate();
    setActiveTpl(null);
    toast("Template cleared");
  };

  const openClip = (clip) => {
    // Persist the selected clip so the editor can display all real AI fields.
    setActiveClip({
      ...clip,
      source_filename: file?.name || "video.mp4",
      mode: resultMode || "real_ai",
      project_id: responseMeta?.project_id || null,
      render_ready: !!responseMeta?.render_ready,
      saved_at: new Date().toISOString(),
    });
    nav(`/clip/${clip.id}`);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) start(f);
  };

  const stageIdx = STAGES.findIndex((s) => s.id === stage);
  const doneStages = stage === "ready"
    ? STAGES.map((s) => s.id)
    : STAGES.slice(0, Math.max(0, stageIdx)).map((s) => s.id);

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-5xl mx-auto" data-testid="upload-page">

        {/* Header strip with live AI status */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1.5 border border-purple/30 bg-purple/10 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200">Real AI · Whisper + Claude 4.5</span>
          </span>
          {resultMode === "real_ai" && (
            <span className="inline-flex items-center gap-1.5 btn-brand rounded-full px-2.5 py-1" data-testid="badge-real-ai">
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">AI analysis complete</span>
            </span>
          )}
        </div>

        {/* ------- Dropzone ------- */}
        {!stage && (
          <>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Upload your long-form.</h1>
              <p className="mt-2 text-sm text-zinc-400 max-w-xl">
              Drop an mp4, mov, mp3, wav, m4a or webm (max 100 MB) and Hookify will transcribe it with Whisper and surface 3–5 real clip ideas using Claude Sonnet 4.5. Then "Generate clip" renders a downloadable 9:16 MP4 with burnt captions.
            </p>

            {/* Active template / settings hint card */}
            {(activeTemplate || settings.preferred_platform) && (
              <div className="mt-6 bg-ink-900 border border-white/5 rounded-lg p-4 flex items-center gap-4 flex-wrap" data-testid="upload-context">
                {activeTemplate && (
                  <div className="inline-flex items-center gap-2 bg-volt/10 border border-volt/30 rounded-full pl-3 pr-1.5 py-1">
                    <Sparkles className="w-3 h-3 text-volt" />
                    <span className="text-[11px] text-volt">Template: {activeTemplate.name}</span>
                    <button onClick={handleClearTemplate} className="w-5 h-5 rounded-full hover:bg-volt/20 flex items-center justify-center text-volt" aria-label="Clear template">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="text-[11px] text-zinc-500">
                  Targeting <span className="text-zinc-300">{settings.preferred_platform}</span> · {settings.default_clip_length}s clips · <span className="text-zinc-300">{settings.caption_style}</span> captions · <span className="text-zinc-300">{settings.brand_tone}</span> tone
                </div>
              </div>
            )}

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

            <div className="mt-6 flex items-center gap-2 bg-ink-900 border border-white/5 rounded-md p-3 text-xs text-zinc-500">
              <Sparkles className="w-4 h-4 text-volt shrink-0" />
              Uploads go directly to your private Supabase bucket. Whisper transcribes, Claude Sonnet 4.5 writes the clip ideas, and FFmpeg renders a 9:16 MP4 — all real, no demo data.
            </div>
          </>
        )}

        {/* ------- Pipeline (running) ------- */}
        {stage && stage !== "ready" && (
          <div data-testid="upload-pipeline">
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Hookify is reading your video.</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {resultMode === "demo" ? "Demo processing — sample ideas appear when this finishes." : "Real AI processing · transcription via Whisper, analysis via Claude Sonnet 4.5."}
            </p>

            <div className="mt-8 bg-ink-900 border border-white/5 rounded-lg p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0">
                <FileVideo className="w-5 h-5 text-volt" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{file?.name || "video.mp4"}</div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {file?.size ? (file.size / 1024 / 1024).toFixed(1) + " MB" : "Sample source"} · started {new Date().toLocaleTimeString()}
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

        {/* ------- Error (real-AI failure) ------- */}
        {errorMsg && !stage && (
          <div className="mt-8 flex items-start gap-3 bg-red-500/5 border border-red-500/30 text-zinc-200 rounded-md p-4 text-sm" data-testid="upload-error">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white">AI analysis failed</div>
              <div className="text-xs mt-1 text-zinc-400 break-words">{errorMsg}</div>
              <div className="text-xs mt-2 text-zinc-500">
                If this keeps happening: check that your file has clear audio, is under 100 MB, and your backend has a valid <code>EMERGENT_LLM_KEY</code> with quota.
              </div>
              <button
                onClick={() => { setErrorMsg(""); inputRef.current?.click(); }}
                className="mt-3 inline-flex items-center gap-2 btn-brand font-medium px-3 py-1.5 rounded-md text-xs"
                data-testid="upload-retry"
              >
                <RotateCcw className="w-3 h-3" /> Try another file
              </button>
            </div>
          </div>
        )}

        {/* ------- Results ------- */}
        {stage === "ready" && results && (
          <div data-testid="upload-results">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">
                  Here are <span className="text-volt">{results.length} real clip ideas</span> from your transcript.
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Generated by Whisper + Claude Sonnet 4.5. Pick one to open in the editor and render the 9:16 MP4.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={reset} className="inline-flex items-center gap-2 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="upload-reset">
                  <RotateCcw className="w-3.5 h-3.5" /> Upload another
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Source</div>
                <div className="text-sm font-medium mt-1 truncate">{file?.name || "video.mp4"}</div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">AI ideas</div>
                <div className="text-sm font-medium mt-1 text-volt">{results.length}</div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Targeting</div>
                <div className="text-sm font-medium mt-1">{settings.preferred_platform}</div>
              </div>
              <div className="bg-ink-900 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Mode</div>
                <div className="text-sm font-medium mt-1 text-volt">Real AI · Whisper + Claude</div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
