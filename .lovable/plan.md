## Plan: brute-force fix the missing business-case file

### What is actually wrong
- The project filesystem does contain `public/business-case.md` now.
- Your screenshot does not show it, which means the editor file tree is stale or the previous save happened after the screenshot state.
- The earlier mistake was saving first into `.lovable/business-case.md`; that folder only visibly exposes `plan.md`, so that location was the wrong place for a user-facing downloadable report.

### Fix I will implement
1. **Keep the report in a visible public location**
   - Ensure `public/business-case.md` exists and contains the full registration-focused business case.
   - This makes it available at `/business-case.md` in the browser.

2. **Add redundant downloadable formats**
   - Create `public/business-case.txt` with the same readable report content.
   - Create `public/business-case.html` as a clean browser-readable version with a visible title and formatted sections.
   - This avoids relying on one hidden/editor-specific file behavior.

3. **Add a visible index file in `public`**
   - Create `public/README-business-case.md` that plainly says where the files are:
     - `/business-case.md`
     - `/business-case.txt`
     - `/business-case.html`
   - This gives you a file-tree-visible pointer even if markdown preview behavior is confusing.

4. **Verify after writing**
   - List the `public` folder again.
   - Confirm all business-case files are present by filename.
   - Read the first lines of each file to confirm they are not empty.

### Acceptance criteria
- The file tree should show at least:
  - `business-case.md`
  - `business-case.txt`
  - `business-case.html`
  - `README-business-case.md`
- The report should be accessible in the browser at `/business-case.md` and `/business-case.html`.
- The content should be registration-focused, persuasive, and usable outside the app without opening `.lovable`.