import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSiteSettings, updateSiteSetting, DASHBOARD_NAV_KEYS, DEFAULT_DASHBOARD_NAV_VISIBILITY, type DashboardNavKey, type DashboardNavVisibility } from "@/lib/site-settings.functions";
import { Home, Calendar, ClipboardList, ListChecks, Sparkles, FolderOpen, User, Hammer } from "lucide-react";
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
  const { isSuperAdmin } = useAuth();
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
  const landingOnly = (data as any)?.landing_only_mode === true;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <AdminPageHeader
        title="Site settings"
        description="Toggle homepage sections and manage the bulk-generation unlock code."
      />

      {isSuperAdmin && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Site mode</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Super-admin only. When landing-only mode is ON, every visitor — including approved members —
            sees a single standalone landing page instead of the full website. Admin pages stay reachable so
            you can keep editing and switch it back off. <code className="rounded bg-muted px-1">/login</code>,{" "}
            <code className="rounded bg-muted px-1">/reset-password</code>, and{" "}
            <code className="rounded bg-muted px-1">/admin</code> stay reachable.
          </p>

          <div className="flex items-start justify-between gap-6 rounded-lg border border-border/60 bg-background/50 p-4">
            <div className="flex-1">
              <Label htmlFor="toggle-landing-only" className="text-sm font-medium">
                Landing-only mode
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {landingOnly
                  ? "ON — the public sees only the standalone landing page."
                  : "OFF — the full website is live for everyone."}
              </p>
            </div>
            <Switch
              id="toggle-landing-only"
              checked={landingOnly}
              disabled={isLoading || mutate.isPending}
              onCheckedChange={(checked) =>
                mutate.mutate({ key: "landing_only_mode", value: checked })
              }
            />
          </div>
        </section>
      )}


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

      <DashboardNavSettings
        value={data?.dashboard_nav_visibility ?? DEFAULT_DASHBOARD_NAV_VISIBILITY}
        loading={isLoading}
        onSave={(next) => mutate.mutate({ key: "dashboard_nav_visibility", value: next })}
        saving={mutate.isPending}
      />

      <BulkUnlockSettings />
    </div>
  );
}

const NAV_META: Record<DashboardNavKey, { label: string; icon: typeof Home; helper: string }> = {
  today: { label: "Today", icon: Home, helper: "Daily check-in landing page with countdown and next action." },
  workshop: { label: "Workshop day", icon: Calendar, helper: "Reservation details, venue, agenda for the cohort day." },
  brief: { label: "Startup brief", icon: ClipboardList, helper: "The 10-question brief that feeds every deliverable." },
  deliverables: { label: "Deliverables", icon: ListChecks, helper: "Generate and view the 20 investor-ready documents." },
  hub: { label: "Ventures", icon: Sparkles, helper: "Concept explorer with a 50-document workspace per venture." },
  operations: { label: "Operationalize", icon: Hammer, helper: "The 90-day operating runway and creative sign-off for each venture." },
  files: { label: "My files", icon: FolderOpen, helper: "Saved documents, uploads, brand media and PDFs." },
  profile: { label: "Founder profile", icon: User, helper: "Founder details, startup info and financial snapshot." },
};

function DashboardNavSettings({
  value,
  loading,
  saving,
  onSave,
}: {
  value: DashboardNavVisibility;
  loading: boolean;
  saving: boolean;
  onSave: (next: DashboardNavVisibility) => void;
}) {
  const enabledCount = DASHBOARD_NAV_KEYS.filter((k) => value[k] !== false).length;

  function toggle(key: DashboardNavKey, checked: boolean) {
    if (!checked && enabledCount <= 1 && value[key] !== false) {
      toast.error("At least one navigation item must stay enabled.");
      return;
    }
    onSave({ ...value, [key]: checked });
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">Dashboard navigation</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Turn individual sidebar items on or off for every founder. Admins always see the full list with a
        "Hidden" badge so you can still navigate while configuring.
      </p>

      <div className="space-y-2">
        {DASHBOARD_NAV_KEYS.map((key) => {
          const meta = NAV_META[key];
          const Icon = meta.icon;
          const checked = value[key] !== false;
          return (
            <div
              key={key}
              className="flex items-start justify-between gap-6 rounded-lg border border-border/60 bg-background/50 p-4"
            >
              <div className="flex flex-1 items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor={`nav-${key}`} className="text-sm font-medium">
                    {meta.label}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.helper}</p>
                </div>
              </div>
              <Switch
                id={`nav-${key}`}
                checked={checked}
                disabled={loading || saving}
                onCheckedChange={(c) => toggle(key, c)}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {DASHBOARD_NAV_KEYS.length} visible to founders
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || saving}
          onClick={() => onSave(DEFAULT_DASHBOARD_NAV_VISIBILITY)}
        >
          Reset to defaults
        </Button>
      </div>
    </section>
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
        The Hub default is category-by-category (Foundation → Strategy → …). Founders can run all 50 documents
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
