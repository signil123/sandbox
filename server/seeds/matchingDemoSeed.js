// File: server/seeds/matchingDemoSeed.js
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

dotenv.config()

const DEFAULT_PASSWORD = 'DemoPass123!'

const athletes = [
  {
    key: 'athlete-1',
    firstName: 'Darius',
    lastName: 'Coleman',
    email: 'demo.athlete.darius@signil.dev',
    school: 'Ohio State University',
    sport: 'Football',
    nilNeeds: ['Brand Partnerships and Marketing', 'Social Media Strategy', 'Contract Negotiation'],
    profile: {
      profileType: 'athlete',
      title: 'Student Athlete',
      aboutMe:
        'Starting quarterback building a personal brand around leadership, content, and national partnerships.',
      bio: 'Quarterback focused on high-visibility NIL campaigns and long-term brand equity.',
      location: 'Columbus, OH',
      sport: 'Football',
      school: 'Ohio State University',
      position: 'Quarterback',
      classYear: 'Junior',
      locationPreference: 'Hybrid',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 18 },
      isPublic: true,
      nilPreferences: {
        dealSize: '250k-500k',
        timeline: 'short',
        focusAreas: ['Brand Partnerships', 'Social Media Growth', 'Endorsements'],
      },
      interests: {
        brandPartnerships: true,
        contentCreation: true,
        socialMediaGrowth: true,
        endorsements: true,
      },
    },
    interests: [
      { category: 'Football', subcategories: ['Quarterback', 'NCAA'], level: 'expert' },
      { category: 'Leadership', subcategories: ['Public Speaking'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Brand Partnerships', 'Social Media Strategy', 'Content Creation'],
      minValue: 100000,
      maxValue: 500000,
      preferredBrand: ['Nike', 'Gatorade'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'athlete-2',
    firstName: 'Maya',
    lastName: 'Reynolds',
    email: 'demo.athlete.maya@signil.dev',
    school: 'UCLA',
    sport: 'Basketball',
    nilNeeds: ['Financial Planning', 'Taxes', 'Brand Building'],
    profile: {
      profileType: 'athlete',
      title: 'Student Athlete',
      aboutMe:
        'Point guard balancing national exposure with smart long-term financial planning and selective endorsements.',
      bio: 'Focused on sustainable NIL growth, tax structure, and premium brand partnerships.',
      location: 'Los Angeles, CA',
      sport: 'Basketball',
      school: 'UCLA',
      position: 'Point Guard',
      classYear: 'Senior',
      locationPreference: 'In-person',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.7, totalReviews: 12 },
      isPublic: true,
      nilPreferences: {
        dealSize: '100k-250k',
        timeline: 'medium',
        focusAreas: ['Brand Partnerships', 'Sponsorships', 'Social Media Growth'],
      },
      interests: {
        brandPartnerships: true,
        socialMediaGrowth: true,
        charitableWork: true,
      },
    },
    interests: [
      { category: 'Basketball', subcategories: ['Point Guard'], level: 'expert' },
      { category: 'Financial Literacy', subcategories: ['Budgeting'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Financial Planning', 'Taxes', 'Brand Building'],
      minValue: 75000,
      maxValue: 300000,
      preferredBrand: ['Nike', 'Beats'],
      allowSocial: true,
      allowVideo: false,
      isPublic: true,
    },
  },
  {
    key: 'athlete-3',
    firstName: 'Leo',
    lastName: 'Santos',
    email: 'demo.athlete.leo@signil.dev',
    school: 'University of Texas',
    sport: 'Soccer',
    nilNeeds: ['Contract Negotiation', 'Legal Compliance', 'Brand Partnerships and Marketing'],
    profile: {
      profileType: 'athlete',
      title: 'Student Athlete',
      aboutMe:
        'Division I striker expanding international brand deals while prioritizing legal protection and contract clarity.',
      bio: 'Soccer striker seeking legal-first NIL representation and global sponsor opportunities.',
      location: 'Austin, TX',
      sport: 'Soccer',
      school: 'University of Texas',
      position: 'Forward',
      classYear: 'Junior',
      locationPreference: 'Remote',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.9, totalReviews: 15 },
      isPublic: true,
      nilPreferences: {
        dealSize: '100k-250k',
        timeline: 'short',
        focusAreas: ['Brand Partnerships', 'Endorsements', 'Event Appearances'],
      },
      interests: {
        brandPartnerships: true,
        endorsements: true,
        eventAppearances: true,
      },
    },
    interests: [
      { category: 'Soccer', subcategories: ['Forward'], level: 'expert' },
      { category: 'Contracts', subcategories: ['Negotiation'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Contract Negotiation', 'Legal Compliance', 'Brand Partnerships'],
      minValue: 60000,
      maxValue: 250000,
      preferredBrand: ['Adidas', 'Puma'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'athlete-4',
    firstName: 'Jasmine',
    lastName: 'Nguyen',
    email: 'demo.athlete.jasmine@signil.dev',
    school: 'University of Florida',
    sport: 'Volleyball',
    nilNeeds: ['Social Media Strategy', 'Brand Building', 'Brand Partnerships and Marketing'],
    profile: {
      profileType: 'athlete',
      title: 'Student Athlete',
      aboutMe:
        'Volleyball captain growing audience-first partnerships in beauty, wellness, and lifestyle categories.',
      bio: 'Creator-driven athlete focused on social growth and high-quality brand storytelling.',
      location: 'Gainesville, FL',
      sport: 'Volleyball',
      school: 'University of Florida',
      position: 'Outside Hitter',
      classYear: 'Senior',
      locationPreference: 'Hybrid',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.6, totalReviews: 9 },
      isPublic: true,
      nilPreferences: {
        dealSize: '50k-100k',
        timeline: 'medium',
        focusAreas: ['Social Media Growth', 'Content Creation', 'Sponsorships'],
      },
      interests: {
        contentCreation: true,
        socialMediaGrowth: true,
        sponsorships: true,
      },
    },
    interests: [
      { category: 'Volleyball', subcategories: ['Outside Hitter'], level: 'expert' },
      { category: 'Content Creation', subcategories: ['Short Form Video'], level: 'expert' },
    ],
    nilPreference: {
      categories: ['Social Media Strategy', 'Brand Building', 'Content Creation'],
      minValue: 30000,
      maxValue: 150000,
      preferredBrand: ['Lululemon', 'Gymshark'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'athlete-5',
    firstName: 'Ty',
    lastName: 'Henderson',
    email: 'demo.athlete.ty@signil.dev',
    school: 'University of Oregon',
    sport: 'Track & Field',
    nilNeeds: ['Financial Planning', 'Brand Partnerships and Marketing', 'Legal Compliance'],
    profile: {
      profileType: 'athlete',
      title: 'Student Athlete',
      aboutMe:
        'Sprinter building long-term sponsorship portfolio with financial discipline and compliant deal structures.',
      bio: 'Track athlete looking for compliant, scalable, and financially smart NIL deals.',
      location: 'Eugene, OR',
      sport: 'Track & Field',
      school: 'University of Oregon',
      position: 'Sprinter',
      classYear: 'Sophomore',
      locationPreference: 'Remote',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.5, totalReviews: 7 },
      isPublic: true,
      nilPreferences: {
        dealSize: '100k-250k',
        timeline: 'long',
        focusAreas: ['Brand Partnerships', 'Endorsements', 'Sponsorships'],
      },
      interests: {
        brandPartnerships: true,
        endorsements: true,
        mediaTraining: true,
      },
    },
    interests: [
      { category: 'Track & Field', subcategories: ['Sprinting'], level: 'expert' },
      { category: 'Performance', subcategories: ['Recovery'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Financial Planning', 'Brand Partnerships', 'Legal Compliance'],
      minValue: 50000,
      maxValue: 220000,
      preferredBrand: ['On', 'Nike'],
      allowSocial: true,
      allowVideo: false,
      isPublic: true,
    },
  },
]

const advisors = [
  {
    key: 'advisor-1',
    firstName: 'Ava',
    lastName: 'Caldwell',
    email: 'demo.advisor.ava@signil.dev',
    tier: 'pro',
    specialties: ['Contract Negotiation', 'Legal Compliance', 'Contract Review'],
    experience: '10+ years',
    profile: {
      profileType: 'advisor',
      title: 'Sports Contract Counsel',
      aboutMe:
        'Former athletics counsel helping football and basketball athletes protect upside in NIL contracts.',
      bio: 'Legal advisor for high-value NIL contracts and risk-controlled negotiations.',
      location: 'Atlanta, GA',
      locationPreference: 'Hybrid',
      specialization: ['Contract Negotiation', 'Legal Compliance', 'Football NIL Strategy'],
      education: 'JD, University of Georgia',
      certifications: ['State Bar License', 'NCAA Compliance'],
      experience: '14 years',
      clients: 42,
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.9, totalReviews: 61 },
      isPublic: true,
      socialLinks: { linkedin: 'ava-caldwell' },
    },
    interests: [
      { category: 'Law', subcategories: ['Contract Law', 'NIL Compliance'], level: 'expert' },
      { category: 'Football', subcategories: ['Quarterback'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Contract Negotiation', 'Legal Compliance', 'Brand Partnerships'],
      minValue: 50000,
      maxValue: 1000000,
      preferredBrand: ['Nike', 'Under Armour'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'advisor-2',
    firstName: 'Marcus',
    lastName: 'Reed',
    email: 'demo.advisor.marcus@signil.dev',
    tier: 'growth',
    specialties: ['Financial Planning', 'Taxes', 'Tax Planning'],
    experience: '10+ years',
    profile: {
      profileType: 'advisor',
      title: 'Athlete Financial Planner',
      aboutMe:
        'CPA and CFP focused on tax-optimized NIL income planning for basketball and track athletes.',
      bio: 'Finance advisor for budgeting, tax strategy, and long-term athlete wealth planning.',
      location: 'Dallas, TX',
      locationPreference: 'Remote',
      specialization: ['Financial Planning', 'Taxes', 'Basketball NIL Finance'],
      education: 'MBA, UT Austin',
      certifications: ['CPA', 'CFP'],
      experience: '12 years',
      clients: 55,
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 48 },
      isPublic: true,
      socialLinks: { linkedin: 'marcus-reed-cfp' },
    },
    interests: [
      { category: 'Finance', subcategories: ['Tax Planning', 'Investing'], level: 'expert' },
      { category: 'Basketball', subcategories: ['NIL'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Financial Planning', 'Taxes', 'Brand Building'],
      minValue: 30000,
      maxValue: 600000,
      preferredBrand: ['American Express', 'SoFi'],
      allowSocial: true,
      allowVideo: false,
      isPublic: true,
    },
  },
  {
    key: 'advisor-3',
    firstName: 'Sofia',
    lastName: 'Lopez',
    email: 'demo.advisor.sofia@signil.dev',
    tier: 'free',
    specialties: ['Social Media Strategy', 'Brand Building', 'Marketing'],
    experience: '5-10 years',
    profile: {
      profileType: 'advisor',
      title: 'Athlete Brand Strategist',
      aboutMe:
        'Social-first strategist helping volleyball and women’s sports athletes build consistent creator pipelines.',
      bio: 'Advisor for audience growth, creator campaigns, and sponsorship narrative design.',
      location: 'Miami, FL',
      locationPreference: 'Hybrid',
      specialization: ['Social Media Strategy', 'Brand Building', 'Volleyball Content Strategy'],
      education: 'MS Marketing, FIU',
      certifications: ['Brand Strategy Certificate'],
      experience: '8 years',
      clients: 29,
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.7, totalReviews: 34 },
      isPublic: true,
      socialLinks: { instagram: '@sofiaforathletes' },
    },
    interests: [
      { category: 'Marketing', subcategories: ['Social Media', 'Brand'], level: 'expert' },
      { category: 'Volleyball', subcategories: ['NIL Creator Deals'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Social Media Strategy', 'Brand Building', 'Content Creation'],
      minValue: 20000,
      maxValue: 250000,
      preferredBrand: ['Lululemon', 'Sephora'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'advisor-4',
    firstName: 'Nathan',
    lastName: 'Brooks',
    email: 'demo.advisor.nathan@signil.dev',
    tier: 'growth',
    specialties: ['Legal Compliance', 'Contract Review', 'Contract Negotiation'],
    experience: '10+ years',
    profile: {
      profileType: 'advisor',
      title: 'NIL Compliance Advisor',
      aboutMe:
        'Compliance-first advisor supporting soccer athletes through safe, enforceable endorsement agreements.',
      bio: 'Built for athletes who need policy-safe NIL execution across conferences and sponsors.',
      location: 'Chicago, IL',
      locationPreference: 'In-person',
      specialization: ['Legal Compliance', 'Contract Review', 'Soccer Deal Structuring'],
      education: 'JD, Northwestern',
      certifications: ['Sports Law Certification'],
      experience: '11 years',
      clients: 37,
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 40 },
      isPublic: true,
      socialLinks: { linkedin: 'nathan-brooks-law' },
    },
    interests: [
      { category: 'Law', subcategories: ['Compliance'], level: 'expert' },
      { category: 'Soccer', subcategories: ['International Deals'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Legal Compliance', 'Contract Review', 'Contract Negotiation'],
      minValue: 40000,
      maxValue: 500000,
      preferredBrand: ['Adidas', 'Puma'],
      allowSocial: true,
      allowVideo: false,
      isPublic: true,
    },
  },
  {
    key: 'advisor-5',
    firstName: 'Priya',
    lastName: 'Shah',
    email: 'demo.advisor.priya@signil.dev',
    tier: 'pro',
    specialties: ['Financial Planning', 'Brand Partnerships and Marketing'],
    experience: '5-10 years',
    profile: {
      profileType: 'advisor',
      title: 'NIL Growth Advisor',
      aboutMe:
        'Cross-functional advisor combining sponsorship strategy with practical financial planning for rising athletes.',
      bio: 'Helps athletes scale sponsorship revenue while protecting long-term financial upside.',
      location: 'Seattle, WA',
      locationPreference: 'Remote',
      specialization: ['Financial Planning', 'Brand Partnerships and Marketing', 'Track Sponsorship Strategy'],
      education: 'MBA, University of Washington',
      certifications: ['Certified NIL Strategist'],
      experience: '9 years',
      clients: 31,
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.9, totalReviews: 44 },
      isPublic: true,
      socialLinks: { linkedin: 'priya-shah-nil' },
    },
    interests: [
      { category: 'Finance', subcategories: ['Cash Flow', 'Budgeting'], level: 'expert' },
      { category: 'Track & Field', subcategories: ['Sponsorship'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Financial Planning', 'Brand Partnerships', 'Sponsorships'],
      minValue: 25000,
      maxValue: 400000,
      preferredBrand: ['On', 'Red Bull'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
]

const agents = [
  {
    key: 'agent-1',
    firstName: 'Ethan',
    lastName: 'Cole',
    email: 'demo.agent.ethan@signil.dev',
    tier: 'pro',
    specialties: ['Brand Partnerships and Marketing', 'Contract Negotiation'],
    experience: '10+ years',
    profile: {
      profileType: 'agent',
      title: 'Senior Sports Agent',
      aboutMe:
        'Represents football and basketball athletes in national sponsorships and premium brand campaigns.',
      bio: 'Agent for scale-stage NIL execution with strong sponsor and media network.',
      location: 'Nashville, TN',
      locationPreference: 'Hybrid',
      specialization: ['Brand Partnerships and Marketing', 'Football Endorsements', 'Contract Negotiation'],
      agencyName: 'Summit Sports Group',
      agencySince: new Date('2016-03-01'),
      representedAthletes: 63,
      experience: '13 years',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.9, totalReviews: 72 },
      isPublic: true,
      socialLinks: { linkedin: 'ethan-cole-agent' },
    },
    interests: [
      { category: 'Athlete Representation', subcategories: ['Football'], level: 'expert' },
      { category: 'Brand Deals', subcategories: ['National Campaigns'], level: 'expert' },
    ],
    nilPreference: {
      categories: ['Brand Partnerships', 'Contract Negotiation', 'Endorsements'],
      minValue: 75000,
      maxValue: 1200000,
      preferredBrand: ['Nike', 'Gatorade', 'Beats'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'agent-2',
    firstName: 'Bianca',
    lastName: 'Torres',
    email: 'demo.agent.bianca@signil.dev',
    tier: 'growth',
    specialties: ['Social Media Strategy', 'Brand Building', 'Brand Partnerships and Marketing'],
    experience: '5-10 years',
    profile: {
      profileType: 'agent',
      title: 'Creator Economy Agent',
      aboutMe:
        'Specializes in women athlete creator deals with repeatable short-form and community-first campaigns.',
      bio: 'Agent focused on creator partnerships, media kits, and social monetization.',
      location: 'San Diego, CA',
      locationPreference: 'Remote',
      specialization: ['Social Media Strategy', 'Brand Building', 'Volleyball Creator Deals'],
      agencyName: 'Northstar Athlete Media',
      agencySince: new Date('2019-09-15'),
      representedAthletes: 34,
      experience: '7 years',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 39 },
      isPublic: true,
      socialLinks: { instagram: '@bianca.nil.agent' },
    },
    interests: [
      { category: 'Marketing', subcategories: ['Creator Campaigns'], level: 'expert' },
      { category: 'Volleyball', subcategories: ['Lifestyle Partnerships'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Social Media Strategy', 'Brand Building', 'Content Creation'],
      minValue: 30000,
      maxValue: 300000,
      preferredBrand: ['Lululemon', 'Nike'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'agent-3',
    firstName: 'Jordan',
    lastName: 'Kim',
    email: 'demo.agent.jordan@signil.dev',
    tier: 'free',
    specialties: ['Contract Negotiation', 'Legal Compliance', 'Brand Partnerships and Marketing'],
    experience: '5-10 years',
    profile: {
      profileType: 'agent',
      title: 'International NIL Agent',
      aboutMe:
        'Supports soccer athletes with cross-border endorsements, compliance workflows, and multilingual campaigns.',
      bio: 'Internationally focused NIL representation for soccer players.',
      location: 'New York, NY',
      locationPreference: 'Hybrid',
      specialization: ['Contract Negotiation', 'Soccer Sponsorships', 'Legal Compliance'],
      agencyName: 'Global Athlete Desk',
      agencySince: new Date('2020-01-10'),
      representedAthletes: 21,
      experience: '6 years',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.6, totalReviews: 22 },
      isPublic: true,
      socialLinks: { linkedin: 'jordan-kim-global-agent' },
    },
    interests: [
      { category: 'Soccer', subcategories: ['International Partnerships'], level: 'expert' },
      { category: 'Law', subcategories: ['Cross-border Compliance'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Contract Negotiation', 'Legal Compliance', 'Brand Partnerships'],
      minValue: 35000,
      maxValue: 450000,
      preferredBrand: ['Adidas', 'Puma'],
      allowSocial: true,
      allowVideo: false,
      isPublic: true,
    },
  },
  {
    key: 'agent-4',
    firstName: 'Riley',
    lastName: 'Morgan',
    email: 'demo.agent.riley@signil.dev',
    tier: 'growth',
    specialties: ['Financial Planning', 'Brand Partnerships and Marketing'],
    experience: '10+ years',
    profile: {
      profileType: 'agent',
      title: 'Athlete Growth Agent',
      aboutMe:
        'Blends sponsorship packaging with practical revenue planning for basketball and track athletes.',
      bio: 'Growth-focused agent for athletes building repeatable income through sponsorship pipelines.',
      location: 'Phoenix, AZ',
      locationPreference: 'Remote',
      specialization: ['Brand Partnerships and Marketing', 'Track & Field Campaigns', 'Financial Planning'],
      agencyName: 'Peak Ladder Sports',
      agencySince: new Date('2017-07-01'),
      representedAthletes: 41,
      experience: '10 years',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.7, totalReviews: 33 },
      isPublic: true,
      socialLinks: { linkedin: 'riley-morgan-agent' },
    },
    interests: [
      { category: 'Track & Field', subcategories: ['Sponsorships'], level: 'intermediate' },
      { category: 'Finance', subcategories: ['Revenue Planning'], level: 'expert' },
    ],
    nilPreference: {
      categories: ['Brand Partnerships', 'Financial Planning', 'Sponsorships'],
      minValue: 25000,
      maxValue: 350000,
      preferredBrand: ['On', 'Asics'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
  {
    key: 'agent-5',
    firstName: 'Cameron',
    lastName: 'Price',
    email: 'demo.agent.cameron@signil.dev',
    tier: 'pro',
    specialties: ['Brand Building', 'Social Media Strategy', 'Contract Negotiation'],
    experience: '5-10 years',
    profile: {
      profileType: 'agent',
      title: 'Digital Sponsorship Agent',
      aboutMe:
        'Specialist in creator-led NIL deals, short-form campaigns, and long-term ambassador relationships.',
      bio: 'Agent for digital-native athletes building recurring social and sponsor revenue.',
      location: 'Charlotte, NC',
      locationPreference: 'Hybrid',
      specialization: ['Brand Building', 'Social Media Strategy', 'Basketball Creator Campaigns'],
      agencyName: 'Signal Sports Talent',
      agencySince: new Date('2018-11-20'),
      representedAthletes: 47,
      experience: '9 years',
      verified: true,
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 46 },
      isPublic: true,
      socialLinks: { instagram: '@cameronprice.nil' },
    },
    interests: [
      { category: 'Marketing', subcategories: ['Social Growth'], level: 'expert' },
      { category: 'Basketball', subcategories: ['Creator Deals'], level: 'intermediate' },
    ],
    nilPreference: {
      categories: ['Brand Building', 'Social Media Strategy', 'Brand Partnerships'],
      minValue: 30000,
      maxValue: 500000,
      preferredBrand: ['Nike', 'New Balance'],
      allowSocial: true,
      allowVideo: true,
      isPublic: true,
    },
  },
]

const allSeedProfiles = [...athletes, ...advisors, ...agents]

const resetSeedUsers = async () => {
  const emails = allSeedProfiles.map((item) => item.email.toLowerCase())
  const users = await User.find({ email: { $in: emails } }).select('_id')
  const userIds = users.map((user) => user._id)

  if (!userIds.length) return

  await Promise.all([
    Interest.deleteMany({ user: { $in: userIds } }),
    NILPreference.deleteMany({ user: { $in: userIds } }),
    Profile.deleteMany({ user: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ])
}

const upsertSeedProfile = async (item, userType) => {
  let user = await User.findOne({ email: item.email.toLowerCase() })
  if (!user) {
    user = new User({
      firstName: item.firstName,
      lastName: item.lastName,
      name: `${item.firstName} ${item.lastName}`,
      email: item.email.toLowerCase(),
      password: DEFAULT_PASSWORD,
      role: 'user',
      userType,
    })
  }

  user.firstName = item.firstName
  user.lastName = item.lastName
  user.name = `${item.firstName} ${item.lastName}`
  user.email = item.email.toLowerCase()
  user.password = DEFAULT_PASSWORD
  user.userType = userType
  user.school = item.school || null
  user.sport = item.sport || null
  user.nilNeeds = item.nilNeeds || []
  user.specialties = item.specialties || []
  user.experience = item.experience || null
  user.tier = item.tier || 'free'
  user.isVerified = true
  user.verificationStatus = 'approved'
  user.isProfileComplete = true
  user.isActive = true
  user.isBlocked = false
  await user.save()

  let profile = await Profile.findOne({ user: user._id })
  if (!profile) {
    profile = new Profile({ user: user._id, profileType: userType })
  }

  Object.assign(profile, item.profile, {
    user: user._id,
    profileType: userType,
    verified: true,
    verificationStatus: 'approved',
    isPublic: true,
  })
  await profile.save()

  await Interest.deleteMany({ user: user._id })
  if (item.interests?.length) {
    await Interest.insertMany(
      item.interests.map((interest) => ({
        user: user._id,
        ...interest,
      }))
    )
  }

  let nilPreference = await NILPreference.findOne({ user: user._id })
  if (!nilPreference) {
    nilPreference = new NILPreference({ user: user._id })
  }

  Object.assign(nilPreference, {
    user: user._id,
    ...(item.nilPreference || {}),
  })
  await nilPreference.save()
}

const run = async () => {
  try {
    const mongoUri = process.env.MONGO || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MongoDB URI not found. Set MONGO or MONGODB_URI in your env.')
    }

    await mongoose.connect(mongoUri)
    const shouldReset = process.argv.includes('--reset')
    if (shouldReset) {
      await resetSeedUsers()
      console.log('Removed existing matching demo seed users.')
    }

    for (const athlete of athletes) {
      await upsertSeedProfile(athlete, 'athlete')
      console.log(`Seeded athlete: ${athlete.email}`)
    }

    for (const advisor of advisors) {
      await upsertSeedProfile(advisor, 'advisor')
      console.log(`Seeded advisor: ${advisor.email}`)
    }

    for (const agent of agents) {
      await upsertSeedProfile(agent, 'agent')
      console.log(`Seeded agent: ${agent.email}`)
    }

    console.log('Matching demo seed complete.')
    console.log('Users created/updated: 15 (5 athletes, 5 advisors, 5 agents)')
    console.log(`Default password for seeded users: ${DEFAULT_PASSWORD}`)
    process.exit(0)
  } catch (error) {
    console.error('Matching demo seed failed:', error.message || error)
    process.exit(1)
  }
}

run()
