import mongoose from 'mongoose'
import { createError } from '../error.js'
import { ProfileView } from '../models/ProfileView.js'
import { Connection, ConnectionRequest } from '../models/Relationship.js'

// Phase D — real Activity timeseries for the athlete private profile.
//
// GET /api/profile/me/stats/{views|connections|received|sent}?range=1D|1W|1M|3M|YTD|1Y
//
// Response shape:
//   {
//     points: [{ t: ISOString, v: Number }],   // bucketed counts across the window
//     allTimeTotal: Number,                    // lifetime total of this metric
//     windowDelta: Number,                     // sum of points (events in window)
//     deltaPct: Number,                        // windowDelta / allTimeTotalAtWindowStart * 100
//     rangeLabel: String,                      // 'Today' | 'This Week' | etc — for the subtitle
//   }
//
// On a brand-new account with zero events, we still return a flat zero series
// of the right length so the client can render a flat baseline with total=0
// and deltaPct=0 (no division-by-zero — when the all-time total at the start
// of the window is 0, deltaPct is reported as 0).

const RANGE_CONFIG = {
  '1D': { label: 'Today', windowMs: 24 * 60 * 60 * 1000, bucket: 'hour', buckets: 24 },
  '1W': { label: 'This Week', windowMs: 7 * 24 * 60 * 60 * 1000, bucket: 'day', buckets: 7 },
  '1M': { label: 'This Month', windowMs: 30 * 24 * 60 * 60 * 1000, bucket: 'day', buckets: 30 },
  '3M': { label: 'Last 3 Months', windowMs: 90 * 24 * 60 * 60 * 1000, bucket: 'day', buckets: 90 },
  YTD: { label: 'Year to Date', bucket: 'week', ytd: true },
  '1Y': { label: 'This Year', windowMs: 365 * 24 * 60 * 60 * 1000, bucket: 'month', buckets: 12 },
}

// Build the [start, end] window and the array of bucket boundaries (length = buckets+1).
// Returns { start, end, edges: Date[] } where edges[i]..edges[i+1] is bucket i.
const buildWindow = (range) => {
  const cfg = RANGE_CONFIG[range]
  if (!cfg) return null
  const end = new Date()
  let start
  let edges = []

  if (cfg.ytd) {
    start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0)
    // Weekly buckets from Jan 1 → today. Number of weeks = ceil((end - start) / 1w).
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const totalMs = end.getTime() - start.getTime()
    const nWeeks = Math.max(1, Math.ceil(totalMs / weekMs))
    for (let i = 0; i <= nWeeks; i++) {
      edges.push(new Date(start.getTime() + i * weekMs))
    }
    edges[edges.length - 1] = end
  } else if (cfg.bucket === 'hour') {
    start = new Date(end.getTime() - cfg.windowMs)
    for (let i = 0; i <= cfg.buckets; i++) {
      edges.push(new Date(start.getTime() + i * 60 * 60 * 1000))
    }
    edges[edges.length - 1] = end
  } else if (cfg.bucket === 'day') {
    start = new Date(end.getTime() - cfg.windowMs)
    const dayMs = 24 * 60 * 60 * 1000
    for (let i = 0; i <= cfg.buckets; i++) {
      edges.push(new Date(start.getTime() + i * dayMs))
    }
    edges[edges.length - 1] = end
  } else if (cfg.bucket === 'month') {
    // 12 monthly buckets ending at the start of the current month + a partial bucket through today.
    const ref = new Date(end.getFullYear(), end.getMonth() - 11, 1, 0, 0, 0, 0)
    start = ref
    for (let i = 0; i <= 12; i++) {
      edges.push(new Date(ref.getFullYear(), ref.getMonth() + i, 1, 0, 0, 0, 0))
    }
    edges[edges.length - 1] = end
  }

  return { start, end, edges, label: cfg.label }
}

// Bucket an array of event timestamps into counts per (edges[i], edges[i+1]).
const bucketize = (timestamps, edges) => {
  const n = edges.length - 1
  const counts = new Array(n).fill(0)
  for (const t of timestamps) {
    const ms = t instanceof Date ? t.getTime() : new Date(t).getTime()
    if (ms < edges[0].getTime() || ms > edges[edges.length - 1].getTime()) continue
    // Binary search for bucket index.
    let lo = 0
    let hi = n - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (ms < edges[mid].getTime()) hi = mid - 1
      else if (ms >= edges[mid + 1].getTime()) lo = mid + 1
      else { lo = mid; break }
    }
    if (lo >= 0 && lo < n) counts[lo] += 1
  }
  return counts
}

// Resolve { events: Date[], allTimeTotal, allTimeBeforeStart } for a given metric + user.
const fetchMetric = async (metric, userId, start) => {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  if (metric === 'views') {
    const all = await ProfileView.find({ profileOwner: userObjectId }, { lastViewedAt: 1, _id: 0 }).lean()
    const events = all.map((d) => d.lastViewedAt).filter(Boolean)
    const allTimeTotal = events.length
    const allTimeBeforeStart = events.filter((t) => t.getTime() < start.getTime()).length
    return { events, allTimeTotal, allTimeBeforeStart }
  }

  if (metric === 'connections') {
    const all = await Connection.find(
      {
        $or: [{ user1: userObjectId }, { user2: userObjectId }],
        status: 'active',
      },
      { connectedAt: 1, _id: 0 }
    ).lean()
    const events = all.map((d) => d.connectedAt).filter(Boolean)
    const allTimeTotal = events.length
    const allTimeBeforeStart = events.filter((t) => t.getTime() < start.getTime()).length
    return { events, allTimeTotal, allTimeBeforeStart }
  }

  if (metric === 'received') {
    const all = await ConnectionRequest.find({ to: userObjectId }, { createdAt: 1, _id: 0 }).lean()
    const events = all.map((d) => d.createdAt).filter(Boolean)
    const allTimeTotal = events.length
    const allTimeBeforeStart = events.filter((t) => t.getTime() < start.getTime()).length
    return { events, allTimeTotal, allTimeBeforeStart }
  }

  if (metric === 'sent') {
    const all = await ConnectionRequest.find({ from: userObjectId }, { createdAt: 1, _id: 0 }).lean()
    const events = all.map((d) => d.createdAt).filter(Boolean)
    const allTimeTotal = events.length
    const allTimeBeforeStart = events.filter((t) => t.getTime() < start.getTime()).length
    return { events, allTimeTotal, allTimeBeforeStart }
  }

  return null
}

const METRIC_PARAM_MAP = {
  views: 'views',
  connections: 'connections',
  received: 'received',
  sent: 'sent',
}

export const getActivityStats = async (req, res, next) => {
  try {
    const metric = METRIC_PARAM_MAP[req.params.metric]
    if (!metric) return next(createError(400, 'Unknown metric'))

    const range = (req.query.range || '1M').toUpperCase()
    const window = buildWindow(range)
    if (!window) return next(createError(400, 'Unknown range'))

    const { start, edges, label } = window

    const result = await fetchMetric(metric, req.user._id, start)
    if (!result) return next(createError(400, 'Unknown metric'))

    const { events, allTimeTotal, allTimeBeforeStart } = result

    const counts = bucketize(events, edges)
    const points = counts.map((v, i) => ({ t: edges[i].toISOString(), v }))
    const windowDelta = counts.reduce((a, b) => a + b, 0)
    const deltaPct = allTimeBeforeStart > 0 ? (windowDelta / allTimeBeforeStart) * 100 : 0

    res.json({
      success: true,
      data: {
        metric,
        range,
        rangeLabel: label,
        points,
        allTimeTotal,
        windowDelta,
        deltaPct: Math.round(deltaPct * 10) / 10,
      },
    })
  } catch (err) {
    next(err)
  }
}
