---
id: F-T000
title: POC — port one trivial component end-to-end
milestone: M-fast
kind: critical
status: TODO
blocked_by: []
blocks: [F-T001, F-T002]
parallel_safe: false
touches:
  - web/components/postcard/style-picker.tsx
  - web/app/_poc/page.tsx
owner: null
started_at: null
completed_at: null
---

# F-T000 — POC: port one trivial component end-to-end

## Why
Before committing 5 days to a full port, verify the porting pipeline works with the smallest possible real slice. Produces:
- Confidence that JSX → TSX works
- A reference template for later ports
- An early red flag if anything unexpected breaks

## Acceptance
- [ ] A new component `web/components/postcard/style-picker.tsx` renders the 6 postcard-style labels used in legacy
- [ ] A temporary page `web/app/_poc/page.tsx` mounts the component for visual inspection
- [ ] Visiting http://localhost:3000/_poc shows the 6 styles with correct labels, matching order from legacy
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] Owner eyeballs it and says "continue"

## Legacy references
Read:
- `archive/app-html-prototype-2026-04-20/src/palette.jsx` (the 6 postcard styles are defined here)
- `archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx` (how the legacy picker uses them)

## Steps
1. Read the two legacy files above in full.
2. Identify the 6 style objects: `watercolour`, `vintage_poster`, `risograph`, `ink_watercolour`, `anime`, `art_nouveau` (names may differ slightly in legacy; use exact legacy labels).
3. Create `web/components/postcard/style-picker.tsx` with `'use client'` directive:
   - Typed `PostcardStyle` union (import from `@/lib/ai-provider`)
   - Typed `StyleMeta` record: `{ id, label, description, swatchColor }` for each
   - Component signature: `StylePicker({ value, onChange }: { value: PostcardStyle; onChange: (s: PostcardStyle) => void })`
   - Renders 6 buttons in a row, each showing label + small swatch
   - Highlight the currently-selected one
4. Create `web/app/_poc/page.tsx`:
   ```tsx
   'use client';
   import { useState } from 'react';
   import { StylePicker } from '@/components/postcard/style-picker';
   import type { PostcardStyle } from '@/lib/ai-provider';

   export default function PocPage() {
     const [style, setStyle] = useState<PostcardStyle>('watercolour');
     return <div style={{ padding: 40 }}><StylePicker value={style} onChange={setStyle} /></div>;
   }
   ```
5. Use design tokens from `design-system/colors_and_type.css` for colours and type — do not invent values.
6. Verify typecheck + build.
7. Start dev server, open `http://localhost:3000/_poc`, take a screenshot.

## Verification
- `curl -o /dev/null -w "%{http_code}" http://localhost:3000/_poc` → 200
- Visual compare to legacy: open `http://localhost:8000/#workspace`, find a stop, note the 6 style options — labels should match.

## Blockers
_none_

## Trace
