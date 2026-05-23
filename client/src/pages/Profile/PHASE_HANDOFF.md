# Athlete Private Profile Rebuild — Phase Handoff

Canonical source of truth for the multi-phase rebuild of the athlete private profile page. Read this before resuming work; do not re-derive state from chat history.

---

## ⚡ Resume here

**You are picking this up after Phase F shipped. Phase E was deferred behind Phase F (visual rebuild) and is next.**

When the user says some variant of *"let's begin Phase E"*:

1. **Do NOT start coding.** The user's standing rule: reach 90% confidence via clarifying questions before building any non-trivial deliverable. Phase E touches public views and adds a preview modal, so the first response on resume must be questions, not code.
2. **Re-confirm scope** with the user — read the [Phase E — polish + public-view passthrough (planned)](#phase-e--polish--public-view-passthrough-planned) section below and ask anything underspecified, in particular:
   - Where exactly the "Preview Public" entry point lives on `HeaderCard` (icon button next to contacts strip vs. on banner — propose, don't guess).
   - Mobile breakpoints to support (the existing `useIsDesktop` hook gates desktop layout — clarify how Phase E should treat each card on mobile).
   - Visibility-and-blur rules: which fields blur on the public view for unconnected viewers (per-field `publicVisibility` already covers email/phone; check whether socials use a separate per-platform `public` toggle or also gate on connection state).
3. **Hard rules to keep applying** (carried over from CLAUDE.md):
   - No emojis anywhere — code, UI, console, docs, commits.
   - End each phase with a Playwright headed viewport so the user can sign off before moving on.
   - Don't touch public profile views unless intentional. **Phase E is the one phase where public-view edits are allowed** — but only for the blurred-until-connected logic and visual QA; structural changes still need user sign-off.
4. **Last commit on `main`** at the time of this hand-off: `6b3ee7f` — Bump PROGRESS.md cursor to rename commit hash (2026-05-10). Phase D code is uncommitted; commit before starting Phase E. Run `git log --oneline -5` to confirm.
5. **Dev servers** must be running before any Playwright pass. See [Useful commands](#useful-commands) at the bottom.

### Phase status summary
- ✅ **Phase A** — schema migration, controllers, sanitizers, interests catalog endpoint, idempotent migration script.
- ✅ **Phase B** — read-only layout shipped and visually verified.
- ✅ **Phase C** — all 6 modals shipped (Modal #7 was folded into #6 at user's request), cleanup deletes complete, `ProfilePage` → `AthleteProfilePage` rename complete.
- ✅ **Phase D** — real Activity timeseries via 4 endpoints, all-time-total + window-delta UI, per-(tab,range) cache, new `3M` range chip, seed script.
- ✅ **Phase F** — visual rebuild to Claude Design 3-col layout (HeaderCard restructure, Experience/Education/NIL inline editing, Connection mini-cards redesigned, Activity & Strength filled card, AthleteConnectionsModal, schema coordinates + rating, seed script promoting ghosts to advisors). `ProfilePreviewModal` shell built and wired to connection-mini-card View buttons.
- ⏳ **Phase E** — *next.* HeaderCard "Preview Your Public Profile" button (modal shell already exists from Phase F — just wire the button), blurred-until-connected on public views, mobile responsive pass, visual QA.

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
- ~~**NEW**: `client/src/pages/Admin/PhaseAReviewPage.jsx` — Playwright review harness mounted at `/admin/phase-a-review`.~~ **Deleted in Phase C cleanup (2026-05-10).**
- ~~**MODIFIED**: `client/src/App.jsx` — added route `/admin/phase-a-review` under `PrivateRoute`.~~ Route removed in Phase C cleanup.

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
  interests:  [String],   // catalog values, min 5 (edited from inside Modal #6)
  nilPreferences: { dealSize, timeline, focusAreas: [String] },   // dealSize enum: 0-1k|1k-5k|5k-10k|10k-25k|25k-50k|50k-100k|100k+; focusAreas min 3
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
- **REWRITTEN** `client/src/pages/Profile/AthleteProfilePage.jsx` (renamed from `ProfilePage.jsx` in Phase C cleanup) — composes the layout. Uses a `useIsDesktop()` matchMedia hook (not Tailwind `md:` classes — Tailwind v4 utilities weren't reliably applied during initial render and caused both desktop and mobile blocks to mount). Mobile fallback stacks vertically. Loading/error states.
- ~~**MOVED** `client/src/pages/Profile/ProfilePage.jsx` → `ProfilePage.legacy.jsx.bak`~~ **Deleted in Phase C cleanup (2026-05-10).**

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

## Phase C — edit modals + backend writes (DONE)

The big build. Each pencil opens a focused edit modal with Save/Cancel + confirmation, hitting the existing `PUT /api/profile/me/athlete` (or `/interests`, `/nil-preferences`) endpoints with partial patches. Optimistic UI on save, revert on error.

### Modals (6 of 6 done — Interests merged into Modal #6)
1. ✅ **Modal shell + form primitives** — `EditModal` (overlay, header, footer with Save/Cancel), confirmation dialog ("Apply changes?"), dirty-check confirmation on Cancel ("Discard changes?"). Form primitives: `TextField`, `Textarea`, `Select`, `DateField`, `Toggle`, `ChipPicker`, `EntryList` (reorder via 3×3 bronze-dot drag handle, drag-and-drop). Supplementary primitives: `LocationField` (Photon US-cities typeahead with Remote pin + manual city + state-dropdown fallback), `SportField` (typeahead over 50 college sports + custom escape hatch).
2. ✅ **Identity + Bio + Contacts modal** — name, sport, position, school, classYear (numeric grad year, displayed as "Class of YYYY"), location (LocationField), aboutMe (≤400), email, phone, per-field public visibility toggles, inline banner + avatar uploads (file picker → `POST /api/upload`, persisted with the rest of the patch on Save).
3. ✅ **Socials modal** — 6 builtin platforms (Instagram, X/Twitter, TikTok, YouTube, LinkedIn, Facebook) with handle input + auto URL derivation + override link + per-platform public toggle. Plus an "Other platforms" section for unlimited custom rows (App name + Handle + Link). Render uses well-known glyphs (Reddit, Discord, GitHub, Twitch, Pinterest, Snapchat, Threads, Mastodon, Signal); anything else shows a single-letter initial tile. Server `socials.platform` enum dropped; `custom: bool` distinguishes builtin from user-added.
4. ✅ **Experience modal** — add/edit/delete entries; reorder via drag handle. Default sort: newest end date first. Fields: role (req), company (req), location, startDate (req), endDate (req, with Present checkbox), description (≤400). Logo auto-derived from company name (1–2 letters + deterministic color from a 10-color palette). End-before-start blocked.
5. ✅ **Education modal** — add/edit/delete/drag-reorder. Fields: school (req), degree (grouped dropdown over Pre-college / Associate / Bachelor's / Master's / Doctoral & Professional, with "Other (custom)" escape that flips to a free-text input), fieldOfStudy (free text), startYear (req, year-only), endYear (req, year-only with Present), description (≤400). Single-letter crest auto-derived from school name. Empty-state copy aligned to "No education added, yet." in both private and public views.
6. ✅ **NIL Preferences modal** (combined NIL + Interests) — `Select`s for deal size and timeline plus two `CatalogTypeahead` editors:
   - **Focus Areas** — catalog-only (`server/data/focusAreasCatalog.js`, ~45 entries across 8 categories: Finance & Tax, Legal, Marketing & Social, Brand & Business, Deals & Representation, Career & Development, Wellness & Performance, Education & Compliance). One-to-one match against advisor/agent expertise — no custom entries. **Min 3** enforced client + server.
   - **Interests** — catalog-only (existing `server/data/interestsCatalog.js`). **Min 5** enforced client + server.
   - **Single Save** fires `/me/nil-preferences` and/or `/me/interests` per dirty slice (no extra writes for fields the user didn't touch).
   - **Deal size enum replaced**: now `0-1k | 1k-5k | 5k-10k | 10k-25k | 25k-50k | 50k-100k | 100k+`. Legacy values (`100k-250k`, `250k-500k`, `500k-1m`, `1m-5m`, `5m+`) coalesced to `100k+` by the schema setter on next write; rendered as `$100K+` immediately via the read-side label map.
   - **focusAreas schema** converted from `[{title, description}]` to `[String]`; legacy object-shape docs coerced to strings on the next save.
   - **Card layout** — `NILPreferencesCard` rebuilt with two sub-sections (Focus Areas + Interests), each with a count badge next to its title and a horizontal-scroll `PillRail` clipped to ~2 pills with right/left edge-fade hints. Card height stays at the original 220px so the Activity & Strength card can expand into the freed right-rail space.
   - **`InterestsCard.jsx` deleted**; `ProfilePage` right-rail simplified from a 2-row grid to a single Activity & Strength cell.
   - New endpoint: `GET /api/profile/nil/focus-areas-catalog` (public, cacheable).

### Bug fixes shipped during Phase C
- **Login spinner-on-load**: `state.user.loading` was being persisted to `localStorage` via `redux-persist`. Any interrupted login/signup left `loading: true` in storage so the next mount rendered the Sign In button mid-spin before any user interaction. Fixed in `client/src/redux/store.js` with a redux-persist transform that strips `loading`/`error` (and `network.loading`/`error`) on write and resets them to safe defaults on rehydrate.

### Things to remember during Phase C
- All save buttons go through `profileService.updateAthleteProfile()` for everything except interests (which uses `updateAthleteInterests`) and NIL prefs (which has its own endpoint). The `/me/athlete` controller already accepts every field listed in the API surface above as partial patches.
- After save, refetch the bundle via `getAthleteProfileBundle` so the page reflects what's persisted.
- Save UX: optimistic update → PATCH → on error, revert local state + show error banner with the server's message.
- Mobile/responsive layout for the new private profile page is deferred — desktop-only for Phase C as well.

### Phase C cleanup punchlist — DONE (2026-05-10)
1. ✅ Renamed `ProfilePage` → `AthleteProfilePage` (isolated commit).
2. ✅ `PhaseAReviewPage.jsx` + `/admin/phase-a-review` route removed.
3. ✅ `PhaseCReviewPage.jsx` + `/admin/phase-c-review` route removed.
4. ✅ `ProfilePage.legacy.jsx.bak` removed.

---

## Phase D — real Activity & Strength data (DONE)

Stub line charts replaced with real timeseries. Verified headed at 1440×900: views/connections/received/sent across all six ranges render real data; Strength tab intact.

### Files
- **NEW** `server/controllers/profileStatsController.js` — `getActivityStats(req,res,next)`. Builds the window edges per range, fetches the metric's events from Mongo, bucketizes via binary search, returns `{points:[{t,v}], allTimeTotal, windowDelta, deltaPct, rangeLabel}`. Bucketing config:
  - `1D` → 24 hourly buckets, last 24h
  - `1W` → 7 daily buckets, last 7d
  - `1M` → 30 daily buckets, last 30d
  - `3M` → 90 daily buckets, last 90d
  - `YTD` → weekly buckets from Jan 1 → today
  - `1Y` → 12 monthly buckets, last 12 months
- **MODIFIED** `server/routes/profileRoutes.js` — added `GET /me/stats/:metric` under `verifyToken`.
- **NEW** `server/scripts/seedActivityStats.js` — synthetic backfill. Creates ghost users (role:'user', userType:'athlete') and inserts `ProfileView`, `Connection`, `ConnectionRequest` rows scattered across 365 days. `--clear` deletes all seed rows by `@phase-d-seed.signil.local` email match. Reads `process.env.MONGO || process.env.MONGO_URI` to match the server's actual env var name.
- **MODIFIED** `client/src/services/profileService.js` — added `getActivityStats(metric, range)`.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/ActivityStrengthCard.jsx` — fetches real stats keyed by `(metric, range)`, caches results in a module-level `Map` (per page mount), shows all-time total as the big number, delta line as `▲/▼/– ±N (X.X%) <rangeLabel>` with green/red/gray. Sparkline shows real points; flat dashed line in empty windows. New `3M` chip added to `RANGES`.

### Decisions locked
- **deltaPct math (Option A)**: `windowDelta / allTimeBeforeStart * 100`. Rationale: matches the stock-app mental model — % growth from where you started the window. On fresh accounts with most events recent, this naturally produces high percentages on long ranges (1Y can show 1750% if there were only 2 events before the year started). That's correct, not a bug.
- **Tab labels unchanged**: Profile Views | Connections | Received | Sent | Strength. "Connections" = mutual accepted (not requests).
- **Received/Sent count all `ConnectionRequest` statuses** (pending/accepted/rejected/cancelled), keyed by `createdAt`. Activity, not outcomes.
- **Connections data source**: `Connection.connectedAt` where `me ∈ {user1, user2}` and `status:'active'`. (Note: `Relationship.acceptedAt` from the original plan does not exist — the `Connection` model in `server/models/Relationship.js` is what was meant.)
- **Empty window**: flat zero series of correct length, total/delta = 0, percentage = 0% in gray (no division-by-zero — when `allTimeBeforeStart === 0`, deltaPct returns 0).
- **Cache**: per-`(tab,range)` `Map` lives for the component lifetime (resets on remount, e.g. after a save that refetches the bundle).

---

## Phase F — visual rebuild to Claude Design layout (DONE)

Replaces the Phase B/C layout with the new 3-column Claude Design layout. Backend semantics untouched — all editing flows, validation, and `profileService` writes preserved. Phase E was deferred behind Phase F at user's request.

### Layout (1440×900 desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│                        Header card                              │
├──────────────┬──────────────┬───────────────────────────────────┤
│  Experience  │  Education   │  NIL Preferences                  │
├──────────────┴──────────────┼───────────────────────────────────┤
│   Connection Center         │  Activity & Strength              │
└─────────────────────────────┴───────────────────────────────────┘
```
Grid: `gridTemplateColumns: '1fr 1fr 340px'`, `gridTemplateRows: '218px 260px minmax(0, 1fr)'`, gap 12. Page offset `SIDEBAR_W + 32 = 260` from left.

### Files
- **REWRITTEN** `client/src/pages/Profile/AthleteProfilePage.jsx` — 3-col grid template, NIL draft state lifted to page (commits via `/me/nil-preferences` and/or `/me/interests`), `AthleteConnectionsModal` mounts here.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/HeaderCard.jsx` — short banner + avatar overlap, single pencil next to name (opens combined Identity modal), About Me column with bronze eyebrow, dashed-border contact strip with `Eye`/`Lock` `PUBLIC`/`PRIVATE` badges + `+` button for socials. Connection count is a clickable button that opens `AthleteConnectionsModal`.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/ExperienceCard.jsx`, `EducationCard.jsx` — 34px square logo, 13px title, 12px org/school + `TypePill`, 11px dates, 2-line description clamp.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/NILPreferencesCard.jsx` — inline editing. Custom dropdown tile (portal-based, not `<select>`) for Deal Size + Timeline to fix oversized macOS popover. Pill rails for Focus Areas + Interests with `+` opening `FocusAreasModal` / `InterestsModal`. "UNSAVED CHANGES" Cancel/Confirm bar appears when the page-level `nilDraft` is non-null.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/ConnectionCenterCard.jsx` — `1fr 1fr 1fr 44px` grid with 32px circular bronze arrow opening the modal. Uses shared `ConnectionMiniCard`.
- **REWRITTEN** `client/src/components/Profile/athletePrivate/ActivityStrengthCard.jsx` — Strength tab rebuilt with 190px ring + scroll-down-for-todo. Metric tabs use design's faint-gold-highlight + inset bottom shadow active state. Range chips kept `3M`, now `flex:1` per chip and pinned to bottom via `marginTop: auto`.
- **NEW** `client/src/components/Profile/athletePrivate/FocusAreasModal.jsx`, `InterestsModal.jsx` — single-section catalog editors that **stage** selections into the page-level NIL draft (don't commit directly).
- **NEW** `client/src/components/Profile/athletePrivate/AthleteConnectionsModal.jsx` — 960px, navy backdrop with blur, search + Focus filter + Location filter (Any / 25 / 100 / Remote — haversine on `Profile.coordinates`, Remote = literal "remote" string OR missing location). Scoped to athlete private profile only; legacy `ConnectionsModal` still used elsewhere.
- **NEW** `client/src/components/Profile/athletePrivate/ProfilePreviewModal.jsx` — portal shell for in-page preview of a user's public profile. Currently triggered by Connection mini-card View. Phase E adds the HeaderCard "Preview public" button which mounts the same shell against the viewer's own bundle.
- **NEW** `client/src/components/Profile/athletePrivate/shared/CatalogTypeahead.jsx` — lifted from the now-deleted NILPreferencesModal; shared by FocusAreasModal + InterestsModal.
- **NEW** `client/src/components/Profile/athletePrivate/shared/ConnectionMiniCard.jsx` — the mini-card visual + `buildMiniCardData()` normalization. Stub rating/EXP/expertise/aboutMe fallbacks tagged `TODO: F4 cleanup`.
- **NEW** `client/src/utils/geo.js` — haversine + `isRemoteLocation`.
- **MODIFIED** `client/src/components/Profile/athletePrivate/shared/icons.jsx` — added `Users, DollarSign, Clock, Target, Heart, ExternalLink, MessageSquare, Search, X`.
- **MODIFIED** `client/src/components/Profile/athletePrivate/shared/primitives.jsx` — `Card` body wrapper now `display:flex; flexDirection:column` (was the root cause of the Activity chart not filling its container).
- **MODIFIED** `client/src/components/Profile/athletePrivate/shared/LocationField.jsx` — `onChange(v, coords)` second arg returns `{lat, lng}` for Photon picks, `null` for Remote / manual / no pick.
- **MODIFIED** `client/src/components/Profile/athletePrivate/IdentityModal.jsx` — captures `coordinates` from LocationField into draft, includes in PATCH when location changed.
- **MODIFIED** `server/models/Profile.js` — added `coordinates: {lat, lng}`, `rating: Number (0-5)`, `_seedTag: String (select:false)`.
- **MODIFIED** `server/controllers/profileController.js` — accepts `coordinates` on `/me/athlete` partial patch, surfaces it in the bundle.
- **NEW** `server/scripts/seedConnectionMiniCardStubs.js` — promotes Phase D ghost users to realistic advisors/agents (idempotent, `--user` to scope, `--apply` to write, `--clear` to undo). Pre-launch cleanup documented in CLAUDE.md.
- **DELETED** `client/src/components/Profile/athletePrivate/NILPreferencesModal.jsx` — replaced by inline NIL card + single-section FocusAreas/Interests modals.

### Decisions locked (Phase F)
- One pencil per card section; the HeaderCard pencil sits inline next to the user's name (not in the banner — user feedback).
- Deal Size enum: **keep the granular shipped set** (`0-1k`…`100k+`); don't switch back to the design's coarser buckets.
- 3M range chip on Activity card: **keep** (Phase D addition, not in design but user wants it).
- Density: comfortable only — no Tweaks toggle in shipped buildout.
- Stub mini-card data (rating/EXP/expertise/about): **DB seed (option B)**, not render-time stubs. Render-time stubs remain as last-resort fallback for unseeded users. Pre-launch cleanup required.
- View button on connection mini-card: opens in-page `ProfilePreviewModal` (same shell as the planned Phase E Preview-Public button).
- `AthleteConnectionsModal` is scoped to the athlete private profile only; the legacy `ConnectionsModal` still backs other surfaces.
- Distance filter: stored `coordinates` (option B), populated by LocationField. Older docs without coords are excluded from 25/100mi buckets. "Remote" matches both literal "remote" strings and missing locations.

---

## Phase E — polish + public-view passthrough (planned)

- **Preview Your Public Profile**: a "Preview public" button on the HeaderCard (next to the contacts strip or top-right of the banner area) that opens an in-page modal mounting `<AthletePublicView profile={bundle.profile} viewer={null} />`. Renders exactly what an unconnected stranger would see (blurred contacts, no private fields). Esc/Close drops the user back into editing without navigation. Reuses the existing `EditModal` portal shell (no overlay's footer Save/Cancel — preview-only, single Close button).
- "Blurred until connected" implementation on public views for email/phone/socials, gated by per-field `publicVisibility` and connection state.
- Cross-check that public views correctly read the migrated schema (experience/education arrays, consolidated socials).
- Mobile responsive pass for the private profile page.
- Smoke test: full edit cycle for each section, schema migration replay on a staging clone.
- Visual QA against the design's screenshots.

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

# Phase F — promote Phase D ghosts to realistic advisors (dev-only)
cd server && node scripts/seedConnectionMiniCardStubs.js --user <athleteId>            # dry-run
cd server && node scripts/seedConnectionMiniCardStubs.js --user <athleteId> --apply    # write
cd server && node scripts/seedConnectionMiniCardStubs.js --user <athleteId> --clear --apply   # undo
```

## Routes for the headed Playwright viewport

- `http://localhost:5173/profile/athlete` — the athlete private profile (post-Phase-D). All edit modals wired; `ActivityStrengthCard` shows real timeseries fetched from `/api/profile/me/stats/*`.

## Seed data (Phase D)

```bash
# Backfill for the test athlete account
cd server && node scripts/seedActivityStats.js --user 6941fc896016bb657e1f99cd
# Clear seed rows
cd server && node scripts/seedActivityStats.js --user 6941fc896016bb657e1f99cd --clear
```

Test account map (dev DB):
- `athlete@test.com` → `6941fc896016bb657e1f99cd` (John Admin, athlete)
- `advisor@test.com` → `6945e5e6654ba821282dc357`
- `agent@test.com` → `6945ee3158162f88734e68b3`
