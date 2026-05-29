import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBrief, updateBriefField } from "@/lib/brief.functions";
import { BRIEF_FIELDS } from "@/lib/workflow";
import { VoiceField } from "@/components/voice/VoiceField";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/brief")({
  component: BriefPage,
  head: () => ({ meta: [{ title: "Business Brief" }] }),
});

function BriefPage() {
  const getFn = useServerFn(getMyBrief);
  const saveFn = useServerFn(updateBriefField);
  const { data, refetch } = useQuery({ queryKey: ["my", "brief"], queryFn: () => getFn() });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data?.brief) return;
    const init: Record<string, string> = {};
    for (const f of BRIEF_FIELDS) init[f.key] = (data.brief[f.key as keyof typeof data.brief] as string) ?? "";
    setValues(init);
  }, [data]);

  const save = async (key: string) => {
    try {
      await saveFn({ data: { field: key as never, value: values[key] ?? "" } });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const score = data?.brief?.completeness_score ?? 0;
  const pct = Math.round((score / BRIEF_FIELDS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your business brief</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Speak or type. Every deliverable downstream uses this brief, so the more specific you are, the better the output.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground">{score} / {BRIEF_FIELDS.length}</span>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-white/10 bg-card p-6">
        {BRIEF_FIELDS.map((f) => (
          <VoiceField
            key={f.key}
            label={f.label}
            value={values[f.key] ?? ""}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
            onBlur={() => save(f.key)}
            placeholder={f.placeholder}
            multiline={f.multiline}
            context={f.label}
          />
        ))}
      </div>
    </div>
  );
}
