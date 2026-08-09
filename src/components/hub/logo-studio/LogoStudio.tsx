import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check, ImagePlus, Loader2, PenLine, RotateCcw, Sparkles, Upload, Wand2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { invokeEdge } from "@/lib/edge-invoke";

/**
 * Logo Studio — a directed brief, not an interview.
 *
 * The founder describes the mark they want in their own words, shows the work
 * they admire, and sets a few dials. The art director reads that alongside the
 * brand guide and the Second Brain, commits to one creative direction, then
 * draws three marks that share a single construction law.
 */

type Mark = {
  id: string;
  concept_id: string;
  title: string;
  idea: string;
  second_read: string;
  reads_as: string;
  brief: string;
  change_note?: string;
  url: string | null;
  provider: string;
  jury?: { pass: boolean; note: string; scores: Record<string, number> } | null;
};

type Round = { index: number; label: string; marks: Mark[]; error: string | null };

type Concept = {
  id: string;
  title: string;
  idea: string;
  second_read: string;
  reads_as: string;
  logo_type: string;
};

type Direction = {
  headline: string;
  core_idea: string;
  attributes: string[];
  metaphor: string;
  subject_presence: string;
  colour_roles: { dominant: string; secondary: string; accent: string };
  avoid: string[];
  set_law: string;
  rationale: string;
  concepts: Concept[];
};

type Reference = { url: string; path?: string; reason: string; label?: string };

type Session = {
  id: string;
  status: "intake" | "direction" | "concepts" | "approved" | "committed";
  brief: { direction?: Direction; intake?: any } | null;
  steps: Round[];
  inspiration: Reference[];
  approved_rough: Mark | null;
  vector_svg: string | null;
  traced: boolean | null;
  last_error: string | null;
  brand?: { companyName: string; headingFont: string | null; primary: string | null; palette?: string[] } | null;
};

const MARK_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "open", label: "You decide", hint: "Let the director choose" },
  { value: "symbol", label: "Symbol", hint: "A mark that stands alone" },
  { value: "combination", label: "Symbol + name", hint: "Mark beside the name" },
  { value: "lettermark", label: "Lettermark", hint: "Built from initials" },
  { value: "wordmark", label: "Wordmark", hint: "The name, beautifully set" },
];

const DIALS: { key: string; label: string; low: string; high: string }[] = [
  { key: "abstraction", label: "Abstraction", low: "Literal", high: "Abstract" },
  { key: "weight", label: "Weight", low: "Light", high: "Heavy" },
  { key: "geometry", label: "Construction", low: "Geometric", high: "Organic" },
  { key: "warmth", label: "Temperature", low: "Cool", high: "Warm" },
  { key: "era", label: "Era", low: "Classic", high: "Contemporary" },
];

const REASONS = ["shape", "colour", "typography", "feeling"];

async function studio(payload: Record<string, unknown>): Promise<any> {
  const { data, error } = await invokeEdge("venture-logo-studio", { body: payload });
  if (error) throw new Error((data as any)?.error || error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export default function LogoStudio({
  snapshotId,
  onCommitted,
}: {
  snapshotId: string;
  onCommitted?: (asset: any) => void;
}) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);

  const [description, setDescription] = useState("");
  const [markType, setMarkType] = useState("open");
  const [dials, setDials] = useState<Record<string, number>>({
    abstraction: 3, weight: 3, geometry: 3, warmth: 3, era: 3,
  });
  const [avoid, setAvoid] = useState<string[]>([]);
  const [avoidDraft, setAvoidDraft] = useState("");
  const [refReason, setRefReason] = useState("shape");
  const [dragging, setDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0);

  const [directionNote, setDirectionNote] = useState("");
  const [refineFor, setRefineFor] = useState<Mark | null>(null);
  const [refineNote, setRefineNote] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLInputElement>(null);

  const existing = useQuery({
    queryKey: ["logoStudio", snapshotId],
    queryFn: () => studio({ action: "get", snapshotId }),
  });

  useEffect(() => {
    if (existing.data?.session) {
      const s = existing.data.session as Session;
      setSession(s);
      const intake = s.brief?.intake;
      if (intake) {
        setDescription((prev) => prev || intake.description || "");
        if (intake.markType) setMarkType(intake.markType);
        if (intake.dials && Object.keys(intake.dials).length) setDials((d) => ({ ...d, ...intake.dials }));
        if (Array.isArray(intake.avoid) && intake.avoid.length) setAvoid(intake.avoid);
      }
    }
  }, [existing.data]);

  const land = (data: any) => { if (data?.session) setSession(data.session); };

  // Sessions written by the previous interview pipeline are still in the table.
  // Only a direction from the current pipeline is renderable; anything older
  // drops the founder back to the describe pane instead of crashing.
  const rawDirection = session?.brief?.direction as Direction | undefined;
  const direction: Direction | null =
    rawDirection && rawDirection.colour_roles && Array.isArray(rawDirection.concepts) ? rawDirection : null;

  const rounds: Round[] = useMemo(
    () =>
      (Array.isArray(session?.steps) ? session!.steps : [])
        .map((r: any, i: number) => ({
          index: typeof r?.index === "number" ? r.index : i,
          label: r?.label ?? "Marks",
          marks: Array.isArray(r?.marks) ? r.marks : [],
          error: r?.error ?? null,
        }))
        .filter((r) => r.marks.length > 0),
    [session],
  );
  const latest = rounds[rounds.length - 1] ?? null;
  const earlier = useMemo(() => rounds.slice(0, -1).flatMap((r) => r.marks ?? []), [rounds]);
  const references = session?.inspiration ?? [];

  const start = useMutation({
    mutationFn: () => studio({ action: "start", snapshotId }),
    onSuccess: land,
    onError: (e: any) => toast.error(e.message),
  });

  const uploadReference = useMutation({
    mutationFn: async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of buf) binary += String.fromCharCode(byte);
      return studio({
        action: "upload_reference",
        snapshotId,
        sessionId: session?.id,
        data: btoa(binary),
        mime: file.type,
        filename: file.name,
        reason: refReason,
      });
    },
    onSuccess: (data) => { land(data); toast.success("Inspiration added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeReference = useMutation({
    mutationFn: (path: string) => studio({ action: "remove_reference", snapshotId, sessionId: session?.id, path }),
    onSuccess: land,
    onError: (e: any) => toast.error(e.message),
  });

  const addFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const room = Math.max(0, 5 - references.length);
    if (room === 0) { toast.error("You can keep up to 5 inspiration images"); return; }
    const batch = files.slice(0, room);
    if (files.length > room) toast.message(`Only ${room} more image${room === 1 ? "" : "s"} fit — extras skipped`);
    setUploadQueue(batch.length);
    for (const file of batch) {
      try {
        await uploadReference.mutateAsync(file);
      } catch {
        /* toast handled in mutation */
      } finally {
        setUploadQueue((n) => Math.max(0, n - 1));
      }
    }
    setUploadQueue(0);
  };



  const getDirection = useMutation({
    mutationFn: () =>
      studio({
        action: "direction",
        snapshotId,
        sessionId: session?.id,
        intake: { description, markType, dials, avoid },
      }),
    onSuccess: (data) => { land(data); toast.success("Creative direction ready"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reviseDirection = useMutation({
    mutationFn: (instruction: string) =>
      studio({ action: "revise_direction", snapshotId, sessionId: session?.id, instruction }),
    onSuccess: (data) => { land(data); setDirectionNote(""); toast.success("Direction rewritten"); },
    onError: (e: any) => toast.error(e.message),
  });

  const drawConcepts = useMutation({
    mutationFn: () => studio({ action: "concepts", snapshotId, sessionId: session?.id }),
    onSuccess: (data) => { land(data); toast.success("Three marks drawn"); },
    onError: (e: any) => toast.error(e.message),
  });

  const refine = useMutation({
    mutationFn: (vars: { markId: string; instruction: string }) =>
      studio({ action: "refine", snapshotId, sessionId: session?.id, ...vars }),
    onSuccess: (data) => { land(data); setRefineFor(null); setRefineNote(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (markId: string) => studio({ action: "approve", snapshotId, sessionId: session?.id, markId }),
    onSuccess: (data) => {
      land(data);
      toast[data?.traced ? "success" : "warning"](
        data?.traced ? "Traced to clean vectors in your brand colours" : data?.note ?? "Saved, but tracing fell back",
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: () => studio({ action: "commit", snapshotId, sessionId: session?.id }),
    onSuccess: (data) => {
      land(data);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      onCommitted?.(data?.asset);
      toast.success("Logo family saved to your Live Brand");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadOwn = useMutation({
    mutationFn: async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of buf) binary += String.fromCharCode(byte);
      return studio({ action: "upload_own", snapshotId, sessionId: session?.id, mime: file.type, data: btoa(binary) });
    },
    onSuccess: (data) => { land(data); toast.success("Your mark is vectored and ready to save"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => studio({ action: "reset", snapshotId, sessionId: session?.id }),
    onSuccess: () => { setSession(null); toast.success("Studio cleared"); },
    onError: (e: any) => toast.error(e.message),
  });

  const busy =
    start.isPending || getDirection.isPending || reviseDirection.isPending || drawConcepts.isPending ||
    refine.isPending || approve.isPending || commit.isPending || uploadOwn.isPending;

  /* ------------------------------ loading / empty ------------------------------ */

  if (existing.isLoading) {
    return (
      <section className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening the studio…
      </section>
    );
  }

  if (!session) {
    return (
      <section className="space-y-4 rounded-xl border border-white/10 bg-background/40 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Logo Studio</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Describe the mark you want in your own words, show the work you admire, and set a few dials. Your art
            director reads that alongside your brand guide and Second Brain, commits to one creative direction, then
            draws three marks that share a single construction law. Approve one and it's vectored on the spot, in
            your colours.
          </p>
        </div>
        <Button onClick={() => start.mutate()} disabled={start.isPending} size="sm">
          {start.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
          Open the studio
        </Button>
      </section>
    );
  }

  /* ------------------------------ describe ------------------------------ */

  const describePane = (
    <section className="space-y-6 rounded-xl border border-white/10 bg-background/40 p-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Describe the mark you want</h3>
        <p className="text-xs text-muted-foreground">
          Nothing here is required — but anything you write outranks the director's own taste.
        </p>
      </div>

      <Field label="In your words">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="What should someone feel when they see it? Is there an object, a place, a gesture that belongs in it? Anything you've pictured already?"
          className="text-sm"
        />
      </Field>

      <Field label="Mark type">
        <div className="flex flex-wrap gap-2">
          {MARK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMarkType(t.value)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                markType === t.value
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/25"
              }`}
            >
              <span className="block font-medium">{t.label}</span>
              <span className="block text-[10px] opacity-70">{t.hint}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Direction dials">
        <div className="grid gap-4 sm:grid-cols-2">
          {DIALS.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{d.low}</span>
                <span className="font-medium text-foreground">{d.label}</span>
                <span>{d.high}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={dials[d.key] ?? 3}
                onChange={(e) => setDials((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>
      </Field>

      <Field label="Never do this">
        <div className="flex flex-wrap gap-2">
          {avoid.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px]">
              {a}
              <button type="button" onClick={() => setAvoid((prev) => prev.filter((x) => x !== a))}>
                <X className="h-3 w-3 opacity-60" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={avoidDraft}
            onChange={(e) => setAvoidDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && avoidDraft.trim()) {
                e.preventDefault();
                setAvoid((prev) => Array.from(new Set([...prev, avoidDraft.trim()])).slice(0, 12));
                setAvoidDraft("");
              }
            }}
            placeholder="e.g. no coffee cups, nothing circular, no green"
            className="h-9 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!avoidDraft.trim()) return;
              setAvoid((prev) => Array.from(new Set([...prev, avoidDraft.trim()])).slice(0, 12));
              setAvoidDraft("");
            }}
          >
            Add
          </Button>
        </div>
      </Field>

      <Field label="Inspiration (up to 5)">
        <div className="flex flex-wrap gap-2">
          {references.map((r) => (
            <div key={r.path ?? r.url} className="relative">
              <img src={r.url} alt={r.label ?? "Inspiration"} className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
              <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 px-1 py-0.5 text-center text-[9px] uppercase tracking-wide text-white">
                {r.reason}
              </span>
              <button
                type="button"
                onClick={() => r.path && removeReference.mutate(r.path)}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {references.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadReference.isPending}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-[10px] text-muted-foreground hover:border-white/40"
            >
              {uploadReference.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ImagePlus className="h-4 w-4" />}
              Add
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>Added for its</span>
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRefReason(r)}
              className={`rounded-full border px-2 py-0.5 ${
                refReason === r ? "border-primary/60 bg-primary/10 text-foreground" : "border-white/10"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadReference.mutate(file);
            e.currentTarget.value = "";
          }}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button onClick={() => getDirection.mutate()} disabled={busy} size="sm">
          {getDirection.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {getDirection.isPending ? "Reading your brand…" : direction ? "Rebuild the direction" : "Get the creative direction"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => ownRef.current?.click()} disabled={busy}>
          <Upload className="mr-1 h-4 w-4" /> I already have a logo
        </Button>
        <input
          ref={ownRef}
          type="file"
          accept="image/*,.svg"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadOwn.mutate(file);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </section>
  );

  /* ------------------------------ direction ------------------------------ */

  const directionPane = direction && (
    <section className="space-y-5 rounded-xl border border-white/10 bg-background/40 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{direction.headline}</h3>
        <div className="flex gap-1.5">
          {[direction.colour_roles.dominant, direction.colour_roles.secondary, direction.colour_roles.accent]
            .filter(Boolean)
            .map((hex, i) => (
              <span
                key={`${hex}-${i}`}
                title={["dominant", "secondary", "accent"][i]}
                className="h-5 w-5 rounded-full border border-white/20"
                style={{ background: hex }}
              />
            ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{direction.rationale}</p>

      <dl className="grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Core idea</dt><dd>{direction.core_idea}</dd></div>
        <div><dt className="text-muted-foreground">Metaphor</dt><dd>{direction.metaphor}</dd></div>
        <div><dt className="text-muted-foreground">Who appears in it</dt><dd>{direction.subject_presence}</dd></div>
        <div><dt className="text-muted-foreground">Set law</dt><dd>{direction.set_law}</dd></div>
      </dl>

      {direction.attributes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {direction.attributes.map((a) => (
            <span key={a} className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px]">{a}</span>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {direction.concepts.map((c) => (
          <div key={c.id} className="space-y-1 rounded-lg border border-white/10 p-3">
            <p className="text-xs font-semibold">{c.title}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{c.idea}</p>
            <p className="text-[11px] italic text-muted-foreground/80">Second read — {c.second_read}</p>
          </div>
        ))}
      </div>

      {direction.avoid?.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Never: {direction.avoid.join(" · ")}</p>
      )}

      <div className="space-y-2 border-t border-white/10 pt-4">
        <Textarea
          value={directionNote}
          onChange={(e) => setDirectionNote(e.target.value)}
          rows={2}
          placeholder="Change the direction — anything you type here becomes law."
          className="text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => drawConcepts.mutate()} disabled={busy} size="sm">
            {drawConcepts.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
            {drawConcepts.isPending ? "Drawing three marks…" : "Draw the three marks"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !directionNote.trim()}
            onClick={() => reviseDirection.mutate(directionNote.trim())}
          >
            {reviseDirection.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <PenLine className="mr-1 h-4 w-4" />}
            Revise the direction
          </Button>
        </div>
      </div>
    </section>
  );

  /* ------------------------------ marks ------------------------------ */

  const markCard = (m: Mark, compact = false) => (
    <div key={m.id} className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-3">
      {m.url
        ? <img src={m.url} alt={m.title} className="aspect-square w-full rounded-lg bg-white object-contain" />
        : <div className="aspect-square w-full rounded-lg bg-white/5" />}
      <div className="space-y-1">
        <p className="text-xs font-semibold">{m.title}</p>
        {!compact && <p className="text-[11px] leading-relaxed text-muted-foreground">{m.idea}</p>}
        {!compact && m.second_read && (
          <p className="text-[11px] italic text-muted-foreground/80">Second read — {m.second_read}</p>
        )}
        {m.change_note && <p className="text-[11px] text-muted-foreground">Changed: {m.change_note}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" disabled={busy} onClick={() => approve.mutate(m.id)}>
          <Check className="mr-1 h-3.5 w-3.5" /> Use this
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => { setRefineFor(m); setRefineNote(""); }}>
          <PenLine className="mr-1 h-3.5 w-3.5" /> Refine
        </Button>
      </div>
      {refineFor?.id === m.id && (
        <div className="space-y-2">
          <Textarea
            value={refineNote}
            onChange={(e) => setRefineNote(e.target.value)}
            rows={2}
            placeholder="What should change? e.g. make the figures closer, drop the outer ring, heavier stroke."
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy || !refineNote.trim()}
              onClick={() => refine.mutate({ markId: m.id, instruction: refineNote.trim() })}
            >
              {refine.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null} Redraw
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRefineFor(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );

  const marksPane = latest && (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{latest.label}</h3>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => drawConcepts.mutate()}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Draw another set
        </Button>
      </div>
      {latest.error && <p className="text-[11px] text-amber-400">{latest.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {latest.marks.map((m) => markCard(m))}
      </div>
      {earlier.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Earlier marks</p>
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {earlier.map((m) => markCard(m, true))}
          </div>
        </div>
      )}
    </section>
  );

  /* ------------------------------ approved ------------------------------ */

  const approvedPane = session.status !== "intake" && session.vector_svg && (
    <section className="space-y-4 rounded-xl border border-white/10 bg-background/40 p-6">
      <h3 className="text-sm font-semibold">
        {session.traced ? "Vectored in your brand colours" : "Saved — tracing fell back to a raster"}
      </h3>
      <div
        className="mx-auto max-w-xs rounded-lg bg-white p-6 [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: session.vector_svg }}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => commit.mutate()}>
          {commit.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Save the logo family to my brand
        </Button>
      </div>
      {session.status === "committed" && (
        <p className="text-[11px] text-muted-foreground">Saved. Your mark, lockups and knockouts are in your Live Brand.</p>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {session.status === "intake" || !direction ? describePane : null}
      {direction && session.status !== "intake" && (
        <details className="rounded-xl border border-white/10 bg-background/20 p-4" open={false}>
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Edit your description</summary>
          <div className="pt-4">{describePane}</div>
        </details>
      )}
      {directionPane}
      {marksPane}
      {approvedPane}

      {session.last_error && (
        <p className="text-[11px] text-amber-400">{session.last_error}</p>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => reset.mutate()}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Start over
        </Button>
      </div>
    </div>
  );
}
