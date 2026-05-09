/**
 * Phase C Review Harness — modal shell + form primitives
 * --------------------------------------------------------------------------
 * Mounted at /admin/phase-c-review. Lets the user exercise every primitive
 * built in Phase C step 1 (EditModal, TextField, Textarea, Select, DateField,
 * Toggle, ChipPicker, EntryList) before any per-section modal is wired to a
 * real pencil. Nothing here PATCHes the server — it's all local state.
 *
 * Delete this page (and the route in App.jsx) when Phase C ships.
 */

import { useMemo, useState } from 'react'
import DashboardLayout from '../Layout/DashboardLayout'
import { EditModal } from '../../components/Profile/athletePrivate/shared/EditModal'
import {
  TextField,
  Textarea,
  Select,
  DateField,
  Toggle,
  ChipPicker,
  EntryList,
} from '../../components/Profile/athletePrivate/shared/formFields'
import { LocationField } from '../../components/Profile/athletePrivate/shared/LocationField'

const SIDEBAR_W = 228

const SAMPLE_INTERESTS = [
  'Basketball', 'Football', 'Soccer', 'Track & Field', 'Tennis',
  'Golf', 'Baseball', 'Volleyball', 'Swimming', 'Lacrosse',
  'Hockey', 'Wrestling', 'Cycling', 'Skiing', 'Rowing',
  'Photography', 'Music', 'Travel', 'Cooking', 'Reading',
]

const TriggerCard = ({ title, hint, onOpen }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid rgba(22,49,70,0.08)',
      borderRadius: 14,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ fontSize: 14, fontWeight: 800, color: '#163146' }}>{title}</div>
    <div style={{ fontSize: 12.5, color: 'rgba(22,49,70,0.6)', lineHeight: 1.5 }}>{hint}</div>
    <button
      type='button'
      onClick={onOpen}
      style={{
        marginTop: 'auto',
        padding: '8px 14px',
        borderRadius: 9,
        border: 0,
        background: '#986a41',
        color: '#fff',
        fontWeight: 800,
        fontSize: 12.5,
        cursor: 'pointer',
        alignSelf: 'flex-start',
      }}
    >
      Open modal
    </button>
  </div>
)

const PhaseCReviewPage = () => {
  const [openKind, setOpenKind] = useState(null)
  const [savingKind, setSavingKind] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)

  // ---- demo state for each modal ----
  const [identity, setIdentity] = useState({
    name: 'Sample Athlete',
    sport: 'Basketball',
    location: '',
    aboutMe: 'Hooper from the Bay. Studying business at State.',
    email: 'athlete@example.com',
    emailPublic: true,
    phonePublic: false,
  })
  const initialIdentity = useMemo(() => identity, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [draftIdentity, setDraftIdentity] = useState(identity)

  const [interests, setInterests] = useState(['Basketball', 'Photography', 'Music'])
  const [draftInterests, setDraftInterests] = useState(interests)

  const [experience, setExperience] = useState([
    { role: 'Brand Ambassador', company: 'Acme Apparel', location: '', startDate: '2024-06', endDate: 'present', description: '' },
  ])
  const [draftExperience, setDraftExperience] = useState(experience)

  const [standaloneLocation, setStandaloneLocation] = useState('')
  const [draftStandaloneLocation, setDraftStandaloneLocation] = useState('')

  // ---- helpers ----
  const open = (kind) => {
    if (kind === 'identity') setDraftIdentity(identity)
    if (kind === 'interests') setDraftInterests(interests)
    if (kind === 'experience') setDraftExperience(experience)
    if (kind === 'location') setDraftStandaloneLocation(standaloneLocation)
    setOpenKind(kind)
  }

  const fakeSave = async (kind, commit) => {
    setSavingKind(kind)
    await new Promise((r) => setTimeout(r, 600))
    commit()
    setSavingKind(null)
    setOpenKind(null)
    setLastSaved({ kind, at: new Date().toISOString() })
  }

  const identityDirty = JSON.stringify(draftIdentity) !== JSON.stringify(identity)
  const interestsDirty = JSON.stringify([...draftInterests].sort()) !== JSON.stringify([...interests].sort())
  const experienceDirty = JSON.stringify(draftExperience) !== JSON.stringify(experience)
  const interestsValid = draftInterests.length >= 5

  return (
    <DashboardLayout>
      <div
        style={{
          paddingLeft: `max(24px, ${SIDEBAR_W + 32}px)`,
          paddingRight: 24,
          paddingTop: 24,
          paddingBottom: 40,
        }}
      >
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#163146', letterSpacing: '-0.01em' }}>
            Phase C — modal shell + form primitives
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(22,49,70,0.65)', fontSize: 13.5, lineHeight: 1.5 }}>
            Local-only sandbox. Nothing here writes to the server. Click any card below to exercise the
            EditModal shell and the form primitives it composes.
          </p>
          {lastSaved && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(34,197,94,0.10)',
                color: '#15803d',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              Last saved: {lastSaved.kind} @ {new Date(lastSaved.at).toLocaleTimeString()}
            </div>
          )}
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <TriggerCard
            title='Identity + contacts'
            hint='TextField, Textarea, Toggle, dirty-check on Cancel, confirm-on-Save.'
            onOpen={() => open('identity')}
          />
          <TriggerCard
            title='Interests (min 5)'
            hint='ChipPicker with a min-selection rule. Save stays disabled until ≥5 selected.'
            onOpen={() => open('interests')}
          />
          <TriggerCard
            title='Experience entries'
            hint='EntryList with reorder + delete + add, plus DateField (Present checkbox), Select.'
            onOpen={() => open('experience')}
          />
          <TriggerCard
            title='Error banner'
            hint='Forces the in-modal error banner via a stub failure.'
            onOpen={() => open('error')}
          />
          <TriggerCard
            title='Location field (standalone)'
            hint='Photon-backed typeahead with Remote pinned + manual entry (city input + state dropdown).'
            onOpen={() => open('location')}
          />
        </div>

        {/* Identity modal */}
        <EditModal
          open={openKind === 'identity'}
          title='Edit identity & contacts'
          subtitle='Name and sport are required. Visibility toggles control whether contacts appear on your public profile.'
          onClose={() => setOpenKind(null)}
          onSave={() => fakeSave('identity', () => setIdentity(draftIdentity))}
          dirty={identityDirty}
          saving={savingKind === 'identity'}
          saveDisabled={!draftIdentity.name?.trim() || !draftIdentity.sport?.trim()}
        >
          <TextField
            label='Full name'
            required
            value={draftIdentity.name}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, name: v })}
            error={!draftIdentity.name?.trim() ? 'Name is required' : null}
          />
          <Select
            label='Primary sport'
            required
            value={draftIdentity.sport}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, sport: v })}
            options={['Basketball', 'Football', 'Soccer', 'Tennis', 'Track & Field', 'Volleyball']}
          />
          <Textarea
            label='About me'
            value={draftIdentity.aboutMe}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, aboutMe: v })}
            maxLength={400}
            placeholder='A short bio for advisors and brands.'
          />
          <LocationField
            label='Location'
            value={draftIdentity.location}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, location: v })}
            hint='Search any US city, pick Remote, or use manual entry for the long tail.'
          />
          <TextField
            label='Email'
            type='email'
            value={draftIdentity.email}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, email: v })}
          />
          <Toggle
            label='Show email on public profile'
            hint='Off keeps it private. On still blurs until a connection is accepted.'
            checked={draftIdentity.emailPublic}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, emailPublic: v })}
          />
          <Toggle
            label='Show phone on public profile'
            checked={draftIdentity.phonePublic}
            onChange={(v) => setDraftIdentity({ ...draftIdentity, phonePublic: v })}
          />
        </EditModal>

        {/* Interests modal */}
        <EditModal
          open={openKind === 'interests'}
          title='Edit interests'
          subtitle='Pick at least 5 from the catalog. Save stays disabled until you do.'
          onClose={() => setOpenKind(null)}
          onSave={() => fakeSave('interests', () => setInterests(draftInterests))}
          dirty={interestsDirty}
          saving={savingKind === 'interests'}
          saveDisabled={!interestsValid}
          width={620}
          errorBanner={!interestsValid ? 'You must select at least 5 interest before saving your changes.' : null}
        >
          <ChipPicker
            label='Interests'
            options={SAMPLE_INTERESTS}
            selected={draftInterests}
            onChange={setDraftInterests}
            min={5}
            placeholder='Search interests…'
            hint='In the real catalog this list pulls from /api/profile/interests/catalog (128 items).'
          />
        </EditModal>

        {/* Experience modal */}
        <EditModal
          open={openKind === 'experience'}
          title='Edit experience'
          subtitle='Reorder with the chevrons. Delete with the trash icon. Click a row header to expand.'
          onClose={() => setOpenKind(null)}
          onSave={() => fakeSave('experience', () => setExperience(draftExperience))}
          dirty={experienceDirty}
          saving={savingKind === 'experience'}
          width={620}
        >
          <EntryList
            entries={draftExperience}
            onChange={setDraftExperience}
            newEntry={{ role: '', company: '', location: '', startDate: '', endDate: '', description: '' }}
            addLabel='Add experience'
            emptyLabel='No experience entries yet — click below to add one.'
            summary={(e) =>
              [e.role || 'Untitled role', e.company].filter(Boolean).join(' · ')
            }
            renderEntry={({ entry, onChange }) => (
              <>
                <TextField
                  label='Role'
                  required
                  value={entry.role}
                  onChange={(v) => onChange({ role: v })}
                />
                <TextField
                  label='Organization'
                  required
                  value={entry.company}
                  onChange={(v) => onChange({ company: v })}
                />
                <LocationField
                  label='Location'
                  value={entry.location}
                  onChange={(v) => onChange({ location: v })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <DateField
                    label='Start'
                    value={entry.startDate}
                    onChange={(v) => onChange({ startDate: v })}
                    allowPresent={false}
                  />
                  <DateField
                    label='End'
                    value={entry.endDate}
                    onChange={(v) => onChange({ endDate: v })}
                  />
                </div>
                <Textarea
                  label='About this experience'
                  value={entry.description}
                  onChange={(v) => onChange({ description: v })}
                  maxLength={400}
                  placeholder='What did you do, who did you work with, and what was the outcome?'
                />
              </>
            )}
          />
        </EditModal>

        {/* Standalone Location demo */}
        <EditModal
          open={openKind === 'location'}
          title='Pick a location'
          subtitle='Type to search any US city via Photon. Remote is always pinned at the top. Use manual entry for places that don’t appear.'
          onClose={() => setOpenKind(null)}
          onSave={() => fakeSave('location', () => setStandaloneLocation(draftStandaloneLocation))}
          dirty={draftStandaloneLocation !== standaloneLocation}
          saving={savingKind === 'location'}
          saveDisabled={!draftStandaloneLocation}
        >
          <LocationField
            label='Location'
            value={draftStandaloneLocation}
            onChange={setDraftStandaloneLocation}
            hint='Try typing "asheville", "san fr", or just open the dropdown to pick Remote.'
          />
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(22,49,70,0.6)' }}>
            Stored value: <code style={{ background: 'rgba(22,49,70,0.06)', padding: '1px 6px', borderRadius: 4 }}>{draftStandaloneLocation || '(empty)'}</code>
          </div>
        </EditModal>

        {/* Error-banner demo */}
        <EditModal
          open={openKind === 'error'}
          title='Error banner demo'
          subtitle='This modal has a non-empty errorBanner prop so you can see the alert styling.'
          onClose={() => setOpenKind(null)}
          onSave={() => setOpenKind(null)}
          errorBanner='Server returned 400: at least 5 interests are required to publish your profile.'
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(22,49,70,0.7)' }}>
            The banner appears between the header and the body. Use this slot for the server's error
            message after a failed PATCH; revert local state alongside.
          </p>
        </EditModal>
      </div>
    </DashboardLayout>
  )
}

export default PhaseCReviewPage
