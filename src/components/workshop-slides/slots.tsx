import { createContext, useContext, type ReactNode } from "react";

/**
 * Map of slot key -> override value.
 * Slot key format: `${deckSlug}::${slideId}.${field}` (matches DB row key).
 */
export type SlotValue = {
  text?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
};
export type SlotMap = Record<string, SlotValue>;

type Ctx = {
  deckSlug: string;
  overrides: SlotMap;
  /** Optional override notifier — admin editor uses this to capture defaults. */
  onSlotMount?: (slotKey: string, defaults: SlotValue & { kind: "text" | "image" }) => void;
};

const DeckOverridesContext = createContext<Ctx | null>(null);

export function DeckOverridesProvider({
  deckSlug,
  overrides,
  onSlotMount,
  children,
}: {
  deckSlug: string;
  overrides: SlotMap;
  onSlotMount?: Ctx["onSlotMount"];
  children: ReactNode;
}) {
  return (
    <DeckOverridesContext.Provider value={{ deckSlug, overrides, onSlotMount }}>
      {children}
    </DeckOverridesContext.Provider>
  );
}

function useCtx() {
  return useContext(DeckOverridesContext);
}

export function slotKey(deckSlug: string, slideId: string, field: string) {
  return `${deckSlug}::${slideId}.${field}`;
}

/**
 * Render text that may be overridden by admin. Pass the authored default as
 * `defaultValue`. If an override exists for this slot, that string is rendered
 * instead.
 */
export function SlotText({
  slideId,
  field,
  defaultValue,
  as: As = "span",
  className,
}: {
  slideId: string;
  field: string;
  defaultValue: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  const ctx = useCtx();
  if (!ctx) {
    return <As className={className}>{defaultValue}</As>;
  }
  const key = slotKey(ctx.deckSlug, slideId, field);
  const override = ctx.overrides[key]?.text;
  ctx.onSlotMount?.(key, { kind: "text", text: defaultValue });
  const value = override ?? defaultValue;
  return <As className={className}>{value}</As>;
}

/**
 * Render an image that may be overridden by admin. Slot id is required, but a
 * default image is optional — if neither default nor override exists, the slot
 * stays empty (admin can fill it later). When no override exists and no
 * default is provided, nothing renders.
 */
export function SlotImage({
  slideId,
  field,
  defaultSrc,
  defaultAlt,
  className,
  style,
}: {
  slideId: string;
  field: string;
  defaultSrc?: string;
  defaultAlt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ctx = useCtx();
  if (ctx) {
    const key = slotKey(ctx.deckSlug, slideId, field);
    ctx.onSlotMount?.(key, { kind: "image", imageUrl: defaultSrc ?? null, imageAlt: defaultAlt ?? null });
    const ov = ctx.overrides[key];
    const src = ov?.imageUrl ?? defaultSrc;
    const alt = ov?.imageAlt ?? defaultAlt ?? "";
    if (!src) return null;
    return <img src={src} alt={alt} className={className} style={style} />;
  }
  if (!defaultSrc) return null;
  return <img src={defaultSrc} alt={defaultAlt ?? ""} className={className} style={style} />;
}
