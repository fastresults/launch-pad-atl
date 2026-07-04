## Goal
Make it unmistakable that `/schedule` is the agenda for the **Strategic Foundation Workshop** (the in-person morning workshop). Right now the page opens with "Idea in. Launch plan out." with no workshop name in sight.

## Changes — `src/routes/schedule.tsx` (hero section only)

1. **Add an eyebrow label above the date line** — small uppercase tag reading `Strategic Foundation Workshop · Agenda`, styled like the existing eyebrow tokens (`text-xs uppercase tracking-[0.18em]`) but using the brand gradient text (`text-gradient-brand`) so it visually anchors the page.

2. **Move the date/time line to sit under the eyebrow** as a secondary meta line (unchanged copy: `{EVENT.dateLabel} · {EVENT.timeLabel}`), so the hierarchy becomes:
   - Workshop name (eyebrow)
   - Date · time (meta)
   - H1 "Idea in. Launch plan out."
   - Existing sub-paragraph

3. **Tighten the H1 sub-paragraph** to name the workshop once in prose: change "One morning. Four working stages…" to "The Strategic Foundation Workshop is one morning. Four working stages. By 11:30 AM you walk out with the full plan in your hands and a signed, dated 90-day playbook for what to do next."

4. **Footer CTA tile heading** — change "One day. One door. Twenty seats." to keep the punch but reinforce identity: leave the H3 as-is and add a small eyebrow above it reading `Strategic Foundation Workshop`, same styling as the hero eyebrow. This ties the bottom of the page back to the workshop name.

5. **Browser tab title** — the route currently inherits the default `<title>`. Add a `<title>` update via a lightweight `useEffect` at the top of `SchedulePage` setting `document.title = "Schedule — Strategic Foundation Workshop"` on mount (matches the pattern used elsewhere in the app; no new deps).

## Out of scope
- No changes to `SCHEDULE`, `STAGES`, timeline rendering, day-at-a-glance rail, or session content.
- No changes to routing, cohort data, or the register flow.
- No changes to other workshop pages (`/build/*`) — those already carry their own workshop names.

## Verification
- Load `/schedule`: hero shows "Strategic Foundation Workshop · Agenda" eyebrow above the date, prose paragraph names the workshop, browser tab reads "Schedule — Strategic Foundation Workshop".
- Footer CTA tile shows the workshop eyebrow above "One day. One door. Twenty seats."
- Timeline, stage anchors (`#stage-N`), and the "Reserve your seat" link are unchanged.
