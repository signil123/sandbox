# Signil UX/UI Rebuild

Durable cursor for the **full-platform visual rebuild**. Companion to (but separate from) `PROGRESS.md`, which tracks the now-frozen athlete private profile rebuild (Phases A-F). This rebuild is a **completely fresh buildout**: it does not reuse anything from `components/Profile/athletePrivate/shared/`. The athlete profile stays at its current Phase F state until **Phase 4** below, when it gets migrated onto the new design system.

For session-spanning context, this file replaces what `PHASE_HANDOFF.md` is for the athlete-profile work.

---

## Cursor

- **Active phase:** Phase 0 — reference + spec
- **Status:** Awaiting Contra + Upwork credentials so the captures can run via Playwright. Reference checklist below is the source of truth for what to capture.
- **Last updated:** 2026-05-23 — initial draft, planning conversation, no code yet
- **On resume:** read "Hard rules" + "Cursor" + the latest filled-in section of "Phase 0 — reference captures" below. Continue from whichever surface is next on the checklist.

---

## Hard rules (initiative-specific)

In addition to the repo-wide rules in `CLAUDE.md`:

1. **Contra-primary, Upwork for specific patterns only.** Default to Contra's visual language (minimal, editorial, generous whitespace, soft type). Borrow from Upwork only for dense/data-heavy surfaces — Explore filters, settings tables, marketplace cards.
2. **Aesthetic anchor: Stripe / Linear / Contra.** Pale neutrals, tight type scale, low-contrast borders, micro-interactions over heavy chrome. Not Bloomberg-dense, not Carta-financial.
3. **Athlete-first.** Phases 2-7 cover athlete surfaces only. Phases 8-9 replicate the same kit and patterns for advisor and agent. No three-roles-in-parallel.
4. **No Phase F primitive reuse.** New design system lives in a fresh `client/src/ui/` (final name TBD in Phase 1). `components/Profile/athletePrivate/shared/` is read-only reference until Phase 4 migrates the athlete profile onto the new kit.
5. **Functionality preserved.** This is a UX/UI rebuild. Existing endpoints, schema, redux, and feature behavior are NOT in scope to change. If a redesign requires a backend change, flag it as a question — don't quietly drift.
6. **Visible review gate per phase.** Each phase ends with a headed Playwright viewport the user can interact with. Phase N+1 doesn't start until N is signed off.
7. **No emojis** (already a repo rule, restating for emphasis given this is a visual rebuild and the temptation to use them in design copy is real).

---

## Roadmap

| Phase | Scope | Output | Status |
|---|---|---|---|
| **0** | Reference capture + design spec | `REDESIGN.md` filled out with tokens, type scale, component vocabulary, annotated screenshots | In progress |
| **1** | Design system in fresh `client/src/ui/` | Tokens + primitives (Button, Input, Field, Select, Textarea, Card, Modal, Tabs, Toast, Avatar, Badge, EmptyState, Toolbar) + gallery review page | Not started |
| **2** | Auth — athlete role | `AuthPage` (login + signup) + `ResetPasswordPage` rebuilt on new kit | Not started |
| **3** | Onboarding wizard — net-new, athlete-only | Multi-step Contra-style flow between signup and dashboard | Not started |
| **4** | Athlete profile — private + public | `AthleteProfilePage` migrated off Phase F primitives onto new kit. `AthletePublicView` + `PublicProfilePage` rebuilt. | Not started |
| **5** | Settings (athlete) | `SettingsPage` redesigned with sectioned left-nav layout | Not started |
| **6** | Explore (athlete view) | `ExplorePage` refined cards, filters, search | Not started |
| **7** | Cohesion pass | Light polish on dashboard / messaging / news chrome so nothing feels orphaned | Not started |
| **8** | Replicate phases 2-7 for advisor | Same kit, advisor-specific surfaces (incl. `AdvisorProfilePage`, `AdvisorPublicView`) | Not started |
| **9** | Replicate phases 2-7 for agent | Same kit, agent-specific surfaces | Not started |

Phase E of the athlete-profile rebuild (Preview-public modal, blur-until-connected, mobile, visual QA) is **dropped**. Anything that would have been done there gets folded into Phase 4 here.

---

## Phase 0 — reference captures

For each surface, the goal is: capture every visual state Signil will need an equivalent of, then annotate what's worth borrowing. Captures land in this section as they arrive.

### Checklist

| # | Signil surface | Current file | Contra equivalent | Upwork equivalent | States to capture | Status |
|---|---|---|---|---|---|---|
| 1 | Login | `client/src/pages/Auth/AuthPage.jsx` (login mode) | Login page | Account login | empty, typing, wrong-password error, success transition | Pending creds |
| 2 | Signup | `client/src/pages/Auth/AuthPage.jsx` + `SignupFormComponents.jsx` | Signup flow | Signup flow | role/account-type picker, each form step, validation errors | Pending creds |
| 3 | Reset password | `client/src/pages/Auth/ResetPasswordPage.jsx` | Forgot password | Forgot password | email entry, link sent, set new password | Pending creds |
| 4 | **Onboarding (net-new)** | none yet | Post-signup onboarding wizard | "Complete your profile" wizard | every step + progress indicator + skip behavior | Pending creds |
| 5 | Athlete profile (private edit) | `client/src/pages/Profile/AthleteProfilePage.jsx` | Own-profile edit view | Freelancer "edit profile" | header, sections, inline edits, modals | Pending creds |
| 6 | Athlete profile (public) | `client/src/pages/Profile/AthletePublicView.jsx` + `PublicProfilePage.jsx` | Public profile (someone else's) | Public freelancer profile | hero, sections, CTAs (connect / message / hire) | Pending creds |
| 7 | Settings | `client/src/pages/Settings/SettingsPage.jsx` | Settings | Settings | account, notifications, privacy, billing | Pending creds |
| 8 | Explore | `client/src/pages/Explore/ExplorePage.jsx` | Explore / discover | Talent search | grid/list, filter rail, search bar, empty state, individual card | Pending creds |
| 9 | App nav shell | `client/src/pages/Layout/*` + `pages/Dashboard/*` chrome | Main app chrome | Main app chrome | sidebar, top bar, global search | Pending creds |

### Working notes per surface

> Filled in as captures arrive. Each surface section follows the same template: screenshot paths, what to borrow, what to skip, open questions.

#### 1. Login
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 2. Signup
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 3. Reset password
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 4. Onboarding (net-new)
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 5. Athlete profile (private edit)
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 6. Athlete profile (public)
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 7. Settings
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 8. Explore
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

#### 9. App nav shell
- Captures: _pending_
- What to borrow: _pending_
- What to skip: _pending_
- Open questions: _pending_

---

## Phase 0 — design spec (fills in as references arrive)

### Color tokens
- _pending_ — derive from Contra's palette, lightly biased toward Signil's existing brand if any.

### Type scale
- _pending_ — Contra uses a soft, editorial sans (likely a Söhne / Inter / Geist family). Decide on one body sans + one display variant.

### Spacing scale
- _pending_ — likely 4-px-grid (4, 8, 12, 16, 24, 32, 48, 64, 96).

### Radius scale
- _pending_ — likely 4, 8, 12, 16, 24, full.

### Shadow scale
- _pending_ — Contra uses very soft shadows; likely 2-3 elevations max.

### Motion
- _pending_ — Contra is sparing with motion. Hover transforms, modal sheet-up, smooth scroll. Decide on duration + easing tokens.

### Component vocabulary
- _pending_ — list every primitive needed across all phases, sourced from the captures.

### Patterns
- _pending_ — empty states, error states, loading states, success toasts, modal flow, multi-step wizard, filter rail, card grid, profile hero, settings nav.

---

## Credentials handling

Credentials for Contra + Upwork are provided by the user to enable Playwright capture of reference surfaces.

- Treat any credentials shared in the session transcript as **disposable**. Use them for capture, never persist them in committed files, env files, or scripts.
- If a Playwright capture script is needed, source credentials from env vars only (`CONTRA_EMAIL` / `CONTRA_PASSWORD` / `UPWORK_EMAIL` / `UPWORK_PASSWORD`), and do not write the script to disk unless strictly necessary. Prefer one-shot in-shell Playwright invocations.
- Captures land under `tmp/redesign-refs/` (gitignored) so screenshots don't leak the source pages into the repo. Annotated stills that we want as permanent reference can be moved to `docs/redesign-refs/` later, with any UI elements that could leak private data redacted.

---

## How to update this file

After each meaningful step (capture batch landed, spec section filled, phase shipped), update **3 lines minimum**:

1. **Cursor → Active phase** if we advanced.
2. **Cursor → Status** with the current open question or next action.
3. **Cursor → Last updated** date.

Also move any newly-shipped item from Roadmap → "Status" column.

Long decisions and rationale go in the per-surface "Open questions" subsections under Phase 0, not in the cursor.
