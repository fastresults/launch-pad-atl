// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Image as ImageIcon, RotateCcw } from "lucide-react";
import { contrastRatio } from "@/lib/brand/palette-rules";
import { AssetImage } from "./AssetImage";

// Strip trailing ellipsis / punctuation left behind by older truncators so the
// full headline can be re-edited and re-rendered without a leftover "…".
function sanitizeHeadline(s: string | null | undefined): string {
  const raw = (s ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/\s+/g, " ")
    .replace(/(?:\.{3}|…)+\s*$/g, "")
    .replace(/[\s,;:\-–—]+$/g, "")
    .trim();
}


const QUICK_NOTES = [
  "Lighter background",
  "Stronger logo presence",
  "More whitespace",
  "Higher contrast",
  "Less saturated",
  "Different composition",
  "Make brand color unmistakable",
];

const DIRECTIONS = [
  { id: "editorial", label: "Editorial" },
  { id: "photographic", label: "Photographic" },
  { id: "geometric", label: "Geometric" },
  { id: "illustrative", label: "Illustrative" },
];

const INTENSITIES = [
  { id: "subtle", label: "Subtle", hint: "Restrained brand-color moment" },
  { id: "balanced", label: "Balanced", hint: "Anchoring brand splash (default)" },
  { id: "bold", label: "Bold", hint: "Brand color is the hero element" },
] as const;

const PLACEMENTS = [
  { id: "auto", label: "Auto (recommended)" },
  { id: "anchor_block", label: "Anchor block / quadrant" },
  { id: "sidebar_stripe", label: "Sidebar / folio stripe" },
  { id: "duotone_wash", label: "Duotone wash over subject" },
  { id: "focal_shape", label: "Fill the focal shape" },
  { id: "corner_mark", label: "Corner / folio mark" },
  { id: "framed_border", label: "Framed border" },
] as const;

const LOGO_SIZES = [
  { id: "sm", label: "Small", hint: "Discreet corner mark" },
  { id: "md", label: "Medium", hint: "Recommended (readable at a glance)" },
  { id: "lg", label: "Large", hint: "Hero logo — dominant lockup" },
] as const;

type SwatchRole = "surface" | "ink" | "signature" | "accent";
const SWATCH_ROLES: { key: SwatchRole; label: string; hint: string }[] = [
  { key: "surface",   label: "Surface",   hint: "Background" },
  { key: "ink",       label: "Ink",       hint: "Text & primary mark" },
  { key: "signature", label: "Signature", hint: "Brand color splash" },
  { key: "accent",    label: "Accent",    hint: "Supporting hue" },
];

function normalizeHex(v?: string | null): string | null {
  if (!v) return null;
  const m = String(v).trim().match(/^#?([0-9a-fA-F]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : null;
}

function SwatchButton({
  role, brandHex, displayHex, value, onChange,
}: {
  role: SwatchRole;
  brandHex: string | null;
  displayHex: string | null; // the hex that actually renders (e.g. displaySignature)
  value: string | null;      // the user override for this role, or null
  onChange: (hex: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hexText, setHexText] = useState<string>((value || displayHex || brandHex || "").toUpperCase());
  const [open, setOpen] = useState(false);
  const effective = value || displayHex || brandHex || "#000000";
  const edited = !!value && value.toUpperCase() !== (brandHex || "").toUpperCase();

  const commit = (raw: string) => {
    const n = normalizeHex(raw);
    if (n) {
      setHexText(n);
      onChange(n);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`${role} — click to change`}
        className={`relative flex items-center gap-1.5 rounded-md border px-1.5 py-1 transition ${
          open ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
        }`}
      >
        <span
          className="h-4 w-4 rounded-sm border border-border"
          style={{ background: effective }}
        />
        <span className="text-[10px] font-mono uppercase text-muted-foreground">
          {effective.replace("#", "")}
        </span>
        {edited && <span className="h-1.5 w-1.5 rounded-full bg-primary" title="edited" />}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-popover p-2 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] font-medium capitalize">{role}</div>
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => { onChange(null); setHexText((brandHex || "").toUpperCase()); }}
              title="Reset to brand kit value"
            >
              <RotateCcw className="mr-0.5 -mt-0.5 inline h-3 w-3" /> Reset
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="color"
              value={effective}
              onChange={(e) => commit(e.target.value)}
              className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
            />
            <input
              type="text"
              value={hexText}
              onChange={(e) => setHexText(e.target.value.toUpperCase())}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
              className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-[11px] uppercase"
              placeholder="#RRGGBB"
              maxLength={7}
            />
          </div>
          {brandHex && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Brand: <span className="font-mono">{brandHex}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RegenerateAssetDialog({
  open,
  onOpenChange,
  scope, // "single" | "all"
  targetLabel,
  thumbnailUrl,
  currentDirection,
  canvasPlan,
  initialIntensity = "balanced",
  mode = "regenerate",
  suggestedHeadline,
  currentHeadline,
  currentLogoSize,
  focusSection,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: "single" | "all";
  targetLabel: string;
  thumbnailUrl?: string | null;
  currentDirection: string;
  canvasPlan?: { surface?: string; ink?: string; accent?: string; signature?: string; displaySignature?: string } | null;
  initialIntensity?: "subtle" | "balanced" | "bold";
  mode?: "generate" | "regenerate";
  /** Suggested/auto headline shown to the user when they pick "Use suggested". */
  suggestedHeadline?: string | null;
  /** The headline that was actually used on the current asset (if any). */
  currentHeadline?: string | null;
  /** The logo size the current asset was rendered with, if any. */
  currentLogoSize?: "sm" | "md" | "lg" | null;
  /** When set, scroll+highlight the matching section and pre-focus its primary input. */
  focusSection?: "headline" | "palette" | "feedback" | "logo";
  onSubmit: (input: {
    feedback: string;
    directionOverride?: string;
    signatureIntensity?: "subtle" | "balanced" | "bold";
    signaturePlacement?: typeof PLACEMENTS[number]["id"];
    paletteOverride?: { surface?: string; ink?: string; accent?: string; signature?: string };
    headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string };
    logoSize?: "sm" | "md" | "lg";
  }) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [direction, setDirection] = useState<string>(currentDirection);
  const [intensity, setIntensity] = useState<"subtle" | "balanced" | "bold">(initialIntensity);
  const [placement, setPlacement] = useState<typeof PLACEMENTS[number]["id"]>("auto");
  const [logoSize, setLogoSize] = useState<"sm" | "md" | "lg">(currentLogoSize || "md");
  const [busy, setBusy] = useState(false);

  // Headline override: when opened via "Edit headline", default to Custom so the
  // user can type immediately. Otherwise, default to Custom only when there's an
  // existing headline to preserve/edit; else Auto.
  const initialHeadlineMode: "auto" | "custom" | "none" =
    focusSection === "headline"
      ? "custom"
      : currentHeadline && currentHeadline.trim()
      ? "custom"
      : "auto";
  const [headlineMode, setHeadlineMode] = useState<"auto" | "custom" | "none">(initialHeadlineMode);
  const [headlineText, setHeadlineText] = useState<string>(sanitizeHeadline(currentHeadline));
  const [headlineHighlight, setHeadlineHighlight] = useState(false);
  const headlineSectionRef = useRef<HTMLDivElement | null>(null);
  const headlineInputRef = useRef<HTMLInputElement | null>(null);
  const [logoHighlight, setLogoHighlight] = useState(false);
  const logoSectionRef = useRef<HTMLDivElement | null>(null);

  // Scroll + highlight + focus when opened targeting a specific section.
  useEffect(() => {
    if (!open) return;
    if (focusSection !== "headline" && focusSection !== "logo") return;
    // Wait for dialog mount animation.
    const t = window.setTimeout(() => {
      if (focusSection === "headline") {
        headlineSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        setHeadlineHighlight(true);
        const inp = headlineInputRef.current;
        if (inp) {
          inp.focus();
          try { inp.select(); } catch { /* noop */ }
        }
        window.setTimeout(() => setHeadlineHighlight(false), 1400);
      } else if (focusSection === "logo") {
        logoSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        setLogoHighlight(true);
        window.setTimeout(() => setLogoHighlight(false), 1400);
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, focusSection]);


  // Per-role override state — null means "use brand-kit value".
  const [ovr, setOvr] = useState<Record<SwatchRole, string | null>>({
    surface: null, ink: null, signature: null, accent: null,
  });

  const brand = {
    surface: normalizeHex(canvasPlan?.surface),
    ink: normalizeHex(canvasPlan?.ink),
    signature: normalizeHex(canvasPlan?.signature),
    accent: normalizeHex(canvasPlan?.accent),
  };
  const displaySig = normalizeHex(canvasPlan?.displaySignature) || brand.signature;
  // Accent is required for the art director prompt — always surface a value.
  // Fallback order: kit accent → signature → ink → surface → neutral.
  const accentFallback = brand.accent || displaySig || brand.signature || brand.ink || brand.surface || "#6B7280";

  const effective = {
    surface: ovr.surface || brand.surface,
    ink: ovr.ink || brand.ink,
    signature: ovr.signature || displaySig,
    accent: ovr.accent || accentFallback,
  };

  const contrast = useMemo(() => {
    if (!effective.surface || !effective.ink) return null;
    try { return contrastRatio(effective.ink, effective.surface); } catch { return null; }
  }, [effective.surface, effective.ink]);

  const addQuick = (note: string) => {
    setFeedback((prev) => (prev ? `${prev}\n• ${note}` : `• ${note}`));
  };

  const submit = async () => {
    setBusy(true);
    const paletteOverride = Object.fromEntries(
      Object.entries(ovr).filter(([, v]) => !!v),
    ) as Record<string, string>;
    const headlineOverride =
      headlineMode === "none"
        ? { mode: "none" as const }
        : headlineMode === "custom" && headlineText.trim()
        ? { mode: "custom" as const, text: sanitizeHeadline(headlineText).slice(0, 140) }
        : undefined; // auto = default, no override
    const payload = {
      feedback: feedback.trim(),
      directionOverride: direction !== currentDirection ? direction : undefined,
      signatureIntensity: intensity,
      signaturePlacement: placement,
      paletteOverride: Object.keys(paletteOverride).length ? paletteOverride : undefined,
      headlineOverride,
      logoSize,
    };
    // Fire-and-forget so the user can close the modal and let the task run in the background.
    Promise.resolve()
      .then(() => onSubmit(payload))
      .catch(() => { /* parent surfaces errors via toast */ })
      .finally(() => setBusy(false));
    setFeedback("");
    onOpenChange(false);
  };

  const submitLabel = mode === "generate" ? "Generate" : "Regenerate";

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {mode === "generate"
              ? `Generate ${targetLabel}`
              : scope === "all" ? "Regenerate all assets" : `Regenerate ${targetLabel}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "generate"
              ? "Fine-tune palette, direction, and brand-color intensity before we render this asset."
              : "Tell the art director what's off-brand. Your notes are passed verbatim to the next render."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1 min-h-0">

          {scope === "single" && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40 flex items-center justify-center">
                {thumbnailUrl ? (
                  <AssetImage src={thumbnailUrl} alt="current" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{targetLabel}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{currentDirection}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Clickable palette */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">Palette — click any swatch to change</div>
              {Object.values(ovr).some(Boolean) && (
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => setOvr({ surface: null, ink: null, signature: null, accent: null })}
                >
                  Reset all
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCH_ROLES.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
                  <SwatchButton
                    role={key}
                    brandHex={key === "accent" ? (brand.accent || accentFallback) : brand[key]}
                    displayHex={key === "signature" ? displaySig : (key === "accent" ? (brand.accent || accentFallback) : brand[key])}
                    value={ovr[key]}
                    onChange={(hex) => setOvr((p) => ({ ...p, [key]: hex }))}
                  />
                </div>
              ))}
            </div>
            {contrast !== null && (
              <div
                className={`text-[10px] ${
                  contrast >= 4.5 ? "text-status-success" : contrast >= 3 ? "text-status-warning" : "text-status-danger"
                }`}
              >
                Ink on surface: {contrast.toFixed(2)}:1{" "}
                {contrast >= 4.5 ? "· AA pass" : contrast >= 3 ? "· AA fail (large text only)" : "· illegible"}
              </div>
            )}
          </div>

          {/* Headline text override */}
          <div
            ref={headlineSectionRef}
            className={`rounded-lg border bg-muted/20 p-3 space-y-2 transition ${
              headlineHighlight ? "border-primary ring-2 ring-primary/60 shadow-sm" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">Headline text on image</div>
              <span className="text-[10px] text-muted-foreground">
                {headlineMode === "custom" ? `${headlineText.length}/140` : ""}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["auto", "custom", "none"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={busy}
                  onClick={() => setHeadlineMode(m)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                    headlineMode === m
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {m === "auto" ? "Use suggested" : m === "custom" ? "Custom text" : "No text"}
                </button>
              ))}
            </div>
            {headlineMode === "auto" && (
              <div className="text-[10px] text-muted-foreground">
                Will render:{" "}
                <span className="font-medium text-foreground">
                  "{sanitizeHeadline(suggestedHeadline || currentHeadline || "").slice(0, 140) || "(venture name)"}"
                </span>
              </div>
            )}
            {headlineMode === "custom" && (
              <input
                ref={headlineInputRef}
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value.slice(0, 140))}
                disabled={busy}
                placeholder="Exact words to render on the image"
                maxLength={140}
                className="h-9 w-full rounded border border-border bg-background px-2 text-sm"
              />
            )}
            {headlineMode === "none" && (
              <div className="text-[10px] text-muted-foreground">
                No headline, tagline, or lettering will be rendered. Logo still composites in.
              </div>
            )}
          </div>

          {/* Logo size on canvas */}
          <div
            ref={logoSectionRef}
            className={`rounded-md transition-colors ${logoHighlight ? "ring-2 ring-primary/60 bg-primary/5 p-2 -m-2" : ""}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-medium">Logo size on image</div>
              <div className="text-[10px] text-muted-foreground">
                Bigger = more brand recall
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LOGO_SIZES.map((opt) => {
                const active = logoSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLogoSize(opt.id)}
                    disabled={busy}
                    className={`rounded-md border px-2 py-1.5 text-left text-[11px] transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.hint}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              We reserve a clean, contrasting zone and composite your real logo in — never AI-drawn.
            </div>
          </div>





          {mode === "regenerate" && (
            <div>
              <label className="mb-1 block text-xs font-medium">What's off?</label>
              <Textarea
                rows={4}
                placeholder="e.g. background too dark, logo too small, less purple, more editorial feel"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value.slice(0, 600))}
                disabled={busy}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addQuick(n)}
                    disabled={busy}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                  >
                    + {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scope === "single" && (
            <div>
              <label className="mb-1 block text-xs font-medium">Style for this asset (optional)</label>
              <Select value={direction} onValueChange={setDirection} disabled={busy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <div className="text-xs font-medium">Brand signature color</div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">Intensity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {INTENSITIES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setIntensity(opt.id)}
                    className={`rounded-md border px-2 py-1.5 text-left transition ${
                      intensity === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    title={opt.hint}
                  >
                    <div className="text-[11px] font-medium">{opt.label}</div>
                    <div className="text-[9px] text-muted-foreground line-clamp-1">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">Placement</label>
              <Select value={placement} onValueChange={(v: any) => setPlacement(v)} disabled={busy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>


        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
