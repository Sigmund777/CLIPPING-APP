import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "../lib/auth";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { register, googleAuth } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Account created — let's forge some clips");
      nav("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      await googleAuth();
      toast.success("Account created with Google");
      nav("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950 text-white" data-testid="signup-page">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <Link to="/" className="relative flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-md bg-volt flex items-center justify-center"><Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} /></div>
          <span className="font-heading font-semibold text-lg">ClipForge<span className="text-volt">.</span></span>
        </Link>
        <div className="relative max-w-md space-y-6">
          <h2 className="font-heading text-2xl font-medium leading-snug">Start free. 5 clips on us.</h2>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex items-center gap-2"><span className="text-volt">→</span> No credit card required</li>
            <li className="flex items-center gap-2"><span className="text-volt">→</span> Cancel anytime</li>
            <li className="flex items-center gap-2"><span className="text-volt">→</span> Your content stays private. Always.</li>
          </ul>
        </div>
        <div className="relative text-xs text-zinc-600 font-mono">Trusted by 18,400+ creators</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-medium tracking-tight">Create your account.</h1>
            <p className="mt-2 text-sm text-zinc-400">Forge your first clip in under 5 minutes.</p>
          </div>

          <button type="button" onClick={google} className="w-full border border-white/10 rounded-md py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2" data-testid="signup-google">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v2.92h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.46C16.85 3.86 14.6 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.65-3.66 8.65-8.8 0-.6-.07-1.06-.3-1.1z"/></svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <div className="flex-1 h-px bg-white/5" /> OR <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-ink-900 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors" data-testid="signup-name" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-ink-900 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors" data-testid="signup-email" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-ink-900 border border-white/10 rounded-md px-3 py-2.5 pr-10 text-sm focus:border-volt focus:outline-none transition-colors" data-testid="signup-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[11px] text-zinc-600 mt-1.5">Min 6 characters</div>
            </div>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2" data-testid="signup-error">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-volt text-black font-medium py-3 rounded-md hover:bg-volt-300 transition-colors disabled:opacity-50" data-testid="signup-submit">
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already a creator? <Link to="/login" className="text-volt hover:underline" data-testid="link-login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
