// Geo utilities — haversine distance + helpers for the connection mini-card
// distance filter. Used by AthleteConnectionsModal.
//
// Profiles store coordinates as `{ lat: Number, lng: Number }` (populated by
// LocationField when the user picks a Photon suggestion). Older docs may not
// have this set; callers should handle null defensively.

const EARTH_RADIUS_MI = 3958.8

const toRad = (deg) => (deg * Math.PI) / 180

// Haversine distance between two {lat, lng} points in miles. Returns null if
// either input is missing required numeric fields.
export const distanceMiles = (a, b) => {
  if (!a || !b) return null
  const aLat = Number(a.lat)
  const aLng = Number(a.lng)
  const bLat = Number(b.lat)
  const bLng = Number(b.lng)
  if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) return null
  if (!Number.isFinite(bLat) || !Number.isFinite(bLng)) return null
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Treat a connection as "remote" if either:
//   - their location string contains "remote" (case-insensitive), OR
//   - they have no location set at all.
// (Per #14 user call.)
export const isRemoteLocation = (locationStr) => {
  if (!locationStr) return true
  return /remote/i.test(String(locationStr))
}
