import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

/**
 * Renders a 1920x1080 slide and scales it to fit its parent container
 * via CSS transform. Parent must be position:relative and overflow:hidden.
 */
export function ScaledSlide({ children, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const update = () => {
      const { width, height } = parent.getBoundingClientRect();
      const s = Math.min(width / 1920, height / 1080);
      setScale(s > 0 ? s : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`slide-content ${className ?? ""}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -960,
        marginTop: -540,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
}
