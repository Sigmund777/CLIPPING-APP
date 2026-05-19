import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  loadSavedClips, deleteSavedClip, saveClip, setActiveClip,
  CLIP_STATUSES, PLATFORM_OPTIONS, formatRelative, formatTimestamp,
} from "../lib/mockData";
import {
  Lightbulb, Pencil, Trash2, Plus, ArrowRight, Clock, FileVideo,
  Zap, Filter, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  "Idea":          "border-white/15 text-zinc-300",
  "Editing":       "border-amber-400/30 text-amber-300",
  "Ready to post": "border-volt/40 text-volt",
  "Posted":        "border-emerald-400/30 text-emerald-300",
};

export default function WorkspacePage() {
  const [clips, setClips] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const nav = useNavigate();

  useEffect(() => { setClips(loadSavedClips()); }, []);

  const filtered = useMemo(() => {
    return clips.filter((c) => {
      if (platformFilter !== "All" && c.platform !== platformFilter) return false;
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      return true;
    });
  }, [clips, platformFilter, statusFilter]);

  const handleEdit = (c) => {
    setActiveClip(c);
    nav(`/clip/${c.id}`);
  };
  const handleDelete = (id) => {
    if (!window.confirm("Delete this saved clip?")) return;
    setClips(deleteSavedClip(id));
    toast.success("Clip deleted");
  };
  const handleStatus = (c, status) => {
    const merged = { ...c, status };
    saveClip(merged);
    setClips((prev) => prev.map((p) => (p.id === c.id ? merged : p)));
    toast.success(`Status → ${status}`);
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-6xl mx-auto" data-testid="workspace-page">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Workspace · saved clips</span>
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Your saved clips</h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl">Edit titles, hooks, captions and track status — Idea → Editing → Ready to post → Posted. Saved locally in this beta build.</p>
          </div>
          <button onClick={() => nav("/upload")} className="inline-flex items-center gap-2 bg-volt text-black font-medium px-4 py-2.5 rounded-md hover:bg-volt-300 text-sm" data-testid="workspace-upload-cta">
            <Plus className="w-4 h-4" /> New from upload
          </button>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold"><Filter className="w-3 h-3" /> Filter</div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-ink-900 border border-white/10 rounded-md px-3 py-1.5 text-xs focus:border-volt focus:outline-none"
            data-testid="workspace-filter-platform"
          >
            <option value="All">All platforms</option>
            {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-ink-900 border border-white/10 rounded-md px-3 py-1.5 text-xs focus:border-volt focus:outline-none"
            data-testid="workspace-filter-status"
          >
            <option value="All">All statuses</option>
            {CLIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-[11px] text-zinc-500">{filtered.length} of {clips.length}</span>
        </div>

        {clips.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg p-16 text-center" data-testid="workspace-empty">
            <Sparkles className="w-6 h-6 text-volt mx-auto mb-3" />
            <h3 className="font-heading text-lg font-medium">No saved clips yet.</h3>
            <p className="text-sm text-zinc-400 mt-1.5 max-w-sm mx-auto">Upload a video to generate your first clip ideas.</p>
            <button onClick={() => nav("/upload")} className="mt-6 inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md text-sm hover:bg-volt-300 transition-colors" data-testid="workspace-empty-upload">
              <Plus className="w-4 h-4" /> Upload a video
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg p-10 text-center">
            <h3 className="font-heading text-base font-medium">Nothing matches this filter.</h3>
            <button onClick={() => { setPlatformFilter("All"); setStatusFilter("All"); }} className="mt-3 text-xs text-volt hover:underline">Reset filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-ink-900 border border-white/5 rounded-lg p-5 flex flex-col gap-3" data-testid={`saved-clip-${c.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border ${STATUS_COLORS[c.status || "Idea"]}`}>{c.status || "Idea"}</span>
                  <span className="inline-flex items-center gap-1.5 bg-volt/10 border border-volt/30 rounded-full px-2 py-0.5 text-[10px] text-volt">
                    <span className="w-1.5 h-1.5 rounded-full bg-volt" /> {c.platform}
                  </span>
                </div>
                <h3 className="font-heading text-base font-medium leading-snug line-clamp-2">{c.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimestamp(c.start_seconds || 0)}→{formatTimestamp(c.end_seconds || 0)}</span>
                  <span className="inline-flex items-center gap-1 truncate"><FileVideo className="w-3 h-3" /> <span className="truncate">{c.source_filename}</span></span>
                </div>
                {c.hook && <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 border-l-2 border-volt/30 pl-3">{c.hook}</p>}
                <div className="text-[10px] text-zinc-500 flex items-center justify-between gap-2 mt-1">
                  <span>{c.confidence ? <><Zap className="inline w-3 h-3 text-volt mr-1" />{c.confidence}% confident</> : <><Lightbulb className="inline w-3 h-3 mr-1" />New</>}</span>
                  <span>Saved {formatRelative(c.updated_at || c.saved_at)}</span>
                </div>

                <select
                  value={c.status || "Idea"}
                  onChange={(e) => handleStatus(c, e.target.value)}
                  className="bg-ink-950 border border-white/10 rounded-md px-2 py-1.5 text-xs focus:border-volt focus:outline-none"
                  data-testid={`saved-status-${c.id}`}
                >
                  {CLIP_STATUSES.map((s) => <option key={s} value={s}>Set to: {s}</option>)}
                </select>

                <div className="flex items-center gap-2 pt-2 mt-auto border-t border-white/5">
                  <button onClick={() => handleEdit(c)} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-volt text-black font-medium rounded-md py-2 text-xs hover:bg-volt-300 transition-colors" data-testid={`saved-edit-${c.id}`}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="inline-flex items-center justify-center w-9 h-9 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/40 rounded-md transition-colors" data-testid={`saved-delete-${c.id}`} aria-label="Delete clip">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
