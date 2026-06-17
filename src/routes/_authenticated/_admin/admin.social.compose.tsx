// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { listAccounts, createPost } from "@/lib/zernio.functions";

export default function AdminSocialCompose() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"now" | "schedule" | "draft">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", "all"],
    queryFn: () => listAccounts(),
  });
  const accounts: any[] = accountsQ.data?.accounts ?? [];

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const platforms = useMemo(
    () =>
      accounts
        .filter((a) => selected.has(a._id ?? a.id))
        .map((a) => ({ platform: a.platform, accountId: a._id ?? a.id })),
    [accounts, selected],
  );

  const createMut = useMutation({
    mutationFn: () =>
      createPost({
        content,
        platforms,
        publishNow: mode === "now",
        scheduledFor: mode === "schedule" ? scheduledFor : undefined,
        timezone: mode === "schedule" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      }),
    onSuccess: () => {
      toast.success(
        mode === "now" ? "Posted" : mode === "schedule" ? "Scheduled" : "Saved as draft",
      );
      navigate("/admin/social/posts");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const canSubmit =
    content.trim().length > 0 &&
    platforms.length > 0 &&
    (mode !== "schedule" || scheduledFor);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="New post" description="Compose and publish across connected accounts." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={8}
              placeholder="What do you want to share?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Media URL (optional)
              </label>
              <Input
                placeholder="https://…/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(["now", "schedule", "draft"] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={mode === m ? "default" : "outline"}
                  onClick={() => setMode(m)}
                >
                  {m === "now" ? "Publish now" : m === "schedule" ? "Schedule" : "Save draft"}
                </Button>
              ))}
            </div>
            {mode === "schedule" && (
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            )}

            <Button
              className="mt-2 w-full"
              disabled={!canSubmit || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending
                ? "Submitting…"
                : mode === "now"
                  ? "Publish now"
                  : mode === "schedule"
                    ? "Schedule post"
                    : "Save draft"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post to</CardTitle>
          </CardHeader>
          <CardContent>
            {accountsQ.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : accounts.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No accounts connected. Connect one first.
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((a) => {
                  const id = a._id ?? a.id;
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded border p-2 text-sm hover:bg-muted/50"
                    >
                      <Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} />
                      <Badge variant="secondary" className="text-[10px]">
                        {a.platform}
                      </Badge>
                      <span className="truncate">{a.username ?? a.name ?? id}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
