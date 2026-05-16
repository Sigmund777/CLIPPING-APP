import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Twitter, Youtube, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-950 mt-32" data-testid="footer">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid md:grid-cols-5 gap-12">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-volt flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold text-lg">ClipForge<span className="text-volt">.</span></span>
          </Link>
          <p className="mt-5 text-sm text-zinc-500 max-w-sm leading-relaxed">
            The AI clipping studio for serious creators. Turn long-form podcasts, streams and uploads into scroll-stopping shorts in minutes.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-volt hover:border-volt/40 transition-colors" data-testid="footer-twitter"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-volt hover:border-volt/40 transition-colors" data-testid="footer-youtube"><Youtube className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-volt hover:border-volt/40 transition-colors" data-testid="footer-github"><Github className="w-4 h-4" /></a>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Product</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="/#features" className="hover:text-white">Features</a></li>
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><a href="/#how" className="hover:text-white">How it works</a></li>
            <li><a href="#" className="hover:text-white">Changelog</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Company</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Press kit</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Legal</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Cookies</a></li>
            <li><a href="#" className="hover:text-white">DPA</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div>© 2026 ClipForge AI, Inc. All rights reserved.</div>
          <div>Made for creators who hate editing.</div>
        </div>
      </div>
    </footer>
  );
}
