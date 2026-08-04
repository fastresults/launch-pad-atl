# Sharper hero headlines for the eight build workshops

The current hero questions run long and read like survey prompts ("Where do your customers already spend their time?"). At hero scale they wrap to two lines and don't push anyone to type. Foundation stays exactly as-is.

Every replacement is two to four words — a command, not a survey question. Short enough to sit on one line at hero scale, and each one leaves only one thing to type in the box. Supporting prompt examples and the input label are tightened to match.

## The new headlines

| Workshop | Now | New |
| --- | --- | --- |
| Brand | What should people feel when they find you? | Be impossible to ignore. |
| Website | What should your site get someone to do? | Make your site sell. |
| Sales | What kind of clients do you want? | Name your dream client. |
| Email & CRM | Who's slipping through the cracks right now? | Who stopped replying? |
| Social | Where do your customers already spend their time? | Where are your buyers? |
| Content | What do people ask you before they buy? | What do buyers ask? |
| AI ops | What are you doing by hand that's eating your week? | What's eating your week? |
| Legal & money | What's the part you've been avoiding? | What are you avoiding? |

Four are imperatives, four are one-beat questions. A box under a command gets typed in more than a box under a question, and the questions that remain are the ones a founder can answer instantly without thinking.


## Also tightened

- **Prompt examples** (the ghost text that types itself in the field): shortened to five to eight words each so the field reads as an easy answer, not an essay. Same meaning, fewer words.
- **Input labels** shortened to match the new question ("Name your dream client" instead of "Tell us the clients you want").
- **Captions** under the field keep the existing "We build X. You own it." pattern — that line is working and stays.

## Technical notes

- Single file: `src/lib/workshop-catalog.ts`, `BUILD_META` only — `heroQuestion`, `promptExamples`, `inputLabel` per slug.
- `FOUNDATION` object untouched.
- No component, layout, or data-shape changes; the hero already reads these fields.
