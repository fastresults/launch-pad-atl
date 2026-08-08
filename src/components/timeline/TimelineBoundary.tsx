import { Component, type ReactNode } from "react";

/**
 * A render failure in the timeline must never take a page down. Degrades to a
 * plain phase list, which is still useful.
 */
export class TimelineBoundary extends Component<
  { children: ReactNode; resetKey?: string; fallbackTitle?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[VentureTimeline] render failed", error);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0b0c10] p-6 text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Launch cadence</p>
        <h2 className="mt-1 font-serif text-[22px]">Idea → Validate → Foundation → Offer → Pre-sell → Launch → Prove → Cash flow</h2>
        <p className="mt-2 text-[13px] text-white/55">
          The interactive timeline couldn't be drawn in this browser. The sequence above is the order of work.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ failed: false })}
          className="mt-4 rounded-full border border-white/20 px-4 py-1.5 text-[13px] text-white/80 hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }
}
