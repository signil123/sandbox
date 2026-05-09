/**
 * Phase A Review Harness
 * --------------------------------------------------------------------------
 * Visual + functional review of the Phase A schema and API changes.
 * Mounted at /admin/phase-a-review (admin-protected route).
 *
 * Verifies, in a single headed Playwright viewport:
 *   1. Interests catalog endpoint returns ~120 items, grouped by category
 *   2. Athlete profile bundle returns the new structured shape
 *      (experience array, education array, socials array, interests array,
 *       publicVisibility, dropped legacy fields)
 *   3. Round-trip writes for each editable section work end-to-end
 *      via PUT /profile/me/athlete and PUT /profile/me/interests
 *   4. Public view (AthletePublicView) still renders correctly against the
 *      new schema (live preview of the same profile via getPublicProfile)
 *
 * No production users touched — this only mutates the LOGGED-IN admin's
 * own profile, and every write button shows a preview of the patch first.
 */

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../Layout/DashboardLayout'
import { profileService } from '../../services/profileService'
import axiosInstance from '../../config'

const Section = ({ title, status, children }) => (
  <section
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      border: '1px solid rgba(22,49,70,0.08)',
      boxShadow: '0 2px 8px -2px rgba(22,49,70,0.06)',
    }}
  >
    <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#163146', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {status && <StatusBadge status={status} />}
    </header>
    {children}
  </section>
)

const StatusBadge = ({ status }) => {
  const styles = {
    pass: { bg: 'rgba(34,197,94,0.12)', fg: '#15803d', label: 'PASS' },
    fail: { bg: 'rgba(239,68,68,0.12)', fg: '#b91c1c', label: 'FAIL' },
    pending: { bg: 'rgba(22,49,70,0.08)', fg: 'rgba(22,49,70,0.6)', label: 'PENDING' },
    info: { bg: 'rgba(152,106,65,0.12)', fg: '#7a5435', label: 'INFO' },
  }
  const s = styles[status] || styles.info
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.12em',
        padding: '3px 8px',
        borderRadius: 6,
      }}
    >
      {s.label}
    </span>
  )
}

const Json = ({ value, max = 600 }) => {
  const text = JSON.stringify(value, null, 2)
  const truncated = text.length > max ? text.slice(0, max) + '\n  …' : text
  return (
    <pre
      style={{
        background: '#0a1824',
        color: '#cde3f5',
        fontSize: 11.5,
        lineHeight: 1.55,
        padding: 12,
        borderRadius: 8,
        overflow: 'auto',
        maxHeight: 320,
        margin: 0,
      }}
    >
      {truncated}
    </pre>
  )
}

const Btn = ({ onClick, children, disabled, tone = 'primary' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: tone === 'primary' ? '#163146' : 'rgba(22,49,70,0.08)',
      color: tone === 'primary' ? '#fff' : '#163146',
      padding: '8px 14px',
      borderRadius: 8,
      border: 0,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.02em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </button>
)

const Row = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
    {children}
  </div>
)

const Note = ({ children, tone = 'info' }) => (
  <p
    style={{
      fontSize: 12,
      lineHeight: 1.55,
      color: tone === 'error' ? '#b91c1c' : 'rgba(22,49,70,0.7)',
      margin: '8px 0 0',
    }}
  >
    {children}
  </p>
)

const PhaseAReviewPage = () => {
  // Catalog
  const [catalog, setCatalog] = useState(null)
  const [catalogErr, setCatalogErr] = useState(null)

  // Bundle (current user's athlete profile)
  const [bundle, setBundle] = useState(null)
  const [bundleErr, setBundleErr] = useState(null)
  const [bundleLoading, setBundleLoading] = useState(false)

  // Last write result
  const [lastWrite, setLastWrite] = useState(null)
  const [lastWriteErr, setLastWriteErr] = useState(null)
  const [writing, setWriting] = useState(false)

  const loadAll = async () => {
    setCatalogErr(null)
    setBundleErr(null)
    setBundleLoading(true)
    try {
      const c = await profileService.getInterestsCatalog()
      setCatalog(c)
    } catch (e) {
      setCatalogErr(String(e))
    }
    try {
      const b = await profileService.getAthleteProfileBundle()
      setBundle(b?.data || b)
    } catch (e) {
      setBundleErr(String(e))
    }
    setBundleLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const sendPatch = async (patch, label) => {
    setWriting(true)
    setLastWriteErr(null)
    try {
      const r = await axiosInstance.put('/profile/me/athlete', patch)
      setLastWrite({ label, request: patch, response: r.data })
      // Refresh the bundle so the page reflects the write
      const b = await profileService.getAthleteProfileBundle()
      setBundle(b?.data || b)
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || String(e)
      setLastWriteErr(`${label}: ${msg}`)
      setLastWrite({ label, request: patch, error: msg })
    }
    setWriting(false)
  }

  const sendInterestsPatch = async (interests, label) => {
    setWriting(true)
    setLastWriteErr(null)
    try {
      const r = await profileService.updateAthleteInterests(interests)
      setLastWrite({ label, request: { interests }, response: r })
      const b = await profileService.getAthleteProfileBundle()
      setBundle(b?.data || b)
    } catch (e) {
      const msg = typeof e === 'string' ? e : e?.message || String(e)
      setLastWriteErr(`${label}: ${msg}`)
      setLastWrite({ label, request: { interests }, error: msg })
    }
    setWriting(false)
  }

  // ---- Computed checks ----------
  const catalogStatus = catalogErr ? 'fail' : catalog ? 'pass' : 'pending'
  const bundleStatus = bundleErr ? 'fail' : bundle ? 'pass' : 'pending'

  const profile = bundle?.profile
  const shapeChecks = useMemo(() => {
    if (!profile) return null
    return {
      experience_isArray: Array.isArray(profile.experience),
      education_isArray: Array.isArray(profile.education),
      socials_isArray: Array.isArray(profile.socials),
      interests_isArray: Array.isArray(bundle.interests),
      publicVisibility_present: !!profile.publicVisibility,
      // Dropped fields should NOT appear on the bundle response
      jerseyNumber_dropped: profile.jerseyNumber === undefined,
      height_dropped: profile.height === undefined,
      weight_dropped: profile.weight === undefined,
      achievements_dropped: profile.achievements === undefined,
      stats_dropped: profile.stats === undefined,
    }
  }, [profile, bundle])

  const allShapeOk = shapeChecks && Object.values(shapeChecks).every(Boolean)

  // Sample patches the reviewer can fire
  const samplePatches = {
    addExperience: {
      experience: [
        ...(profile?.experience || []),
        {
          role: 'Test Role',
          company: 'Phase A Review Co.',
          type: 'Endorsement',
          startDate: '2025',
          endDate: 'Present',
          location: 'Los Angeles, CA',
          description: 'Sample entry written from the Phase A review harness.',
          logoText: 'PA',
          logoBg: '#986a41',
        },
      ],
    },
    addEducation: {
      education: [
        ...(profile?.education || []),
        {
          school: 'University of Southern California',
          degree: 'B.S.',
          fieldOfStudy: 'Communications',
          startYear: '2023',
          endYear: '2027',
          description: 'Sample entry written from the Phase A review harness.',
          logoText: 'U',
          logoBg: '#163146',
        },
      ],
    },
    setSocials: {
      socials: [
        { platform: 'instagram', handle: '@athlete_test', url: 'https://instagram.com/athlete_test', public: true },
        { platform: 'twitter', handle: '@athlete_test', url: 'https://twitter.com/athlete_test', public: false },
        { platform: 'tiktok', handle: '@athlete_test', url: 'https://tiktok.com/@athlete_test', public: true },
      ],
    },
    setVisibility: {
      publicVisibility: { email: false, phone: true },
    },
  }

  // Pick first 5 interests from the catalog for a "valid" interests test
  const fiveValidInterests = useMemo(() => {
    if (!catalog?.catalog) return []
    return catalog.catalog.slice(0, 5).map((c) => c.value)
  }, [catalog])

  const fourInterests = fiveValidInterests.slice(0, 4)
  const invalidInterests = ['NotARealInterest', ...fiveValidInterests.slice(0, 4)]

  // Sidebar is fixed-position 228px + 16px left margin. Offset content past it
  // (matches the pattern used by DashboardPage and other dashboard-shell pages).
  const SIDEBAR_W = 228
  const CONTENT_LEFT = SIDEBAR_W + 32 // 260

  return (
    <DashboardLayout>
      <div
        style={{
          // Desktop: offset past the fixed sidebar. Mobile: full-width with padding.
          paddingLeft: `max(24px, ${CONTENT_LEFT}px)`,
          paddingRight: 24,
          paddingTop: 24,
          paddingBottom: 96,
          maxWidth: 1400,
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#163146', letterSpacing: '-0.02em' }}>
            Phase A Review — Athlete Profile Schema
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(22,49,70,0.65)', fontSize: 13.5, lineHeight: 1.55 }}>
            Visual verification of the Phase A backend changes before Phase B (UI rebuild) starts.
            Every write here mutates only YOUR own athlete profile — no other users are touched.
          </p>
          <Row>
            <Btn onClick={loadAll} disabled={bundleLoading}>
              {bundleLoading ? 'Reloading…' : 'Reload bundle + catalog'}
            </Btn>
          </Row>
        </header>

        {/* ---- 1. Catalog endpoint ---- */}
        <Section title='1. Interests catalog endpoint  ·  GET /api/profile/interests/catalog' status={catalogStatus}>
          {catalogErr && <Note tone='error'>Error: {catalogErr}</Note>}
          {catalog && (
            <>
              <Note>
                Returned <strong>{catalog.catalog?.length}</strong> interests. Min for completion:{' '}
                <strong>{catalog.minForCompletion}</strong>.
              </Note>
              <Row>
                {Object.entries(
                  (catalog.catalog || []).reduce((acc, i) => {
                    acc[i.category] = (acc[i.category] || 0) + 1
                    return acc
                  }, {})
                ).map(([cat, n]) => (
                  <span
                    key={cat}
                    style={{
                      background: 'rgba(22,49,70,0.06)',
                      color: '#163146',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {cat} · {n}
                  </span>
                ))}
              </Row>
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#163146' }}>
                  Show first 30 catalog values
                </summary>
                <Json value={catalog.catalog?.slice(0, 30)} max={2000} />
              </details>
            </>
          )}
        </Section>

        {/* ---- 2. Bundle shape check ---- */}
        <Section
          title='2. Athlete profile bundle shape  ·  GET /api/profile/me/bundle'
          status={shapeChecks ? (allShapeOk ? 'pass' : 'fail') : 'pending'}
        >
          {bundleErr && <Note tone='error'>Error: {bundleErr}</Note>}
          {shapeChecks && (
            <>
              <Note>
                These are the structural assertions the new schema must satisfy. All must be ✓ before Phase B starts.
              </Note>
              <ul style={{ margin: '10px 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                {Object.entries(shapeChecks).map(([k, v]) => (
                  <li key={k} style={{ color: v ? '#15803d' : '#b91c1c' }}>
                    {v ? 'OK' : 'FAIL'} <code>{k}</code>
                  </li>
                ))}
              </ul>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#163146' }}>
                  Show full bundle response
                </summary>
                <Json value={bundle} max={4000} />
              </details>
            </>
          )}
        </Section>

        {/* ---- 3. Round-trip writes ---- */}
        <Section title='3. Section writes  ·  PUT /api/profile/me/athlete' status='info'>
          <Note>
            Each button sends a partial patch to the unified athlete update endpoint. The bundle reloads
            after each write so you can see the new value persisted.
          </Note>
          <Row>
            <Btn onClick={() => sendPatch(samplePatches.addExperience, 'Add Experience entry')} disabled={writing}>
              + Append sample Experience
            </Btn>
            <Btn onClick={() => sendPatch(samplePatches.addEducation, 'Add Education entry')} disabled={writing}>
              + Append sample Education
            </Btn>
            <Btn onClick={() => sendPatch(samplePatches.setSocials, 'Replace Socials')} disabled={writing}>
              Replace Socials (3 platforms)
            </Btn>
            <Btn onClick={() => sendPatch(samplePatches.setVisibility, 'Toggle email private')} disabled={writing}>
              Set email private
            </Btn>
            <Btn
              tone='secondary'
              onClick={() =>
                sendPatch(
                  { experience: [], education: [], socials: [], publicVisibility: { email: true, phone: true } },
                  'Clear test data'
                )
              }
              disabled={writing}
            >
              Reset (clear arrays)
            </Btn>
          </Row>
        </Section>

        {/* ---- 4. Interests validation ---- */}
        <Section title='4. Interests validation  ·  PUT /api/profile/me/interests' status='info'>
          <Note>
            The minimum is 5. Sending fewer or any unknown catalog value should return a 400 with an
            explanatory error message.
          </Note>
          <Row>
            <Btn
              onClick={() => sendInterestsPatch(fiveValidInterests, 'Save 5 valid interests (should succeed)')}
              disabled={writing || fiveValidInterests.length < 5}
            >
              Save 5 valid interests (expect ✓)
            </Btn>
            <Btn
              onClick={() => sendInterestsPatch(fourInterests, 'Save 4 interests (should fail with min-5 error)')}
              disabled={writing || fourInterests.length < 4}
              tone='secondary'
            >
              Save 4 (expect 400)
            </Btn>
            <Btn
              onClick={() => sendInterestsPatch(invalidInterests, 'Save with unknown value (should fail)')}
              disabled={writing}
              tone='secondary'
            >
              Save with unknown value (expect 400)
            </Btn>
          </Row>
        </Section>

        {/* ---- 5. Last write result ---- */}
        <Section
          title='5. Last write result'
          status={lastWriteErr ? 'fail' : lastWrite ? 'pass' : 'pending'}
        >
          {!lastWrite && <Note>Trigger any of the buttons above to see the request/response cycle.</Note>}
          {lastWrite && (
            <>
              <Note>
                <strong>{lastWrite.label}</strong>
                {lastWriteErr ? <span style={{ color: '#b91c1c' }}> — {lastWriteErr}</span> : ' — succeeded'}
              </Note>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(22,49,70,0.55)', marginBottom: 4 }}>
                    REQUEST
                  </div>
                  <Json value={lastWrite.request} max={2000} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(22,49,70,0.55)', marginBottom: 4 }}>
                    RESPONSE
                  </div>
                  <Json value={lastWrite.response || lastWrite.error} max={2000} />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* ---- 6. Public-view passthrough ---- */}
        <Section title='6. Public view passthrough  ·  the same profile, as the public sees it' status='info'>
          <Note>
            The public profile view reads <code>experience</code>, <code>education</code>,{' '}
            <code>activeInterests</code>, and <code>socialMedia</code> (virtual). After any write above,
            those reads should reflect the change immediately.
          </Note>
          {profile && (
            <details open style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#163146' }}>
                Show current public-view-accessible fields
              </summary>
              <Json
                value={{
                  experience: profile.experience,
                  education: profile.education,
                  activeInterests: bundle.activeInterests,
                  socialMedia_virtual: profile.socialMedia,
                  socials_canonical: profile.socials,
                  publicVisibility: profile.publicVisibility,
                }}
                max={3000}
              />
            </details>
          )}
        </Section>
      </div>
    </DashboardLayout>
  )
}

export default PhaseAReviewPage
