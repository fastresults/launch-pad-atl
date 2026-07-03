// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { listPosts, deletePost } from "@/lib/zernio.functions";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function AdminSocialPosts() {
  const [status, setStatus] = useState<string>("all");
  const qc = useQueryClient();
  const confirm = useConfirm();

  const postsQ = useQuery({
    queryKey: ["zernio", "posts", status],
    queryFn: () => listPosts({ status: status === "all" ? undefined : status }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["zernio", "posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const posts: any[] = postsQ.data?.posts ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Posts"
        description="View scheduled, published, and draft posts."
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {postsQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No posts found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const id = p._id ?? p.id;
            return (
              <Card key={id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={p.status === "failed" ? "destructive" : "secondary"}>
                        {p.status ?? "unknown"}
                      </Badge>
                      {(p.platforms ?? []).map((pl: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {pl.platform}
                        </Badge>
                      ))}
                      {p.scheduledFor && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">{p.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                      onClick={async () => {
                        if (await confirm({ title: "Delete this post?", destructive: true, confirmText: "Delete" })) deleteMut.mutate(id);
                      }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
