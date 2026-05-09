import React, { useEffect, useMemo, useState } from 'react'
import { EditModal } from './shared/EditModal'
import { TextField, Textarea, Select, DateField, EntryList } from './shared/formFields'
import { profileService } from '../../../services/profileService'

// Same deterministic palette + hashing scheme used by ExperienceModal so the
// look of the two cards is consistent. Single-letter logo on Education to
// match the existing EducationCard render (which uses a serif italic crest).
const LOGO_PALETTE = [
  '#163146', '#7a5435', '#0f766e', '#1d4ed8', '#7c3aed',
  '#b91c1c', '#9333ea', '#0891b2', '#a16207', '#15803d',
]

const hashString = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const deriveLogoText = (school) => {
  const name = String(school || '').trim()
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const deriveLogoBg = (school) => {
  const name = String(school || '').trim().toLowerCase()
  if (!name) return LOGO_PALETTE[0]
  return LOGO_PALETTE[hashString(name) % LOGO_PALETTE.length]
}

// Curated US degree list. Grouped via <optgroup> for scannability. The "Other
// (custom)" sentinel flips to a free-text input so anything off-list is still
// capturable. Stored as the raw abbreviation string ('BSBA', 'MBA', 'PhD'…).
export const DEGREE_GROUPS = [
  {
    label: 'Pre-college',
    options: [
      { value: 'High School Diploma', label: 'High School Diploma' },
      { value: 'GED', label: 'GED' },
    ],
  },
  {
    label: 'Associate',
    options: [
      { value: 'AA', label: 'AA — Associate of Arts' },
      { value: 'AS', label: 'AS — Associate of Science' },
      { value: 'AAS', label: 'AAS — Associate of Applied Science' },
    ],
  },
  {
    label: 'Bachelor’s',
    options: [
      { value: 'BA', label: 'BA — Bachelor of Arts' },
      { value: 'BS', label: 'BS — Bachelor of Science' },
      { value: 'BBA', label: 'BBA — Bachelor of Business Administration' },
      { value: 'BSBA', label: 'BSBA — Bachelor of Science in Business Administration' },
      { value: 'BFA', label: 'BFA — Bachelor of Fine Arts' },
      { value: 'BSE', label: 'BSE — Bachelor of Science in Engineering' },
      { value: 'BSN', label: 'BSN — Bachelor of Science in Nursing' },
      { value: 'BSW', label: 'BSW — Bachelor of Social Work' },
      { value: 'BArch', label: 'BArch — Bachelor of Architecture' },
      { value: 'BMus', label: 'BMus — Bachelor of Music' },
      { value: 'BEd', label: 'BEd — Bachelor of Education' },
      { value: 'BSc', label: 'BSc — Bachelor of Science (alt.)' },
    ],
  },
  {
    label: 'Master’s',
    options: [
      { value: 'MA', label: 'MA — Master of Arts' },
      { value: 'MS', label: 'MS — Master of Science' },
      { value: 'MBA', label: 'MBA — Master of Business Administration' },
      { value: 'MAcc', label: 'MAcc — Master of Accountancy' },
      { value: 'MEd', label: 'MEd — Master of Education' },
      { value: 'MAT', label: 'MAT — Master of Arts in Teaching' },
      { value: 'MEng', label: 'MEng — Master of Engineering' },
      { value: 'MArch', label: 'MArch — Master of Architecture' },
      { value: 'MFA', label: 'MFA — Master of Fine Arts' },
      { value: 'MMus', label: 'MMus — Master of Music' },
      { value: 'MPH', label: 'MPH — Master of Public Health' },
      { value: 'MPA', label: 'MPA — Master of Public Administration' },
      { value: 'MPP', label: 'MPP — Master of Public Policy' },
      { value: 'MSW', label: 'MSW — Master of Social Work' },
      { value: 'MSN', label: 'MSN — Master of Science in Nursing' },
      { value: 'MHA', label: 'MHA — Master of Health Administration' },
      { value: 'MIM', label: 'MIM — Master in Management' },
      { value: 'MDiv', label: 'MDiv — Master of Divinity' },
      { value: 'LLM', label: 'LLM — Master of Laws' },
    ],
  },
  {
    label: 'Doctoral & Professional',
    options: [
      { value: 'PhD', label: 'PhD — Doctor of Philosophy' },
      { value: 'EdD', label: 'EdD — Doctor of Education' },
      { value: 'DBA', label: 'DBA — Doctor of Business Administration' },
      { value: 'DPA', label: 'DPA — Doctor of Public Administration' },
      { value: 'JD', label: 'JD — Juris Doctor' },
      { value: 'MD', label: 'MD — Doctor of Medicine' },
      { value: 'DO', label: 'DO — Doctor of Osteopathic Medicine' },
      { value: 'DDS', label: 'DDS — Doctor of Dental Surgery' },
      { value: 'DMD', label: 'DMD — Doctor of Dental Medicine' },
      { value: 'PharmD', label: 'PharmD — Doctor of Pharmacy' },
      { value: 'DPT', label: 'DPT — Doctor of Physical Therapy' },
      { value: 'DVM', label: 'DVM — Doctor of Veterinary Medicine' },
      { value: 'AuD', label: 'AuD — Doctor of Audiology' },
      { value: 'OD', label: 'OD — Doctor of Optometry' },
      { value: 'PsyD', label: 'PsyD — Doctor of Psychology' },
      { value: 'ScD', label: 'ScD — Doctor of Science' },
    ],
  },
]

const DEGREE_VALUES = new Set(
  DEGREE_GROUPS.flatMap((g) => g.options.map((o) => o.value)),
)
const OTHER_SENTINEL = '__other__'

// Year compare: 'present' beats every dated value; everything else is a 4-digit
// string that string-compares correctly.
const isEndBeforeStart = (start, end) => {
  if (!start || !end) return false
  if (end === 'present') return false
  return String(end) < String(start)
}

const blankEntry = () => ({
  school: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
  description: '',
})

const buildBaseline = (existing) => {
  const list = Array.isArray(existing)
    ? existing.map((e) => ({
        school: e.school || '',
        degree: e.degree || '',
        fieldOfStudy: e.fieldOfStudy || '',
        startYear: e.startYear || '',
        endYear: e.endYear || '',
        description: e.description || '',
      }))
    : []
  // Newest end year first; 'present' wins; empty end sinks to the bottom.
  return list.slice().sort((a, b) => {
    const av = a.endYear === 'present' ? '￿' : a.endYear || ' '
    const bv = b.endYear === 'present' ? '￿' : b.endYear || ' '
    return bv.localeCompare(av)
  })
}

// Auto-derive the logo on save; the user never sees these fields in the form.
const rowsToEducation = (rows) =>
  rows
    .map((r) => {
      const school = (r.school || '').trim()
      const degree = (r.degree || '').trim()
      const fieldOfStudy = (r.fieldOfStudy || '').trim()
      const startYear = (r.startYear || '').trim()
      const endYear = (r.endYear || '').trim()
      const description = (r.description || '').trim()
      return {
        school,
        degree,
        fieldOfStudy,
        startYear,
        endYear,
        description,
        logoText: deriveLogoText(school),
        logoBg: deriveLogoBg(school),
      }
    })
    .filter((e) => e.school)

// Required: school + start/end. Other fields are optional. Block end<start.
const validateRow = (r) => {
  const errs = []
  if (!r.school.trim()) errs.push('School is required')
  if (!r.startYear) errs.push('Start year is required')
  if (!r.endYear) errs.push('End year is required (or check Present)')
  if (isEndBeforeStart(r.startYear, r.endYear)) errs.push('End year is before start year')
  return errs.length ? errs.join(' · ') : null
}

const EducationModal = ({ open, bundle, onClose, onSaved }) => {
  const baseline = useMemo(() => buildBaseline(bundle?.profile?.education), [bundle])
  const [rows, setRows] = useState(baseline)
  const [saving, setSaving] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)

  useEffect(() => {
    if (open) {
      setRows(baseline)
      setErrorBanner(null)
    }
  }, [open, baseline])

  const dirty = useMemo(
    () => JSON.stringify(rowsToEducation(rows)) !== JSON.stringify(rowsToEducation(baseline)),
    [rows, baseline],
  )

  const rowErrors = rows.map(validateRow)
  const firstError = rowErrors.find(Boolean) || null
  const hasError = !!firstError

  const handleSave = async () => {
    if (hasError) {
      setErrorBanner(`Fix the highlighted entries before saving: ${firstError}`)
      return
    }
    setSaving(true)
    setErrorBanner(null)
    try {
      const education = rowsToEducation(rows)
      await profileService.updateAthleteProfile({ education })
      await onSaved?.()
      onClose?.()
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || (typeof e === 'string' ? e : 'Save failed')
      setErrorBanner(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <EditModal
      open={open}
      title='Edit education'
      subtitle='Add the schools, programs, and credentials you want on your profile. Drag the dotted handle on the left to reorder; delete with the trash icon.'
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
      saving={saving}
      saveDisabled={hasError || !dirty}
      width={640}
      errorBanner={errorBanner}
    >
      <EntryList
        entries={rows}
        onChange={setRows}
        newEntry={blankEntry()}
        addLabel='Add education'
        emptyLabel='No entries yet — click below to add one.'
        summary={(e) => {
          const parts = [e.school || 'Untitled school']
          const detail = [e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')
          if (detail) parts.push(detail)
          return parts.join(' · ')
        }}
        renderEntry={({ entry, onChange }) => {
          const err = validateRow(entry)
          // Map an off-list degree (legacy data, manually typed) to the Other
          // sentinel so the dropdown stays visually correct and the user can
          // edit it through the free-text input.
          const isCustomDegree = entry.degree && !DEGREE_VALUES.has(entry.degree)
          const dropdownValue = isCustomDegree ? OTHER_SENTINEL : entry.degree
          return (
            <>
              <TextField
                label='School'
                required
                value={entry.school}
                onChange={(v) => onChange({ school: v })}
                placeholder='e.g. University of Southern California'
                hint={
                  entry.school.trim()
                    ? `Logo will display as “${deriveLogoText(entry.school)}”`
                    : null
                }
              />

              <DegreeSelect
                value={dropdownValue}
                onChange={(v) => {
                  if (v === OTHER_SENTINEL) {
                    onChange({ degree: isCustomDegree ? entry.degree : '' })
                  } else {
                    onChange({ degree: v })
                  }
                }}
              />
              {dropdownValue === OTHER_SENTINEL && (
                <TextField
                  label='Custom degree'
                  value={entry.degree}
                  onChange={(v) => onChange({ degree: v })}
                  placeholder='e.g. BTech, BCS'
                  hint='Use the abbreviation that appears on your transcript.'
                />
              )}

              <TextField
                label='Field of study'
                value={entry.fieldOfStudy}
                onChange={(v) => onChange({ fieldOfStudy: v })}
                placeholder='e.g. Communications, Mechanical Engineering'
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <DateField
                  label='Start year'
                  required
                  value={entry.startYear}
                  onChange={(v) => onChange({ startYear: v })}
                  yearOnly
                  allowPresent={false}
                />
                <DateField
                  label='End year'
                  required
                  value={entry.endYear}
                  onChange={(v) => onChange({ endYear: v })}
                  yearOnly
                />
              </div>

              <Textarea
                label='About this education'
                value={entry.description}
                onChange={(v) => onChange({ description: v })}
                maxLength={400}
                placeholder='Honors, coursework, leadership, anything worth surfacing.'
              />

              {err && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '8px 10px',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#9b1c1c',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {err}
                </div>
              )}
            </>
          )
        }}
      />
    </EditModal>
  )
}

// DegreeSelect — grouped <select> with optgroups + an "Other" sentinel.
// We don't use the generic Select primitive here because it doesn't support
// optgroups, and a flat list of 50+ degree titles is harder to scan.
const DegreeSelect = ({ value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <label
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'rgba(22,49,70,0.65)',
        marginBottom: 6,
      }}
    >
      Degree
    </label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(22,49,70,0.15)',
        background: '#fff',
        color: '#163146',
        fontSize: 13.5,
        fontWeight: 500,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
    >
      <option value=''>None / not applicable</option>
      {DEGREE_GROUPS.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={OTHER_SENTINEL}>Other (custom)…</option>
    </select>
  </div>
)

export default EducationModal
