// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, CheckCircle2, Circle, Loader2, ExternalLink, Wrench, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tool = {
  key: string;
  job: string;
  name: string;
  url?: string;
  why?: string;
  setup_minutes?: number;
  linked_asset_key?: string;
  day?: number;
  free_tier?: boolean;
};

type StackStatus = "not_started" | "signed_up" | "configured" | "live";
const STEPS: StackStatus[] = ["not_started", "signed_up", "configured", "live"];
const STEP_LABEL: Record<StackStatus, string> = {
  not_started: "Not started",
  signed_up: "Signed up",
  configured: "Configured",
  live: "Live",
};

interface Props {
  snapshotId: string;
  userId: string;
  stackDoc: any | null;               // venture_documents row for ai_tool_stack_recommendation (Operating Tool Stack)
  onGenerateStack: () => void;
  onScrollToDoc: (key: string) => void;
  onOpenDoc: (key: string) => void;
  isGenerating?: boolean;
  compact?: boolean;
}

// Extract the tool_stack_checklist.json block from the generated markdown.
function extractStackJson(content: string | null | undefined): Tool[] {
  if (!content) return [];
  const match = content.match(/```json[^\n]*(?:tool|ai)_stack_checklist[^\n]*\n([\s\S]*?)```/i)
    || content.match(/```json\s*\n([\s\S]*?)```/i);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1].trim());
    const tools = Array.isArray(parsed) ? parsed : parsed.tools;
    if (!Array.isArray(tools)) return [];
    return tools.filter((t: any) => t && t.key && t.name).map((t: any) => ({
      key: String(t.key),
      job: String(t.job ?? ""),
      name: String(t.name),
      url: t.url,
      why: t.why,
      setup_minutes: t.setup_minutes,
      linked_asset_key: t.linked_asset_key,
      day: t.day,
      free_tier: !!t.free_tier,
    }));
  } catch {
    return [];
  }
}

export function ToolStackPanel({
  snapshotId,
  userId,
  stackDoc,
  onGenerateStack,
  onScrollToDoc,
  onOpenDoc,
  isGenerating,
  compact = false,
}: Props) {
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(compact);

  const tools = useMemo(() => extractStackJson(stackDoc?.content), [stackDoc?.content]);
  const hasStack = tools.length > 0;

  const statusQuery = useQuery({
    queryKey: ["ai-stack-status", snapshotId],
    enabled: hasStack,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venture_tool_stack_status")
        .select("tool_key,status")
        .eq("snapshot_id", snapshotId);
      if (error) throw error;
      const m = new Map<string, StackStatus>();
      for (const r of data ?? []) m.set(r.tool_key, r.status as StackStatus);
      return m;
    },
  });

  const upsertStatus = useMutation({
    mutationFn: async ({ toolKey, status }: { toolKey: string; status: StackStatus }) => {
      const { error } = await supabase
        .from("venture_tool_stack_status")
        .upsert(
          { snapshot_id: snapshotId, user_id: userId, tool_key: toolKey, status },
          { onConflict: "snapshot_id,tool_key" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-stack-status", snapshotId] }),
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update status"),
  });

  const advance = (tool: Tool) => {
    const cur: StackStatus = statusQuery.data?.get(tool.key) ?? "not_started";
    const nextIdx = Math.min(STEPS.indexOf(cur) + 1, STEPS.length - 1);
    upsertStatus.mutate({ toolKey: tool.key, status: STEPS[nextIdx] });
  };

  const reset = (tool: Tool) => upsertStatus.mutate({ toolKey: tool.key, status: "not_started" });

  const liveCount = useMemo(() => {
    if (!hasStack) return 0;
    let n = 0;
    for (const t of tools) if (statusQuery.data?.get(t.key) === "live") n++;
    return n;
  }, [tools, statusQuery.data, hasStack]);

  // Empty state — no stack doc yet
  if (!hasStack) {
    if (compact) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-card/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">Operating Tool Stack</span>
            <span
              className="truncate text-xs text-muted-foreground"
              title="Generate your Operating Tool Stack and this panel becomes a live setup checklist — sign up, configure, and go live for every tool the sprint needs."
            >
              Turn your plan into a working tool stack
            </span>
          </div>
          <Button size="sm" onClick={onGenerateStack} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Generate
          </Button>
        </div>
      );
    }
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-card/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold">Turn your 14-day plan into a working tool stack</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Generate your Operating Tool Stack and this panel becomes a live setup checklist —
              sign up, configure, and go live for every tool the sprint needs.
            </p>
          </div>

          <Button onClick={onGenerateStack} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            Set up my tool stack
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background via-card to-background p-6">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold">Your operating tool stack</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              The exact tools your business runs on. Click a step to advance — track signup, configuration, and go-live for each.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border bg-card/60 px-3 py-2 text-right">
              <div className="text-xs text-muted-foreground">Tools live</div>
              <div className="text-lg font-semibold">
                {liveCount}<span className="text-muted-foreground">/{tools.length}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {tools.map((tool) => {
              const cur: StackStatus = statusQuery.data?.get(tool.key) ?? "not_started";
              const isLive = cur === "live";
              return (
                <div
                  key={tool.key}
                  className={`flex flex-col gap-3 rounded-xl border p-3 ${
                    isLive ? "border-status-success/40 bg-status-success/5" : "border-border bg-background/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {tool.job}
                        </div>
                        {tool.free_tier && (
                          <span className="rounded-full border border-status-success/30 bg-status-success/10 px-1.5 text-[9px] font-medium text-status-success">
                            Free tier
                          </span>
                        )}
                        {typeof tool.day === "number" && (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 text-[9px] font-medium text-primary">
                            Day {tool.day}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        <h4 className="truncate text-sm font-semibold">{tool.name}</h4>
                        {tool.url && (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="Open tool website"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {tool.why && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{tool.why}</p>}
                    </div>
                  </div>

                  {/* Step chip */}
                  <div className="flex flex-wrap items-center gap-1">
                    {STEPS.filter((s) => s !== "not_started").map((s, i) => {
                      const stepIdx = STEPS.indexOf(s);
                      const curIdx = STEPS.indexOf(cur);
                      const reached = curIdx >= stepIdx;
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => upsertStatus.mutate({ toolKey: tool.key, status: s })}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              reached
                                ? "border-primary/50 bg-primary/15 text-foreground"
                                : "border-border text-muted-foreground hover:border-border"
                            }`}
                          >
                            {STEP_LABEL[s]}
                          </button>
                          {i < 2 && <span className="text-muted-foreground/50">·</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {typeof tool.setup_minutes === "number" && <span>~{tool.setup_minutes} min setup</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {tool.linked_asset_key && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onOpenDoc(tool.linked_asset_key!)}>
                            Open guide
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onScrollToDoc(tool.linked_asset_key!)} title="Jump to card below">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {cur !== "not_started" && (
                        <Button size="sm" variant="ghost" onClick={() => reset(tool)} title="Reset progress">
                          Reset
                        </Button>
                      )}
                      {!isLive && (
                        <Button size="sm" onClick={() => advance(tool)}>
                          <Rocket className="mr-1 h-3 w-3" />
                          Advance
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
