import React from 'react'
import { ExternalLink, MessageSquare } from './icons'
import { getImageUrl } from '../../../../utils/imageUtils'

// Shared mini-card used by both ConnectionCenterCard (top-3 view) and
// AthleteConnectionsModal (full grid view). Layout matches the Claude Design
// "Athlete Private Profile" connection mini-card:
//   - gradient banner (deterministic per-userId) with location top-right
//   - 38px avatar overlap
//   - name, role
//   - 2 expertise pills + "+N" overflow
//   - 2-line about clamp
//   - EXP/RATING/CONNECTIONS stat row
//   - View + Message buttons

const NAVY = '#163146'

// 8-color palette. Hash userId, mod 8 — same connection always gets the same
// gradient across reloads. Mirrors the Claude Design palette.
const GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1e3a8a)',
  'linear-gradient(135deg, #163146, #0a1824)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #10b981, #065f46)',
  'linear-gradient(135deg, #8b5cf6, #5b21b6)',
  'linear-gradient(135deg, #ef4444, #7f1d1d)',
  'linear-gradient(135deg, #0ea5e9, #0c4a6e)',
  'linear-gradient(135deg, #ec4899, #9d174d)',
]

const hashString = (s = '') => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export const gradientFor = (userId) => GRADIENTS[hashString(String(userId)) % GRADIENTS.length]

export const initialsOf = (name) => {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}

// Compute total years of professional experience from a profile's experience
// array. Treats "Present" / missing endDate as today.
const parseDate = (val) => {
  if (!val) return null
  const s = String(val).trim()
  if (/^present$/i.test(s)) return Date.now()
  const t = Date.parse(s)
  return Number.isFinite(t) ? t : null
}

const computeYearsExperience = (experience) => {
  if (!Array.isArray(experience) || experience.length === 0) return null
  const now = Date.now()
  let earliestStart = null
  let latestEnd = null
  for (const x of experience) {
    const start = parseDate(x.startDate)
    const end = parseDate(x.endDate) || now
    if (start != null && (earliestStart === null || start < earliestStart)) earliestStart = start
    if (end != null && (latestEnd === null || end > latestEnd)) latestEnd = end
  }
  if (earliestStart == null) return null
  const yrs = (latestEnd - earliestStart) / (1000 * 60 * 60 * 24 * 365)
  return Math.max(1, Math.round(yrs))
}

// TODO: F4 cleanup — these stub fallbacks render synthetic
// rating/expertise/EXP/about for connections whose Profile docs don't yet
// have those fields populated. When `seedConnectionMiniCardStubs.js --apply`
// has been run on the dev DB, real fields take precedence and these only
// fire for unseeded users. Pre-launch: run `--clear` and confirm none of
// these stub paths still fire (i.e. all connections have real data).
const STUB_RATINGS = [4.6, 4.7, 4.8, 4.9, 5.0]
const STUB_EXPERTISE = [
  ['Contract Negotiation', 'Legal Compliance', 'Trust & Estate'],
  ['Financial Planning', 'Brand Partnerships', 'Tax Strategy'],
  ['Career Development', 'Negotiation', 'Endorsements'],
  ['Tax Strategy', 'Multi-state Filing', 'S-corp Setup'],
  ['Brand Partnerships', 'Content Strategy', 'Social Growth'],
  ['Personal Brand', 'Public Speaking', 'Press Strategy'],
  ['Long-term Investing', 'Trust Setup', 'Insurance'],
  ['NCAA Compliance', 'State NIL Law', 'Eligibility'],
]
const STUB_ABOUT = [
  'Former in-house counsel for two SEC programs. Specializes in protecting young athletes through deal structure and clean exit terms.',
  'Builds long-horizon NIL plans that compound. Past clients include 30+ Power 5 athletes and a Pac-12 player of the year.',
  'Boutique agent focused on women’s basketball. Treats every roster move as a brand decision and runs negotiations end to end.',
  'CPA specializing in multi-state NIL income, S-corp setup, and quarterly estimates. Keeps athletes audit-ready year-round.',
  'Ex-agency creative director turned NIL strategist. Pairs athletes with brands that fit their voice, not just their reach.',
  'Coaches athletes on press, podcasts, and on-camera presence. Past clients have moved from college to nationally televised features.',
  'Helps athletes turn variable income into stable wealth through trusts, indexed portfolios, and proper insurance coverage.',
  'Stays on top of every state NIL bill so deals never threaten eligibility. Trusted by compliance offices at 4 major programs.',
]

const stubRatingFor = (userId) => STUB_RATINGS[hashString(String(userId)) % STUB_RATINGS.length]
const stubExpertiseFor = (userId) =>
  STUB_EXPERTISE[hashString(String(userId) + 'expertise') % STUB_EXPERTISE.length]
const stubExperienceYears = (userId) => 3 + (hashString(String(userId) + 'exp') % 13)
const stubAboutFor = (userId) =>
  STUB_ABOUT[hashString(String(userId) + 'about') % STUB_ABOUT.length]

const roleLabel = (userType, profile) => {
  if (profile?.title) return profile.title
  const map = {
    advisor: 'Advisor',
    agent: 'Agent',
    athlete: 'Athlete',
    user: 'Member',
  }
  return map[userType] || 'Member'
}

// Normalize a raw connection (from getNetwork response) + its public-profile
// fetch (which may be null for unseeded users) into the canonical mini-card
// data shape consumed by both ConnectionMiniCard and the modal's filter.
export const buildMiniCardData = ({ connection, currentUserId, publicProfile }) => {
  const otherUser = extractOtherUser(connection, currentUserId)
  const otherUserId = extractOtherUserId(connection, currentUserId)
  const profile = publicProfile?.profile || null
  const photo = otherUser?.profileImage
    ? getImageUrl(otherUser.profileImage)
    : profile?.photo
    ? getImageUrl(profile.photo)
    : null
  const expertise = (() => {
    const fromProfile = profile?.focusAreas
    if (Array.isArray(fromProfile) && fromProfile.length > 0) {
      return fromProfile
        .map((f) => (typeof f === 'string' ? f : f?.title))
        .filter(Boolean)
    }
    const interests = publicProfile?.interests
    if (Array.isArray(interests) && interests.length > 0) return interests.slice(0, 3)
    return stubExpertiseFor(otherUserId)
  })()
  const yearsExp = computeYearsExperience(profile?.experience) || stubExperienceYears(otherUserId)
  const rating = profile?.rating || stubRatingFor(otherUserId)
  const about = profile?.aboutMe || profile?.bio || stubAboutFor(otherUserId)
  return {
    userId: otherUserId,
    name: otherUser?.name || 'Unknown',
    role: roleLabel(otherUser?.userType, profile),
    userType: otherUser?.userType,
    photo,
    location: otherUser?.location || profile?.location || '',
    coordinates: profile?.coordinates || null,
    expertise,
    rating,
    experienceYears: yearsExp,
    connectionsCount: profile?.connectionsCount || null,
    about,
  }
}

// Helpers — connection response shape varies by endpoint version, so peel
// either `connectedUser` (formatted shape) or `user1`/`user2` (raw).
export const extractOtherUser = (c, currentUserId) => {
  if (c?.connectedUser) return c.connectedUser
  if (c?.user) return c.user
  const u1 = c?.user1
  const u2 = c?.user2
  if (!u1 || !u2) return null
  const u1Id = u1?._id?.toString?.() || u1?._id || u1
  return String(u1Id) === String(currentUserId) ? u2 : u1
}

export const extractOtherUserId = (c, currentUserId) => {
  const u = extractOtherUser(c, currentUserId)
  if (!u) return null
  return u.userId || u._id || u.id || null
}

const Stat = ({ label, value }) => (
  <div>
    <div
      style={{
        fontSize: 7.5,
        fontWeight: 700,
        color: 'rgba(22,49,70,0.42)',
        letterSpacing: '0.12em',
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 10, fontWeight: 800, color: NAVY }}>{value}</div>
  </div>
)

export const ConnectionMiniCard = ({ data, onMessage, onView }) => {
  const {
    userId,
    name,
    role,
    photo,
    location,
    expertise,
    rating,
    experienceYears,
    connectionsCount,
    about,
  } = data
  const gradient = gradientFor(userId)
  const visibleExpertise = (expertise || []).slice(0, 2)
  const more = Math.max(0, (expertise?.length || 0) - visibleExpertise.length)

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid rgba(22,49,70,0.06)',
        boxShadow: '0 2px 8px -2px rgba(22,49,70,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        transition: 'transform 300ms cubic-bezier(.22,1,.36,1), box-shadow 300ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(22,49,70,0.18)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(22,49,70,0.06)'
      }}
    >
      <div
        style={{
          height: 40,
          background: gradient,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 10px',
          flexShrink: 0,
        }}
      >
        {location && (
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '70%',
            }}
          >
            {location}
          </span>
        )}
      </div>

      <div
        style={{
          padding: '0 12px 12px',
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: photo ? `url(${photo}) center/cover` : gradient,
            color: '#fff',
            border: '3px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            marginTop: -19,
            marginBottom: 5,
          }}
        >
          {!photo && initialsOf(name)}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: NAVY,
            letterSpacing: '-0.005em',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(22,49,70,0.6)',
            fontWeight: 500,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {role}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
          {visibleExpertise.map((e, i) => (
            <span
              key={i}
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(22,49,70,0.04)',
                color: 'rgba(22,49,70,0.75)',
                border: '1px solid rgba(22,49,70,0.08)',
                maxWidth: 130,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e}
            </span>
          ))}
          {more > 0 && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                background: '#986a41',
                color: '#fff',
              }}
            >
              +{more}
            </span>
          )}
        </div>

        {about && (
          <div
            style={{
              fontSize: 10.5,
              lineHeight: 1.42,
              color: 'rgba(22,49,70,0.7)',
              marginTop: 7,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {about}
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 6,
            borderTop: '1px solid rgba(22,49,70,0.06)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 4,
          }}
        >
          <Stat label='EXP' value={experienceYears != null ? `${experienceYears} yrs` : 'N/A'} />
          <Stat label='RATING' value={rating != null ? rating.toFixed(1) : 'N/A'} />
          <Stat
            label='CONNECTIONS'
            value={connectionsCount != null ? connectionsCount.toLocaleString() : '0'}
          />
        </div>

        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <button
            type='button'
            onClick={() => onView?.(userId)}
            style={{
              padding: '6px 0',
              borderRadius: 8,
              background: '#fff',
              color: NAVY,
              border: '1px solid rgba(22,49,70,0.12)',
              fontSize: 10.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={11} /> View
          </button>
          <button
            type='button'
            onClick={() => onMessage?.(userId)}
            style={{
              padding: '6px 0',
              borderRadius: 8,
              background: NAVY,
              color: '#fff',
              border: `1px solid ${NAVY}`,
              fontSize: 10.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={11} /> Message
          </button>
        </div>
      </div>
    </div>
  )
}
