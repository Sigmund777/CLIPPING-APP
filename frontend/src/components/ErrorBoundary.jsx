import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log but never show the red dev overlay
    // eslint-disable-next-line no-console
    console.warn("[ErrorBoundary] caught:", error?.message || error, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-ink-950 text-white flex items-center justify-center p-6" data-testid="error-boundary">
        <div className="max-w-md w-full bg-ink-900 border border-white/5 rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-md bg-volt/10 border border-volt/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-5 h-5 text-volt" />
          </div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Something hiccuped.</h1>
          <p className="mt-2 text-sm text-zinc-400">Don't worry — your clips are safe. Reload the studio and we'll pick up where you left off.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={this.reset} className="bg-volt text-black font-medium px-5 py-2.5 rounded-md text-sm hover:bg-volt-300 transition-colors" data-testid="error-retry">
              Try again
            </button>
            <Link to="/" className="border border-white/10 text-white px-5 py-2.5 rounded-md text-sm hover:bg-white/5 transition-colors" data-testid="error-home">
              Back to landing
            </Link>
          </div>
          {this.state.error?.message && (
            <div className="mt-6 text-[11px] text-zinc-600 font-mono break-all">{String(this.state.error.message)}</div>
          )}
        </div>
      </div>
    );
  }
}
