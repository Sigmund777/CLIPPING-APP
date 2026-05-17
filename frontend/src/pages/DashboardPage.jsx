import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import JoinBetaDialog from "../components/JoinBetaDialog";
import {
  DEMO_RECENT_UPLOADS, DEMO_GENERATED_CLIPS, formatRelative, formatTimestamp,
  getActiveTemplate, clearActiveTemplate,
} from "../lib/mockData";
import { useAuth } from "../lib/auth";
import {
  UploadCloud, FileVideo, Loader2, CheckCircle2, Sparkles, ArrowRight,
  Folder, Clock, Lightbulb, Scissors, Wand2, MessageSquare, X,
} from "lucide-react";
import { toast } from "sonner";

// ------------ Header beta badge ------------
function BetaHeader({ name }) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1"
          data-testid="beta-badge"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Early access beta</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">v2.4 · Demo processing</span>
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight" data-testid="dashboard-heading">
        Welcome to Hookify, {name?.split(" ")[0] || "Creator"}.
      </h1>
      <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
        Upload your long-form video and Hookify will help suggest short-form clip ideas, hooks, captions, and timestamps. You're inside the early-access beta — real uploads, live AI processing, and account verification are rolling out shortly.
      </p>
    </header>
  );
}

// ------------ Big upload CTA card ------------
function UploadCard({ onUpload, activeTemplate, onClearTemplate }) {
  return (
    <section data-testid="upload-section">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Step 1</div>
          <h2 className="font-heading text-xl font-medium">Upload a video</h2>
        </div>
        {activeTemplate && (
          <div className="inline-flex items-center gap-2 bg-volt/10 border border-volt/30 rounded-full pl-3 pr-1.5 py-1" data-testid="active-template-chip">
            <Sparkles className="w-3 h-3 text-volt" />
            <span className="text-[11px] text-volt">Using: {activeTemplate.name}</span>
            <button onClick={onClearTemplate} className="w-5 h-5 rounded-full hover:bg-volt/20 flex items-center justify-center text-volt" aria-label="Clear template">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onUpload}
        className="w-full block border-2 border-dashed border-white/10 hover:border-volt/40 bg-ink-900/40 rounded-lg p-10 sm:p-14 text-left transition-colors group"
        data-testid="dashboard-upload-card"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-14 h-14 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0 group-hover:bg-volt group-hover:border-volt transition-colors">
            <UploadCloud className="w-6 h-6 text-volt group-hover:text-black transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl sm:text-2xl font-medium tracking-tight">Drop a video to get sample clip ideas</h3>
            <p className="mt-1.5 text-sm text-zinc-400">MP4, MOV, MKV up to 500MB · or paste a YouTube / Vimeo / Twitch URL in the upload screen.</p>
            <div className="mt-5 inline-flex items-center gap-2 bg-volt text-black text-sm font-medium px-5 py-2.5 rounded-md group-hover:bg-volt-300 transition-colors">
              <FileVideo className="w-4 h-4" /> Choose a file
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}

// ------------ Recent project row ------------
function ProjectRow({ project, onSelect, selected }) {
  const isProcessing = project.status === "processing";
  return (
    <button
      onClick={() => !isProcessing && onSelect(project)}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-md border transition-colors ${
        selected ? "border-volt/40 bg-volt/5" :
        isProcessing ? "border-white/5 bg-ink-900 cursor-default" :
        "border-white/5 bg-ink-900 hover:border-volt/30"
      }`}
      data-testid={`project-row-${project.id}`}
      disabled={isProcessing}
    >
      <div className="w-10 h-10 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0">
        <FileVideo className="w-4 h-4 text-volt" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{project.filename}</div>
        <div className="text-[11px] text-zinc-500 truncate">{project.source_label} · {project.duration_minutes} min · {project.size_mb} MB</div>
      </div>
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-volt animate-spin" />
            <span className="text-[11px] font-mono text-volt">Demo processing · {project.progress}%</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Lightbulb className="w-3 h-3 text-volt" /> {project.clips_suggested} ideas
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">{formatRelative(project.processed_at)}</div>
            <CheckCircle2 className="w-3.5 h-3.5 text-volt" />
          </>
        )}
      </div>
    </button>
  );
}

// ------------ Single clip idea card ------------
function ClipIdeaCard({ idea }) {
  return (
    <div className="bg-ink-900 border border-white/5 rounded-lg p-5 flex flex-col gap-4" data-testid={`idea-card-${idea.id}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-zinc-400">
          <Clock className="w-3 h-3" />
          {formatTimestamp(idea.start_seconds)} → {formatTimestamp(idea.end_seconds)} · {idea.duration_seconds}s
        </div>
        <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-[10px] text-volt">
          <span className="w-1.5 h-1.5 rounded-full bg-volt" /> {idea.platform}
        </span>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1">Title idea</div>
        <h3 className="font-heading text-base font-medium leading-snug">{idea.title}</h3>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Wand2 className="w-3 h-3" /> Hook</div>
        <p className="text-sm text-zinc-200 leading-relaxed">{idea.hook}</p>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" /> Caption · <span className="text-volt">{idea.caption_style}</span> style
        </div>
        <div className="text-xs text-zinc-300 bg-ink-950 border border-white/5 rounded-md p-3 whitespace-pre-line leading-relaxed">{idea.caption_text}</div>
      </div>

      <div className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-volt/30 pl-3">{idea.reason}</div>

      <Link
        to={`/clip/demo-clip-1`}
        className="mt-auto inline-flex items-center justify-center gap-2 border border-white/10 hover:border-volt/40 hover:bg-volt/5 text-zinc-300 hover:text-volt rounded-md py-2.5 text-xs transition-colors"
        data-testid={`idea-open-${idea.id}`}
      >
        Open in editor <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ============ PAGE ============
export default function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [projects] = useState(DEMO_RECENT_UPLOADS);
  const [selectedProject, setSelectedProject] = useState(DEMO_RECENT_UPLOADS[0]); // surface ideas immediately
  const [activeTemplate, setActiveTemplateState] = useState(getActiveTemplate());

  useEffect(() => {
    if (activeTemplate) {
      toast.success(`Template active: ${activeTemplate.name}`, { description: "Your next upload will use this template." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearTemplate = () => {
    clearActiveTemplate();
    setActiveTemplateState(null);
    toast("Template cleared");
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-6xl mx-auto space-y-14" data-testid="dashboard-page">
        <BetaHeader name={user?.name} />

        {/* ============ 1. Upload a video ============ */}
        <UploadCard
          onUpload={() => nav("/upload")}
          activeTemplate={activeTemplate}
          onClearTemplate={handleClearTemplate}
        />

        {/* ============ 2. Recent projects ============ */}
        <section data-testid="projects-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Step 2</div>
              <h2 className="font-heading text-xl font-medium flex items-center gap-2">
                <Folder className="w-5 h-5 text-zinc-500" /> Recent projects
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500">{projects.length} sample projects loaded for demo</span>
          </div>

          {projects.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-lg p-10 text-center" data-testid="projects-empty">
              <FileVideo className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-medium">No projects yet</h3>
              <p className="text-xs text-zinc-500 mt-1">Your uploaded source videos will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onSelect={(proj) => { setSelectedProject(proj); toast.success(`Loaded ideas for ${proj.filename}`); }}
                  selected={selectedProject?.id === p.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============ 3. Generated clip ideas ============ */}
        <section data-testid="ideas-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Step 3</div>
              <h2 className="font-heading text-xl font-medium flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-zinc-500" /> Generated clip ideas
              </h2>
              {selectedProject ? (
                <p className="text-xs text-zinc-500 mt-1">Sample ideas for <span className="text-zinc-300">{selectedProject.filename}</span> — demo data only.</p>
              ) : (
                <p className="text-xs text-zinc-500 mt-1">Pick a project above or upload a new video to see suggested ideas.</p>
              )}
            </div>
          </div>

          {selectedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="ideas-grid">
              {DEMO_GENERATED_CLIPS.map((i) => <ClipIdeaCard key={i.id} idea={i} />)}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-lg p-12 text-center" data-testid="ideas-empty">
              <Scissors className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-medium">No clip ideas yet</h3>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto">Upload a long-form video and Hookify will return three sample clip ideas with hooks, captions, and timestamps.</p>
              <button onClick={() => nav("/upload")} className="mt-5 inline-flex items-center gap-2 bg-volt text-black font-medium px-4 py-2 rounded-md text-xs hover:bg-volt-300 transition-colors">
                Upload a video <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </section>

        {/* ============ 4. Join beta CTA ============ */}
        <section
          className="rounded-lg border border-volt/20 bg-gradient-to-br from-volt/5 via-ink-900 to-ink-900 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
          data-testid="beta-cta"
        >
          <div className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">Beta seat</div>
            <h2 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight">Want full access when real AI processing launches?</h2>
            <p className="mt-2 text-sm text-zinc-400">Join the beta list and we'll send you the keys as soon as live uploads, transcript, and hook generation are wired in. Two-week rolling waitlist.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <JoinBetaDialog
              trigger={
                <button
                  className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-3 rounded-md hover:bg-volt-300 transition-colors text-sm"
                  data-testid="dashboard-request-access"
                >
                  <Sparkles className="w-4 h-4" /> Request access
                </button>
              }
            />
            <Link to="/pricing" className="text-xs text-zinc-400 hover:text-white">See plans →</Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
