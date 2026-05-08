import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : "The app crashed." };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.message) {
      return (
        <main className="grid min-h-screen place-items-center bg-paper p-6 text-ink">
          <section className="w-[min(560px,100%)] rounded-md bg-white p-6 shadow-panel">
            <h1 className="text-2xl font-black">Instant Cast stopped</h1>
            <p className="mt-3 text-sm leading-6 text-ink/75">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-md bg-sea px-4 py-2 text-sm font-bold text-white"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
