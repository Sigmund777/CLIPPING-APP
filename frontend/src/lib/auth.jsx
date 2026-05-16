import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (_) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };
  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    setUser(data);
    return data;
  };
  const googleAuth = async () => {
    // Simulated Google sign-in: in v1 we mock the profile returned by Google
    const fakeProfile = {
      email: `creator+${Math.floor(Math.random() * 9000)}@gmail.com`,
      name: "Google Creator",
      avatar: null,
    };
    const { data } = await api.post("/auth/google", fakeProfile);
    setUser(data);
    return data;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, googleAuth, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export { formatApiErrorDetail };
