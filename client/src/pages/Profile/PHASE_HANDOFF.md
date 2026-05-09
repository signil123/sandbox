# Athlete Private Profile Rebuild — Phase Handoff

Canonical source of truth for the multi-phase rebuild of the athlete private profile page. Read this before resuming work; do not re-derive state from chat history.

**Status as of 2026-05-03:** Phase A and Phase B complete and signed off. Phase C is next.

---

## Project goal

Replace the existing athlete private profile page (`/profile/athlete`) with a new layout from a Claude Design handoff bundle. Edits made on the private page propagate to the public profile views (`PublicProfilePage`, `AthletePublicView`, `UserPreviewCard` "Recommended For You" cards) because they read the same Profile document.

**Public views are intentionally untouched.** Don't refactor them.

---

## Decisions locked

- **Scope**: athlete private profile page only. Advisor and agent profiles unchanged.
- **Edit pattern**: one pencil per section, opens a focused modal scoped to that card, Save/Cancel with confirmation dialog, partial PATCH to existing controllers.
- **Sections with pencils**: Header (identity + bio + contacts in one modal), Socials, Experience, Education, NIL Preferences, Interests.
- **Sections without pencils**: Connection Center, Activity & Strength.
- **No Tweaks panel** — that was a prototype debug surface, omitted entirely.
- **Backend**: real MongoDB writes via the existing `profileService` endpoints. No local-only state.
- **Image storage**: Cloudinary (already wired). All image uploads go through `POST /api/upload`.
- **Visibility**: per-field `publicVisibility.{email, phone}` on the Profile; per-platform `public: bool` on each social. Email/phone/socials default public, are blurred-until-connected on public views, and can be made permanently private by the user.
- **Interests rule**: catalog-only (128 catalog values across 12 categories), minimum 5 selections enforced both client-side (Save button disabled) and server-side (400 error if bypassed).
- **No emojis. Anywhere.** Use plain words or outline SVG icons (the `shared/icons.jsx` set).
- **Charts in Phase B**: stubbed with deterministic seeded data. Real timeseries comes in Phase D.
- **Connection Center**: top 3 most recently accepted connections, Message-only button (no Connect — these are already accepted).
- **Education** has an optional `fieldOfStudy` field added.
- **`locationPreference` kept** in schema (used as a filter on the Explore page).

---

## Phase A — schema + API (DONE)

Schema migrated, controllers rewritten, catalog endpoint live.

### Files
- **NEW**: `server/data/interestsCatalog.js` — 128 interests across 12 categories. Exports `INTERESTS_CATALOG`, `INTERESTS_VALUES`, `INTERESTS_VALUE_SET`, `MIN_INTERESTS_FOR_COMPLETION` (=5). Frozen at module load.
- **MODIFIED**: `server/models/Profile.js` — converted `experience`/`education` from `String` to typed arrays matching the public view's read shape; replaced 10-boolean `interests` object with `[String]`; consolidated `socialLinks` + `socialMedia` into single `socials: [{platform, handle, url, public}]` array; added `publicVisibility: {email, phone}`; dropped `jerseyNumber`, `height`, `weight`, `achievements`, `stats`, `yearsActive`, `website`, raw `socialLinks`, raw `socialMedia`. Added backwards-compat virtuals: `socialMedia`, `socialLinks`, `activeInterests` (legacy boolean shape still readable through these).
- **MODIFIED**: `server/controllers/profileController.js` — rewrote `updateProfile`, `updateAthleteProfile`, `updateAthleteInterests`. Added `getInterestsCatalog`. Added per-section sanitizers (`sanitizeExperienceEntry`, `sanitizeEducationEntry`, `sanitizeSocialEntry`). Required-field guards on identity (name, sport, position, school, classYear). Email format validation. Banner Cloudinary cleanup added. `hasActiveInterests` updated to handle the array shape. Bundle response includes `experience`, `education`, `socials`, `publicVisibility`; drops legacy fields.
- **MODIFIED**: `server/routes/profileRoutes.js` — added `GET /interests/catalog`.
- **NEW**: `server/scripts/migrateAthleteProfileShape.js` — one-time idempotent migration. Dry-run by default; pass `--apply` to write. Wipes legacy interests, drops `String` experience/education values (start fresh), consolidates legacy social fields into the new array, initializes `publicVisibility` defaults.
- **MODIFIED**: `client/src/services/profileService.js` — added `getInterestsCatalog()` (memoized); `updateAthleteInterests` now sends array shape.
- **NEW**: `client/src/pages/Admin/PhaseAReviewPage.jsx` — Playwright review harness mounted at `/admin/phase-a-review`. Verifies catalog endpoint (128 items, 12 categories), bundle shape (10 structural assertions), round-trip writes for each section, interests min-5 validation. Sidebar offset uses `paddingLeft: max(24px, 260px)`.
- **MODIFIED**: `client/src/App.jsx` — added route `/admin/phase-a-review` under `PrivateRoute`.

### API surface (canonical)
- `GET /api/profile/me/bundle` — primary read for the private page
- `GET /api/profile/interests/catalog` — `{catalog: [{category, value}], minForCompletion: 5}`, public + cacheable
- `PUT /api/profile/me/athlete` — accepts partial patches for any of: `name`, `sport`, `school`, `position`, `classYear`, `location`, `locationPreference`, `aboutMe`, `email`, `phone`, `publicVisibility`, `profileImage`, `photo`, `bannerImage`, `experience`, `education`, `socials`, `interests`
- `PUT /api/profile/me/interests` — array form, validated against catalog + min-5
- `PUT /api/profile/me/nil-preferences` — `{dealSize, timeline, focusAreas}`
- `POST /api/upload` — Cloudinary, returns `{url}`. Images ≤10MB.

### Schema shape (canonical)
```
Profile {
  user, profileType: 'athlete',
  // identity
  sport, school, position, classYear,
  location, locationPreference,
  // images
  profileImage, photo, bannerImage,
  // bio + contacts
  aboutMe, bio,
  publicVisibility: { email: bool, phone: bool },
  // structured arrays (Phase A canonical)
  experience: [{ role, company, type, startDate, endDate, location, description, logoText, logoBg }],
  education:  [{ school, degree, fieldOfStudy, startYear, endYear, description, logoText, logoBg }],
  socials:    [{ platform, handle, url, public }],   // platforms: instagram|twitter|tiktok|youtube|linkedin|facebook
  interests:  [String],   // catalog values, min 5
  nilPreferences: { dealSize, timeline, focusAreas: [{title, description}] },
}
// email + phone live on User, not Profile.
```

---

## Phase B — read-only layout (DONE)

New layout shipped, populated profile verified visually in headed Playwright.

### Layout (1440×900 desktop)
```
┌──────────────────────────────────────────────────────────┐
│                     Header card                          │
├─────────────────────────┬────────────────────────────────┤
│  Experience │ Education │  NIL Preferences               │
│─────────────┴───────────│  Interests (h-scroll)          │
│  Connection Center      │  Activity & Strength           │
└─────────────────────────┴────────────────────────────────┘
```

Grid: `gridTemplateColumns: '1fr 360px'`, `gridTemplateRows: '340px 220px minmax(0, 1fr)'`. Page is fixed-position offset by `SIDEBAR_W + 32 = 260px` from the left.

### Files
- **NEW** `client/src/components/Profile/athletePrivate/shared/icons.jsx` — outline SVG icon set (Pencil, Plus, Camera, ChevronRight/Left/Down, ArrowRight, Mail, Phone, Pin, Lock, Eye, social brand glyphs in `SOCIAL_ICONS`).
- **NEW** `client/src/components/Profile/athletePrivate/shared/primitives.jsx` — `Card`, `EditPencil` (disabled in Phase B, wired in Phase C), `Pill`, `ProgressRing` (red <50, amber 51-79, green 80+), `FadeScroll`, `EmptyState`.
- **NEW** `client/src/components/Profile/athletePrivate/HeaderCard.jsx` — banner with absolutely-positioned avatar (overlaps banner bottom by half), identity column (name + sport·position + school·class + location + connection count), about-me column, full-width contact strip with email/phone visibility badges + socials row + add-social button + edit pencil. Connection count fetched live via `connectionService.getNetwork(userId)`, defaults to 0.
- **NEW** `client/src/components/Profile/athletePrivate/ExperienceCard.jsx` — reads `bundle.profile.experience`. Shows logo + role + company + type chip + dates + location + description.
- **NEW** `client/src/components/Profile/athletePrivate/EducationCard.jsx` — reads `bundle.profile.education`. Shows logo + school + degree·fieldOfStudy + years + description.
- **NEW** `client/src/components/Profile/athletePrivate/NILPreferencesCard.jsx` — deal size + timeline + focus area chips. Filters out non-string focus area values defensively.
- **NEW** `client/src/components/Profile/athletePrivate/InterestsCard.jsx` — horizontal-scroll pills with edge fade mask.
- **NEW** `client/src/components/Profile/athletePrivate/ActivityStrengthCard.jsx` — inline tab nav (Profile Views / Connections / Received / Sent / Strength) with gold-underline active state. Range chips (1D/1W/1M/YTD/1Y) hidden on Strength tab. Metric tabs render a deterministic seeded sparkline (stub data per agreement). Strength tab renders real ProgressRing + missing-fields list computed from 15 weighted checks (totals 100): name, sport, position, school, classYear, location, bio length, photo, banner, ≥1 experience, ≥1 education, ≥2 socials, ≥5 interests, NIL focus areas, email. NIL data read from `bundle.nilPreferences` (top level), not `bundle.profile.nilPreferences`.
- **NEW** `client/src/components/Profile/athletePrivate/ConnectionCenterCard.jsx` — top 3 most recently accepted connections + "See all" arrow that opens existing `ConnectionsModal`. Mini cards have Message-only button. Defensive response shape parsing for `connectionService.getNetwork`.
- **REWRITTEN** `client/src/pages/Profile/ProfilePage.jsx` — composes the layout. Uses a `useIsDesktop()` matchMedia hook (not Tailwind `md:` classes — Tailwind v4 utilities weren't reliably applied during initial render and caused both desktop and mobile blocks to mount). Mobile fallback stacks vertically. Loading/error states.
- **MOVED** `client/src/pages/Profile/ProfilePage.jsx` → `ProfilePage.legacy.jsx.bak` (backup of old 2054-line page; safe to delete once Phase C signs off).

### Verified working
The user populated their account with full sample athlete data via `mcp__playwright__browser_evaluate` (6 PUT calls, all 200) and visually confirmed every section renders correctly:
- Header: name + pencil, sport · position, school · class, location + connection count, About Me + pencil, contact strip with email PUBLIC, phone PRIVATE, 5 social icons (LinkedIn shown private with lock badge), `+` button, contacts pencil
- Experience (4 entries with logos, type chips, dates, locations, descriptions)
- Education (2 entries with degree + fieldOfStudy, years, descriptions)
- NIL Preferences (deal size, timeline, 4 focus area chips)
- Interests (12 pills, horizontal scroll)
- Connection Center (top 3 + see-all)
- Activity & Strength: line chart on metric tabs, ring + missing-list on Strength tab

---

## Phase C — edit modals + backend writes (NEXT)

The big build. Wire each pencil to a focused edit modal with Save/Cancel + confirmation, hitting the existing `PUT /api/profile/me/athlete` (or `/interests`, `/nil-preferences`) endpoints with partial patches. Optimistic UI on save, revert on error.

### Modals to build (one PR per modal, or grouped — TBD with user)
1. **Modal shell + form primitives** — `EditModal` (overlay, header, footer with Save/Cancel), confirmation dialog ("Apply changes?"), dirty-check confirmation on Cancel ("Discard changes?"). Form primitives: `TextField`, `Textarea`, `Select`, `DateField`, `Toggle`, `ChipPicker`, `EntryList` with reorder via ↑↓ buttons.
2. **Identity + Bio + Contacts modal** (single modal per user spec) — name, sport, position, school, classYear, location, aboutMe, email, phone. Per-field public visibility toggles on email and phone. Required-field validation (name, sport, position, school, classYear). Banner image and profile photo edit affordances inline (or as small sub-modals) — file picker → `POST /api/upload` → store secure_url.
3. **Socials modal** — 6 platforms listed, each row: handle + URL inputs + per-platform public toggle. Empty handle hides the platform from the header card.
4. **Experience modal** — add/edit/delete/reorder entries. Per-entry fields: role, company, type (Endorsement/Athletic/Community), startDate, endDate, location, description, logoText (initials, ≤4 chars), logoBg (color or generator from organization name).
5. **Education modal** — add/edit/delete/reorder. Fields: school, degree, fieldOfStudy (optional), startYear, endYear, description, logoText, logoBg.
6. **NIL Preferences modal** — deal size dropdown (existing enum), timeline dropdown (existing enum), focus area chip picker (title + optional description per chip).
7. **Interests modal** — search bar over the catalog (fetched once via `getInterestsCatalog`), click to add, hover-X to remove, "Selected (n/5)" counter, **Save button disabled until ≥5 selected**, server-side error toast as backstop.

### Things to remember during Phase C
- All save buttons go through `profileService.updateAthleteProfile()` for everything except interests (which uses `updateAthleteInterests`) and NIL prefs (which has its own endpoint). The `/me/athlete` controller already accepts every field listed in the API surface above as partial patches.
- After save, refetch the bundle via `getAthleteProfileBundle` so the page reflects what's persisted.
- Save UX: optimistic update → PATCH → on error, revert local state + show error banner with the server's message.
- Pencils on Header have `disabled={false}` once Phase C ships. Currently disabled. The disabled state is rendered via `EditPencil`'s `disabled` prop in `shared/primitives.jsx`.
- After Phase C ships, **delete** the Phase A review harness (`client/src/pages/Admin/PhaseAReviewPage.jsx` + the `/admin/phase-a-review` route in App.jsx) and the legacy backup (`client/src/pages/Profile/ProfilePage.legacy.jsx.bak`).
- Mobile/responsive layout for the new private profile page is deferred — desktop-only for Phase C as well.

---

## Phase D — real Activity & Strength data (planned)

Replace the stub line charts with real timeseries.

- New endpoints: `GET /api/profile/me/stats/{profile-views|connections|requests-received|requests-sent}?range=1D|1W|1M|YTD|1Y`. Each returns `{points: [{t:Date, v:Number}], total:Number, deltaPct:Number}`.
- Server-side: bucket `ProfileView.lastViewedAt`, `Relationship.acceptedAt`, `ConnectionRequest.createdAt` (incoming and outgoing) by range.
- Client-side: `ActivityStrengthCard` swaps stub `seededSeries` for a real fetch keyed by `(activeTab, range)`. Loading + error states per tab.

---

## Phase E — polish + public-view passthrough (planned)

- "Blurred until connected" implementation on public views for email/phone/socials, gated by per-field `publicVisibility` and connection state.
- Cross-check that public views correctly read the migrated schema (experience/education arrays, consolidated socials).
- Mobile responsive pass for the private profile page.
- Smoke test: full edit cycle for each section, schema migration replay on a staging clone.
- Visual QA against the design's screenshots.
- Delete the Phase A harness and legacy ProfilePage backup.

---

## Active issues to watch

- **`avatar fallback initials never appear** when the user has any `profileImage` in their User record (most do, even if it's a default seeded photo). The HeaderCard already filters out `unsplash` and `placeholder` patterns; extend that filter if more default-photo URLs surface.
- **`Connection count` on the header reads from `connectionService.getNetwork(userId).length`. If the endpoint response shape changes, the defensive parser in HeaderCard's `useEffect` may need an additional fallback path.
- **NIL focus areas in Strength check**: read from `bundle.nilPreferences?.focusAreas` (top level), NOT `bundle.profile.nilPreferences` — that was a fix during Phase B review.

---

## Useful commands

```bash
# Dev servers
cd server && npm run start       # http://localhost:8800
cd client && npm run dev         # http://localhost:5173

# Migration (dry run)
cd server && node scripts/migrateAthleteProfileShape.js
# Migration (actually write)
cd server && node scripts/migrateAthleteProfileShape.js --apply
# Migrate a single user
cd server && node scripts/migrateAthleteProfileShape.js --apply --user <userId>
```

## Routes for the headed Playwright viewport

- `http://localhost:5173/profile/athlete` — the new private profile (Phase B)
- `http://localhost:5173/admin/phase-a-review` — the schema review harness (delete after Phase C)
