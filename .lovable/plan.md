## Update facilitator page copy

### Scope
Surgical text edits in two existing components. No new files, no structural changes, no dependency updates.

### Edits

**1. FacilitatorStory.tsx — "co-founded" → "founded", headquarters, continents**
- Paragraph 2: change "co-founded OPEN Interactive" to "founded OPEN Interactive".
- Update the headquarters clause from "now headquartered in Georgia" to "headquartered in the West Indies".
- Append "OPEN Interactive serves three continents." to the same paragraph or the next logical sentence.

**2. FacilitatorTimeline.tsx — timeline item 2009**
- Change title from "Co-founded OPEN Interactive" to "Founded OPEN Interactive".
- Update description: replace "Now operating globally with Pathways PR as its communications division." with language that includes the West Indies headquarters and three-continent reach.

**3. FacilitatorStory.tsx — tech stack paragraph (bottom)**
- Replace the explicit tool list "Claude, Lovable.dev, Supabase, and fal.ai" with general, current language about the latest bleeding-edge AI tools, frameworks, and infrastructure he uses to ship products and share with workshop audiences.
- Keep the same sentence structure and tone: "He actively ships SaaS products using [updated language], and teaches from a hands-on playbook built in the field — not borrowed from a textbook."

### Acceptance criteria
- Build passes with no TypeScript or lint errors.
- No other copy on the facilitator page is changed.
- Desktop and mobile preview renders correctly.