/**
 * One-time migration: athlete profile shape change for Phase A.
 *
 * Changes applied per athlete Profile document:
 *   - interests:    boolean object  → []  (wiped per product decision)
 *   - experience:   String          → []  (start fresh; design's array shape can't round-trip a string)
 *   - education:    String          → []  (same)
 *   - socialLinks + socialMedia (legacy)  → consolidated into socials: [{platform, handle, url, public:true}]
 *   - publicVisibility: initialized to {email:true, phone:true} if missing
 *   - Drops: jerseyNumber, height, weight, achievements, stats, yearsActive, website (using $unset)
 *
 * Usage:
 *   node server/scripts/migrateAthleteProfileShape.js              # DRY RUN — prints what would change
 *   node server/scripts/migrateAthleteProfileShape.js --apply      # actually writes
 *   node server/scripts/migrateAthleteProfileShape.js --apply --user <userId>   # single user
 *
 * Idempotent: re-running after --apply is a no-op.
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const APPLY = process.argv.includes('--apply')
const userIdx = process.argv.indexOf('--user')
const SINGLE_USER = userIdx > -1 ? process.argv[userIdx + 1] : null

const SOCIAL_PLATFORMS = ['instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'facebook']

const buildSocialsFromLegacy = (doc) => {
  // socialMedia is { instagram, twitter, tiktok }; socialLinks is { twitter, instagram, linkedin, facebook }
  const sm = doc.socialMedia || {}
  const sl = doc.socialLinks || {}
  const out = []
  for (const platform of SOCIAL_PLATFORMS) {
    // Prefer socialMedia handle, fall back to socialLinks
    const handle = sm[platform] || ''
    const url = sl[platform] || ''
    if (!handle && !url) continue
    out.push({
      platform,
      handle: String(handle || '').trim(),
      url: String(url || '').trim(),
      public: true,
    })
  }
  return out
}

const isLegacyInterestsShape = (interests) =>
  interests &&
  typeof interests === 'object' &&
  !Array.isArray(interests) &&
  Object.keys(interests).some((k) => typeof interests[k] === 'boolean')

const planMigration = (doc) => {
  const set = {}
  const unset = {}
  const before = {}
  const after = {}

  // interests: boolean object → []
  if (isLegacyInterestsShape(doc.interests)) {
    before.interests = doc.interests
    set.interests = []
    after.interests = []
  } else if (!Array.isArray(doc.interests)) {
    // Already missing or wrong type — normalize
    before.interests = doc.interests
    set.interests = []
    after.interests = []
  }

  // experience: string → []
  if (typeof doc.experience === 'string') {
    before.experience = doc.experience
    set.experience = []
    after.experience = []
  }

  // education: string → []
  if (typeof doc.education === 'string') {
    before.education = doc.education
    set.education = []
    after.education = []
  }

  // socials: build from legacy if missing or empty AND legacy data exists
  const hasLegacySocials =
    (doc.socialMedia && Object.values(doc.socialMedia).some(Boolean)) ||
    (doc.socialLinks && Object.values(doc.socialLinks).some(Boolean))
  if (hasLegacySocials && (!Array.isArray(doc.socials) || doc.socials.length === 0)) {
    const built = buildSocialsFromLegacy(doc)
    before.socials = doc.socials || []
    set.socials = built
    after.socials = built
  }

  // publicVisibility: initialize defaults if missing
  if (!doc.publicVisibility || typeof doc.publicVisibility !== 'object') {
    before.publicVisibility = doc.publicVisibility
    set.publicVisibility = { email: true, phone: true }
    after.publicVisibility = { email: true, phone: true }
  }

  // Drop fields
  for (const dropField of [
    'jerseyNumber',
    'height',
    'weight',
    'achievements',
    'stats',
    'yearsActive',
    'website',
    'socialLinks',
    'socialMedia',
  ]) {
    if (doc[dropField] !== undefined) {
      before[dropField] = doc[dropField]
      unset[dropField] = ''
      after[dropField] = '<dropped>'
    }
  }

  return { set, unset, before, after }
}

const summarize = (label, val) => {
  if (val === undefined || val === null) return String(val)
  if (typeof val === 'string') return val.length > 60 ? `"${val.slice(0, 57)}..."` : `"${val}"`
  if (Array.isArray(val)) return `[${val.length} items]`
  if (typeof val === 'object') return `{${Object.keys(val).join(', ')}}`
  return String(val)
}

const main = async () => {
  if (!process.env.MONGO) {
    console.error('MONGO env var not set. Make sure .env is loaded or pass MONGO=... inline.')
    process.exit(1)
  }

  console.log(`\n=== Athlete Profile Shape Migration ===`)
  console.log(`Mode: ${APPLY ? 'APPLY (writes will happen)' : 'DRY RUN (no writes)'}`)
  if (SINGLE_USER) console.log(`Target: single user ${SINGLE_USER}`)
  console.log(``)

  await mongoose.connect(process.env.MONGO)
  console.log('Connected to MongoDB.')

  // Use the raw collection so we read pre-migration shapes accurately
  const coll = mongoose.connection.collection('profiles')

  const query = { profileType: 'athlete' }
  if (SINGLE_USER) query.user = new mongoose.Types.ObjectId(SINGLE_USER)

  const total = await coll.countDocuments(query)
  console.log(`Found ${total} athlete profile(s).\n`)

  let touched = 0
  let unchanged = 0
  let written = 0

  const cursor = coll.find(query)
  for await (const doc of cursor) {
    const plan = planMigration(doc)
    const willChange = Object.keys(plan.set).length + Object.keys(plan.unset).length > 0

    if (!willChange) {
      unchanged++
      continue
    }

    touched++
    console.log(`--- ${doc._id} (user ${doc.user}) ---`)
    for (const k of Object.keys(plan.set)) {
      console.log(`  ${k}: ${summarize(k, plan.before[k])}  →  ${summarize(k, plan.after[k])}`)
    }
    for (const k of Object.keys(plan.unset)) {
      console.log(`  drop ${k}: ${summarize(k, plan.before[k])}`)
    }

    if (APPLY) {
      const update = {}
      if (Object.keys(plan.set).length) update.$set = plan.set
      if (Object.keys(plan.unset).length) update.$unset = plan.unset
      await coll.updateOne({ _id: doc._id }, update)
      written++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total athletes:          ${total}`)
  console.log(`Already migrated:        ${unchanged}`)
  console.log(`Need migration:          ${touched}`)
  console.log(`Actually written:        ${written}${APPLY ? '' : '  (dry run — pass --apply to write)'}`)

  await mongoose.disconnect()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
