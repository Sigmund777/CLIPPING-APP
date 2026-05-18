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
