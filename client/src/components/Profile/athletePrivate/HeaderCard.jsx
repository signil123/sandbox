import React, { useEffect, useState } from 'react'
import { EditPencil } from './shared/primitives'
import {
  Mail,
  Phone,
  Pin,
  Lock,
  Eye,
  Plus,
  Users,
  SOCIAL_ICONS,
  CUSTOM_SOCIAL_ICONS,
} from './shared/icons'
import { getImageUrl } from '../../../utils/imageUtils'
import { connectionService } from '../../../services/connectionService'

// HeaderCard — matches Claude Design "Athlete Private Profile":
//
//   ┌──────────────────────────────────────────────────────────────────────┐
//   │ [banner — short, gradient, dot-grid + bronze glow puff]   [pencil]   │
//   ├──────┬─────────────────────────────────────┬────┬─────────────────────┤
//   │  AV  │  Name                               │ ╎  │  ABOUT ME           │
//   │      │  Sport · Position                   │ ╎  │  <bio text>         │
//   │      │  School · Class of YYYY             │ ╎  │                     │
//   │      │  📍 Location   👥 N connections     │ ╎  │                     │
//   ├──────┴─────────────────────────────────────┴────┴─────────────────────┤
//   │  ✉ email PUBLIC | ☎ phone PRIVATE | SOCIALS [icons] [+]               │
//   └──────────────────────────────────────────────────────────────────────┘
//
// One pencil (top-right) opens the combined Identity/Bio/Contacts modal.
// Socials get edited via the [+] button on the contact strip.

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

const HeaderCard = ({
  bundle,
  currentUserId,
  onEdit,
  onEditSocials,
  onOpenConnections,
  density = 'comfortable',
}) => {
  const compact = density === 'compact'
  const profile = bundle?.profile || {}
  const user = bundle?.user || {}

  const fullName = user.name || 'Your Name'
  const initials = initialsOf(fullName)
  const photoUrl = profile.photo || profile.profileImage || user.profileImage || null
  const isPlaceholderUrl = (u) => !u || /placeholder|unsplash/i.test(u)
  const photoSrc = !isPlaceholderUrl(photoUrl) ? getImageUrl(photoUrl) : null
  const bannerSrc = profile.bannerImage ? getImageUrl(profile.bannerImage) : null

  const visibility = profile.publicVisibility || { email: true, phone: true }
  const socials = Array.isArray(profile.socials) ? profile.socials : []
  const visibleSocials = socials.filter((s) => s.handle || s.url)

  const [connCount, setConnCount] = useState(0)
  useEffect(() => {
    if (!currentUserId) return
    let cancelled = false
    connectionService
      .getNetwork(currentUserId)
      .then((res) => {
        if (cancelled) return
        const raw =
          res?.data?.data?.connections ||
          res?.data?.connections ||
          res?.data?.data ||
          res?.data ||
          []
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        setConnCount(list.length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentUserId])

  const bannerH = compact ? 56 : 64
  const avatarSize = compact ? 70 : 78

  // Banner gradient — uses the saved banner image if present, else a
  // navy-leaning gradient with dot-grid and bronze glow puff per design.
  const bannerBg = bannerSrc
    ? `url(${bannerSrc}) center/cover no-repeat`
    : 'linear-gradient(135deg, hsl(220 30% 30%) 0%, hsl(220 40% 22%) 50%, #0a1824 100%)'

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 22,
        border: '1px solid rgba(22,49,70,0.05)',
        boxShadow: '0 2px 8px -2px rgba(22,49,70,0.06)',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Banner — short band, decorative */}
      <div
        style={{
          height: bannerH,
          flexShrink: 0,
          background: bannerBg,
          position: 'relative',
          borderRadius: '22px 22px 0 0',
          overflow: 'hidden',
        }}
      >
        {!bannerSrc && (
          <>
            {/* faint dot grid */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                opacity: 0.5,
              }}
            />
            {/* bronze glow puff */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                right: -40,
                top: -30,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background:
                  'radial-gradient(closest-side, rgba(152,106,65,0.45), transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
          </>
        )}
      </div>

      <div
        style={{
          padding: compact ? '0 22px 12px' : '0 26px 14px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1.4fr) 1px minmax(0, 1fr)',
            gap: compact ? 16 : 22,
            alignItems: 'flex-start',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Avatar — overlaps banner */}
          <div
            style={{
              marginTop: -(bannerH * 0.55),
              position: 'relative',
              alignSelf: 'flex-start',
            }}
          >
            <div
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: '50%',
                background: photoSrc
                  ? `url(${photoSrc}) center/cover`
                  : 'linear-gradient(135deg,#163146,#0a1824)',
                border: '4px solid #fff',
                boxShadow: '0 10px 24px -8px rgba(22,49,70,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: compact ? 30 : 34,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {!photoSrc && initials}
            </div>
          </div>

          {/* Identity column */}
          <div style={{ paddingTop: compact ? 8 : 10, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: compact ? 19 : 22,
                  fontWeight: 800,
                  color: '#163146',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.1,
                }}
              >
                {fullName}
              </h1>
              <EditPencil onClick={onEdit} label='Edit profile' />
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: 'rgba(22,49,70,0.78)',
                fontWeight: 600,
              }}
            >
              {[profile.sport, profile.position].filter(Boolean).join(' · ') || (
                <span style={{ color: 'rgba(22,49,70,0.4)', fontStyle: 'italic' }}>
                  Sport · Position
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 1,
                fontSize: 11.5,
                color: 'rgba(22,49,70,0.6)',
                fontWeight: 500,
              }}
            >
              {profile.school && <span>{profile.school}</span>}
              {profile.school && profile.classYear && <span> · </span>}
              {profile.classYear && <span>{formatGradClass(profile.classYear)}</span>}
            </div>

            <div
              style={{
                marginTop: compact ? 6 : 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: compact ? 10 : 14,
                alignItems: 'center',
                fontSize: 11.5,
                color: 'rgba(22,49,70,0.7)',
              }}
            >
              {profile.location && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Pin size={12} />
                  {profile.location}
                </span>
              )}
              <button
                type='button'
                onClick={onOpenConnections}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#986a41',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontSize: 11.5,
                }}
              >
                <Users size={12} /> {connCount} connection{connCount === 1 ? '' : 's'}
              </button>
            </div>
          </div>

          {/* divider */}
          <div
            aria-hidden
            style={{
              width: 1,
              alignSelf: 'stretch',
              background: 'rgba(22,49,70,0.07)',
              marginTop: compact ? 10 : 12,
            }}
          />

          {/* About me column */}
          <div style={{ paddingTop: compact ? 10 : 12, minWidth: 0 }}>
            <div style={{ marginBottom: 5 }}>
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: '0.22em',
                  color: '#986a41',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                ABOUT ME
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: compact ? 12 : 12.5,
                lineHeight: 1.5,
                color: 'rgba(22,49,70,0.78)',
                fontWeight: 400,
                overflow: 'hidden',
              }}
            >
              {profile.aboutMe || profile.bio ? (
                truncate(profile.aboutMe || profile.bio, 250)
              ) : (
                <span style={{ color: 'rgba(22,49,70,0.4)', fontStyle: 'italic' }}>
                  No about me written yet.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Bottom contact strip — full width */}
        <div
          style={{
            marginTop: compact ? 8 : 10,
            paddingTop: compact ? 8 : 10,
            borderTop: '1px dashed rgba(22,49,70,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 14 : 20,
            fontSize: 11.5,
            color: 'rgba(22,49,70,0.78)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <ContactItem icon={<Mail size={12} />} value={user.email || 'No email set'} isPublic={visibility.email} dimmed={!user.email} />
          <span aria-hidden style={{ width: 1, height: 14, background: 'rgba(22,49,70,0.1)' }} />
          <ContactItem icon={<Phone size={12} />} value={user.phone || 'No phone set'} isPublic={visibility.phone} dimmed={!user.phone} />
          <span aria-hidden style={{ width: 1, height: 14, background: 'rgba(22,49,70,0.1)' }} />
          <SocialsRow socials={visibleSocials} onAdd={onEditSocials || onEdit} />
        </div>
      </div>
    </section>
  )
}

const truncate = (s, n) => {
  if (!s) return ''
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

const ContactItem = ({ icon, value, isPublic, dimmed }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      color: dimmed ? 'rgba(22,49,70,0.4)' : 'rgba(22,49,70,0.78)',
    }}
  >
    {icon}
    {value}
    {!dimmed && (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: isPublic ? '#1f7a3f' : 'rgba(22,49,70,0.45)',
          letterSpacing: '0.1em',
          marginLeft: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {isPublic ? <Eye size={10} /> : <Lock size={10} />}
        {isPublic ? 'PUBLIC' : 'PRIVATE'}
      </span>
    )}
  </span>
)

const SocialsRow = ({ socials, onAdd }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(22,49,70,0.45)',
        letterSpacing: '0.12em',
        marginRight: 2,
      }}
    >
      SOCIALS
    </span>
    {socials.map((s, idx) => {
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
            width: 22,
            height: 22,
            borderRadius: 7,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: s.public ? '#163146' : 'rgba(22,49,70,0.06)',
            color: s.public ? '#fff' : 'rgba(22,49,70,0.4)',
          }}
        >
          {Icon ? <Icon size={11} /> : initial}
          {!s.public && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 11,
                height: 11,
                borderRadius: 6,
                background: '#fff',
                border: '1px solid rgba(22,49,70,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={6} />
            </span>
          )}
        </span>
      )
    })}
    <button
      type='button'
      onClick={onAdd}
      title='Add or edit social'
      aria-label='Add social'
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(152,106,65,0.08)',
        color: '#986a41',
        border: '1px dashed rgba(152,106,65,0.4)',
        cursor: 'pointer',
      }}
    >
      <Plus size={11} />
    </button>
  </span>
)

export default HeaderCard
