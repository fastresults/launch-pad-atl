## Change
In `src/routes/build.$slug.tsx`, add the workshop title above the date on each row in the "Upcoming dates" list.

**Edit:** inside the `<li>` for each session, prepend a small primary-color eyebrow line with `{w.title}` above the existing date/time block.

Row layout becomes:
```
Scaffold your business          [ Reserve → ]
Fri, Jul 10, 2026
1:30–4:00 pm ET
```

Styling: `text-xs uppercase tracking-[0.16em] text-primary` for the title line, matching existing eyebrow style. No other changes.