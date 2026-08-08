import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; resetKey: string; onAsk: () => void };
type State = { failed: boolean; attempts: number };

/**
 * Keeps a rendering failure inside the mind map canvas from taking down the
 * whole showcase page.
 */
export class MindMapBoundary extends Component<Props, State> {
  state: State = { failed: false, attempts: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, attempts: 0 });
    }
  }

  componentDidCatch(error: unknown) {
    console.warn("[ShareMindMap] render failed", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/40 p-6 text-center">
          <p className="max-w-xs text-sm text-muted-foreground">
            The mind map couldn&apos;t be drawn. You can retry or ask the venture directly.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => this.setState((state) => ({ failed: false, attempts: state.attempts + 1 }))}
            >
              Retry map
            </Button>
            <Button type="button" size="sm" onClick={this.props.onAsk}>Ask this venture</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MindMapBoundary;
