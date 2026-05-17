import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { DEMO_CLIPS, DEMO_RECENT_UPLOADS, formatViews, formatRelative } from "../lib/mockData";
import {
  Upload, Plus, Scissors, Clock, Flame, Trash2, ArrowRight, ArrowUpRight,
  TrendingUp, Eye, Heart, Share2, MessageCircle, FileVideo, Loader2,
  CheckCircle2, Pencil, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import JoinBetaDialog from "../components/JoinBetaDialog";

const PLAN_LIMITS = { free: 5, creator: 120, studio: Infinity };

function ClipCard({ clip, onDelete }) {
  return (
    <Link
      to={`/clip/${clip.id}`}
      className="group block bg-ink-900 border border-white/5 rounded-lg overflow-hidden hover:border-zinc-700/60 transition-colors"
      data-testid={`clip-card-${clip.id}`}
    >
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
        {/* Hover overlay with explicit Edit affordance */}
        <div className="absolute inset-0 bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 bg-volt text-black text-xs font-medium px-3 py-2 rounded-md">
            <Pencil className="w-3.5 h-3.5" /> Edit clip
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-medium text-sm line-clamp-2 group-hover:text-volt transition-colors">{clip.title}</h3>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(clip.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 shrink-0 pt-0.5"
            data-testid={`clip-delete-${clip.id}`}
            aria-label="Delete clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
          {clip.is_exported ? <span className="text-volt">● Exported</span> : <span>● Draft</span>}
          <span>·</span>
          <span>{formatRelative(clip.created_at)}</span>
          {clip.performance?.views > 0 && (
            <>
              <span>·</span>
              <span className="text-zinc-400">{formatViews(clip.performance.views)} views</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-ink-900 p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${accent ? "text-volt" : "text-zinc-600"}`} />
      </div>
      <div className={`font-heading text-3xl font-medium ${accent ? "text-volt" : "text-white"}`}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-1.5">{sub}</div>}
    </div>
  );
}

function UploadRow({ upl, onOpen }) {
  const isProcessing = upl.status === "processing";
  return (
    <div
      onClick={() => !isProcessing && onOpen(upl)}
      className={`flex items-center gap-4 p-4 rounded-md border border-white/5 bg-ink-900 ${isProcessing ? "opacity-95" : "hover:border-volt/30 cursor-pointer"} transition-colors`}
      data-testid={`upload-row-${upl.id}`}
    >
      <div className="w-10 h-10 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0">
        <FileVideo className="w-4 h-4 text-volt" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{upl.filename}</div>
        <div className="text-[11px] text-zinc-500 truncate">{upl.source_label} · {upl.duration_minutes} min · {upl.size_mb} MB</div>
      </div>
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-volt animate-spin" />
            <span className="text-[11px] font-mono text-volt">{upl.progress}%</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Scissors className="w-3 h-3 text-volt" /> {upl.clips_generated} clips
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">{formatRelative(upl.processed_at)}</div>
            <CheckCircle2 className="w-3.5 h-3.5 text-volt" />
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [clips, setClips] = useState(null);
  const [filter, setFilter] = useState("all"); // all | draft | exported
  const [recentUploads] = useState(DEMO_RECENT_UPLOADS);
  const nav = useNavigate();

  const load = async () => {
    let real = [];
    try {
      const { data } = await api.get("/clips", { timeout: 5000 });
      real = Array.isArray(data) ? data : [];
    } catch (_) {
      real = [];
    }
    // Enrich real clips with mock performance data when missing so the demo always feels full.
    const enrichedReal = real.map((c, i) => {
      if (c.performance) return c;
      const baseViews = Math.max(0, (c.viral_score || 70) * 12_000 - i * 80_000);
      return {
        ...c,
        platforms: c.platforms || ["TikTok", "Shorts", "Reels"].slice(0, 1 + (i % 3)),
        source_video: c.source_video || "founders-lab-ep142.mp4",
        performance: c.is_exported
          ? {
              views: Math.round(baseViews),
              likes: Math.round(baseViews * 0.078),
              shares: Math.round(baseViews * 0.011),
              comments: Math.round(baseViews * 0.0026),
              ctr: 7 + (c.viral_score || 70) / 20,
            }
          : { views: 0, likes: 0, shares: 0, comments: 0, ctr: 0 },
      };
    });
    // Merge with DEMO_CLIPS (deduped by id) so first-time visitors see a populated studio.
    const seen = new Set(enrichedReal.map((c) => c.id));
    const merged = [...enrichedReal, ...DEMO_CLIPS.filter((c) => !seen.has(c.id))];
    setClips(merged);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this clip?")) return;
    setClips((prev) => (prev || []).filter((c) => c.id !== id));
    try {
      await api.delete(`/clips/${id}`, { timeout: 5000 });
      toast.success("Clip deleted");
    } catch (_) {
      toast.success("Clip removed");
    }
  };

  // --- derived ---
  const enriched = useMemo(() => {
    // ensure every clip has a `performance` object for safe math
    return (clips || []).map((c) => ({
      ...c,
      performance: c.performance || { views: 0, likes: 0, shares: 0, comments: 0, ctr: 0 },
    }));
  }, [clips]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const exportedCount = enriched.filter((c) => c.is_exported).length;
    const limit = PLAN_LIMITS[user?.plan] ?? PLAN_LIMITS.free;
    const exportsRemaining = limit === Infinity ? "∞" : Math.max(limit - exportedCount, 0);
    const avgScore = total ? Math.round(enriched.reduce((s, c) => s + (c.viral_score || 0), 0) / total) : 0;
    const totalViews = enriched.reduce((s, c) => s + (c.performance.views || 0), 0);
    return { total, exportedCount, exportsRemaining, limit, avgScore, totalViews };
  }, [enriched, user?.plan]);

  const bestClip = useMemo(() => {
    if (!enriched.length) return null;
    // pick the clip with the highest views; if all are 0, fall back to viral_score
    const byViews = [...enriched].sort((a, b) => (b.performance.views || 0) - (a.performance.views || 0))[0];
    if (byViews.performance.views > 0) return byViews;
    return [...enriched].sort((a, b) => b.viral_score - a.viral_score)[0];
  }, [enriched]);

  const filteredClips = useMemo(() => {
    if (filter === "draft") return enriched.filter((c) => !c.is_exported);
    if (filter === "exported") return enriched.filter((c) => c.is_exported);
    return enriched;
  }, [enriched, filter]);

  const filters = [
    { id: "all",      label: "All",       count: enriched.length },
    { id: "draft",    label: "Drafts",    count: enriched.filter((c) => !c.is_exported).length },
    { id: "exported", label: "Exported",  count: enriched.filter((c) => c.is_exported).length },
  ];

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-7xl mx-auto space-y-12" data-testid="dashboard-page">
        {/* ============ Header ============ */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-volt">Studio</span>
              <span
                className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-0.5"
                data-testid="demo-mode-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Demo mode</span>
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "Creator"}.</h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Real uploads, AI clipping, and account verification are coming soon. Everything you see below is sample data so you can explore the studio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <JoinBetaDialog
              trigger={
                <button
                  className="inline-flex items-center gap-2 border border-volt/40 text-volt hover:bg-volt/10 transition-colors font-medium px-4 py-2.5 rounded-md text-sm"
                  data-testid="dashboard-join-beta"
                >
                  <Sparkles className="w-4 h-4" /> Join beta
                </button>
              }
            />
            <button
              onClick={() => nav("/upload")}
              className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm"
              data-testid="dashboard-upload-cta"
            >
              <Plus className="w-4 h-4" /> Upload new video
            </button>
          </div>
        </header>

        {/* ============ Stats row ============ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Sample studio metrics</span>
            <span className="inline-block w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-[10px] text-zinc-600">Numbers shown are illustrative for demo purposes.</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden" data-testid="dashboard-stats">
            <StatTile
              label="Total clips generated"
              value={stats.total}
              sub="Sample · across two source videos"
              icon={Scissors}
            />
            <StatTile
              label="Exports remaining"
              value={stats.exportsRemaining}
              sub={user?.plan === "free" ? `of ${PLAN_LIMITS.free} on demo plan` : "fair use applies"}
              icon={Upload}
              accent
            />
            <StatTile
              label="Avg viral score"
              value={stats.avgScore || "—"}
              sub="Sample · benchmarked vs. 18K creators"
              icon={Flame}
            />
            <StatTile
              label="Total views earned"
              value={formatViews(stats.totalViews)}
              sub="Sample · TikTok · Shorts · Reels combined"
              icon={TrendingUp}
            />
          </div>
        </section>

        {/* ============ Best performing clip ============ */}
        {bestClip ? (
          <section data-testid="dashboard-best">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Best performing clip</div>
                <h2 className="font-heading text-xl font-medium">Your scroll-stopper of the week</h2>
              </div>
              <Link to={`/clip/${bestClip.id}`} className="text-xs text-zinc-500 hover:text-white inline-flex items-center gap-1" data-testid="best-clip-link">
                Open editor <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
              {/* Vertical preview */}
              <Link to={`/clip/${bestClip.id}`} className="aspect-[9/16] lg:aspect-auto relative overflow-hidden bg-ink-900 group" data-testid="best-clip-preview">
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${bestClip.thumbnail_color}33 0%, #18181B 50%, #09090B 100%)` }} />
                <div className="absolute inset-0 dot-grid opacity-30" />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-volt text-black rounded-full px-2.5 py-1 text-[11px] font-mono font-bold">
                    <Flame className="w-3 h-3" /> {bestClip.viral_score}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                    9:16
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink-950/40">
                  <div className="inline-flex items-center gap-1.5 bg-volt text-black text-xs font-medium px-3 py-2 rounded-md">
                    <Pencil className="w-3.5 h-3.5" /> Edit clip
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="caption-pill rounded-md px-2.5 py-2 inline-block max-w-full">
                    <div className="text-[11px] font-medium leading-tight"><span className="text-volt">{bestClip.transcript_preview?.split(" ").slice(0, 4).join(" ")}</span> {bestClip.transcript_preview?.split(" ").slice(4, 9).join(" ")}…</div>
                  </div>
                </div>
              </Link>

              {/* Details */}
              <div className="bg-ink-900 p-6 lg:p-8 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight leading-tight">{bestClip.title}</h3>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    From <span className="text-zinc-300">{bestClip.source_video || "your upload"}</span> · {bestClip.duration_seconds}s · captioned in {bestClip.caption_style}.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                    {(bestClip.platforms || ["TikTok"]).map((p) => (
                      <span key={p} className="inline-flex items-center gap-1.5 bg-ink-950 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-volt" /> {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Performance metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-white/5">
                  {[
                    { label: "Views",    val: formatViews(bestClip.performance.views), icon: Eye },
                    { label: "Likes",    val: formatViews(bestClip.performance.likes), icon: Heart },
                    { label: "Shares",   val: formatViews(bestClip.performance.shares), icon: Share2 },
                    { label: "Comments", val: formatViews(bestClip.performance.comments), icon: MessageCircle },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-bold mb-1.5">
                        <m.icon className="w-3 h-3" /> {m.label}
                      </div>
                      <div className="font-heading text-xl font-medium text-white">{m.val}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Link to={`/clip/${bestClip.id}`} className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm" data-testid="best-clip-edit">
                    <Pencil className="w-4 h-4" /> Edit clip
                  </Link>
                  <button className="inline-flex items-center gap-2 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 px-4 py-2.5 rounded-md text-sm transition-colors">
                    <ArrowUpRight className="w-4 h-4" /> View analytics
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ============ Recent uploads ============ */}
        <section data-testid="dashboard-uploads">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Recent uploads</div>
              <h2 className="font-heading text-xl font-medium">Source videos in your studio</h2>
            </div>
            <button onClick={() => nav("/upload")} className="text-xs text-zinc-500 hover:text-white inline-flex items-center gap-1" data-testid="uploads-new-link">
              Upload new <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentUploads.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-lg p-10 text-center" data-testid="uploads-empty">
              <FileVideo className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-medium">No uploads yet</h3>
              <p className="text-xs text-zinc-500 mt-1">Your processed source videos will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentUploads.map((u) => <UploadRow key={u.id} upl={u} onOpen={() => nav("/upload")} />)}
            </div>
          )}
        </section>

        {/* ============ Saved clips grid ============ */}
        <section data-testid="dashboard-clips">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-1">Saved clips</div>
              <h2 className="font-heading text-xl font-medium">Your library</h2>
            </div>

            <div className="flex items-center gap-2 bg-ink-900 border border-white/5 rounded-md p-1" data-testid="clip-filters">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${filter === f.id ? "bg-volt text-black font-medium" : "text-zinc-400 hover:text-white"}`}
                  data-testid={`filter-${f.id}`}
                >
                  {f.label} <span className="opacity-70 ml-1">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {clips === null && <div className="text-zinc-500 text-sm" data-testid="clips-loading">Loading…</div>}

          {clips !== null && filteredClips.length === 0 && enriched.length === 0 && (
            <div className="border border-dashed border-white/10 rounded-lg p-16 text-center" data-testid="dashboard-empty">
              <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-5 h-5 text-volt" />
              </div>
              <h3 className="font-heading text-lg font-medium">No clips yet</h3>
              <p className="text-sm text-zinc-400 mt-1.5 max-w-sm mx-auto">
                Upload your first long-form video and we'll surface 8–12 viral moments in minutes.
              </p>
              <button onClick={() => nav("/upload")} className="mt-6 inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md text-sm hover:bg-volt-300 transition-colors" data-testid="empty-upload-cta">
                <Plus className="w-4 h-4" /> Upload a video
              </button>
            </div>
          )}

          {clips !== null && filteredClips.length === 0 && enriched.length > 0 && (
            <div className="border border-dashed border-white/10 rounded-lg p-10 text-center" data-testid="filter-empty">
              <h3 className="font-heading text-base font-medium">Nothing in this filter</h3>
              <p className="text-xs text-zinc-500 mt-1">Try a different tab — or upload another video to generate more clips.</p>
              <button onClick={() => setFilter("all")} className="mt-4 text-xs text-volt hover:underline" data-testid="filter-reset">Show all clips</button>
            </div>
          )}

          {filteredClips.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredClips.map((c) => <ClipCard key={c.id} clip={c} onDelete={onDelete} />)}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
