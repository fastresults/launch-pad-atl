import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Admin route crashed:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              The admin page failed to render. Try again, or reload the page.
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-background/60 p-3 text-xs text-rose-300">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <Button size="sm" onClick={this.reset}>Try again</Button>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
