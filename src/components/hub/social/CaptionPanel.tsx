// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Scissors, MessageSquare, Type } from "lucide-react";
import { toast } from "sonner";
import { invokeEdge } from "@/lib/edge-invoke";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { CAPTION_SPECS, assembleCaption, specFor, type CaptionPost } from "@/lib/caption-specs";

function copyText(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error("Couldn't copy"),
  );
}

export function CaptionPanel({
  post,
  snapshotId,
  defaultPlatform,
}: {
  post: CaptionPost;
  snapshotId?: string | null;
  defaultPlatform?: string | null;
}) {
  const initial = useMemo(() => specFor(defaultPlatform ?? post.platform), [defaultPlatform, post.platform]);
  const [platformId, setPlatformId] = useState(initial.id);
  const [override, setOverride] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);

  useEffect(() => {
    setPlatformId(initial.id);
    setOverride(null);
  }, [initial.id, post.id]);

  const spec = CAPTION_SPECS.find((s) => s.id === platformId) ?? initial;
  const built = useMemo(
    () => assembleCaption(post, spec, { overrideCaption: override }),
    [post, spec, override],
  );

  const over = built.overBy > 0;
  const near = !over && built.chars > spec.target;
  const counterClass = over
    ? "text-status-danger"
    : near
    ? "text-status-warning"
    : "text-status-success";

  const shorten = async () => {
    setShortening(true);
    try {
      const { data, error } = await invokeEdge("venture-post-caption", {
        body: {
          snapshotId,
          postId: post.id,
          platform: spec.id,
          caption: built.caption,
          limit: spec.limit,
          target: spec.target,
          hashtags: built.hashtags,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setOverride((data as any).caption);
      toast.success("Caption tightened to fit");
    } catch (e: any) {
      toast.error(edgeErrorMessage?.(e) ?? e?.message ?? "Couldn't shorten the caption");
    } finally {
      setShortening(false);
    }
  };

  const hasBody = !!(post.hook || post.body || post.cta);
  if (!hasBody) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
          <Type className="h-3.5 w-3.5 text-primary" /> Post caption
        </div>
        <span className={`font-mono text-[10px] ${counterClass}`}>
          {built.chars.toLocaleString()} / {spec.limit.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {CAPTION_SPECS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setPlatformId(s.id); setOverride(null); }}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
              s.id === platformId
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-card/60 p-2 font-sans text-[11px] leading-relaxed">
        {built.caption}
      </pre>

      {spec.fold && (
        <div className="text-[10px] text-muted-foreground">
          First {spec.fold} characters show before “more”.
          {spec.note ? ` ${spec.note}` : ""}
        </div>
      )}
      {!spec.fold && spec.note && (
        <div className="text-[10px] text-muted-foreground">{spec.note}</div>
      )}

      {built.title && (
        <div>
          <div className="text-[10px] text-muted-foreground">Title ({spec.titleLimit} max)</div>
          <div className="mt-1 flex items-start gap-2">
            <div className="flex-1 rounded border border-border bg-card/60 p-2 text-[11px]">{built.title}</div>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyText(built.title!, "Title copied")}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {built.firstComment && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" /> First comment (hashtags)
          </div>
          <div className="mt-1 rounded border border-border bg-card/60 p-2 text-[11px] break-words">
            {built.firstComment}
          </div>
        </div>
      )}

      {over && (
        <div className="rounded border border-status-danger/40 bg-status-danger/10 p-2 text-[10px] text-status-danger">
          {built.overBy} characters over {spec.label}'s limit.
        </div>
      )}

      <div className="grid gap-1.5">
        <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => copyText(built.caption, "Caption copied")}>
          <Copy className="mr-2 h-3.5 w-3.5" /> Copy caption
        </Button>
        {built.hashtags.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={() =>
              copyText(
                built.firstComment ? `${built.caption}\n\n${built.firstComment}` : built.caption,
                "Caption + hashtags copied",
              )
            }
          >
            <Copy className="mr-2 h-3.5 w-3.5" /> Copy caption + hashtags
          </Button>
        )}
        {built.hashtags.length > 0 && (
          <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => copyText(built.hashtags.join(" "), "Hashtags copied")}>
            <Copy className="mr-2 h-3.5 w-3.5" /> Copy hashtags only
          </Button>
        )}
        {(over || near) && snapshotId && (
          <Button size="sm" className="w-full justify-start" disabled={shortening} onClick={shorten}>
            {shortening ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Scissors className="mr-2 h-3.5 w-3.5" />}
            {shortening ? "Tightening…" : `Shorten for ${spec.label}`}
          </Button>
        )}
        {override && (
          <button
            type="button"
            className="text-left text-[10px] text-muted-foreground underline"
            onClick={() => setOverride(null)}
          >
            Revert to the original caption
          </button>
        )}
      </div>
    </div>
  );
}
