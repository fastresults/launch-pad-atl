# Rollback Plan — Startuplabs Production

Purpose: define **when** to roll back, **what** to roll back, and **who** decides — before we're staring at a live incident.

---

## Rollback triggers (any one = pull the trigger)

| Signal | Threshold | Source |
| --- | --- | --- |
| HTTP 5xx rate | > 2% over any 5-min window | Lovable Cloud logs / Sentry |
| Sentry new issue rate | > 10 unique issues in 15 min | Sentry |
| Auth signup failure | > 5% failures over 15 min | `auth` logs + PostHog funnel |
| DB CPU | sustained > 85% for 10 min | `supabase--db_health` |
| Payment failure (if live) | any `charge.failed` cluster > 3 in 10 min | Stripe dashboard |
| P0 data leak / RLS bypass | 1 confirmed | manual |
| Homepage broken above the fold | 1 confirmed by two humans | manual |

**Decision authority**: cutover lead (Adam) or on-call engineer. No committee — one call, log it in the incident channel.

---

## Rollback procedure

### A. Frontend-only regression (bad copy, broken layout, JS error)

1. In Lovable, open **Version history** → select the last known-good version (record its ID before cutover).
2. Click **Revert to this version** → **Publish**.
3. Verify live site loads and Sentry error rate drops within 5 minutes.
4. Open a follow-up ticket describing the regression and the reverted commit.

**ETA to restore**: < 5 minutes.

### B. Backend regression (bad migration, broken RLS, edge function crash)

1. **Identify** the offending migration: `ls supabase/migrations/ | tail -5` — most recent applied post-cutover.
2. **Author a reversing migration** — never `DROP`/edit history. New timestamp, undo the change (drop new index, restore old policy, re-grant revoked privilege, etc.).
3. Apply via `supabase--migration`.
4. For a broken edge function: `supabase--deploy_edge_functions` with the previous version from git history, or `supabase--delete_edge_functions` if the function itself is the problem and the frontend can degrade gracefully.
5. Verify with `supabase--linter` and a targeted `read_query`.

**ETA to restore**: 10–30 minutes depending on migration complexity.

### C. Data corruption / accidental destructive write

1. **Freeze writes** to the affected table: apply a temporary RLS policy that denies `INSERT`/`UPDATE`/`DELETE` to `authenticated`.
2. Identify the last clean backup snapshot (recorded in the cutover checklist).
3. Contact Lovable support for point-in-time restore if the incident is < 7 days old.
4. Restore into a **staging schema first**, diff, then merge deltas — never overwrite live tables blindly.

**ETA to restore**: 1–4 hours. This is the scenario the T-24h backup verification exists for.

### D. Complete outage (Cloud region down, DNS broken)

1. Confirm scope in Lovable status / provider status pages before acting.
2. Post a status message on the marketing site if partially reachable, or via social if not.
3. Wait for provider recovery — do **not** attempt a domain re-point without a validated alternate host.

---

## Rollback communication template

```
INCIDENT — Startuplabs
Time: <UTC>
Impact: <what's broken, who's affected>
Trigger: <which threshold above>
Action: rolling back to version <ID> / reverting migration <name>
ETA: <minutes>
Owner: <name>
Next update: <time>
```

Post in team channel at trigger, at action, at resolution. Silence is the enemy.

---

## Post-incident (within 48h)

- Timeline reconstructed from Sentry + Lovable logs + chat transcript.
- Root cause identified — not "the migration broke it" but "the migration broke it *because* we didn't test X".
- One preventive action added to the readiness register with an owner.
- Cutover checklist updated so this class of failure gets caught at T-24h next time.
