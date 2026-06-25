
# Add an "Expectations + Team Evove" closing chapter to the Founder Roadmap

One new chapter, placed at the tail of the roadmap right before the final blockquote and sign-off, that sets honest expectations about the founder journey and positions Team Evove as the standing extended team they can call on.

## Where it goes

Insert as **Chapter 13 — The Road Ahead, and Who's With You**, immediately after Chapter 12 (Read Next From Your Kit) and **before** "The One Thing" and "Closing Note." This keeps the climactic single-move callout and personal sign-off as the true last words, while making sure the founder reads the expectations + Team Evove offer at the emotional crescendo of the document.

Updated tail order:

```
…
Chapter 12 — Read Next From Your Kit
Chapter 13 — The Road Ahead, and Who's With You   (NEW)
The One Thing
Closing Note
```

## What Chapter 13 says

Tone: honest, encouraging, never gloomy. Not a sales pitch. It frames the work ahead and then names the standing crew the founder already has access to.

Structure (added verbatim to the system prompt):

> **## Chapter 13 — The Road Ahead, and Who's With You**
>
> Open with one short paragraph, addressed to the founder by first name, that levels with them: every venture worth building costs hours, focus, money, and a piece of the founder's peace of mind. Name the three things this specifically will demand of them — pulled from the kit (e.g. fundraising stamina, hiring before you can afford it, selling before the product is finished). Encouraging, never gloomy.
>
> Then three labeled blocks (bold lead-ins, not headings):
>
> **What the next year will actually ask of you** — 3–4 lines on hours, focus, capital, and personal energy. Plain language. No clichés.
>
> **The decisions that will define this year** — 3–4 lines naming concrete decisions specific to this venture: the first hire, the funding moment, the channel bet, the pricing call. Drawn from the kit.
>
> **How to stay standing** — 3–4 lines on building the right team early, securing the right funding (not just any funding), and managing stress and logistics so the work compounds instead of eroding you.
>
> Then a clearly framed closing block titled **You're not doing this alone — Team Evove is here.**
>
> A 4–6 sentence paragraph in a warm partner voice, naming Team Evove as the standing extended team this founder can call on for advice, mentoring, and execution support: senior strategists, technologists, graphic designers, brand and growth specialists. Make it specific to where this venture is most likely to need help (pulled from the weakest pillars in earlier chapters). End with: *Whenever you need a second brain, a second pair of hands, or a sounding board — Team Evove is one message away.*

Tone rules carried from existing prompt apply: second person, founder's first name where appropriate, company name verbatim, no "AI-ese," no slogans.

## Files touched

- `supabase/functions/venture-generate-roadmap/index.ts`
  - Add the **Chapter 13** block above into `SYSTEM_PROMPT`, between Chapter 12 and "The One Thing."
  - Leave existing 45-day → 12-month continuity rule and QUALITY_SCORE trailer unchanged.

No other files change. The dialog already renders `Chapter N — …` H2s with the eyebrow + accent rule and auto-adds the sidebar nav entry, so the new chapter shows up correctly with no UI code change. DOCX/print stylesheet already covers it.

## Verification

1. Regenerate the roadmap on the current snapshot.
2. Confirm a new H2 **Chapter 13 — The Road Ahead, and Who's With You** appears just before "The One Thing," with the "Chapter 13" eyebrow rendered.
3. Spot-check: founder addressed by first name in the opening paragraph; specific decisions named (real hire, real funding moment, real channel) instead of generic founder advice.
4. Spot-check the **Team Evove** closing block: warm partner voice, specifically tied to this venture's weakest pillars from earlier chapters, ends on the "one message away" sentence.
5. Confirm "The One Thing" and "Closing Note" remain the final two sections.
6. Export to .docx and Print → new chapter renders cleanly.

## Out of scope

- No new CTA, button, or contact form for Team Evove (the document itself is the touchpoint).
- No schema changes, no new edge function, no new components.
