# Progress

One-screen cursor for the **athlete private profile rebuild**. Updated alongside every commit. For full context, decisions, schema, and rationale, read [`client/src/pages/Profile/PHASE_HANDOFF.md`](client/src/pages/Profile/PHASE_HANDOFF.md).

---

## Cursor

- **Active phase:** Phase C wrap-up → Phase D
- **Last commit:** `186d08c` — PROGRESS.md cursor + plan AthleteProfilePage rename + Preview Public (2026-05-09)
- **Last touched by Claude:** 2026-05-10 — Modal #6 signed off; Phase C cleanup in progress (review harnesses + legacy backup deleted; rename pending).

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
- ✅ **Bug fix** — login spinner-on-load (redux-persist transform strips `loading`/`error` flags from persisted state)

## Next (in order)

1. **Phase C cleanup (rename)** — `ProfilePage` → `AthleteProfilePage` (file + export + import in [App.jsx](client/src/App.jsx)) — single isolated commit so the rename diff is reviewable.
2. **Phase D** — real Activity & Strength data (replace stub timeseries with `GET /api/profile/me/stats/...` endpoints).
3. **Phase E** — polish + public-view passthrough:
   - **Preview Your Public Profile** — HeaderCard "Preview public" button → in-page modal mounting `<AthletePublicView>`
   - Blurred-until-connected implementation on public views
   - Mobile responsive pass
   - Visual QA against design screenshots

## How to update this file

After each commit that advances the rebuild, update **3 lines only**:

1. **Last commit** — bump to the new commit hash + 1-line summary + date.
2. **Last touched by Claude** — bump the date.
3. Move the just-shipped item from **Next** → **What's done** (or strike off a cleanup item).

Don't restate decisions or architecture here — that's [`PHASE_HANDOFF.md`](client/src/pages/Profile/PHASE_HANDOFF.md). This doc is a cursor, not a history.
