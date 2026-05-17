import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { loadBetaRequests } from "../lib/mockData";
import { Mail, User, Smartphone, Calendar, Inbox } from "lucide-react";

export default function BetaRequestsPage() {
  const [reqs, setReqs] = useState([]);
  useEffect(() => { setReqs(loadBetaRequests()); }, []);

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-4xl mx-auto" data-testid="beta-requests-page">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Internal · beta requests</span>
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight">Local beta sign-ups</h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">Submissions captured by the Request Access form in this browser. Stored locally — clear browser storage to reset.</p>
        </header>

        {reqs.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-lg p-16 text-center" data-testid="beta-requests-empty">
            <Inbox className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-heading text-base font-medium">No submissions yet.</h3>
            <p className="text-xs text-zinc-500 mt-1">Visitors who fill the Join Beta form will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reqs.slice().reverse().map((r, i) => (
              <div key={i} className="bg-ink-900 border border-white/5 rounded-lg p-5" data-testid={`beta-req-${i}`}>
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-volt" />
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                    <Calendar className="w-3 h-3" /> {new Date(r.submitted_at).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] mb-3">
                  <div className="flex items-center gap-1.5 text-zinc-400"><Mail className="w-3 h-3 text-volt" /> {r.email}</div>
                  <div className="flex items-center gap-1.5 text-zinc-400"><Smartphone className="w-3 h-3 text-volt" /> {r.platform || "—"}</div>
                  <div className="text-zinc-400">{r.type} · {r.volume || "—"}</div>
                </div>
                <div className="text-xs text-zinc-300 border-l-2 border-volt/30 pl-3 leading-relaxed">{r.pain}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
