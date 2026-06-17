// @ts-nocheck
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ZERNIO_PLATFORMS,
  listProfiles,
  listAccounts,
  getConnectUrl,
  disconnectAccount,
} from "@/lib/zernio.functions";
import { Link2, Trash2 } from "lucide-react";

export default function AdminSocialAccounts() {
  const [params, setParams] = useSearchParams();
  const profileId = params.get("profileId") ?? "";
  const [platform, setPlatform] = useState<string>("twitter");

  const qc = useQueryClient();

  const profilesQ = useQuery({
    queryKey: ["zernio", "profiles"],
    queryFn: listProfiles,
  });
  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", profileId || "all"],
    queryFn: () => listAccounts(profileId || undefined),
  });

  const connectMut = useMutation({
    mutationFn: () => getConnectUrl(platform, profileId),
    onSuccess: (d) => {
      if (!d.authUrl) {
        toast.error("No auth URL returned");
        return;
      }
      window.open(d.authUrl, "_blank", "noopener,noreferrer");
      toast.message("Opened Zernio in a new tab. Return here and refresh after authorizing.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: (id: string) => disconnectAccount(id),
    onSuccess: () => {
      toast.success("Account disconnected");
      qc.invalidateQueries({ queryKey: ["zernio", "accounts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const profiles: any[] = profilesQ.data?.profiles ?? [];
  const accounts: any[] = accountsQ.data?.accounts ?? [];

  const selectedProfile = useMemo(
    () => profiles.find((p) => (p._id ?? p.id) === profileId),
    [profiles, profileId],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Connected accounts"
        description="Connect or disconnect social media accounts via Zernio's hosted OAuth flow."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect a new account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Profile</label>
              <Select
                value={profileId}
                onValueChange={(v) => {
                  const next = new URLSearchParams(params);
                  next.set("profileId", v);
                  setParams(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p._id ?? p.id} value={p._id ?? p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZERNIO_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={!profileId || connectMut.isPending}
                onClick={() => connectMut.mutate()}
              >
                <Link2 className="mr-2 h-4 w-4" /> Connect
              </Button>
            </div>
          </div>
          {selectedProfile && (
            <p className="text-xs text-muted-foreground">
              Connecting to profile <strong>{selectedProfile.name}</strong>. A new tab will open
              for OAuth.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {profileId ? "Accounts in this profile" : "All connected accounts"}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ["zernio", "accounts"] })}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {accountsQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No accounts connected yet.</div>
          ) : (
            <div className="divide-y">
              {accounts.map((a) => {
                const id = a._id ?? a.id;
                return (
                  <div key={id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {a.platform}
                        </Badge>
                        <span className="truncate text-sm font-medium">
                          {a.username ?? a.name ?? a.handle ?? id}
                        </span>
                      </div>
                      {a.profileId && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          profile: {a.profileId}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Disconnect this account?")) disconnectMut.mutate(id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
