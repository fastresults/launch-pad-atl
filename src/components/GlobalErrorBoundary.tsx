import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global React error boundary. Renders a minimal fallback and logs the error
 * so a single component crash cannot white-screen the entire app.
 * Sentry/PostHog hooks land here in Phase 4.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[GlobalErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Something went sideways.</h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error. Refresh the page to try again — if it keeps happening, email hello@startuplabs.online.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded-full bg-hero-gradient px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}
