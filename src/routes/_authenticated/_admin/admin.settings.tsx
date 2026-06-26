import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublicSiteSettings, updateSiteSetting } from "@/lib/site-settings.functions";
import {
  adminSetBulkUnlockDefault,
  adminClearBulkUnlockDefault,
  adminSetUserBulkUnlock,
  adminClearUserBulkUnlock,
  adminListUserBulkUnlocks,
  adminHasBulkUnlockDefault,
} from "@/lib/foundersHub.functions";
import { Loader2, Lock, Trash2, Plus, KeyRound } from "lucide-react";

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
  });

  const mutate = useMutation({
    mutationFn: (vars: { key: string; value: unknown }) => updateSiteSetting(vars),
    onSuccess: () => {
      toast.success("Setting saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const showScroller = data?.show_business_ideas_scroller !== false;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <AdminPageHeader
        title="Site settings"
        description="Toggle homepage sections and manage the bulk-generation unlock code."
      />

      <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Homepage sections</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Control which optional sections appear on the public homepage.
        </p>

        <div className="flex items-start justify-between gap-6 rounded-lg border border-border/60 bg-background/50 p-4">
          <div className="flex-1">
            <Label htmlFor="toggle-scroller" className="text-sm font-medium">
              Business ideas scroller
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-scrolling list of 60+ startup ideas across categories, shown between the Framework and Honest
              Roadmap sections.
            </p>
          </div>
          <Switch
            id="toggle-scroller"
            checked={showScroller}
            disabled={isLoading || mutate.isPending}
            onCheckedChange={(checked) =>
              mutate.mutate({ key: "show_business_ideas_scroller", value: checked })
            }
          />
        </div>
      </section>

      <BulkUnlockSettings />
    </div>
  );
}

function BulkUnlockSettings() {
  const qc = useQueryClient();
  const hasDefaultQ = useQuery({ queryKey: ["bulk-unlock-default"], queryFn: adminHasBulkUnlockDefault });
  const usersQ = useQuery({ queryKey: ["bulk-unlock-users"], queryFn: adminListUserBulkUnlocks });

  const [globalCode, setGlobalCode] = useState("");
  const [userId, setUserId] = useState("");
  const [userCode, setUserCode] = useState("");

  const setGlobal = useMutation({
    mutationFn: () => adminSetBulkUnlockDefault({ code: globalCode.trim() }),
    onSuccess: () => {
      toast.success("Global unlock code saved");
      setGlobalCode("");
      qc.invalidateQueries({ queryKey: ["bulk-unlock-default"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearGlobal = useMutation({
    mutationFn: () => adminClearBulkUnlockDefault(),
    onSuccess: () => {
      toast.success("Global unlock code cleared");
      qc.invalidateQueries({ queryKey: ["bulk-unlock-default"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setUser = useMutation({
    mutationFn: () => adminSetUserBulkUnlock({ userId: userId.trim(), code: userCode.trim() }),
    onSuccess: () => {
      toast.success("User unlock code saved");
      setUserId("");
      setUserCode("");
      qc.invalidateQueries({ queryKey: ["bulk-unlock-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearUser = useMutation({
    mutationFn: (uid: string) => adminClearUserBulkUnlock({ userId: uid }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["bulk-unlock-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Bulk-generation unlock</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        The Hub default is category-by-category (Foundation → Strategy → …). Founders can run all 34 documents
        at once only when they enter a valid unlock code. Set one global code that works for everyone, or
        assign a per-user code that overrides it.
      </p>

      <div className="space-y-6">
        <div className="rounded-lg border border-border/60 bg-background/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-medium">Global unlock code</Label>
            <span className={`text-xs ${hasDefaultQ.data ? "text-status-success" : "text-muted-foreground"}`}>
              {hasDefaultQ.isLoading ? "…" : hasDefaultQ.data ? "Set" : "Not set"}
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Used when a user has no personal override. Stored hashed (bcrypt) — we cannot recover it; only replace it.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="New global code"
              value={globalCode}
              onChange={(e) => setGlobalCode(e.target.value)}
            />
            <Button onClick={() => setGlobal.mutate()} disabled={!globalCode.trim() || setGlobal.isPending}>
              {setGlobal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            </Button>
            {hasDefaultQ.data && (
              <Button variant="ghost" onClick={() => clearGlobal.mutate()} disabled={clearGlobal.isPending}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/50 p-4">
          <Label className="text-sm font-medium">Per-user unlock code</Label>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            Overrides the global code for one founder. Paste their user ID (from Admin → Users / Attendees).
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input placeholder="User ID (uuid)" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <Input type="password" placeholder="Unlock code" value={userCode} onChange={(e) => setUserCode(e.target.value)} />
            <Button onClick={() => setUser.mutate()} disabled={!userId.trim() || !userCode.trim() || setUser.isPending}>
              {setUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {usersQ.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!usersQ.isLoading && (usersQ.data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">No per-user overrides set.</p>
            )}
            {(usersQ.data ?? []).map((row) => (
              <div key={row.user_id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.display_name ?? row.email ?? row.user_id}</div>
                  <div className="truncate text-muted-foreground">{row.user_id}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearUser.mutate(row.user_id)}
                  disabled={clearUser.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
