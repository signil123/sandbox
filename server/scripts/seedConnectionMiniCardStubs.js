/**
 * Phase F seed — promote Phase D seed-ghost users into realistic advisors/agents
 * with full Profile docs so the Athlete Private Profile's Connection Center
 * (and the AthleteConnectionsModal grid) renders convincing data without
 * client-side stubs.
 *
 * For every user with email matching @phase-d-seed.signil.local (the Phase D
 * synthetic counterparties), this script:
 *   1. Replaces the generic "Seed Ghost N" name with a realistic advisor name
 *      and sets userType to advisor or agent (per row from ADVISOR_FIXTURES).
 *   2. Creates or updates a Profile doc tagged with _seedTag = the constant
 *      below, populated with: aboutMe, location, coordinates, focusAreas
 *      (matched 1:1 to focusAreasCatalog), rating, experience, profileType.
 *
 * Idempotent: re-running upserts. `--clear` undoes all changes — removes the
 * Profile docs by _seedTag and restores user names/userTypes to their
 * Phase D values.
 *
 * Usage:
 *   node server/scripts/seedConnectionMiniCardStubs.js               # dry-run preview
 *   node server/scripts/seedConnectionMiniCardStubs.js --apply       # actually write
 *   node server/scripts/seedConnectionMiniCardStubs.js --clear       # undo
 *
 * PRE-LAUNCH: this seed must be cleared before official athlete-profile
 * sign-off — its purpose is dev-only realistic visuals. See CLAUDE.md.
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const CLEAR = argv.includes('--clear')
const userIdx = argv.indexOf('--user')
const TARGET_USER_ID = userIdx > -1 ? argv[userIdx + 1] : null

const SEED_EMAIL_DOMAIN = '@phase-d-seed.signil.local'
const SEED_TAG = 'phase-f-mini-card-stub'

// Realistic advisor/agent fixtures. focusAreas values must exactly match
// entries from server/data/focusAreasCatalog.js so the focus-area filter in
// AthleteConnectionsModal categorizes them correctly. Locations come with
// lat/lng so the distance filter works against the athlete's coords.
const FIXTURES = [
  {
    name: 'Ava Caldwell', userType: 'advisor',
    location: 'Atlanta, GA', coordinates: { lat: 33.749, lng: -84.388 },
    rating: 4.9,
    focusAreas: ['Contract Review', 'NIL Deal Negotiation', 'Estate Planning'],
    aboutMe: 'Former in-house counsel for two SEC programs. Specializes in protecting young athletes through deal structure and clean exit terms.',
    title: 'Sports Contract Counsel',
    experience: [
      { role: 'Senior Counsel', company: 'Caldwell Legal', startDate: 'Jan 2018', endDate: 'Present', location: 'Atlanta, GA', description: 'Athlete contract review and NIL deal structuring for SEC athletes.', logoText: 'CL', logoBg: '#3b82f6' },
      { role: 'In-house Counsel', company: 'SEC Conference', startDate: 'Jun 2012', endDate: 'Dec 2017', location: 'Birmingham, AL', description: 'Conference-level athlete compliance and contract review.', logoText: 'SEC', logoBg: '#1e3a8a' },
    ],
  },
  {
    name: 'Priya Shah', userType: 'advisor',
    location: 'Seattle, WA', coordinates: { lat: 47.6062, lng: -122.3321 },
    rating: 4.9,
    focusAreas: ['Investment Management', 'Influencer Partnerships', 'Tax Planning'],
    aboutMe: 'Builds long-horizon NIL plans that compound. Past clients include 30+ Power 5 athletes and a Pac-12 player of the year.',
    title: 'NIL Growth Advisor',
    experience: [
      { role: 'Founding Advisor', company: 'Shah & Co', startDate: 'Aug 2017', endDate: 'Present', location: 'Seattle, WA', description: 'Long-term financial planning for college and pro athletes.', logoText: 'SC', logoBg: '#163146' },
    ],
  },
  {
    name: 'Aaron Tate', userType: 'agent',
    location: 'Remote', coordinates: null,
    rating: 4.5,
    focusAreas: ['Career Coaching', 'Endorsement Negotiation', 'Sponsorship Sourcing'],
    aboutMe: 'Boutique agent focused on women’s basketball. Treats every roster move as a brand decision and runs negotiations end to end.',
    title: 'Sports Agent',
    experience: [
      { role: 'Founding Agent', company: 'Tate Sports', startDate: 'Mar 2023', endDate: 'Present', location: 'Remote', description: 'Boutique representation for women’s collegiate and pro basketball.', logoText: 'TS', logoBg: '#f59e0b' },
    ],
  },
  {
    name: 'Julia Mendez', userType: 'advisor',
    location: 'Miami, FL', coordinates: { lat: 25.7617, lng: -80.1918 },
    rating: 4.8,
    focusAreas: ['Tax Filing', 'Tax Planning', 'Business Formation'],
    aboutMe: 'CPA specializing in multi-state NIL income, S-corp setup, and quarterly estimates. Keeps athletes audit-ready year-round.',
    title: 'CPA · Athlete Tax',
    experience: [
      { role: 'Senior CPA', company: 'Mendez Tax', startDate: 'May 2014', endDate: 'Present', location: 'Miami, FL', description: 'Multi-state athlete tax preparation and S-corp setup.', logoText: 'MT', logoBg: '#10b981' },
    ],
  },
  {
    name: 'Ryan Kim', userType: 'advisor',
    location: 'New York, NY', coordinates: { lat: 40.7128, lng: -74.006 },
    rating: 4.7,
    focusAreas: ['Personal Branding', 'Content Creation', 'Social Media Strategy'],
    aboutMe: 'Ex-agency creative director turned NIL strategist. Pairs athletes with brands that fit their voice, not just their reach.',
    title: 'NIL Brand Strategist',
    experience: [
      { role: 'Creative Director', company: 'Kim Brand Lab', startDate: 'Sep 2019', endDate: 'Present', location: 'New York, NY', description: 'NIL brand matching and creative campaigns.', logoText: 'KB', logoBg: '#8b5cf6' },
    ],
  },
  {
    name: 'Marcus Sterling', userType: 'advisor',
    location: 'Los Angeles, CA', coordinates: { lat: 34.0522, lng: -118.2437 },
    rating: 4.9,
    focusAreas: ['Contract Review', 'Endorsement Negotiation', 'Trademark & IP'],
    aboutMe: '18 years at the intersection of sports law and IP. Reviews every endorsement deal line by line, no exceptions.',
    title: 'Sports Attorney',
    experience: [
      { role: 'Managing Partner', company: 'Sterling Law', startDate: 'Feb 2008', endDate: 'Present', location: 'Los Angeles, CA', description: 'Sports & entertainment IP, endorsement contract review.', logoText: 'SL', logoBg: '#ef4444' },
    ],
  },
  {
    name: 'Nora Lin', userType: 'advisor',
    location: 'San Francisco, CA', coordinates: { lat: 37.7749, lng: -122.4194 },
    rating: 4.8,
    focusAreas: ['Wealth Management', 'Estate Planning', 'Insurance Planning'],
    aboutMe: 'Helps athletes turn variable income into stable wealth through trusts, indexed portfolios, and proper insurance coverage.',
    title: 'Wealth Advisor',
    experience: [
      { role: 'Wealth Advisor', company: 'Lin Wealth', startDate: 'Jul 2015', endDate: 'Present', location: 'San Francisco, CA', description: 'Athlete wealth management and trust structuring.', logoText: 'LW', logoBg: '#0ea5e9' },
    ],
  },
  {
    name: 'Diego Vargas', userType: 'advisor',
    location: 'Remote', coordinates: null,
    rating: 4.6,
    focusAreas: ['Public Relations', 'Public Speaking', 'Media Training'],
    aboutMe: 'Coaches athletes on press, podcasts, and on-camera presence. Past clients have moved from college to nationally televised features.',
    title: 'Personal Branding Coach',
    experience: [
      { role: 'Brand Coach', company: 'Vargas Brand', startDate: 'Apr 2020', endDate: 'Present', location: 'Remote', description: 'Press, podcast, and on-camera coaching for athletes.', logoText: 'VB', logoBg: '#f97316' },
    ],
  },
  {
    name: 'Kira Thompson', userType: 'agent',
    location: 'Chicago, IL', coordinates: { lat: 41.8781, lng: -87.6298 },
    rating: 4.8,
    focusAreas: ['NIL Deal Negotiation', 'Career Coaching'],
    aboutMe: 'Represents 14 active WNBA athletes. Runs a tight college-to-pro pipeline with a focus on draft positioning and rookie deals.',
    title: 'Athlete Agent',
    experience: [
      { role: 'Senior Agent', company: 'Thompson Sports', startDate: 'Oct 2018', endDate: 'Present', location: 'Chicago, IL', description: 'WNBA representation and college-to-pro transitions.', logoText: 'TS', logoBg: '#a855f7' },
    ],
  },
  {
    name: 'Henry Ellis', userType: 'advisor',
    location: 'Boston, MA', coordinates: { lat: 42.3601, lng: -71.0589 },
    rating: 4.9,
    focusAreas: ['Tax Filing', 'Tax Planning', 'Business Formation'],
    aboutMe: 'International tax counsel for athletes who travel, train, or earn abroad. Keeps treaties and residency rules straight.',
    title: 'Tax Attorney',
    experience: [
      { role: 'Tax Counsel', company: 'Ellis Tax Law', startDate: 'Jan 2011', endDate: 'Present', location: 'Boston, MA', description: 'International tax law for athletes earning abroad.', logoText: 'ET', logoBg: '#14b8a6' },
    ],
  },
  {
    name: 'Serena Choi', userType: 'advisor',
    location: 'Remote', coordinates: null,
    rating: 4.7,
    focusAreas: ['Investment Management', 'Wealth Management', 'Retirement Planning'],
    aboutMe: 'Builds barbell portfolios for athletes — conservative core, opportunistic alts. Heavy on real estate for steady cashflow.',
    title: 'Investment Advisor',
    experience: [
      { role: 'Portfolio Manager', company: 'Choi Capital', startDate: 'Jun 2016', endDate: 'Present', location: 'Remote', description: 'Athlete investment portfolio management.', logoText: 'CC', logoBg: '#ec4899' },
    ],
  },
  {
    name: 'Brandon Ahmed', userType: 'advisor',
    location: 'Indianapolis, IN', coordinates: { lat: 39.7684, lng: -86.1581 },
    rating: 4.8,
    focusAreas: ['NIL Compliance Education', 'Contract Review', 'Dispute Resolution'],
    aboutMe: 'Stays on top of every state NIL bill so deals never threaten eligibility. Trusted by compliance offices at 4 major programs.',
    title: 'Compliance Counsel',
    experience: [
      { role: 'Compliance Counsel', company: 'Ahmed Compliance', startDate: 'Nov 2017', endDate: 'Present', location: 'Indianapolis, IN', description: 'NCAA and state NIL law compliance.', logoText: 'AC', logoBg: '#6366f1' },
    ],
  },
]

const main = async () => {
  await mongoose.connect(process.env.MONGO || process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const { default: User } = await import('../models/User.js')
  const { default: Profile } = await import('../models/Profile.js')
  const { Connection } = await import('../models/Relationship.js')

  // If --user is provided, only target ghosts who are *connected* to that
  // user so we don't promote unrelated seed-ghosts unnecessarily. Sort by
  // most-recent connection so the top-3 visible in Connection Center always
  // get the realistic data first.
  let ghosts
  if (TARGET_USER_ID) {
    const conns = await Connection.find({
      $or: [{ user1: TARGET_USER_ID }, { user2: TARGET_USER_ID }],
      status: 'active',
    })
      .sort({ connectedAt: -1 })
      .lean()
    const counterpartyIds = conns.map((c) =>
      String(c.user1) === String(TARGET_USER_ID) ? c.user2 : c.user1
    )
    // Preserve the connectedAt order via the original index. We'll re-sort
    // ghosts to match.
    const orderMap = new Map(counterpartyIds.map((id, idx) => [String(id), idx]))
    const ghostsRaw = await User.find({
      _id: { $in: counterpartyIds },
      email: { $regex: SEED_EMAIL_DOMAIN.replace('.', '\\.') + '$' },
    })
    ghosts = ghostsRaw.sort(
      (a, b) =>
        (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999)
    )
    console.log(
      `Found ${ghosts.length} Phase D seed-ghost users connected to ${TARGET_USER_ID}`
    )
  } else {
    ghosts = await User.find({
      email: { $regex: SEED_EMAIL_DOMAIN.replace('.', '\\.') + '$' },
    }).sort({ createdAt: 1 })
    console.log(`Found ${ghosts.length} Phase D seed-ghost users (all)`)
  }

  if (CLEAR) {
    // Restore user names + userType, drop the Profile docs.
    let restored = 0
    for (const u of ghosts) {
      const m = u.email.match(/seed-ghost-(\d+)/)
      const n = m ? m[1] : '?'
      if (APPLY) {
        await User.updateOne({ _id: u._id }, { name: `Seed Ghost ${n}`, userType: 'athlete' })
      }
      restored++
    }
    const profileFilter = { _seedTag: SEED_TAG }
    const count = await Profile.countDocuments(profileFilter)
    console.log(`Will ${APPLY ? '' : 'DRY-RUN: would '}remove ${count} stub Profile doc(s) and restore ${restored} user(s).`)
    if (APPLY) {
      const del = await Profile.deleteMany(profileFilter)
      console.log(`Deleted ${del.deletedCount} Profile docs.`)
    }
    await mongoose.disconnect()
    return
  }

  // SEED MODE.
  const count = Math.min(ghosts.length, FIXTURES.length)
  console.log(
    `Will ${APPLY ? '' : 'DRY-RUN: would '}upsert ${count} stub Profile doc(s) and rename ${count} user(s).`
  )

  for (let i = 0; i < count; i++) {
    const u = ghosts[i]
    const f = FIXTURES[i % FIXTURES.length]

    if (APPLY) {
      await User.updateOne(
        { _id: u._id },
        { name: f.name, userType: f.userType, email: u.email }
      )
      await Profile.findOneAndUpdate(
        { user: u._id },
        {
          user: u._id,
          profileType: f.userType,
          aboutMe: f.aboutMe,
          location: f.location,
          coordinates: f.coordinates,
          rating: f.rating,
          experience: f.experience,
          // Store the title in a way the public view's `roleLabel` falls
          // through to. Profile schema doesn't define `title`, so this rides
          // on advisorProfile/nilPreferences? Falls back to userType
          // mapping in ConnectionMiniCard. (Title only matters for the
          // mini-card; advisor public view shows aboutMe + experience.)
          nilPreferences: {
            focusAreas: f.focusAreas,
          },
          _seedTag: SEED_TAG,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    }
    console.log(`  ${APPLY ? '✓' : '·'} [${i + 1}/${count}] ${u.email} → ${f.name} (${f.userType})`)
  }

  if (!APPLY) {
    console.log('\nDry-run only. Pass --apply to write.')
  } else {
    console.log('\nDone.')
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
