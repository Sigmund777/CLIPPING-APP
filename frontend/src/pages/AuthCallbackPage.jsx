import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallbackPage() {
  const nav = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const finish = async () => {
      try {
        // detectSessionInUrl=true on the supabase client already parses ?code/#access_token.
        // We just wait briefly, then look up the session.
        await new Promise((r) => setTimeout(r, 300));
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (data?.session) nav("/dashboard", { replace: true });
        else nav("/login", { replace: true });
      } catch (_) {
        nav("/login", { replace: true });
      }
    };
    finish();
    return () => { isMounted = false; };
  }, [nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 text-zinc-300" data-testid="auth-callback">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-volt/30 border-t-volt animate-spin" />
        <div className="text-sm">Finishing sign-in…</div>
      </div>
    </div>
  );
}
