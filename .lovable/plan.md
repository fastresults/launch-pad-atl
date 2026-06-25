## Split title vs subtitle

Add a `subtitle` field to `BUILD_LAYER` so each card shows the short workshop name as the title and the punchy promise as the subtitle.

### Title / subtitle mapping

| Title (h3) | Subtitle (under title) |
|---|---|
| Build your brand | Your brand in a day. No agency required. |
| Convert your website | Build the site your customers actually buy from. |
| Own your social presence | 30 days of content before you leave the room. |
| Engineer your content | Rank, publish, repeat. Your content machine is live. |
| Run on AI | Automate 5 real workflows. Today. |
| Automate your revenue | 16 emails written. Your sales machine is running. |
| Close more sales | Walk out with a sales script that qualifies and closes. |
| Scaffold your business | Entity. Contracts. Books. Done. |

Existing `description` paragraphs stay as-is (the longer body copy under the subtitle).

### Files

1. `src/lib/framework-deliverables.ts` — add `subtitle: string` to `BuildLayerItem`, set old short names as `title` and current long lines as `subtitle`.
2. `src/components/home/HomeFramework.tsx` — render subtitle between `<h3>` and the description paragraph in the BUILD_LAYER grid (around lines 299–304), styled smaller-than-title, italic-leaning, muted-foreground/serif accent to feel like a tagline.
3. `src/lib/build-workshops.ts` + `src/lib/agency-services.ts` — revert `capability` strings back to the original short names ("Brand identity", "A website that converts", etc.) so workshop lookup keeps working. Use `capability === title` again (where title is now the short name).

Wait — the new titles ("Build your brand", "Convert your website"…) don't match existing capability keys either. Simplest: change the lookup to use a new stable `slug` or `capability` field on `BuildLayerItem` that mirrors `BUILD_WORKSHOPS[].capability`. I'll add `capability: string` (= old short label, e.g. "Brand identity") to each BUILD_LAYER item and switch the lookup to `w.capability === b.capability`, leaving `build-workshops.ts` and `agency-services.ts` untouched.

### Final BuildLayerItem shape

```ts
type BuildLayerItem = {
  icon: LucideIcon;
  title: string;        // "Build your brand"
  subtitle: string;     // "Your brand in a day. No agency required."
  description: string;  // existing paragraph
  capability: string;   // stable lookup key, e.g. "Brand identity"
};
```
