import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { DEMO_TEMPLATES, setActiveTemplate } from "../lib/mockData";
import { Sparkles, ArrowRight, Wand2, MessageSquare, Gauge, Quote, Check } from "lucide-react";
import { toast } from "sonner";

const ACCENT_DOTS = {
  Gaming: "#ff4d4d",
  Podcast: "#CCFF00",
  Reaction: "#ffd84d",
  Educational: "#7dd3fc",
  Storytime: "#c084fc",
  "Hot take": "#fb7185",
};

function TemplateCard({ tpl, onUse, isActive }) {
  return (
    <div
      className={`bg-ink-900 border rounded-lg p-6 flex flex-col gap-5 transition-colors ${isActive ? "border-volt/40" : "border-white/5 hover:border-zinc-700/60"}`}
      data-testid={`template-card-${tpl.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT_DOTS[tpl.accent] || "#CCFF00" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{tpl.accent}</span>
          </div>
          <h3 className="font-heading text-lg font-medium leading-tight">{tpl.name}</h3>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 bg-volt text-black text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm">
            <Check className="w-3 h-3" /> Active
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed">{tpl.description}</p>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-volt" /> Hook style</div>
          <div className="text-zinc-300">{tpl.hook_style}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-volt" /> Caption style</div>
          <div className="text-zinc-300">{tpl.caption_style}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1 flex items-center gap-1.5"><Gauge className="w-3 h-3 text-volt" /> Pacing</div>
          <div className="text-zinc-300">{tpl.pacing}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1.5 flex items-center gap-1.5"><Quote className="w-3 h-3 text-volt" /> Title examples</div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {tpl.title_examples.map((t, i) => (
              <li key={i} className="bg-ink-950 border border-white/5 rounded-md px-2.5 py-1.5 leading-snug">"{t}"</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={() => onUse(tpl)}
        className={`mt-auto inline-flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-ink-950 border border-volt/40 text-volt" : "bg-volt text-black hover:bg-volt-300"}`}
        data-testid={`template-use-${tpl.id}`}
      >
        <Sparkles className="w-4 h-4" />
        {isActive ? "Template selected" : "Use template"}
        {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function TemplatesPage() {
  const nav = useNavigate();
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hookify_active_template");
      if (raw) setActiveId(JSON.parse(raw)?.id || null);
    } catch (_) {}
  }, []);

  const handleUse = (tpl) => {
    setActiveTemplate(tpl);
    setActiveId(tpl.id);
    toast.success(`Template selected: ${tpl.name}`, { description: "Heading to upload — we'll apply this to your next clip." });
    setTimeout(() => nav("/upload"), 700);
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-6xl mx-auto" data-testid="templates-page">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Early access beta</span>
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Clip templates</h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Pick a structure that matches the content you're making. We'll apply the hook style, caption style and pacing to your next upload's clip ideas.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_TEMPLATES.map((t) => (
            <TemplateCard key={t.id} tpl={t} onUse={handleUse} isActive={activeId === t.id} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
