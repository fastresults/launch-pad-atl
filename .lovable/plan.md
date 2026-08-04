# Sharper hero headlines for the eight build workshops

The current hero questions run long and read like survey prompts ("Where do your customers already spend their time?"). At hero scale they wrap to two lines and don't push anyone to type. Foundation stays exactly as-is.

Each replacement is short enough to hold one line, written as a direct command or a one-beat question that only has one answer — the thing they type into the box. Supporting prompt examples and the caption under the field are tightened to match.

## The new headlines

| Workshop | Now | New |
| --- | --- | --- |
| Brand | What should people feel when they find you? | Who do you want to be trusted by? |
| Website | What should your site get someone to do? | What should your site make people do? |
| Sales | What kind of clients do you want? | Name your dream client. |
| Email & CRM | Who's slipping through the cracks right now? | Who stopped replying? |
| Social | Where do your customers already spend their time? | Where are your buyers hiding? |
| Content | What do people ask you before they buy? | What do buyers ask you first? |
| AI ops | What are you doing by hand that's eating your week? | What's eating your week? |
| Legal & money | What's the part you've been avoiding? | What are you avoiding? |

Two are deliberate imperatives ("Name your dream client.") — the box under a command gets typed in more than the box under a question.

## Also tightened

- **Prompt examples** (the ghost text that types itself in the field): shortened to five to eight words each so the field reads as an easy answer, not an essay. Same meaning, fewer words.
- **Input labels** shortened to match the new question ("Name your dream client" instead of "Tell us the clients you want").
- **Captions** under the field keep the existing "We build X. You own it." pattern — that line is working and stays.

## Technical notes

- Single file: `src/lib/workshop-catalog.ts`, `BUILD_META` only — `heroQuestion`, `promptExamples`, `inputLabel` per slug.
- `FOUNDATION` object untouched.
- No component, layout, or data-shape changes; the hero already reads these fields.
