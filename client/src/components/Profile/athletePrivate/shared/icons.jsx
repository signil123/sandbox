import React from 'react'

// Outline icon set — sized via `size` prop, color inherits from `currentColor`.
// Brand glyphs (Instagram/Twitter/etc.) use stroke-only paths to feel like the
// rest of the UI; we'll swap to brand-colored fills later if needed.

const stroke = (size, children, viewBox = '0 0 24 24', extraProps = {}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill='none'
    stroke='currentColor'
    strokeWidth={1.7}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...extraProps}
  >
    {children}
  </svg>
)

export const Pencil = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M12 20h9' />
      <path d='M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z' />
    </>
  )

export const Plus = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M12 5v14' />
      <path d='M5 12h14' />
    </>
  )

export const ChevronRight = ({ size = 16 }) => stroke(size, <path d='M9 18l6-6-6-6' />)
export const ChevronLeft = ({ size = 16 }) => stroke(size, <path d='M15 18l-9-6 9-6' />)
export const ChevronDown = ({ size = 14 }) => stroke(size, <path d='M6 9l6 6 6-6' />)
export const ArrowRight = ({ size = 16 }) =>
  stroke(
    size,
    <>
      <path d='M5 12h14' />
      <path d='M12 5l7 7-7 7' />
    </>
  )

export const Mail = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <rect x='2' y='4' width='20' height='16' rx='2' />
      <path d='M22 7l-10 6L2 7' />
    </>
  )
export const Phone = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
  )
export const Pin = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z' />
      <circle cx='12' cy='10' r='3' />
    </>
  )

export const Lock = ({ size = 12 }) =>
  stroke(
    size,
    <>
      <rect x='3' y='11' width='18' height='10' rx='2' />
      <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </>
  )
export const Camera = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
      <circle cx='12' cy='13' r='4' />
    </>
  )

export const Eye = ({ size = 12 }) =>
  stroke(
    size,
    <>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </>
  )

export const Users = ({ size = 12 }) =>
  stroke(
    size,
    <>
      <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='9' cy='7' r='4' />
      <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
      <path d='M16 3.13a4 4 0 0 1 0 7.75' />
    </>
  )

export const DollarSign = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <line x1='12' y1='1' x2='12' y2='23' />
      <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
    </>
  )

export const Clock = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </>
  )

export const Target = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='12' cy='12' r='10' />
      <circle cx='12' cy='12' r='6' />
      <circle cx='12' cy='12' r='2' />
    </>
  )

export const Heart = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z' />
  )

export const ExternalLink = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
      <polyline points='15 3 21 3 21 9' />
      <line x1='10' y1='14' x2='21' y2='3' />
    </>
  )

export const MessageSquare = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
  )

export const Search = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='11' cy='11' r='8' />
      <line x1='21' y1='21' x2='16.65' y2='16.65' />
    </>
  )

export const X = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </>
  )

// Brand glyphs (simplified outlines so they sit nicely beside text)
export const Instagram = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <rect x='3' y='3' width='18' height='18' rx='5' />
      <circle cx='12' cy='12' r='4' />
      <circle cx='17.5' cy='6.5' r='0.6' fill='currentColor' />
    </>
  )
export const Twitter = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 8.6c0 .3 0 .6.1.9A11.4 11.4 0 0 1 3.5 5.2a4 4 0 0 0 1.2 5.4 4 4 0 0 1-1.8-.5v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6 11.4 11.4 0 0 0 8.2 20c7.5 0 11.6-6.2 11.6-11.6v-.5A8.3 8.3 0 0 0 22 5.8z' />
  )
export const Tiktok = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M19.5 7.5a5 5 0 0 1-3.5-1.5v8.5a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2 2.8V3h2.6a5 5 0 0 0 3.5 4.5z' />
  )
export const Youtube = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <rect x='2' y='5' width='20' height='14' rx='3' />
      <path d='M10 9l5 3-5 3z' fill='currentColor' />
    </>
  )
export const Linkedin = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <rect x='3' y='3' width='18' height='18' rx='3' />
      <path d='M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7' />
    </>
  )
export const Facebook = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' />
  )

export const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  tiktok: Tiktok,
  youtube: Youtube,
  linkedin: Linkedin,
  facebook: Facebook,
}

// Well-known custom platforms — used by SocialsRow to render an outline glyph
// for platforms users commonly add but that aren't in the builtin 6. Anything
// not in this map falls back to a single-letter initials tile.
export const Reddit = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='12' cy='13' r='8' />
      <circle cx='9' cy='13' r='1.2' fill='currentColor' />
      <circle cx='15' cy='13' r='1.2' fill='currentColor' />
      <path d='M9 16c1 1 2 1.5 3 1.5s2-.5 3-1.5' />
      <circle cx='19' cy='6' r='1.4' />
      <path d='M18 7l-3 3' />
    </>
  )

export const Discord = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M7 9c2-1 4-1.5 5-1.5s3 .5 5 1.5l1 8c-2 1-4 1.5-5 1.5l-1-2c-1 .3-2 .3-3 0l-1 2c-1 0-3-.5-5-1.5z' />
      <circle cx='10' cy='13' r='1' fill='currentColor' />
      <circle cx='14' cy='13' r='1' fill='currentColor' />
    </>
  )

export const Github = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M9 19c-3 1-3-1.5-4-2m8 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.2 0C4.6 2.8 3.6 3.1 3.6 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 2.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21' />
  )

export const Twitch = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M4 4h16v10l-4 4h-3l-3 3H8v-3H4z' />
      <path d='M11 8v5M15 8v5' />
    </>
  )

export const Pinterest = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='12' cy='12' r='9' />
      <path d='M11 8c0 4-2 6-2 9M12 8c0 3 1 5 3 5s2-2 2-3-1-3-3-3a4 4 0 0 0-4 4' />
    </>
  )

export const Snapchat = ({ size = 14 }) =>
  stroke(
    size,
    <path d='M12 3a4.5 4.5 0 0 1 4.5 4.5c0 2-.3 3.5-.5 4 .5.5 1.5 1 3 1.2-.3 1-1.3 1.5-2.5 1.7-.2.7.5 2 .5 2s-1.5.5-3 0c-1 1.3-2.5 2-4 2s-3-.7-4-2c-1.5.5-3 0-3 0s.7-1.3.5-2c-1.2-.2-2.2-.7-2.5-1.7 1.5-.2 2.5-.7 3-1.2-.2-.5-.5-2-.5-4A4.5 4.5 0 0 1 12 3z' />
  )

export const Threads = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M16 9c-.5-2-2-3-4-3-3 0-5 2-5 6 0 3 2 6 5 6s5-1.5 5-4c0-2-1.5-3-4-3-1.5 0-2.5.5-2.5 2 0 1 1 1.5 2 1.5' />
    </>
  )

export const Mastodon = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <path d='M5 7c0-2 2-3 7-3s7 1 7 3v6c0 2-1 3-3 3.5-3 .8-6 .5-7 0' />
      <path d='M9 10v4M15 10v4M9 12c1.5 1 4.5 1 6 0' />
      <path d='M7 17c1 1 3 1.5 5 1.5' />
    </>
  )

export const Signal = ({ size = 14 }) =>
  stroke(
    size,
    <>
      <circle cx='12' cy='12' r='8' />
      <path d='M5 5l1 2M19 5l-1 2M5 19l1-2M19 19l-1-2' />
    </>
  )

// Lookup keyed by lowercased + space-stripped app name. SocialsRow uses this
// to map a custom platform string to its glyph (or fall back to initials).
export const CUSTOM_SOCIAL_ICONS = {
  reddit: Reddit,
  discord: Discord,
  github: Github,
  twitch: Twitch,
  pinterest: Pinterest,
  snapchat: Snapchat,
  threads: Threads,
  mastodon: Mastodon,
  signal: Signal,
}
