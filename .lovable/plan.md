# Logo Studio: one mark at a time, opened with a written brief

## What changes

Today every turn puts three roughs on the table at once. That makes the session feel like a slot machine — you judge three strangers instead of watching one mark being made. It also triples render time and cost per turn.

New shape:

1. **The designer opens with a brief.** Before anything is drawn, the studio writes a ~100-word design brief: who the business is, the human truth the mark must carry, the subject it proposes to draw, its construction, and the colours from the locked brand system. The founder reads it and either approves it or corrects it in their own words.
2. **One rough, drawn live.** On approval, a single rough is drawn from that brief and shown large.
3. **The session continues one mark at a time.** Each subsequent turn asks one question and redraws a single evolving mark rather than a fresh trio. Refinement is the same loop: say what to change, one new rough appears.
4. **History stays reachable.** Every rough drawn stays in the strip below the canvas, so going back a step or returning to an earlier mark is still possible — nothing good is lost by only drawing one at a time.

## Flow

```text
open  -> design brief (100 words)  -> [Approve brief] or [Correct it...]
                 ^                            |
                 |____ rewritten brief ______|
                                              v
        question + ONE rough  -> answer / refine -> ONE new rough -> ... -> approve -> trace -> commit
```

## Technical notes

- `_shared/logo-interview.ts`: the turn schema drops `art_direction` as an array of three and becomes a single `direction` object (`title`, `render_brief`). A new leading turn type returns `design_brief` (plain prose, ~100 words) with no rough attached; the system prompt is updated to open with a written brief and to develop one mark rather than three alternatives per turn.
- `venture-logo-studio/index.ts`: new actions `start_session` (returns the brief only, no render) and `approve_brief` / `revise_brief`. `drawSet` collapses to a single-render path; `answer` and `refine` each render exactly one rough. Session rows keep the brief text and the accumulated rough history unchanged, so no migration is needed — `steps[].roughs` simply holds one entry per step.
- `LogoStudio.tsx`: a brief card as the first screen with Approve / Correct actions, then a single large rough on the canvas with the question beside it, and the full rough history as a thumbnail strip for back-navigation.
- Approval, tracing, lockups and commit are untouched.
