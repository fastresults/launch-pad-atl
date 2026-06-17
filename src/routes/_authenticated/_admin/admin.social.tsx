// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listProfiles,
  createProfile,
  deleteProfile,
  listAccounts,
} from "@/lib/zernio.functions";
import { Plus, Trash2, Users, ExternalLink } from "lucide-react";

export default function AdminSocialIndex() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const profilesQ = useQuery({
    queryKey: ["zernio", "profiles"],
    queryFn: listProfiles,
  });
  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", "all"],
    queryFn: () => listAccounts(),
  });

  const createMut = useMutation({
    mutationFn: () => createProfile({ name, description }),
    onSuccess: () => {
      toast.success("Profile created");
      setOpen(false);
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["zernio", "profiles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => {
      toast.success("Profile deleted");
      qc.invalidateQueries({ queryKey: ["zernio", "profiles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const profiles: any[] = profilesQ.data?.profiles ?? [];
  const accounts: any[] = accountsQ.data?.accounts ?? [];

  const accountsByProfile = (profileId: string) =>
    accounts.filter((a) => a.profileId === profileId || a.profile?._id === profileId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Social media"
        description="Manage Zernio profiles, connect social accounts, schedule posts, and view analytics."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/social/accounts">Manage accounts</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/social/compose">New post</Link>
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Profiles</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> New profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Profile name (e.g. StartupLabs)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMut.mutate()}
                disabled={!name || createMut.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {profilesQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : profilesQ.error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {(profilesQ.error as Error).message}
          </CardContent>
        </Card>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No profiles yet. Create one to start connecting social accounts.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const id = p._id ?? p.id;
            const linked = accountsByProfile(id);
            return (
              <Card key={id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete profile "${p.name}"?`)) deleteMut.mutate(id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {linked.length} connected account{linked.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {linked.map((a) => (
                      <Badge key={a._id ?? a.id} variant="secondary" className="text-[10px]">
                        {a.platform}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={`/admin/social/accounts?profileId=${id}`}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" /> Connect accounts
                    </Link>
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
