import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteGoal, listMyGoals, upsertGoal } from "@/lib/attendee.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyGoals);
  const saveFn = useServerFn(upsertGoal);
  const delFn = useServerFn(deleteGoal);
  const { data } = useQuery({ queryKey: ["my", "goals"], queryFn: () => listFn() });

  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const save = useMutation({
    mutationFn: () => saveFn({ data: { horizon, title, description: desc, status: "pending" } }),
    onSuccess: () => {
      toast.success("Goal added");
      setTitle("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["my", "goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my", "goals"] }),
  });

  const buckets: Array<30 | 60 | 90> = [30, 60, 90];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">30 / 60 / 90 day goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan your post-workshop sprint.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value) as 30 | 60 | 90)}
            className="rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" className="max-w-md" />
        </div>
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" />
        <Button onClick={() => save.mutate()} disabled={!title || save.isPending}>Add goal</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {buckets.map((h) => (
          <div key={h} className="rounded-2xl border border-white/10 bg-card p-4">
            <div className="mb-3 text-sm font-medium">{h} days</div>
            <ul className="space-y-2">
              {(data?.goals ?? []).filter((g) => g.horizon === h).map((g) => (
                <li key={g.id} className="rounded-lg border border-white/5 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{g.title}</div>
                      {g.description && <div className="mt-1 text-xs text-muted-foreground">{g.description}</div>}
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => del.mutate(g.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              {(data?.goals ?? []).filter((g) => g.horizon === h).length === 0 && (
                <li className="text-xs text-muted-foreground">No goals yet.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
