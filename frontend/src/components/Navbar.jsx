import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Menu, X, Sparkles } from "lucide-react";

export default function Navbar({ variant = "marketing" }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const links = [
    { to: "/#features", label: "Features" },
    { to: "/#how", label: "How it works" },
    { to: "/pricing", label: "Pricing" },
    { to: "/#faq", label: "FAQ" },
  ];

  const goAnchor = (href) => (e) => {
    if (href.startsWith("/#") && loc.pathname === "/") {
      e.preventDefault();
      const id = href.slice(2);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      setOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${variant === "marketing" ? "backdrop-blur-xl bg-ink-950/70" : "bg-ink-950/80 backdrop-blur"} border-b border-white/5`} data-testid="navbar">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-testid="navbar-logo">
          <div className="w-8 h-8 rounded-md bg-volt flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight">Hookify<span className="text-volt">.</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.to} href={l.to} onClick={goAnchor(l.to)} className="text-sm text-zinc-400 hover:text-white transition-colors" data-testid={`nav-${l.label.toLowerCase().replace(/\s/g,'-')}`}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-zinc-300 hover:text-white" data-testid="nav-dashboard">Dashboard</Link>
              <button onClick={async () => { await logout(); nav("/"); }} className="text-sm text-zinc-400 hover:text-white" data-testid="nav-logout">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-300 hover:text-white" data-testid="nav-login">Log in</Link>
              <Link to="/signup" className="bg-volt text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-volt-300 transition-colors" data-testid="nav-signup">Start free</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-zinc-300" data-testid="nav-mobile-toggle">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-ink-950 px-6 py-4 space-y-3">
          {links.map((l) => (
            <a key={l.to} href={l.to} onClick={goAnchor(l.to)} className="block text-sm text-zinc-400" data-testid={`mnav-${l.label.toLowerCase().replace(/\s/g,'-')}`}>{l.label}</a>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" className="block text-sm" data-testid="mnav-dashboard">Dashboard</Link>
              <button onClick={async () => { await logout(); nav("/"); }} className="block text-sm text-zinc-400" data-testid="mnav-logout">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm" data-testid="mnav-login">Log in</Link>
              <Link to="/signup" className="block bg-volt text-black text-sm font-medium px-4 py-2 rounded-md w-fit" data-testid="mnav-signup">Start free</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
