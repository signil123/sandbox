import React, { useEffect, useState } from 'react'
import { Card, EditPencil } from './shared/primitives'
import { Mail, Phone, Pin, Lock, Plus, Camera, SOCIAL_ICONS, CUSTOM_SOCIAL_ICONS } from './shared/icons'
import { getImageUrl } from '../../../utils/imageUtils'
import { connectionService } from '../../../services/connectionService'

// Header card layout (matches the design screenshot):
//   ┌──────────────────────────────────────────────────────────────────┐
//   │  [banner with "Edit banner" pinned top-right]                    │
//   ├──────┬───────────────────────────────────────┬───────────────────┤
//   │  AV  │  Name [pencil]                        │  About Me  [pncl] │
//   │      │  Sport · Position                     │  <bio text>       │
//   │      │  School · Class of YYYY               │                   │
//   │      │  📍 Location · 47 connections         │                   │
//   ├──────┴───────────────────────────────────────┴───────────────────┤
//   │  ✉ email PUBLIC | ☎ phone PRIVATE | SOCIALS [icons] [+] [pncl]   │
//   └──────────────────────────────────────────────────────────────────┘

const initialsOf = (name) => {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}

const formatGradClass = (year) => {
  if (!year) return ''
  const trimmed = String(year).trim()
  if (/^class of/i.test(trimmed)) return trimmed
  return `Class of ${trimmed}`
}

const VisibilityBadge = ({ isPublic }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 9.5,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: isPublic ? '#15803d' : '#7a5435',
      marginLeft: 6,
    }}
  >
    {isPublic ? (
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: '#15803d',
          display: 'inline-block',
        }}
      />
    ) : (
      <Lock size={10} />
    )}
    {isPublic ? 'Public' : 'Private'}
  </span>
)

const Divider = () => (
  <span
    aria-hidden
    style={{
      width: 1,
      alignSelf: 'stretch',
      background: 'rgba(22,49,70,0.10)',
      margin: '0 4px',
    }}
  />
)

const HeaderCard = ({ bundle, currentUserId, onEdit, onEditSocials, density = 'comfortable' }) => {
  const compact = density === 'compact'
  const profile = bundle?.profile || {}
  const user = bundle?.user || {}

  const fullName = user.name || 'Your Name'
  const initials = initialsOf(fullName)
  const photoUrl = profile.photo || profile.profileImage || user.profileImage || null
  // Skip placeholder/fallback images so the initials avatar shows instead
  const isPlaceholderUrl = (u) => !u || /placeholder|unsplash/i.test(u)
  const photoSrc = !isPlaceholderUrl(photoUrl) ? getImageUrl(photoUrl) : null
  const bannerSrc = profile.bannerImage ? getImageUrl(profile.bannerImage) : null

  const visibility = profile.publicVisibility || { email: true, phone: true }
  const socials = Array.isArray(profile.socials) ? profile.socials : []
  const visibleSocials = socials.filter((s) => s.handle || s.url)

  // Connection count (live). Always renders — defaults to 0 until loaded so
  // the header layout stays consistent regardless of network state.
  const [connCount, setConnCount] = useState(0)
  useEffect(() => {
    if (!currentUserId) return
    let cancelled = false
    connectionService
      .getNetwork(currentUserId)
      .then((res) => {
        if (cancelled) return
        // Network endpoint returns the full list — count = list length.
        const raw =
          res?.data?.data?.connections ||
          res?.data?.connections ||
          res?.data?.data ||
          res?.data ||
          []
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        setConnCount(list.length)
      })
      .catch(() => {
        // Leave at 0 on error rather than hiding the row.
      })
    return () => {
      cancelled = true
    }
  }, [currentUserId])

  const bannerH = compact ? 80 : 92
  const avatarSize = compact ? 80 : 88

  return (
    <Card padding={0}>
      {/* Banner band — also hosts the absolutely-positioned avatar so it can
          overlap into the body without escaping the (overflow:hidden) Card. */}
      <div
        style={{
          height: bannerH,
          flexShrink: 0,
          background: bannerSrc
            ? `url(${bannerSrc}) center/cover no-repeat`
            : `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) 0 0/14px 14px,
               linear-gradient(135deg, #163146 0%, #1c3e5a 50%, #0a1824 100%)`,
          position: 'relative',
        }}
      >
        <button
          type='button'
          onClick={onEdit}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'rgba(255,255,255,0.16)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.28)',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Camera size={12} />
          Edit banner
        </button>

        {/* Avatar — pinned to bottom of banner, half spilling into body */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            bottom: -avatarSize / 2,
            width: avatarSize,
            height: avatarSize,
          }}
        >
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: '50%',
              background: photoSrc ? `url(${photoSrc}) center/cover` : '#163146',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: Math.round(avatarSize * 0.32),
              fontWeight: 900,
              letterSpacing: '-0.02em',
              border: '4px solid #fff',
              boxShadow: '0 4px 14px -2px rgba(22,49,70,0.18)',
            }}
          >
            {!photoSrc && initials}
          </div>
          <button
            type='button'
            onClick={onEdit}
            aria-label='Change photo'
            style={{
              position: 'absolute',
              right: -2,
              bottom: 2,
              width: 26,
              height: 26,
              borderRadius: 999,
              background: '#986a41',
              color: '#fff',
              fontSize: 11,
              fontWeight: 900,
              border: '2px solid #fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={12} />
          </button>
        </div>
      </div>

      {/* Identity + About row — left-padded to clear the absolutely-positioned avatar */}
      <div
        style={{
          padding: `${avatarSize / 2 + 8}px 22px 14px ${avatarSize + 22 + 18}px`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'flex-start',
          minHeight: 0,
          flex: 1,
        }}
      >
        {/* Identity column */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2
              style={{
                margin: 0,
                fontSize: compact ? 22 : 24,
                fontWeight: 900,
                color: '#163146',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </h2>
            <EditPencil onClick={onEdit} label='Edit identity' />
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              color: '#163146',
              fontWeight: 600,
            }}
          >
            {[profile.sport, profile.position].filter(Boolean).join(' · ') || (
              <span style={{ color: 'rgba(22,49,70,0.4)', fontStyle: 'italic' }}>Sport · Position</span>
            )}
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: 'rgba(22,49,70,0.7)' }}>
            {profile.school && <span>{profile.school}</span>}
            {profile.school && profile.classYear && <span> · </span>}
            {profile.classYear && <span>{formatGradClass(profile.classYear)}</span>}
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              fontSize: 12,
              color: 'rgba(22,49,70,0.65)',
            }}
          >
            {profile.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Pin size={12} />
                <span>{profile.location}</span>
              </span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#7a5435',
                fontWeight: 800,
              }}
            >
              <PeopleIcon />
              <span>
                {connCount} connection{connCount === 1 ? '' : 's'}
              </span>
            </span>
          </div>
        </div>

        {/* About me column */}
        <div style={{ paddingLeft: 24, minWidth: 0, position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(22,49,70,0.55)',
              }}
            >
              About Me
            </div>
            <EditPencil onClick={onEdit} label='Edit about me' />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: '#163146',
              fontWeight: 400,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 4,
              overflow: 'hidden',
            }}
          >
            {profile.aboutMe || profile.bio || (
              <span style={{ color: 'rgba(22,49,70,0.4)', fontStyle: 'italic' }}>
                No about me written yet.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Contact strip — full width, dividers between groups, edit pencil right-aligned */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 22px',
          borderTop: '1px solid rgba(22,49,70,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(22,49,70,0.015)',
        }}
      >
        <ContactItem
          icon={<Mail size={13} />}
          value={user.email || 'No email set'}
          isPublic={visibility.email}
          dimmed={!user.email}
        />
        <Divider />
        <ContactItem
          icon={<Phone size={13} />}
          value={user.phone || 'No phone set'}
          isPublic={visibility.phone}
          dimmed={!user.phone}
        />
        <Divider />
        <SocialsRow socials={visibleSocials} onAdd={onEditSocials || onEdit} />
        <div style={{ flex: 1 }} />
        <EditPencil onClick={onEdit} label='Edit contacts' />
      </div>
    </Card>
  )
}

const PeopleIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8}
    strokeLinecap='round' strokeLinejoin='round'>
    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
    <circle cx='9' cy='7' r='4' />
    <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
    <path d='M16 3.13a4 4 0 0 1 0 7.75' />
  </svg>
)

const ContactItem = ({ icon, value, isPublic, dimmed }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: dimmed ? 'rgba(22,49,70,0.4)' : '#163146',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ color: 'rgba(22,49,70,0.5)' }}>{icon}</span>
    <span>{value}</span>
    {!dimmed && <VisibilityBadge isPublic={isPublic} />}
  </span>
)

const SocialsRow = ({ socials, onAdd }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 900,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(22,49,70,0.55)',
      }}
    >
      Socials
    </span>
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
      {socials.map((s, idx) => {
        // Builtin platforms hit SOCIAL_ICONS by their lowercase key. Custom
        // platforms try CUSTOM_SOCIAL_ICONS by lowercased+stripped name first
        // (Reddit, Discord, GitHub, etc.); if that misses, fall back to a
        // single-letter initials tile.
        const builtinIcon = SOCIAL_ICONS[s.platform]
        const customKey = (s.platform || '').toLowerCase().replace(/\s+/g, '')
        const customIcon = !builtinIcon ? CUSTOM_SOCIAL_ICONS[customKey] : null
        const Icon = builtinIcon || customIcon
        const initial = (s.platform || '?').trim().charAt(0).toUpperCase()
        return (
          <span
            key={`${s.platform}-${idx}`}
            title={`${s.platform}${s.handle ? ` · ${s.handle}` : ''}${s.public ? '' : ' · private'}`}
            style={{
              position: 'relative',
              width: 26,
              height: 26,
              borderRadius: 7,
              background: s.public ? '#163146' : 'rgba(22,49,70,0.10)',
              color: s.public ? '#fff' : '#163146',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0,
            }}
          >
            {Icon ? <Icon size={13} /> : initial}
            {!s.public && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: -3,
                  right: -3,
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  background: '#7a5435',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #fff',
                }}
              >
                <Lock size={7} />
              </span>
            )}
          </span>
        )
      })}
      <button
        type='button'
        onClick={onAdd}
        aria-label='Add social'
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: 'rgba(152,106,65,0.10)',
          color: '#7a5435',
          border: '1px dashed rgba(152,106,65,0.5)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Plus size={12} />
      </button>
    </span>
  </span>
)

export default HeaderCard
