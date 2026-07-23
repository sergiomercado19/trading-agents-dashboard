import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 mx-4 rounded-lg" style={{ border: "1px solid var(--error, #ef4444)", background: "var(--bg-secondary, #141414)" }}>
          <div className="font-bold text-[15px] mb-2" style={{ color: "var(--error, #ef4444)" }}>
            Something went wrong
          </div>
          <div className="text-[13px] mb-3" style={{ color: "var(--text-muted, #888)" }}>
            {this.state.error?.message || "Unknown error"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="py-1.5 px-4 border-none rounded text-white cursor-pointer text-xs"
            style={{ background: "var(--accent, #3b82f6)" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
