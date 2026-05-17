import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, useAuth } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import ClipEditorPage from "./pages/ClipEditorPage";
import UploadPage from "./pages/UploadPage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import WorkspacePage from "./pages/WorkspacePage";
import BetaRequestsPage from "./pages/BetaRequestsPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-950 text-zinc-500" data-testid="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HideDevOverlay() {
  useEffect(() => {
    // Suppress the CRA / webpack-dev-server runtime error overlay in preview mode.
    const style = document.createElement("style");
    style.setAttribute("data-suppress-overlay", "true");
    style.textContent = `
      #webpack-dev-server-client-overlay,
      iframe[name="webpack-dev-server-client-overlay"],
      iframe[id^="webpack-dev-server-client-overlay"] { display: none !important; visibility: hidden !important; }
    `;
    document.head.appendChild(style);

    // Swallow unhandled promise rejections so they don't trigger an overlay.
    const onRejection = (e) => {
      // eslint-disable-next-line no-console
      console.warn("[unhandledrejection suppressed]", e?.reason?.message || e?.reason);
      e.preventDefault?.();
    };
    const onError = (e) => {
      // eslint-disable-next-line no-console
      console.warn("[window error suppressed]", e?.message);
      // Don't preventDefault here — let ErrorBoundary handle React errors.
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
      style.remove();
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <HideDevOverlay />
          <Toaster theme="dark" position="bottom-right" toastOptions={{ className: "font-body" }} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
            <Route path="/upload" element={<Protected><UploadPage /></Protected>} />
            <Route path="/templates" element={<Protected><TemplatesPage /></Protected>} />
            <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
            <Route path="/workspace" element={<Protected><WorkspacePage /></Protected>} />
            <Route path="/beta-requests" element={<Protected><BetaRequestsPage /></Protected>} />
            <Route path="/editor" element={<Protected><ClipEditorPage /></Protected>} />
            <Route path="/clip-editor" element={<Protected><ClipEditorPage /></Protected>} />
            <Route path="/clip/:clipId" element={<Protected><ClipEditorPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
