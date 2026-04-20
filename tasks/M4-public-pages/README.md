# M4 — Public pages & polish

**Goal:** Guests (no auth) can enjoy the site. Landing, atlas, 404s, ToS/Privacy stubs, feedback form. Empty/loading states polished.
**Duration estimate:** 2 days.
**Exit criteria:**
- Non-authenticated visitor can: land on home, browse atlas, open any public project, switch modes, download postcard PNG
- Footer links to ToS, Privacy, feedback on every page
- Feedback form writes to `feedback` table
- 404 / error pages are styled in the design system

## Tasks

| ID | Title | Kind | Blocked by |
|----|-------|------|------------|
| M4-T001 | Public project page `(public)/[handle]/[slug]` | critical | M3 done |
| M4-T002 | Atlas page (global public list) | critical | M4-T001 |
| M4-T003 | Landing page | critical | M4-T001 |
| M4-P001 | 404 / error pages | parallel | any |
| M4-P002 | Loading + empty states across studio and public | parallel | any |
| M4-P003 | Terms of Service + Privacy Policy stubs | parallel | any |
| M4-P004 | Footer with ToS / Privacy / feedback links | parallel | M4-P003 |
| M4-P005 | Feedback form writing to `feedback` table | parallel | M4-P004 |
| M4-P006 | Social share OG image (per project) | parallel | M4-T001 |

## Content scope for ToS / Privacy

Beta scale. Minimal, honest. ~500 words each.
- ToS: this is a beta; content belongs to creators; we may delete spam; no warranty
- Privacy: we collect email and user content; we use Supabase (US/EU region); contact for deletion
- Do **not** ship without these — EU users + magic-link emails → GDPR territory
