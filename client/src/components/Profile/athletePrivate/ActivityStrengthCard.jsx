import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, ProgressRing } from './shared/primitives'
import { profileService } from '../../../services/profileService'

// Activity & Strength card.
// Five tabs (inline horizontal scroll, gold underline on active):
//   Profile Views | Connections | Received | Sent | Strength
// Range chips (1D / 1W / 1M / 3M / YTD / 1Y) hidden on Strength.
// Metric tabs render a real timeseries fetched from /api/profile/me/stats/*.
// Strength tab renders a 190px ring + "SCROLL FOR ↓ TO-DO" eyebrow + a
// below-the-fold to-do list (per Phase F design).

const TABS = [
  { id: 'views', label: 'Profile Views', metric: 'views' },
  { id: 'connections', label: 'Connections', metric: 'connections' },
  { id: 'received', label: 'Received', metric: 'received' },
  { id: 'sent', label: 'Sent', metric: 'sent' },
  { id: 'strength', label: 'Strength' },
]

const RANGES = ['1D', '1W', '1M', '3M', 'YTD', '1Y']

const NAVY = '#163146'
const BRONZE = '#986a41'

const formatNum = (n) => {
  if (n == null) return '—'
  if (n >= 1000) return n.toLocaleString()
  return String(n)
}

const FillSparkline = ({ data }) => {
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 320, h: 140 })
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])
  // Wrapper takes 100% of its parent flex slot. SVG inside is width:100% /
  // height:100% so it stretches with the wrapper; the measured viewBox keeps
  // path geometry crisp regardless of size.
  return (
    <div
      ref={wrapRef}
      style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', height: '100%' }}
    >
      <Sparkline data={data} w={size.w} h={size.h} />
    </div>
  )
}

const Sparkline = ({ data, w = 320, h = 130 }) => {
  if (!data || data.length < 2) {
    return (
      <svg
        width='100%'
        height='100%'
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio='none'
        style={{ display: 'block' }}
      >
        <line x1='0' x2={w} y1={h - 8} y2={h - 8} stroke='rgba(22,49,70,0.18)' strokeWidth='2' strokeDasharray='4 6' />
      </svg>
    )
  }
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = w / (data.length - 1)

  const pts = data.map((v, i) => [i * stepX, h - 8 - ((v - min) / range) * (h - 16)])
  const linePath = pts
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ')
  const fillPath = `${linePath} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg
      width='100%'
      height='100%'
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio='none'
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id='spark-fill' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor={BRONZE} stopOpacity='0.20' />
          <stop offset='100%' stopColor={BRONZE} stopOpacity='0' />
        </linearGradient>
      </defs>
      <path d={fillPath} fill='url(#spark-fill)' />
      <path
        d={linePath}
        fill='none'
        stroke={BRONZE}
        strokeWidth='2'
        strokeLinejoin='round'
        strokeLinecap='round'
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 0} fill={BRONZE} />
      ))}
    </svg>
  )
}

const useStrength = (bundle) => {
  return useMemo(() => {
    const profile = bundle?.profile || {}
    const user = bundle?.user || {}
    const interests = Array.isArray(bundle?.interests) ? bundle.interests : []
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
      { ok: (nil?.focusAreas || []).length >= 3, weight: 4, label: 'Pick at least 3 NIL focus areas' },
      { ok: !!user.email, weight: 4, label: 'Add an email' },
    ]
    const earned = checks.filter((c) => c.ok).reduce((sum, c) => sum + c.weight, 0)
    const missing = checks.filter((c) => !c.ok).map((c) => c.label)
    return { pct: Math.round(earned), missing }
  }, [bundle])
}

const useStatsCache = () => {
  const ref = useRef(new Map())
  return ref.current
}

const ActivityStrengthCard = ({ bundle }) => {
  const { pct: strengthPct, missing } = useStrength(bundle)
  const [activeTab, setActiveTab] = useState(() => (strengthPct < 100 ? 'strength' : 'views'))
  const [range, setRange] = useState('1M')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cache = useStatsCache()

  const isStrength = activeTab === 'strength'
  const tab = TABS.find((t) => t.id === activeTab) || TABS[0]

  useEffect(() => {
    if (isStrength) return
    const key = `${tab.metric}:${range}`
    const cached = cache.get(key)
    if (cached) {
      setStats(cached)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    profileService
      .getActivityStats(tab.metric, range)
      .then((data) => {
        if (cancelled) return
        cache.set(key, data)
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(typeof err === 'string' ? err : 'Failed to load')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab.metric, range, isStrength, cache])

  return (
    <Card padding={14}>
      <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 800,
              color: NAVY,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Activity &amp; Strength
          </h3>
        </div>

        <TabStrip tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

        {isStrength ? (
          <StrengthBody pct={strengthPct} missing={missing} />
        ) : (
          <MetricBody
            stats={stats}
            loading={loading}
            error={error}
            range={range}
            setRange={setRange}
          />
        )}
      </div>
    </Card>
  )
}

const TabStrip = ({ tabs, activeTab, onSelect }) => {
  const scrollerRef = useRef(null)
  const [overflow, setOverflow] = useState({ left: false, right: false })
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => {
      setOverflow({
        left: el.scrollLeft > 2,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      })
    }
    update()
    el.addEventListener('scroll', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [tabs.length])
  return (
    <div style={{ position: 'relative', flexShrink: 0, marginBottom: 10 }}>
      <div
        ref={scrollerRef}
        className='no-scrollbar'
        style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          overflowY: 'hidden',
          borderBottom: '1px solid rgba(22,49,70,0.08)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {tabs.map((t) => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              type='button'
              onClick={() => onSelect(t.id)}
              style={{
                position: 'relative',
                flexShrink: 0,
                padding: '5px 6px 7px',
                background: active ? 'rgba(152,106,65,0.10)' : 'transparent',
                border: 'none',
                borderRadius: '4px 4px 0 0',
                fontSize: 11,
                fontWeight: active ? 700 : 600,
                color: active ? '#7a5435' : 'rgba(22,49,70,0.55)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: active ? `inset 0 -2px 0 ${BRONZE}` : 'none',
                transition: 'color 120ms, background 120ms',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {overflow.left && <EdgeFade side='left' />}
      {overflow.right && <EdgeFade side='right' />}
    </div>
  )
}

const EdgeFade = ({ side }) => (
  <div
    aria-hidden='true'
    style={{
      position: 'absolute',
      top: 0,
      bottom: 1,
      width: 24,
      [side]: 0,
      pointerEvents: 'none',
      background:
        side === 'left'
          ? 'linear-gradient(to right, #fff 30%, rgba(255,255,255,0))'
          : 'linear-gradient(to left, #fff 30%, rgba(255,255,255,0))',
    }}
  />
)

const DeltaLine = ({ stats }) => {
  if (!stats) return null
  const { windowDelta, deltaPct, rangeLabel } = stats
  const positive = windowDelta > 0
  const negative = windowDelta < 0
  const color = positive ? '#15803d' : negative ? '#b91c1c' : 'rgba(22,49,70,0.55)'
  const arrow = positive ? '▲' : negative ? '▼' : '–'
  const sign = windowDelta > 0 ? '+' : ''
  const pctStr = `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color }}>
      <span style={{ fontSize: 10 }}>{arrow}</span>
      <span>
        {sign}
        {formatNum(windowDelta)} ({pctStr})
      </span>
      <span style={{ fontWeight: 600, color: 'rgba(22,49,70,0.55)' }}>{rangeLabel}</span>
    </div>
  )
}

const MetricBody = ({ stats, loading, error, range, setRange }) => {
  const series = stats?.points?.map((p) => p.v) || []
  const allTime = stats?.allTimeTotal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: NAVY, letterSpacing: '-0.025em', lineHeight: 1 }}>
          {loading && stats == null ? '—' : formatNum(allTime ?? 0)}
        </div>
        {error ? (
          <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: '#b91c1c' }}>
            {error}
          </div>
        ) : (
          <div style={{ marginTop: 6 }}>
            <DeltaLine stats={stats} />
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          marginBottom: 8,
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 120ms',
          display: 'flex',
        }}
      >
        <FillSparkline data={series} />
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 'auto' }}>
        {RANGES.map((r) => {
          const active = r === range
          return (
            <button
              key={r}
              type='button'
              onClick={() => setRange(r)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: active ? 'rgba(152,106,65,0.12)' : 'transparent',
                color: active ? '#7a5435' : 'rgba(22,49,70,0.55)',
                border: '1px solid ' + (active ? 'rgba(152,106,65,0.3)' : 'rgba(22,49,70,0.07)'),
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// StrengthBody — adopts the design's larger ring + scroll-down-for-todo
// pattern. The visible portion of the card is filled by the ring; the to-do
// list lives below the fold and the user scrolls down to see it.
const StrengthBody = ({ pct, missing }) => {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])
  return (
    <div
      ref={scrollRef}
      className='no-scrollbar'
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          minHeight: '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 0 16px',
          gap: 10,
        }}
      >
        <ProgressRing value={pct} size={190} label='Strength' />
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'rgba(22,49,70,0.5)',
            letterSpacing: '0.18em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {missing.length === 0 ? 'Profile complete' : 'Scroll for ↓ To‑do'}
        </div>
      </div>
      <div style={{ flexShrink: 0, paddingTop: 14, borderTop: '1px solid rgba(22,49,70,0.08)' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: NAVY,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {missing.length === 0
            ? 'Profile complete'
            : `${missing.length} thing${missing.length > 1 ? 's' : ''} to finish`}
        </div>
        {missing.length === 0 ? (
          <div style={{ color: 'rgba(22,49,70,0.55)', textAlign: 'center', fontSize: 12 }}>
            You're all set.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {missing.map((m, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11.5,
                  color: 'rgba(22,49,70,0.82)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 10px',
                  background: 'rgba(152,106,65,0.06)',
                  borderRadius: 6,
                  border: '1px solid rgba(152,106,65,0.12)',
                  lineHeight: 1.3,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: BRONZE,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityStrengthCard
