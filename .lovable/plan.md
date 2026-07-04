## Change
In `src/routes/build.$slug.tsx`, add the workshop title into the "Upcoming dates" section so it's clear which workshop the dates belong to.

**Edit:** update the eyebrow line inside the schedule section from:

```
UPCOMING DATES
```

to:

```
UPCOMING DATES · {w.title}
```

(rendered inline with the calendar icon, matching the existing uppercase/tracking style).

No other changes. The `Pick your session. Reserve your seat.` headline and the date rows below stay as-is.