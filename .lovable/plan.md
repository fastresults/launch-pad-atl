# Creative sign-off workflow

Every piece of creative — logos and brand kit, print/digital collateral, social covers, and content-studio ad creative — moves through a tracked review before it can reach the client showcase link. The agency submits, the founder approves, and only approved work publishes.

## The states

```text
draft ──submit──> in_review ──approve──> approved ──publish──> ready_to_publish
                     │  ^                                  
        request changes │  └── resubmit ── changes_requested
```

- **Draft** — freshly generated, internal only.
- **In review** — agency submitted it; the founder is on the clock.
- **Changes requested** — the founder wrote what's wrong; it goes back to the agency.
- **Approved** — the founder signed off.
- **Ready to publish** — approved and marked visible on the share link.

Only the founder (client) can move something to *approved* or *changes requested*. The agency submits, resubmits, and flips approved work to *ready to publish*. Every transition is stamped with who, when, and (for change requests) why.

## What the user sees

**Creative sign-off board** — a new view in the Operations dashboard listing all creative for the venture grouped by kind, each row showing a thumbnail, its state, who it's waiting on, and how long it's been sitting. Bulk "submit all drafts" for the agency; approve / request changes inline for the founder.

**In the studios** — Brand Studio, Social Studio, and Content Studio each get a small state pill on every asset card plus a sign-off action (submit, approve, request changes) matching the viewer's role. Change-request notes show under the asset so nobody has to hunt for the feedback.

**On the share link** — the founder sees only approved and ready-to-publish creative. Anything still in draft, in review, or with changes requested is withheld, and a quiet line explains the section is still in review rather than showing an empty panel. Preview mode for the agency renders everything with state badges so they can check before releasing.

**Ops runway tie-in** — the existing creative sign-off tasks (logo lockup, color/type lock, style-system publish, asset pack export) auto-complete when the matching creative reaches approved, so the runway reflects reality instead of double bookkeeping.

## Technical notes

**Database** (one migration):
- `venture_creative_reviews` — `snapshot_id`, `asset_kind` (`logo` | `brand_kit` | `collateral` | `social_cover` | `content_ad`), `asset_ref` (source row id or kit key), `state`, `submitted_at/by`, `decided_at/by`, `published_at`, `label`, `preview_path`. Unique on `(snapshot_id, asset_kind, asset_ref)`.
- `venture_creative_review_events` — append-only history: `review_id`, `from_state`, `to_state`, `actor_kind`, `actor_name`, `comment`.
- New enum `creative_review_state`. GRANTs for `authenticated` and `service_role` on both tables; RLS scoped to the snapshot owner plus `is_admin`, with share-token reads served through the service role in the edge function.

**Edge functions**:
- New `venture-creative-review`: actions `list`, `submit`, `approve`, `request_changes`, `publish`, `unpublish`. Dual auth mirroring `venture-ops` (share token for the client, JWT for the agency), with the approver rule enforced server-side — an agency identity calling `approve` gets a 403.
- `_shared/creative-registry.ts`: one function that enumerates a venture's creative from `venture_brand_kits`, `venture_brand_collateral`, `venture_social_assets`, and `venture_content_ads` into `{kind, ref, label, preview_path}`, and lazily creates missing `draft` review rows. Used by both the review function and the share builder.
- `venture-share`: filter each creative section through the review states before signing URLs, so withheld assets never get a URL in the payload.
- Regeneration already replaces assets via `_shared/replace-asset.ts`; the review row for a replaced ref resets to `draft` there so approval can't be inherited by new artwork.

**Frontend**:
- `src/lib/creative-review.ts` — types, state labels/classes, and the invoke helpers.
- `src/components/creative/CreativeSignoffBoard.tsx` — the board, reused by the ops dashboard route and the share-side Operationalize pane.
- `src/components/creative/CreativeStatePill.tsx` and `CreativeSignoffActions.tsx` — dropped into the three studio surfaces.
- `src/routes/v.$token.tsx` gains the founder-facing sign-off pane; the hub operations route gains the agency view.

## Order of work

1. Migration + enum.
2. Creative registry and the `venture-creative-review` function, verified with smoke tests.
3. Client library, state pill, and the sign-off board.
4. Studio surfaces (Brand, Social, Content).
5. Share-link gating and the founder pane.
6. Runway auto-completion for the creative tasks.
