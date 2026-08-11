// @ts-nocheck
import { Link, useParams } from 'react-router-dom';
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { } from 'react-router-dom';
import {
  getInquiry,
  replyToInquiry,
  updateInquiryStatus,
  type InquiryStatus,
} from "@/lib/inquiries-admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";


const STATUSES: InquiryStatus[] = ["new", "in_progress", "replied", "closed"];

const TONE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  replied: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export default function InquiryDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  
  
  
  const [reply, setReply] = useState("");

  const q = useQuery({
    queryKey: ["admin", "inquiry", id],
    queryFn: () => getInquiry({ data: { id } }),
  });

  const replyMut = useMutation({
    mutationFn: (body: string) => replyToInquiry({ data: { id, body } }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply sent");
      qc.invalidateQueries({ queryKey: ["admin", "inquiry", id] });
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin", "badges"] });
    },
    onError: (e: Error) => toast.error(e.message || "Reply failed"),
  });

  const statusMut = useMutation({
    mutationFn: (status: InquiryStatus) => updateInquiryStatus({ data: { id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inquiry", id] });
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin", "badges"] });
    },
  });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!q.data?.inquiry) return <div className="text-sm">Not found.</div>;

  const inq = q.data.inquiry;
  const messages = q.data.messages;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/admin/inquiries"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to inquiries
      </Link>

      <div className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{inq.subject}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{inq.name}</span>
              <a
                href={`mailto:${inq.email}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> {inq.email}
              </a>
              {inq.phone && <span>· {inq.phone}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] capitalize", TONE[inq.status])}>
              {inq.status.replace("_", " ")}
            </Badge>
            <Select
              value={inq.status}
              onValueChange={(v) => statusMut.mutate(v as InquiryStatus)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((m) => {
          const outbound = m.direction === "outbound";
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border p-4",
                outbound
                  ? "ml-8 border-primary/30 bg-primary/5"
                  : "mr-8 border-border bg-muted/40",
              )}
            >
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">
                  {outbound ? `${m.author_name || "Team"} (reply)` : m.author_name || inq.name}
                </span>
                <span>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border p-4">
        <label className="mb-2 block text-sm font-medium">Reply</label>
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={6}
          placeholder={`Hi ${inq.name.split(/\s+/)[0]},\n\n…`}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Sends as an email to {inq.email}. Their reply will land in your inbox —
            paste it back here to keep the thread complete.
          </p>
          <Button
            onClick={() => reply.trim() && replyMut.mutate(reply.trim())}
            disabled={replyMut.isPending || reply.trim().length === 0}
          >
            {replyMut.isPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
