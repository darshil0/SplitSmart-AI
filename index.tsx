// src/index.tsx - SplitSmart AI Production Entry Point (v1.2.0)

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// ================================================
// PRODUCTION ERROR BOUNDARY
// ================================================
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: true; error?: string } {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SplitSmart Error Boundary]", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-slate-200/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3 text-center">Oops!</h1>
            <p className="text-slate-600 mb-6 text-center leading-relaxed">
              Something unexpected happened while splitting your bill.
            </p>
            <div className="space-y-3 mb-8">
              <button
                onClick={this.handleReload}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔄 Reload SplitSmart
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                🏠 New Receipt
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Error: {this.state.error || "Unknown"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ================================================
// PRODUCTION INITIALIZATION
// ================================================
const initApp = () => {
  // Root element validation
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("❌ Root element '#root' not found in index.html");
  }

  // Create production root
  const root = createRoot(rootElement);

  // Render with full production safeguards
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  );

  // Performance metrics
  if (import.meta.env.PROD && "performance" in window) {
    console.log(`🚀 SplitSmart v1.2.0 loaded in ${performance.now().toFixed(0)}ms`);
  }
};

// ================================================
// DEVELOPMENT HOT RELOAD
// ================================================
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept("./App", () => {
    console.log("🔄 HMR: App component updated");
    const rootElement = document.getElementById("root");
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <StrictMode>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </StrictMode>
      );
    }
  });
}

// ================================================
// PWA SERVICE WORKER (PRODUCTION ONLY)
// ================================================
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("📱 PWA Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.warn("⚠️ Service Worker registration failed:", error);
      });
  });
}

// ================================================
// START APPLICATION
// ================================================
initApp();

// Export for testing
if (import.meta.env.DEV) {
  (window as any).SplitSmart = { initApp };
}
