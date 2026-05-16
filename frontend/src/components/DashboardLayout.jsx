import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles, LayoutGrid, Upload, Scissors, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const NAV = [
    { to: "/dashboard", label: "Clips", icon: LayoutGrid },
    { to: "/upload", label: "Upload", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-white grid grid-cols-1 lg:grid-cols-[240px_1fr]" data-testid="dashboard-layout">
      <aside className="border-r border-white/5 bg-ink-900/40 hidden lg:flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-6 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-md bg-volt flex items-center justify-center"><Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} /></div>
          <span className="font-heading font-semibold text-lg">ClipForge<span className="text-volt">.</span></span>
        </Link>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-volt/10 text-volt border border-volt/20" : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"}`} data-testid={`side-${n.label.toLowerCase()}`}>
                <n.icon className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent">
            <Scissors className="w-4 h-4" /> Templates
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-volt/20 border border-volt/30 flex items-center justify-center text-xs font-medium text-volt">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{user?.plan} plan</div>
            </div>
          </div>
          <button onClick={async () => { await logout(); nav("/"); }} className="w-full flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-white border border-white/5 rounded-md py-2 hover:border-white/20 transition-colors" data-testid="side-logout">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
