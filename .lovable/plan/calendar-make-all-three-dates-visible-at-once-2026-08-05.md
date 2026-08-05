# Calendar: make all three dates visible at once

The three dates are being generated correctly — for Brand the page renders Aug 11, Sep 8, and Oct 13. The problem is the layout: each month is rendered as its own full-bleed page section with large vertical padding, so a single small card sits alone in an otherwise empty screen and the next date is a full scroll away. Filtered to one workshop, it looks like there is only one date.

## The fix

Collapse the month-per-section structure into one compact list.

- One section wraps the whole list instead of one section per month.
- Month becomes a small label/divider inside that list, not a page break.
- Day cards stack directly under each other with tight spacing.
- Each session row spans the full width of the card instead of sitting in a narrow left column.
- Result on a normal desktop screen: header, chips, and all three dates for the selected workshop visible without scrolling.

## Technical notes

- `src/routes/calendar.tsx` only. Replace the `months.map(...)` that emits a `SectionShell` per month with a single `SectionShell tinted` containing the month groups; render each month label with `SectionEyebrow muted` and reduce the wrapper spacing between months and days.
- Session `<li>` drops the `md:grid-cols-2` so a lone session fills the day card width.
- No changes to `src/lib/workshop-calendar.ts` or the schedule generator — the data is already correct.
