# Signil — repo notes for Claude

> **Read [`PROGRESS.md`](PROGRESS.md) first.** It's the cursor for the active project (athlete profile rebuild) — what's done, what's next, last commit. This file holds the durable repo conventions; PROGRESS.md holds the moving target.

Signil is an NIL (Name / Image / Likeness) marketplace connecting student-athletes with advisors and agents.

## Repo layout
- `client/` — Vite + React app. Dev: `cd client && npm run dev` → `http://localhost:5173`
- `server/` — Express + Mongoose API. Dev: `cd server && npm run start` → `http://localhost:8800`
- `client/src/config.js` — axios instance, reads `VITE_API_URL` (resolves to `http://localhost:8800/api` in dev), sends `Authorization: Bearer <token>` from `localStorage.token`
- Image storage: Cloudinary, wired via `POST /api/upload` (server/controllers/uploadController.js). Multer memory storage, returns `{url}`.

## Hard rules
- **No emojis.** Anywhere — code, UI, console, docs, commits. Use plain words or outline SVG icons (the `client/src/components/Profile/athletePrivate/shared/icons.jsx` set).
- **Ask questions to reach 90% confidence before building** non-trivial deliverables. The product owner prefers a clarifying-question turn over a wrong-build turn.
- **Phased rebuilds get visible review gates.** Each phase ends with a Playwright-headed viewport the user can interact with. Phase N+1 doesn't start until N is signed off.
- **Don't touch public profile views unless intentional.** `PublicProfilePage.jsx`, `AthletePublicView.jsx`, `AdvisorPublicView.jsx`, `UserPreviewCard.jsx` read the same Profile document the private page edits — schema changes propagate to them automatically. Forking shapes will break those views.

## Active project
**Athlete Private Profile rebuild** — replaces `client/src/pages/Profile/ProfilePage.jsx` (athlete role only) with a new design from a Claude Design handoff bundle. Phases A and B are complete and signed off; Phase C is next.

Canonical state lives in `client/src/pages/Profile/PHASE_HANDOFF.md`. Read that before resuming work on this project.

## Dashboard layout offset
The dashboard sidebar is `position: fixed`, 228px wide, with 16px left margin. Page content must offset by `SIDEBAR_W + 32 = 260px` from the left to clear it. The pattern in use:

```jsx
const SIDEBAR_W = 228
<div style={{ position: 'fixed', left: SIDEBAR_W + 32, right: 16, top: 16, bottom: 16, ... }} />
```

## Schema canon
After Phase A, the canonical Profile shape for athletes:
- `experience: [{ role, company, type, startDate, endDate, location, description, logoText, logoBg }]`
- `education: [{ school, degree, fieldOfStudy, startYear, endYear, description, logoText, logoBg }]`
- `socials: [{ platform, handle, url, public }]` (platforms: instagram, twitter, tiktok, youtube, linkedin, facebook)
- `interests: [String]` — catalog values from `server/data/interestsCatalog.js`, min 5 enforced server-side
- `nilPreferences: { dealSize, timeline, focusAreas: [{title, description}] }`
- `publicVisibility: { email: bool, phone: bool }`
- Backwards-compat virtuals on Profile: `socialMedia` (legacy `{instagram, twitter, tiktok}`) and `socialLinks` (legacy `{twitter, instagram, linkedin, facebook}`) — derived from `socials`. Public views still read `socialMedia`.

## Useful endpoints
- `GET /api/profile/me/bundle` — single-call read for the private profile page
- `GET /api/profile/interests/catalog` — public, cacheable, returns `{catalog: [{category, value}], minForCompletion: 5}`
- `PUT /api/profile/me/athlete` — accepts partial patches for any editable field
- `PUT /api/profile/me/interests` — array form, validated against catalog + min-5
- `PUT /api/profile/me/nil-preferences` — deal size, timeline, focus areas
- `POST /api/upload` — Cloudinary upload, returns `{url}`

## Migration
`server/scripts/migrateAthleteProfileShape.js` — idempotent, dry-run by default. `node server/scripts/migrateAthleteProfileShape.js` to preview, append `--apply` to write. Drops legacy fields (`jerseyNumber`, `height`, `weight`, `achievements`, `stats`, `yearsActive`, `website`, `socialLinks` raw, `socialMedia` raw), wipes legacy interests booleans (start fresh), initializes `publicVisibility` defaults.

<!-- Phase A/C review harnesses + the legacy ProfilePage backup were removed during Phase C cleanup (2026-05-10). -->

