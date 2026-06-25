import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getPublicSiteSettings, updateSiteSetting } from "@/lib/site-settings.functions";

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
        description="Toggle homepage sections and global site behavior."
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
    </div>
  );
}
