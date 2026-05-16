import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail } from "./api";
import { DEMO_USER } from "./mockData";

const AuthCtx = createContext(null);
const DEMO_KEY = "hookify_demo_user";

function readDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
function writeDemoUser(user) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(user)); } catch (_) {}
}
function clearDemoUser() {
  try { localStorage.removeItem(DEMO_KEY); } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const refresh = useCallback(async () => {
    // Try the real backend first.
    try {
      const { data } = await api.get("/auth/me", { timeout: 4000 });
      setUser(data);
      setDemoMode(false);
    } catch (e) {
      // If a demo session was previously created, restore it (preview/demo mode).
      const stored = readDemoUser();
      if (stored) {
        setUser(stored);
        setDemoMode(true);
      } else {
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Login: try backend, fall back to local demo session on failure.
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password }, { timeout: 5000 });
      setUser(data);
      setDemoMode(false);
      clearDemoUser();
      return data;
    } catch (err) {
      const status = err?.response?.status;
      // Bad credentials should still surface to the user — don't silently log them in.
      if (status === 401 || status === 400) {
        throw err;
      }
      // Backend unreachable / network error — create a local demo session
      const demo = { ...DEMO_USER, email: email || DEMO_USER.email, name: deriveName(email) };
      writeDemoUser(demo);
      setUser(demo);
      setDemoMode(true);
      return demo;
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await api.post("/auth/register", { email, password, name }, { timeout: 5000 });
      setUser(data);
      setDemoMode(false);
      clearDemoUser();
      return data;
    } catch (err) {
      const status = err?.response?.status;
      // Duplicate email or validation: surface to user.
      if (status === 400 || status === 422) {
        throw err;
      }
      const demo = { ...DEMO_USER, email: email || DEMO_USER.email, name: name || deriveName(email) };
      writeDemoUser(demo);
      setUser(demo);
      setDemoMode(true);
      return demo;
    }
  };

  // Google: always succeed (preview demo). Try real backend, fall back to local demo.
  const googleAuth = async () => {
    const profile = {
      email: `creator+${Math.floor(Math.random() * 9000)}@gmail.com`,
      name: "Google Creator",
      avatar: null,
    };
    try {
      const { data } = await api.post("/auth/google", profile, { timeout: 5000 });
      setUser(data);
      setDemoMode(false);
      clearDemoUser();
      return data;
    } catch (_) {
      const demo = { ...DEMO_USER, email: profile.email, name: profile.name };
      writeDemoUser(demo);
      setUser(demo);
      setDemoMode(true);
      return demo;
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout", null, { timeout: 4000 }); } catch (_) {}
    clearDemoUser();
    setDemoMode(false);
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, demoMode, login, register, googleAuth, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

function deriveName(email) {
  if (!email) return "Creator";
  const base = email.split("@")[0].replace(/[._-]+/g, " ");
  return base.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Creator";
}

export const useAuth = () => useContext(AuthCtx);
export { formatApiErrorDetail };
