import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

/**
 * Keeps a rendering failure inside the mind map canvas from taking down the
 * whole showcase page.
 */
export class MindMapBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ShareMindMap] render failed", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card/40 p-6">
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            The mind map couldn&apos;t be drawn in this browser. Use the contents list or ask the
            second brain instead.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MindMapBoundary;
