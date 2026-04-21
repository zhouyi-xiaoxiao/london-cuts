---
id: F-P003
title: Port PDF export
milestone: M-fast
kind: parallel
status: DONE
blocked_by: [F-T006]
blocks: []
parallel_safe: true
touches:
  - web/lib/export/pdf.ts
  - web/tests/export-pdf.test.ts
owner: subagent-F-P003-via-opus-4.7-main
started_at: 2026-04-21T04:10Z
completed_at: 2026-04-21T04:30Z
---

# F-P003 — Port PDF export

## Why
Users have told us they want to print postcards. PDF export preserves bleed and exact print dimensions.

## Acceptance
- [ ] `exportPostcardPdf(postcardId)` in `web/lib/export/pdf.ts`
- [ ] Outputs 2-page PDF: page 1 = postcard front (art), page 2 = postcard back (message + address)
- [ ] Dimensions preserved: 148×105mm landscape or 105×148mm portrait
- [ ] Font embedding for caveat (handwriting) if needed
- [ ] Triggered by `EXPORT PDF` button in postcard editor
- [ ] Filename: `<project-slug>_<stop-slug>_postcard.pdf`

## Legacy references
- `archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx` — export section uses `jspdf`

## Steps
1. Confirm `jspdf` dep exists in `web/package.json`; if not, add (ask user).
2. Port the PDF generation function.
3. Wire button in `<PostcardEditor />`.

## Verification
- Export a known postcard → PDF opens correctly in Preview.app
- Print-preview shows correct dimensions

## Trace
