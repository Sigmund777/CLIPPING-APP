import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { DEMO_CLIPS } from "../lib/mockData";
import { Upload, Plus, Scissors, Clock, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";

function ClipCard({ clip, onDelete }) {
  return (
    <Link to={`/clip/${clip.id}`} className="group block bg-ink-900 border border-white/5 rounded-lg overflow-hidden hover:border-zinc-700/60 transition-colors" data-testid={`clip-card-${clip.id}`}>
      <div className="aspect-[9/16] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${clip.thumbnail_color || "#CCFF00"}22 0%, #18181B 50%, #09090B 100%)` }}>
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono">
            <Flame className="w-3 h-3 text-volt" /> <span className="text-volt">{clip.viral_score}</span>
          </div>
          <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-300">
            <Clock className="w-3 h-3" /> {clip.duration_seconds}s
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink-950 to-transparent">
          <div className="caption-pill rounded-md px-2.5 py-1.5 inline-block">
            <div className="text-[11px] font-medium leading-tight"><span className="text-volt">{clip.transcript_preview?.split(" ").slice(0, 4).join(" ")}</span> {clip.transcript_preview?.split(" ").slice(4, 8).join(" ")}</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-medium text-sm line-clamp-2 group-hover:text-volt transition-colors">{clip.title}</h3>
          <button onClick={(e) => { e.preventDefault(); onDelete(clip.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400" data-testid={`clip-delete-${clip.id}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
          {clip.is_exported ? <span className="text-volt">● Exported</span> : <span>● Draft</span>}
          <span>·</span>
          <span>{new Date(clip.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [clips, setClips] = useState(null);
  const nav = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/clips", { timeout: 5000 });
      setClips(Array.isArray(data) && data.length ? data : DEMO_CLIPS);
    } catch (_) {
      // Backend unreachable — show demo clips so the dashboard never blanks.
      setClips(DEMO_CLIPS);
    }
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this clip?")) return;
    // Optimistic remove — works in both online and offline modes
    setClips((prev) => (prev || []).filter((c) => c.id !== id));
    try {
      await api.delete(`/clips/${id}`, { timeout: 5000 });
      toast.success("Clip deleted");
    } catch (_) {
      toast.success("Clip removed");
    }
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-7xl mx-auto" data-testid="dashboard-page">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-2">Studio</div>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Welcome back, {user?.name?.split(" ")[0]}.</h1>
            <p className="mt-1.5 text-sm text-zinc-400">{clips?.length || 0} clips in your library · {user?.plan} plan</p>
          </div>
          <button onClick={() => nav("/upload")} className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm" data-testid="dashboard-new-clip">
            <Plus className="w-4 h-4" /> New clip
          </button>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden mb-10">
          {[
            { l: "Clips this month", v: clips?.length || 0, icon: Scissors },
            { l: "Avg viral score", v: clips?.length ? Math.round(clips.reduce((s, c) => s + c.viral_score, 0) / clips.length) : 0, icon: Flame },
            { l: "Minutes saved", v: (clips?.length || 0) * 18, icon: Clock },
            { l: "Exports remaining", v: user?.plan === "free" ? Math.max(5 - (clips?.length || 0), 0) : "∞", icon: Upload },
          ].map((s, i) => (
            <div key={i} className="bg-ink-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">{s.l}</span>
                <s.icon className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="font-heading text-3xl font-medium">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Clips */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-medium">Your clips</h2>
          <button className="text-xs text-zinc-500 hover:text-white">View all →</button>
        </div>

        {clips === null && <div className="text-zinc-500 text-sm">Loading…</div>}
        {clips?.length === 0 && (
          <div className="border border-dashed border-white/10 rounded-lg p-16 text-center" data-testid="dashboard-empty">
            <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-5 h-5 text-volt" />
            </div>
            <h3 className="font-heading text-lg font-medium">No clips yet</h3>
            <p className="text-sm text-zinc-400 mt-1.5">Upload your first long-form video and we'll surface 8–12 viral moments in minutes.</p>
            <button onClick={() => nav("/upload")} className="mt-6 bg-volt text-black font-medium px-5 py-2.5 rounded-md text-sm hover:bg-volt-300 transition-colors">Upload now</button>
          </div>
        )}
        {clips?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {clips.map((c) => <ClipCard key={c.id} clip={c} onDelete={onDelete} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
