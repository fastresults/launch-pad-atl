## Plan: stop the stale chatbot copy and replace the missed landing-page copy

### 1. Fix the real chatbot source, not just the visible UI
- Update the live chatbot knowledge corpus at `supabase/functions/venture-chatbot/knowledge.ts` anywhere it still implies:
  - “we actually build your startup”
  - “live page at your domain”
  - “first outreach sent from your inbox”
  - “real startup that pays you” as a guaranteed result
  - “everything you need for first revenue inside 14 days” as a promise instead of a target
- Keep the correct promise:
  - Startup Labs helps founders write the foundation their startup can build on.
  - The workshop nails the brand, product, marketing, and operational foundations.
  - The website output is a website PRD / AI-builder prompt, not a completed website.
  - Page setup, message sending, and implementation happen after the morning / same week, not in the room.

### 2. Fix the local chatbot knowledge copy too
- Mirror the same corrections in `src/lib/chatbot-knowledge.ts` so the source-of-truth copy and deployed chatbot corpus do not drift again.
- Add hard wording rules inside the chatbot knowledge:
  - Never say “we build your startup.”
  - Never say “you leave with a live page at your domain.”
  - Never say “your first outreach is sent from your inbox” unless describing post-workshop implementation.
  - Say “written foundation,” “website PRD,” “page copy,” “outreach copy,” and “operational assets” instead.

### 3. Fix the exact stale chatbot answer shown in the attachment
Replace the attached stale answer’s substance with this direction:

> In the room, we do not pretend to finish the entire startup before lunch. We write the foundation your startup can build on: the brand, one priced offer, the marketing copy and website PRD, and the operating assets that explain how money comes in and what happens after the yes.  
>  
> The page build, outreach sending, and follow-through happen after the workshop, using the work written with you in the room. The goal is a startup foundation clear enough that a banker, partner, first hire, or first customer can understand what you do in 60 seconds.

### 4. Fix the missed landing-page copy from the attachments
Update `src/components/landing/LandingFramework.tsx` and `src/components/landing/LandingFooter.tsx` where the copy currently says variants of:
- “setting up 3 Atlanta entrepreneurs in business”
- “build it with you”
- “a real business you can run with Monday”
- “One morning with us and a real business you can run with Monday”

Replace with more precise conversion copy:
- “Three Atlanta founders will leave with the written foundation for a startup they can build on immediately.”
- “Brand nailed. Offer priced. Marketing copy and website PRD written. Operations mapped.”
- “Free, in-person Atlanta workshop on August 20.”

### 5. Sweep adjacent stale marketing/public copy
- Search `public/`, `src/`, and `supabase/functions/` for stale phrases, especially:
  - `actually build your startup`
  - `real business you can run`
  - `live page at your domain`
  - `first outreach sent`
  - `page people can visit`
  - `offer they can buy`
  - `ready to take money`
- Update the public poster/social copy files only where they are still being used as current offer assets.

### 6. Redeploy and verify the live chatbot
- Deploy the `venture-chatbot` backend function after changing the knowledge file.
- Test the function with the exact prompt likely producing the screenshot, e.g. “What do I leave with?” and “What gets built in the room?”
- Confirm the response no longer contains any banned claims and does include:
  - brand foundation
  - priced offer/product foundation
  - marketing copy + website PRD
  - operational assets/foundation
  - same-week implementation framing

### 7. Final verification pass
- Run a final text search for the banned phrases across `src`, `supabase/functions`, and current public copy.
- Check the landing page and chatbot behavior in the preview so the visible page and live bot match the corrected promise.