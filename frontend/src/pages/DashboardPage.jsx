import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatRelative, formatTimestamp } from "../lib/mockData";
import {
  UploadCloud, FileVideo, Sparkles, ArrowRight, Folder,
  Clock, Lightbulb, Scissors, Wand2, MessageSquare, Crown, Gauge, Zap,
} from "lucide-react";
import { toast } from "sonner";

const PLAN_QUOTA = { free: 60, starter: 180, pro: 500, business: 2000 };
const PLAN_LABEL = { free: "Free", starter: "Starter", pro: "Pro", business: "Business" };

function StatCard({ label, value, hint, accent }) {
  return (
    <div className={`rounded-lg border ${accent ? "border-purple/30 bg-purple/5" : "border-white/5 bg-ink-900"} p-5`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">{label}</div>
      <div className="font-heading text-3xl font-medium text-white">{value}</div>
      {hint && <div className="text-[11px] text-zinc-500 mt-1.5">{hint}</div>}
    </div>
  );
}

function UsageBar({ used, quota }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, quota)) * 100));
  return (
    <div className="rounded-lg border border-white/5 bg-ink-900 p-5">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Usage this month</div>
          <div className="font-heading text-2xl font-medium mt-1">{Math.round(used)}<span className="text-zinc-500 text-sm font-normal"> / {quota} min</span></div>
        </div>
        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs btn-brand px-3 py-1.5 rounded-md font-medium" data-testid="upgrade-btn">
          <Crown className="w-3.5 h-3.5" /> Upgrade
        </Link>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple to-volt transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-zinc-500">{Math.max(0, quota - Math.round(used))} minutes remaining</div>
    </div>
  );
}

function ProjectRow({ p, onOpen }) {
  const minutes = Math.max(1, Math.round((p.duration_seconds || 0) / 60));
  const ideas = (p.suggestions || []).length;
  return (
    <button
      onClick={() => onOpen(p)}
      className="w-full text-left flex items-center gap-4 p-4 rounded-md border border-white/5 bg-ink-900 hover:border-purple/40 hover:bg-purple/5 transition-colors"
      data-testid={`project-row-${p.id}`}
    >
      <div className="w-10 h-10 rounded-md bg-purple/15 border border-purple/30 flex items-center justify-center shrink-0">
        <FileVideo className="w-4 h-4 text-purple-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{p.filename || "video.mp4"}</div>
        <div className="text-[11px] text-zinc-500 truncate">{minutes} min · {formatRelative(p.created_at)}</div>
      </div>
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-volt">
          <Lightbulb className="w-3 h-3" /> {ideas} ideas
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
      </div>
    </button>
  );
}

function ClipIdeaCard({ idea, project }) {
  return (
    <Link to={`/clip/${idea.id || `gen-${idea.start_seconds}`}`} className="block bg-ink-900 border border-white/5 hover:border-purple/40 hover:ring-brand rounded-lg p-5 flex flex-col gap-4 transition-all" data-testid={`idea-card-${idea.id}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-zinc-400">
          <Clock className="w-3 h-3" />
          {formatTimestamp(idea.start_seconds)} → {formatTimestamp(idea.end_seconds)} · {idea.duration_seconds}s
        </div>
        <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2.5 py-1 text-[10px] text-volt">
          <Zap className="w-3 h-3" /> {idea.confidence ?? "—"}%
        </span>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1">Title idea · {idea.platform}</div>
        <h3 className="font-heading text-base font-medium leading-snug">{idea.title}</h3>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-purple-300" /> Hook</div>
        <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2">{idea.hook}</p>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-volt" /> Caption · <span className="text-volt">{idea.caption_style}</span>
        </div>
        <div className="text-xs text-zinc-300 bg-ink-950 border border-white/5 rounded-md p-3 whitespace-pre-line leading-relaxed line-clamp-3">{idea.caption_text}</div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const [{ data: prof }, { data: projs }] = await Promise.all([
          api.get("/profile"),
          api.get("/projects"),
        ]);
        if (cancel) return;
        setProfile(prof);
        setProjects(projs || []);
        setSelected((projs || [])[0] || null);
      } catch (err) {
        if (!cancel) toast.error("Could not load dashboard", { description: err?.response?.data?.detail || err?.message });
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  const plan = profile?.profile?.plan || "free";
  const used = Number(profile?.profile?.minutes_used_month || 0);
  const quota = Number(profile?.profile?.minutes_quota_month || PLAN_QUOTA[plan] || 60);
  const ideas = (selected?.suggestions || []).slice(0, 6);

  const handleUpload = () => nav("/upload");

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-6xl mx-auto space-y-12" data-testid="dashboard-page">

        {/* Header */}
        <header>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 border border-purple/30 bg-purple/10 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse-glow" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200">{PLAN_LABEL[plan]} plan</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">v3 · Real AI · Live render</span>
          </div>
          <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-medium tracking-tight" data-testid="dashboard-heading">
            Welcome back, {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Creator"}.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Upload long-form, get real 9:16 short-form clips ready to post. Powered by Whisper + Claude Sonnet 4.5.
          </p>
        </header>

        {/* Stat strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="dashboard-stats">
          <UsageBar used={used} quota={quota} />
          <StatCard
            label="Clips rendered"
            value={projects.reduce((acc, p) => acc + ((p.suggestions || []).length), 0)}
            hint="Total clip ideas generated for you this month"
          />
          <StatCard
            label="Sources analyzed"
            value={projects.length}
            hint="Long-form videos you've fed Hookify"
            accent
          />
        </div>

        {/* Upload CTA */}
        <section data-testid="upload-section">
          <button
            onClick={handleUpload}
            className="w-full block border-2 border-dashed border-white/10 hover:border-purple/40 bg-ink-900/40 rounded-2xl p-10 sm:p-14 text-left transition-all group relative overflow-hidden"
            data-testid="dashboard-upload-card"
          >
            <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-purple/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-volt/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-xl btn-brand flex items-center justify-center shrink-0">
                <UploadCloud className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300 mb-1">Step 1 · Upload</div>
                <h3 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight">Drop a video to generate real short-form clips</h3>
                <p className="mt-1.5 text-sm text-zinc-400">MP4, MOV, MP3, WAV, M4A up to 100 MB · uploaded directly to your private Supabase bucket.</p>
                <div className="mt-5 inline-flex items-center gap-2 btn-brand text-sm font-medium px-5 py-2.5 rounded-md">
                  <FileVideo className="w-4 h-4" /> Choose a file
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* Recent projects */}
        <section data-testid="projects-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300 mb-1">Step 2 · History</div>
              <h2 className="font-heading text-xl font-medium flex items-center gap-2">
                <Folder className="w-5 h-5 text-zinc-500" /> Recent projects
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500">{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
          </div>

          {loading ? (
            <div className="space-y-2.5" data-testid="projects-loading">
              <div className="h-16 rounded-md shimmer" /><div className="h-16 rounded-md shimmer" /><div className="h-16 rounded-md shimmer" />
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-lg p-10 text-center" data-testid="projects-empty">
              <FileVideo className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-medium">No projects yet</h3>
              <p className="text-xs text-zinc-500 mt-1">Upload your first video to see it here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {projects.slice(0, 6).map((p) => <ProjectRow key={p.id} p={p} onOpen={(proj) => setSelected(proj)} />)}
            </div>
          )}
        </section>

        {/* Clip ideas */}
        <section data-testid="ideas-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300 mb-1">Step 3 · Edit & export</div>
              <h2 className="font-heading text-xl font-medium flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-zinc-500" /> Generated clip ideas
              </h2>
              {selected ? (
                <p className="text-xs text-zinc-500 mt-1">Showing ideas for <span className="text-zinc-300">{selected.filename}</span>.</p>
              ) : (
                <p className="text-xs text-zinc-500 mt-1">Upload a video to see clip ideas here.</p>
              )}
            </div>
          </div>

          {ideas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="ideas-grid">
              {ideas.map((i) => <ClipIdeaCard key={i.id || `${i.start_seconds}-${i.end_seconds}`} idea={i} project={selected} />)}
            </div>
          ) : !loading ? (
            <div className="border border-dashed border-white/10 rounded-lg p-12 text-center" data-testid="ideas-empty">
              <Scissors className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-medium">No clip ideas yet</h3>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto">Upload a long-form video and Hookify will return 3–5 real clip ideas in ~30 seconds.</p>
              <button onClick={handleUpload} className="mt-5 inline-flex items-center gap-2 btn-brand font-medium px-4 py-2 rounded-md text-xs">
                Upload a video <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
