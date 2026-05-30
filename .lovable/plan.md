## Problem

`/register` crashes with React error #300 ("rendered fewer hooks than expected"). The page shows the generic "This page didn't load" error boundary.

## Root cause

`src/routes/register.tsx` → `RegisterPage` calls `useQuery` for site settings, then does an **early return** based on the result:

```tsx
const { data: siteSettings } = useQuery({ queryKey: ["site-settings"], ... });
if (siteSettings?.register_variant === "selection") return <RegisterSelection />;

const [submitted, setSubmitted] = useState(false);
// ...many more useState / useQuery / useForm / useEffect hooks
```

On the first render `siteSettings` is `undefined`, so all ~10 downstream hooks run. As soon as the query resolves and the variant is `"selection"`, the component returns early — hook count drops — React throws #300 and the route's `errorComponent` renders "This page didn't load". This is exactly what the screen recording shows (page hydrates, then immediately swaps to the error UI).

The current admin config sets `register_variant = "selection"`, so this is the variant that should be showing — but the same bug would eventually fire for any user once settings hydrate to a non-default value.

## Fix

Split the route component so all hooks live inside the variant they belong to, and no hooks run after a conditional return.

1. Rename the existing `RegisterPage` body (everything from `useState(submitted)` through the returned JSX) into a new internal component `RegisterDefault` in the same file. It owns all the form/cohort/availability hooks.
2. Make `RegisterPage` a thin router:
   ```tsx
   function RegisterPage() {
     const fetchSettings = useServerFn(getPublicSiteSettings);
     const { data: siteSettings, isLoading } = useQuery({
       queryKey: ["site-settings"],
       queryFn: () => fetchSettings(),
       staleTime: 60_000,
     });
     if (isLoading) return null; // or a lightweight skeleton inside SiteHeader/Footer shell
     return siteSettings?.register_variant === "selection"
       ? <RegisterSelection />
       : <RegisterDefault />;
   }
   ```
   No other hooks run in `RegisterPage`, so the early branch is safe.
3. Leave `RegisterSelection.tsx` and `getPublicSiteSettings` untouched — the admin-driven AB switch keeps working as designed.

## Verification

- Load `/register` — should render the selection variant (current admin setting) without flashing the error boundary.
- Toggle `register_variant` back to the default in admin → `/register` renders the full form variant.
- Console: no more React #300 errors.
