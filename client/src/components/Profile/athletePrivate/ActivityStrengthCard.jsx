import React, { useMemo, useState } from 'react'
import { Card, ProgressRing } from './shared/primitives'

// Activity & Strength card.
// Five tabs (inline horizontal scroll, gold underline on active):
//   Profile Views | Connections | Received | Sent | Strength
// Range chips (1D / 1W / 1M / YTD / 1Y) hidden on Strength.
// Metric tabs render a stubbed line chart (deterministic fake data — wired to
// real timeseries in Phase D). Strength tab renders a real ring + the user's
// real "things to finish" list computed from bundle data.

const TABS = [
  { id: 'views', label: 'Profile Views', metric: '4,125', delta: '+13%' },
  { id: 'conns', label: 'Connections', metric: '47', delta: '+4%' },
  { id: 'recv', label: 'Received', metric: '12', delta: '+22%' },
  { id: 'sent', label: 'Sent', metric: '9', delta: '+8%' },
  { id: 'strength', label: 'Strength' },
]

const RANGES = ['1D', '1W', '1M', 'YTD', '1Y']

// Deterministic pseudo-random so charts look different per tab/range but stable
const seededSeries = (seed, n = 14) => {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  const out = []
  let v = 30 + (s % 30)
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const drift = (s % 20) - 8
    v = Math.max(8, Math.min(95, v + drift))
    out.push(v)
  }
  return out
}

const Sparkline = ({ data, w = 320, h = 130 }) => {
  if (!data || !data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = w / (data.length - 1)

  const pts = data.map((v, i) => [i * stepX, h - 8 - ((v - min) / range) * (h - 16)])
  const linePath = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ')
  const fillPath = `${linePath} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg width='100%' height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio='none'>
      <defs>
        <linearGradient id='spark-fill' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#986a41' stopOpacity='0.20' />
          <stop offset='100%' stopColor='#986a41' stopOpacity='0' />
        </linearGradient>
      </defs>
      <path d={fillPath} fill='url(#spark-fill)' />
      <path d={linePath} fill='none' stroke='#986a41' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round' />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 0} fill='#986a41' />
      ))}
    </svg>
  )
}

// Compute the real profile-strength % and "things to finish" list from the
// bundle. Same heuristic used in the design prototype, adapted to Phase A's
// canonical schema. Each weight totals to 100.
const useStrength = (bundle) => {
  return useMemo(() => {
    const profile = bundle?.profile || {}
    const user = bundle?.user || {}
    const interests = Array.isArray(bundle?.interests) ? bundle.interests : []
    // nilPreferences lives at the top level of the bundle response, not on profile.
    const nil = bundle?.nilPreferences || profile.nilPreferences || {}
    const checks = [
      { ok: !!user.name, weight: 8, label: 'Add your name' },
      { ok: !!profile.sport, weight: 8, label: 'Set your sport' },
      { ok: !!profile.position, weight: 6, label: 'Set your position' },
      { ok: !!profile.school, weight: 6, label: 'Set your school' },
      { ok: !!profile.classYear, weight: 6, label: 'Set your grad class' },
      { ok: !!profile.location, weight: 4, label: 'Add your location' },
      { ok: (profile.aboutMe || profile.bio || '').length >= 80, weight: 10, label: 'Write a bio (80+ chars)' },
      { ok: !!(profile.photo || profile.profileImage || user.profileImage), weight: 8, label: 'Upload a profile photo' },
      { ok: !!profile.bannerImage, weight: 4, label: 'Add a banner image' },
      { ok: (profile.experience || []).length >= 1, weight: 8, label: 'Add an experience entry' },
      { ok: (profile.education || []).length >= 1, weight: 6, label: 'Add an education entry' },
      { ok: (profile.socials || []).filter((s) => s.handle || s.url).length >= 2, weight: 6, label: 'Connect 2+ social accounts' },
      { ok: interests.length >= 5, weight: 12, label: 'Pick at least 5 interests' },
      { ok: (nil?.focusAreas || []).length >= 1, weight: 4, label: 'Set NIL focus areas' },
      { ok: !!user.email, weight: 4, label: 'Add an email' },
    ]
    const earned = checks.filter((c) => c.ok).reduce((sum, c) => sum + c.weight, 0)
    const missing = checks.filter((c) => !c.ok).map((c) => c.label)
    return { pct: Math.round(earned), missing }
  }, [bundle])
}

const ActivityStrengthCard = ({ bundle }) => {
  const [activeTab, setActiveTab] = useState('views')
  const [range, setRange] = useState('1M')
  const isStrength = activeTab === 'strength'
  const tab = TABS.find((t) => t.id === activeTab) || TABS[0]
  const series = useMemo(() => seededSeries(`${activeTab}-${range}`, 16), [activeTab, range])
  const { pct: strengthPct, missing } = useStrength(bundle)

  return (
    <Card padding={16}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 800,
            color: '#163146',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Activity &amp; Strength
        </h3>
        {!isStrength && (
          <span style={{ fontSize: 10, color: 'rgba(22,49,70,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>
            STUB DATA
          </span>
        )}
      </div>

      {/* Tab nav (horizontal scroll, gold underline on active) */}
      <div
        className='no-scrollbar'
        style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          borderBottom: '1px solid rgba(22,49,70,0.08)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((t) => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              type='button'
              onClick={() => setActiveTab(t.id)}
              style={{
                position: 'relative',
                padding: '6px 6px 8px',
                background: active ? 'rgba(152,106,65,0.08)' : 'transparent',
                color: active ? '#7a5435' : 'rgba(22,49,70,0.55)',
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: 0,
                borderRadius: '6px 6px 0 0',
              }}
            >
              {t.label}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    bottom: -1,
                    height: 2,
                    background: '#986a41',
                    borderRadius: 2,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Body */}
      {isStrength ? (
        <StrengthBody pct={strengthPct} missing={missing} />
      ) : (
        <MetricBody tab={tab} series={series} range={range} setRange={setRange} />
      )}
    </Card>
  )
}

const MetricBody = ({ tab, series, range, setRange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingTop: 10 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#163146', letterSpacing: '-0.02em' }}>
        {tab.metric}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#15803d' }}>{tab.delta}</div>
    </div>
    <div style={{ flex: 1, minHeight: 0, marginTop: 6 }}>
      <Sparkline data={series} />
    </div>
    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexShrink: 0 }}>
      {RANGES.map((r) => {
        const active = r === range
        return (
          <button
            key={r}
            type='button'
            onClick={() => setRange(r)}
            style={{
              padding: '4px 9px',
              background: active ? '#163146' : 'rgba(22,49,70,0.06)',
              color: active ? '#fff' : 'rgba(22,49,70,0.7)',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              borderRadius: 999,
              cursor: 'pointer',
              border: 0,
            }}
          >
            {r}
          </button>
        )
      })}
    </div>
  </div>
)

const StrengthBody = ({ pct, missing }) => (
  <div style={{ display: 'flex', flex: 1, minHeight: 0, paddingTop: 10, gap: 14, alignItems: 'flex-start' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <ProgressRing value={pct} size={120} label='Strength' />
    </div>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(22,49,70,0.5)',
          marginBottom: 4,
        }}
      >
        {missing.length === 0
          ? 'Profile complete'
          : `${missing.length} thing${missing.length > 1 ? 's' : ''} to finish`}
      </div>
      <ul
        className='no-scrollbar'
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          overflowY: 'auto',
          maxHeight: '100%',
          fontSize: 12,
          color: '#163146',
          lineHeight: 1.55,
        }}
      >
        {missing.length === 0 ? (
          <li style={{ color: 'rgba(22,49,70,0.55)' }}>You're all set.</li>
        ) : (
          missing.map((m, i) => (
            <li key={i} style={{ display: 'flex', gap: 6, padding: '3px 0' }}>
              <span style={{ color: '#986a41', fontWeight: 900 }}>•</span>
              <span>{m}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  </div>
)

export default ActivityStrengthCard
