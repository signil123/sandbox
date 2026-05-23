/**
 * Phase D — synthetic activity backfill for the Activity & Strength card.
 *
 * Generates realistic timeseries shape across the last 365 days for one user:
 *   - ProfileView rows (one per unique synthetic viewer, lastViewedAt scattered)
 *   - Connection rows (mutual, status: 'active', connectedAt scattered)
 *   - ConnectionRequest rows in both directions (received + sent), createdAt scattered
 *
 * Each synthetic record is tagged with `__seed: true` (via the doc itself when
 * the schema is strict — we use a sentinel viewer/from prefix instead, since
 * Mongoose strict mode strips unknown fields). To stay clean, this script
 * creates a small pool of synthetic "ghost" Users (or reuses any tagged with
 * the synthetic email domain) and uses those as the counterparties.
 *
 * Usage:
 *   node server/scripts/seedActivityStats.js --user <userId>            # seed
 *   node server/scripts/seedActivityStats.js --user <userId> --clear    # delete all seed rows for that user
 *
 * Idempotent: --clear first, then re-seed with the same args, gives a fresh dataset.
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const argv = process.argv.slice(2)
const userIdx = argv.indexOf('--user')
const TARGET_USER_ID = userIdx > -1 ? argv[userIdx + 1] : null
const CLEAR = argv.includes('--clear')

if (!TARGET_USER_ID) {
  console.error('Usage: node server/scripts/seedActivityStats.js --user <userId> [--clear]')
  process.exit(1)
}

const SEED_EMAIL_DOMAIN = '@phase-d-seed.signil.local'
const SEED_NAME_PREFIX = 'Seed Ghost'

const ONE_DAY = 24 * 60 * 60 * 1000

// Deterministic-ish randomness for repeatable runs.
let _seed = 1234567
const rand = () => {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff
  return _seed / 0x7fffffff
}

const randomTimestampInDays = (daysAgoMin, daysAgoMax) => {
  const days = daysAgoMin + rand() * (daysAgoMax - daysAgoMin)
  return new Date(Date.now() - days * ONE_DAY)
}

const main = async () => {
  await mongoose.connect(process.env.MONGO || process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const { default: User } = await import('../models/User.js')
  const { default: Profile } = await import('../models/Profile.js')
  const { ProfileView } = await import('../models/ProfileView.js')
  const { Connection, ConnectionRequest } = await import('../models/Relationship.js')

  const target = await User.findById(TARGET_USER_ID)
  if (!target) {
    console.error(`User ${TARGET_USER_ID} not found`)
    process.exit(1)
  }
  console.log(`Target user: ${target.name || target.email} (${target._id})`)

  if (CLEAR) {
    // Find all seed ghost user ids first.
    const ghosts = await User.find({ email: { $regex: SEED_EMAIL_DOMAIN.replace('.', '\\.') + '$' } }, { _id: 1 }).lean()
    const ghostIds = ghosts.map((g) => g._id)
    console.log(`Found ${ghostIds.length} seed ghost users`)

    const pvDel = await ProfileView.deleteMany({ profileOwner: target._id, viewer: { $in: ghostIds } })
    const connDel = await Connection.deleteMany({
      $or: [
        { user1: target._id, user2: { $in: ghostIds } },
        { user2: target._id, user1: { $in: ghostIds } },
      ],
    })
    const reqDel = await ConnectionRequest.deleteMany({
      $or: [
        { to: target._id, from: { $in: ghostIds } },
        { from: target._id, to: { $in: ghostIds } },
      ],
    })
    const profDel = await Profile.deleteMany({ user: { $in: ghostIds } })
    const userDel = await User.deleteMany({ _id: { $in: ghostIds } })

    console.log(`Cleared: ${pvDel.deletedCount} views, ${connDel.deletedCount} connections, ${reqDel.deletedCount} requests, ${profDel.deletedCount} ghost profiles, ${userDel.deletedCount} ghost users`)
    await mongoose.disconnect()
    return
  }

  // --- SEED MODE ---
  // Volumes chosen so charts have a visible shape across 1D / 1W / 1M / 3M / YTD / 1Y.
  // ProfileViews: ~250 across 365 days, biased toward recent.
  // Connections: ~35 across 365 days.
  // Received: ~40 across 365 days.
  // Sent: ~25 across 365 days.
  const N_VIEWS = 250
  const N_CONNECTIONS = 35
  const N_RECEIVED = 40
  const N_SENT = 25
  const N_GHOSTS = Math.max(N_VIEWS, N_CONNECTIONS + N_RECEIVED + N_SENT)

  console.log(`Creating ${N_GHOSTS} seed ghost users...`)
  const ghostDocs = []
  for (let i = 0; i < N_GHOSTS; i++) {
    ghostDocs.push({
      name: `${SEED_NAME_PREFIX} ${i + 1}`,
      email: `seed-${i + 1}-${target._id}${SEED_EMAIL_DOMAIN}`,
      password: 'seed-ghost-no-login',
      role: 'user',
      userType: 'athlete',
    })
  }
  let ghosts
  try {
    ghosts = await User.insertMany(ghostDocs, { ordered: false, rawResult: false })
  } catch (err) {
    // Re-fetch whatever did succeed (insertMany throws even on partial success).
    console.warn('insertMany reported errors:', err?.writeErrors?.length || err?.message)
    ghosts = await User.find(
      { email: { $regex: SEED_EMAIL_DOMAIN.replace('.', '\\.') + '$' } },
      { _id: 1, email: 1 }
    ).lean()
  }
  console.log(`Inserted ${ghosts.length} ghosts`)

  // Helper: pull from the ghost pool without replacement.
  const pickGhosts = (count) => {
    const pool = [...ghosts]
    const out = []
    for (let i = 0; i < count && pool.length; i++) {
      const idx = Math.floor(rand() * pool.length)
      out.push(pool.splice(idx, 1)[0])
    }
    return out
  }

  // Profile Views: bias toward recent (more views in last 30 days than 12 months ago).
  console.log(`Seeding ${N_VIEWS} profile views...`)
  const viewGhosts = pickGhosts(N_VIEWS)
  const viewDocs = viewGhosts.map((g) => {
    // Bias: 50% in last 30d, 30% in 30-90d, 20% in 90-365d
    const r = rand()
    let daysAgo
    if (r < 0.5) daysAgo = rand() * 30
    else if (r < 0.8) daysAgo = 30 + rand() * 60
    else daysAgo = 90 + rand() * 275
    const t = new Date(Date.now() - daysAgo * ONE_DAY)
    return { viewer: g._id, profileOwner: target._id, lastViewedAt: t, createdAt: t, updatedAt: t }
  })
  await ProfileView.insertMany(viewDocs, { ordered: false })

  // Connections: spread across the year, slight recency bias.
  console.log(`Seeding ${N_CONNECTIONS} connections...`)
  const connGhosts = pickGhosts(N_CONNECTIONS)
  for (const g of connGhosts) {
    const r = rand()
    const daysAgo = r < 0.4 ? rand() * 60 : 60 + rand() * 305
    const t = new Date(Date.now() - daysAgo * ONE_DAY)
    // bypass pre-save hook (which hits mongoose.models.Connection lookup) — direct insert.
    await Connection.collection.insertOne({
      user1: target._id,
      user2: g._id,
      status: 'active',
      connectedAt: t,
      createdAt: t,
      updatedAt: t,
    })
  }

  // Received requests
  console.log(`Seeding ${N_RECEIVED} received requests...`)
  const recvGhosts = pickGhosts(N_RECEIVED)
  for (const g of recvGhosts) {
    const t = randomTimestampInDays(0, 365)
    const status = rand() < 0.35 ? 'accepted' : rand() < 0.6 ? 'pending' : 'rejected'
    await ConnectionRequest.collection.insertOne({
      from: g._id,
      to: target._id,
      status,
      message: 'Hello (seed)',
      matchScore: Math.floor(rand() * 100),
      createdAt: t,
      updatedAt: t,
      ...(status !== 'pending' ? { respondedAt: new Date(t.getTime() + ONE_DAY), respondedBy: target._id } : {}),
    })
  }

  // Sent requests
  console.log(`Seeding ${N_SENT} sent requests...`)
  const sentGhosts = pickGhosts(N_SENT)
  for (const g of sentGhosts) {
    const t = randomTimestampInDays(0, 365)
    const status = rand() < 0.4 ? 'accepted' : rand() < 0.7 ? 'pending' : 'rejected'
    await ConnectionRequest.collection.insertOne({
      from: target._id,
      to: g._id,
      status,
      message: 'Hello (seed)',
      matchScore: Math.floor(rand() * 100),
      createdAt: t,
      updatedAt: t,
      ...(status !== 'pending' ? { respondedAt: new Date(t.getTime() + ONE_DAY), respondedBy: g._id } : {}),
    })
  }

  console.log('Seed complete.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
