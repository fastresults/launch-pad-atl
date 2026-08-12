# Rewrite Foundation Workshop copy to an invitation tone

The current Foundation Workshop section is framed as a pain gap ("You have the idea. What you don't have is the first real thing." / "The cost of circling"). The user wants it rewritten as positive, encouraging, and assume the need — as if everyone is already in. This plan focuses on the Foundation workshop only, since that is the section shown in the screenshot and the recent "two ways in" work.

## What changes

### 1. Cost-of-circling section (the screenshot target)

Current location: `src/lib/workshop-products.ts` `PRODUCT_META.foundation` (`costEyebrow`, `costStat`, `costStatCaption`, `costBody`).

New direction:

- **Eyebrow:** replace "The cost of circling" with a warm invitation frame, e.g. "Your startup is waiting."
- **Headline:** replace the deficit headline with a confident, inclusive one. "You already have the idea. Let's make it the first real thing."
- **Stat card:** keep the 14 months number but reframe it as the distance we're about to close together, not a warning. Caption becomes something like "from idea to first dollar — if you try to do it alone. This morning changes that."
- **Body copy:** remove the "nothing is wrong" / "heavier and less likely" language. Write it as an invitation: assume the founder is showing up, name what they already bring, and describe what they will leave holding. No shame, no urgency fear.

### 2. Artifact preview

Keep the same live-page mock concept, but make the copy and stamp feel earned and celebratory rather than proof-of-completion.

- Stamp suggestion: "Built with you in the room · live by lunch"

### 3. Objections

Keep the questions, but answer them as confirmations that the user is already in the right place.

- For "I don't have the idea nailed down yet": "Perfect. Most people don't. That's what the morning is for."
- For "Can't I get all of this from AI for free?": "AI can write fast. But it won't look you in the eye and make sure you actually ship. The room does that."
- For "What if I can't build the rest myself?": "That's exactly why there are eight more mornings, or the option to hand it to our team. You won't be stuck."

### 4. Decision section (`WorkshopDecision` in `src/components/home/workshop/WorkshopOffer.tsx`)

Keep the two-card layout, but warm the header and body copy.

- **Eyebrow:** "Two ways in" → keep or soften to "Choose your seat."
- **Headline:** "Come sit with us, or join us over Zoom." → keep as-is, but make the supporting copy more inclusive. "Both lead to the same place. Pick the one that fits your life."
- **Atlanta card:** frame it as an invitation, not a conditional. "If you can be in the room, be in the room." → "Come build it in the room."
- **Closing line:** "Nobody walks away holding a plan. You walk away holding the thing." → keep; it already works.

### 5. Component-level notes

- No layout changes needed. Only copy edits in `src/lib/workshop-products.ts` and minor copy edits in `src/components/home/workshop/WorkshopOffer.tsx`.
- No backend changes. No new components. No new routes.

## Out of scope

- Other workshops (Brand, Website, Sales, etc.) keep their current pain-led copy unless separately requested.
- `RemoteSetupDialog` logic and submission flow are unchanged.

## Deliverables

- Updated `src/lib/workshop-products.ts` for Foundation section copy.
- Updated `src/components/home/workshop/WorkshopOffer.tsx` for the decision-section copy.
- Verify the section renders without errors and the tone reads as one cohesive invitation.
