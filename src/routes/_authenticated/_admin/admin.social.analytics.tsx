// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAccounts, getAnalytics } from "@/lib/zernio.functions";

function formatNumber(n: any) {
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return v.toLocaleString();
}

export default function AdminSocialAnalytics() {
  const [accountId, setAccountId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);

  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", "all"],
    queryFn: () => listAccounts(),
  });
  const accounts: any[] = accountsQ.data?.accounts ?? [];

  const analyticsQ = useQuery({
    queryKey: ["zernio", "analytics", accountId, startDate, endDate],
    queryFn: () => getAnalytics({ accountId, startDate, endDate }),
    enabled: !!accountId,
  });

  const data: any = analyticsQ.data ?? {};
  const summary = data?.summary ?? data?.totals ?? data;
  const entries: [string, any][] =
    summary && typeof summary === "object"
      ? Object.entries(summary).filter(
          ([, v]) => typeof v === "number" || typeof v === "string",
        )
      : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Performance metrics from your connected social accounts."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => {
                const id = a._id ?? a.id;
                return (
                  <SelectItem key={id} value={id}>
                    {a.platform} — {a.username ?? a.name ?? id}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </CardContent>
      </Card>

      {!accountId ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Pick an account to see analytics.
          </CardContent>
        </Card>
      ) : analyticsQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : analyticsQ.error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {(analyticsQ.error as Error).message}
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No analytics data returned for this range.
            <pre className="mt-3 max-h-64 overflow-auto rounded bg-muted p-3 text-[11px]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {entries.map(([k, v]) => (
              <Card key={k}>
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {typeof v === "number" ? formatNumber(v) : String(v)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {Array.isArray(data?.timeseries) && data.timeseries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeseries</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-[11px]">
                  {JSON.stringify(data.timeseries, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <Badge variant="outline" className="text-[10px]">
        Powered by Zernio
      </Badge>
    </div>
  );
}
