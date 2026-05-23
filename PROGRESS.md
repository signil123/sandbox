# Progress

One-screen cursor for the **athlete private profile rebuild**. Updated alongside every commit. For full context, decisions, schema, and rationale, read [`client/src/pages/Profile/PHASE_HANDOFF.md`](client/src/pages/Profile/PHASE_HANDOFF.md) — that file has a "Resume here" header at the top with everything a fresh session needs.

---

## Cursor

- **Active phase:** Phase E — Preview-Public modal entry point (deferred behind Phase F)
- **Last commit:** `6b3ee7f` — Bump PROGRESS.md cursor to rename commit hash (2026-05-10)  *(uncommitted: Phase D + Phase F code)*
- **Last touched by Claude:** 2026-05-15 — Phase F complete. Visual rebuild to Claude Design 3-col layout shipped: F1 grid + HeaderCard (single pencil next to name, short banner, About Me column, contact strip with PUBLIC/PRIVATE eyebrows + Plus social), F2 Experience/Education/NIL inline editing (custom dropdown for Deal Size/Timeline replaces native select to fix oversized macOS popover, draft+Confirm bar, single-section FocusAreas/Interests modals), F3 Connection mini-cards (gradient banner + expertise pills + EXP/RATING/CONNECTIONS + View/Message) and Activity & Strength layout (190px ring, fill-to-bottom chart, range chips pinned). F3 polish: new AthleteConnectionsModal (replaces legacy ConnectionsModal on this surface only), Profile schema gained `coordinates` + `rating`, distance filter haversine + Remote matching. F4 cleanup: F4 seed `seedConnectionMiniCardStubs.js` promotes Phase D ghosts into realistic advisors. NILPreferencesModal.jsx deleted (replaced by inline card + single-section modals). Verified headed at 1440×900.

## On resume ("let's begin Phase E")

Open [`PHASE_HANDOFF.md`](client/src/pages/Profile/PHASE_HANDOFF.md) → "Resume here" section. Phase E covers the HeaderCard "Preview public" entry point that mounts `<AthletePublicView>` inside `ProfilePreviewModal` (modal shell already built in Phase F for connection mini-card View buttons). Also still on the list: blurred-until-connected on public views, mobile responsive pass, visual QA. Apply the 90%-confidence rule — clarifying questions before code.

## What's done

- ✅ **Phase A** — schema migration, Profile model rewritten, controllers + sanitizers, interests catalog endpoint, idempotent migration script
- ✅ **Phase B** — read-only layout shipped (HeaderCard, ExperienceCard, EducationCard, NILPreferencesCard, InterestsCard, ConnectionCenterCard, ActivityStrengthCard, shared primitives + outline icons)
- ✅ **Phase C modal #1** — `EditModal` shell + form primitives (`TextField`, `Textarea`, `Select`, `DateField`, `Toggle`, `ChipPicker`, `EntryList`); supplementary `LocationField` (Photon US-cities typeahead) and `SportField` (50 college sports + custom escape)
- ✅ **Phase C modal #2** — Identity + Bio + Contacts modal (banner + avatar inline upload, all required-field validation)
- ✅ **Phase C modal #3** — Socials modal (6 builtin + unlimited custom platforms with well-known glyphs / single-letter fallback)
- ✅ **Phase C modal #4** — Experience modal (drag-handle reorder, newest-first sort, end-before-start guard, auto logo)
- ✅ **Phase C modal #5** — Education modal (grouped degree dropdown with "Other" escape, free-text fieldOfStudy, year-only pickers, single-letter crest)
- ✅ **Phase C modal #6** — NIL Preferences modal (deal size + timeline dropdowns, **Focus Areas** typeahead with min-3 against new `focusAreasCatalog`, **Interests** typeahead with min-5 against existing `interestsCatalog`). Single Save fires `/me/nil-preferences` and/or `/me/interests` per dirty slice. Card now hosts both sub-sections inside the original 220×360 footprint; each sub-section has a count badge and a horizontal-scroll pill rail (clipped at ~2 pills with edge-fade hint). `InterestsCard` deleted; Activity & Strength expanded to fill the freed right-rail space. Deal size enum replaced (`0-1k`, `1k-5k`, `5k-10k`, `10k-25k`, `25k-50k`, `50k-100k`, `100k+`); legacy values coalesced to `100k+` by schema setter and rendered as `$100K+`. Schema for `focusAreas` converted from `[{title, description}]` to `[String]`.
- ✅ **Phase C cleanup (deletes)** — removed `PhaseAReviewPage.jsx` + `/admin/phase-a-review` route, `PhaseCReviewPage.jsx` + `/admin/phase-c-review` route, and the `ProfilePage.legacy.jsx.bak` backup. App.jsx imports stripped.
- ✅ **Phase C cleanup (rename)** — `ProfilePage` → `AthleteProfilePage` (file + export + import). **Phase C is now fully complete.**
- ✅ **Bug fix** — login spinner-on-load (redux-persist transform strips `loading`/`error` flags from persisted state)
- ✅ **Phase D** — real Activity timeseries. New `profileStatsController.js` exposes `GET /api/profile/me/stats/:metric?range=…` (metric ∈ views/connections/received/sent, range ∈ 1D/1W/1M/3M/YTD/1Y) with per-range bucketing (hourly/daily/weekly/monthly). Response: `{points:[{t,v}], allTimeTotal, windowDelta, deltaPct, rangeLabel}`. `ActivityStrengthCard` rewritten: top number = all-time total, subtitle line = `▲/▼/– ±N (X.X%) <window-label>` with green/red/gray, sparkline = real points. Per-(tab,range) Map cache. New `3M` chip added. `seedActivityStats.js` script generates synthetic backfill (~250 views/35 conns/40 recv/25 sent across 365 days) and supports `--clear` for cleanup.
- ✅ **Phase F** — visual rebuild to Claude Design "Athlete Private Profile" layout (2026-05-15). 3-column grid (1fr 1fr 340px), HeaderCard restructure to short banner + avatar overlap + single pencil + About Me column + PUBLIC/PRIVATE contact strip. Experience/Education/NIL row with inline NIL editing (custom dropdown — not native `<select>` — for Deal Size/Timeline to fix oversized macOS popover; pill rails with `+` opening single-section FocusAreas / Interests modals; "UNSAVED CHANGES" Confirm/Cancel bar). Connection Center redesigned as 1fr 1fr 1fr 44px grid with gradient-banner mini-cards (location, avatar overlap, expertise + overflow, about clamp, EXP/RATING/CONNECTIONS row, View + Message). Activity & Strength: 190px ring + scroll-down-for-todo, chart fills card, range chips pinned to bottom, 3M kept. New `AthleteConnectionsModal` (960px, navy backdrop, search + Focus + Location filters) replaces legacy ConnectionsModal on this surface only. Schema additions: `coordinates: {lat, lng}` (Photon-derived from LocationField) and `rating: Number` and dev-only `_seedTag`. `seedConnectionMiniCardStubs.js` promotes Phase D ghosts → realistic advisors. `NILPreferencesModal.jsx` deleted; `CatalogTypeahead` lifted to shared. `Card` primitive fixed to be `flex-column` so children can `flex:1` (the cause of the Activity chart whitespace bug). Sidebar offset back to `SIDEBAR_W + 32` per CLAUDE.md.

## Next (in order)

1. **Phase E** — polish + public-view passthrough:
   - **Preview Your Public Profile** — HeaderCard "Preview public" button → in-page modal mounting `<AthletePublicView>` (`ProfilePreviewModal` already built in Phase F; just needs the trigger button + viewer's own bundle wired in)
   - Blurred-until-connected implementation on public views
   - Mobile responsive pass
   - Visual QA against design screenshots
   - Backfill: existing athlete/advisor docs have no `coordinates` set — a one-time geocode-and-write script over Profile.location strings would unlock distance filters for the whole user base. Not required to ship Phase E.

## How to update this file

After each commit that advances the rebuild, update **3 lines only**:

1. **Last commit** — bump to the new commit hash + 1-line summary + date.
2. **Last touched by Claude** — bump the date.
3. Move the just-shipped item from **Next** → **What's done** (or strike off a cleanup item).

Don't restate decisions or architecture here — that's [`PHASE_HANDOFF.md`](client/src/pages/Profile/PHASE_HANDOFF.md). This doc is a cursor, not a history.
