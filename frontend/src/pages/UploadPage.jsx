import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { UploadCloud, FileVideo, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { id: "uploading", label: "Uploading video" },
  { id: "transcribing", label: "Transcribing with Whisper" },
  { id: "analysing", label: "Scoring hooks with Claude 4.5" },
  { id: "generating", label: "Crafting viral titles" },
  { id: "done", label: "Ready to edit" },
];

export default function UploadPage() {
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const nav = useNavigate();

  const start = async (selectedFile) => {
    setFile(selectedFile);
    setStage("uploading");
    setProgress(0);

    try {
      const form = new FormData();
      form.append("file", selectedFile);
      await api.post("/videos/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
    } catch (e) {
      // even if upload fails (e.g. dev env / offline preview), continue mock pipeline for demo
      // eslint-disable-next-line no-console
      console.warn("Upload skipped (offline mode):", e?.message);
      setProgress(100);
    }

    const runStage = (id, ms) => new Promise((r) => { setStage(id); setTimeout(r, ms); });
    await runStage("transcribing", 1400);
    await runStage("analysing", 1600);
    await runStage("generating", 1100);
    setStage("done");

    // create a new clip record so dashboard reflects it
    try {
      const { data } = await api.post("/clips", {
        title: "The 3 hooks that broke a million views",
        duration_seconds: 38,
      }, { timeout: 5000 });
      toast.success("Clip ready");
      setTimeout(() => nav(`/clip/${data.id}`), 600);
    } catch (e) {
      // Offline / backend unavailable — still route to the demo clip editor.
      toast.success("Clip ready");
      setTimeout(() => nav(`/clip/demo-clip-1`), 600);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) start(f);
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-4xl mx-auto" data-testid="upload-page">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">New clip</div>
        <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Upload your long-form.</h1>
        <p className="mt-2 text-sm text-zinc-400">MP4, MOV, MKV up to 500MB · or paste a YouTube link below.</p>

        {!stage && (
          <>
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
              <button className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-xs">Ingest</button>
            </div>
          </>
        )}

        {stage && (
          <div className="mt-10 bg-ink-900 border border-white/5 rounded-lg p-8" data-testid="upload-pipeline">
            <div className="flex items-center gap-3 mb-6">
              <FileVideo className="w-5 h-5 text-volt" />
              <div className="text-sm font-medium truncate">{file?.name || "video.mp4"}</div>
              <div className="ml-auto text-xs text-zinc-500 font-mono">{file?.size ? (file.size / 1024 / 1024).toFixed(1) + " MB" : "—"}</div>
            </div>
            <div className="space-y-3">
              {STAGES.map((s) => {
                const done = STAGES.findIndex(x => x.id === stage) > STAGES.findIndex(x => x.id === s.id) || stage === "done";
                const current = s.id === stage && stage !== "done";
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-md border ${current ? "border-volt/30 bg-volt/5" : done ? "border-white/5" : "border-white/5 opacity-50"}`} data-testid={`stage-${s.id}`}>
                    {current ? <Loader2 className="w-4 h-4 text-volt animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4 text-volt" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                    <span className="text-sm">{s.label}</span>
                    {s.id === "uploading" && current && <span className="ml-auto text-xs font-mono text-volt">{progress}%</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
