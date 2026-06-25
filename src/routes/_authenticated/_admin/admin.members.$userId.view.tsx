// @ts-nocheck
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, FileText, Lightbulb, Loader2, Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import {
  getMemberView,
  getMemberDocument,
} from "@/lib/admin-member-view.functions";

function titleCase(s: string) {
  return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminMemberDashboardView() {
  const { userId = "" } = useParams();
  const [viewerDoc, setViewerDoc] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "member-view", userId],
    queryFn: () => getMemberView({ data: { userId } }),
    enabled: !!userId,
  });

  const openDocument = async (documentId: string) => {
    const doc = await getMemberDocument({ data: { documentId } });
    if (doc) {
      setViewerDoc(doc);
      setViewerOpen(true);
    }
  };

  if (q.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading member dashboard…
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200">
        Failed to load: {(q.error as Error).message}
      </div>
    );
  }

  const data = q.data!;
  const name = data.profile?.display_name ?? data.profile?.email ?? "Member";

  return (
    <div className="space-y-6">
      {/* Admin banner */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-amber-300" />
            <span className="text-amber-100">
              Admin view — read-only. Viewing as{" "}
              <span className="font-semibold">{name}</span>{" "}
              <span className="text-amber-200/70">({data.profile?.email})</span>
            </span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/members">
              <ArrowLeft className="mr-1 h-3 w-3" /> Exit view
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <Link to="/admin/members" className="text-xs text-muted-foreground hover:text-foreground">
          ← Members
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{data.profile?.email}</span>
          {data.profile?.member_status && (
            <Badge variant="outline" className="text-[10px]">
              {data.profile.member_status}
            </Badge>
          )}
          {data.profile?.founders_hub_access && (
            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 text-[10px]">
              Founders Hub
            </Badge>
          )}
          {data.profile?.approved_at && (
            <span>approved {new Date(data.profile.approved_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ventures">
            Ventures ({data.snapshots.length})
          </TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="profile">Founder profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ventures" value={String(data.snapshots.length)} icon={Lightbulb} />
            <Stat
              label="Documents"
              value={String(
                data.snapshots.reduce((n: number, s: any) => n + s.documents.length, 0),
              )}
              icon={FileText}
            />
            <Stat
              label="Business"
              value={data.attendee?.business_name ?? "—"}
              icon={Sparkles}
            />
            <Stat
              label="Industry"
              value={data.attendee?.industry ?? "—"}
              icon={User}
            />
          </div>

          {data.snapshots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">
              This member hasn't created any ventures yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.snapshots.slice(0, 3).map((s: any) => (
                <VentureCard key={s.id} snapshot={s} onOpenDoc={openDocument} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ventures" className="mt-4 space-y-4">
          {data.snapshots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">
              No ventures.
            </div>
          ) : (
            data.snapshots.map((s: any) => (
              <VentureCard key={s.id} snapshot={s} onOpenDoc={openDocument} />
            ))
          )}
        </TabsContent>

        <TabsContent value="intake" className="mt-4">
          {data.intake ? (
            <KVCard data={data.intake} />
          ) : (
            <Empty>No intake submitted yet.</Empty>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-4 space-y-4">
          {data.attendee && <KVCard title="Attendee" data={data.attendee} />}
          {data.founder ? (
            <KVCard title="Founder profile" data={data.founder} />
          ) : (
            <Empty>No founder profile.</Empty>
          )}
        </TabsContent>
      </Tabs>

      <DocumentViewer
        doc={viewerDoc}
        open={viewerOpen}
        onOpenChange={(o) => {
          setViewerOpen(o);
          if (!o) setViewerDoc(null);
        }}
      />
    </div>
  );
}

function VentureCard({
  snapshot,
  onOpenDoc,
}: {
  snapshot: any;
  onOpenDoc: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {snapshot.company_name ?? "Untitled venture"}
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {snapshot.status}
            </Badge>
            {snapshot.concept_status && (
              <Badge variant="secondary" className="text-[10px]">
                {snapshot.concept_status}
              </Badge>
            )}
          </div>
          {snapshot.industry && (
            <p className="mt-1 text-xs text-muted-foreground">{snapshot.industry}</p>
          )}
          {snapshot.concept_summary && (
            <p className="mt-2 max-w-2xl text-sm text-foreground/80">
              {snapshot.concept_summary}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(snapshot.created_at).toLocaleDateString()}
        </span>
      </div>

      {snapshot.documents.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">No documents generated yet.</p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {snapshot.documents.map((d: any) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onOpenDoc(d.id)}
              className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate text-sm">{titleCase(d.document_type)}</span>
              </span>
              <Badge
                variant={d.status === "complete" ? "default" : "outline"}
                className="text-[10px]"
              >
                {d.status}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-medium">{value}</div>
    </div>
  );
}

function KVCard({ title, data }: { title?: string; data: Record<string, any> }) {
  const entries = Object.entries(data).filter(
    ([k, v]) =>
      !["id", "user_id", "created_at", "updated_at"].includes(k) &&
      v !== null &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0),
  );
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-card p-5">
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      )}
      <dl className="grid gap-2 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/5 bg-background/40 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {titleCase(k)}
            </dt>
            <dd className="mt-0.5 break-words text-sm text-foreground/90">
              {typeof v === "object" ? (
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                  {JSON.stringify(v, null, 2)}
                </pre>
              ) : (
                String(v)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Empty({ children }: { children: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
