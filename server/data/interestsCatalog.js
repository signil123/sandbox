/**
 * Interests Catalog — authoritative list for athlete profile interests.
 *
 * Source of truth for:
 *   - Athlete Interests picker (private profile edit modal)
 *   - Matching algorithm (athlete ↔ advisor / agent compatibility scoring)
 *   - Public profile display (renders the same string values)
 *
 * Rules:
 *   - The `value` field is the canonical string stored on Profile.interests[].
 *   - Athletes must select at least 5 interests for profile completion (validated server-side on save).
 *   - Athletes cannot add custom interests; only catalog values are accepted.
 *   - To add or rename an interest, edit this file and re-deploy. Renames require a one-off
 *     migration to update existing profile documents.
 *
 * Categories are surfaced in the picker UI as collapsible sections.
 */

const INTERESTS_CATALOG = [
  // -------------------------------------------------------------------------
  // Brand & Marketing
  // -------------------------------------------------------------------------
  { category: 'Brand & Marketing', value: 'Brand Partnerships' },
  { category: 'Brand & Marketing', value: 'Endorsement Deals' },
  { category: 'Brand & Marketing', value: 'Sponsorships' },
  { category: 'Brand & Marketing', value: 'Product Collaborations' },
  { category: 'Brand & Marketing', value: 'Personal Branding' },
  { category: 'Brand & Marketing', value: 'Merchandising' },
  { category: 'Brand & Marketing', value: 'Apparel & Footwear' },
  { category: 'Brand & Marketing', value: 'Equipment Endorsements' },
  { category: 'Brand & Marketing', value: 'Local Business Partnerships' },
  { category: 'Brand & Marketing', value: 'National Brand Campaigns' },
  { category: 'Brand & Marketing', value: 'Influencer Marketing' },

  // -------------------------------------------------------------------------
  // Content & Media
  // -------------------------------------------------------------------------
  { category: 'Content & Media', value: 'Content Creation' },
  { category: 'Content & Media', value: 'Social Media Growth' },
  { category: 'Content & Media', value: 'YouTube' },
  { category: 'Content & Media', value: 'TikTok' },
  { category: 'Content & Media', value: 'Instagram' },
  { category: 'Content & Media', value: 'Twitch & Live Streaming' },
  { category: 'Content & Media', value: 'Podcasting' },
  { category: 'Content & Media', value: 'Vlogging' },
  { category: 'Content & Media', value: 'Photography' },
  { category: 'Content & Media', value: 'Videography' },
  { category: 'Content & Media', value: 'Long-form Storytelling' },
  { category: 'Content & Media', value: 'Documentary Features' },
  { category: 'Content & Media', value: 'Media Training' },
  { category: 'Content & Media', value: 'Press Interviews' },

  // -------------------------------------------------------------------------
  // Community & Causes
  // -------------------------------------------------------------------------
  { category: 'Community & Causes', value: 'Charitable Work' },
  { category: 'Community & Causes', value: 'Youth Mentorship' },
  { category: 'Community & Causes', value: 'Community Service' },
  { category: 'Community & Causes', value: 'Mental Health Advocacy' },
  { category: 'Community & Causes', value: 'Education Equity' },
  { category: 'Community & Causes', value: 'Anti-Bullying' },
  { category: 'Community & Causes', value: 'Diversity & Inclusion' },
  { category: 'Community & Causes', value: 'Environmental Causes' },
  { category: 'Community & Causes', value: 'Sustainability' },
  { category: 'Community & Causes', value: 'Animal Welfare' },
  { category: 'Community & Causes', value: 'Food Insecurity' },
  { category: 'Community & Causes', value: 'Veterans Support' },
  { category: 'Community & Causes', value: 'First Responders Support' },
  { category: 'Community & Causes', value: 'Religious Outreach' },

  // -------------------------------------------------------------------------
  // Appearances & Events
  // -------------------------------------------------------------------------
  { category: 'Appearances & Events', value: 'Event Appearances' },
  { category: 'Appearances & Events', value: 'Speaking Engagements' },
  { category: 'Appearances & Events', value: 'Camps & Clinics' },
  { category: 'Appearances & Events', value: 'Autograph Signings' },
  { category: 'Appearances & Events', value: 'Meet & Greets' },
  { category: 'Appearances & Events', value: 'Charity Events' },
  { category: 'Appearances & Events', value: 'School Visits' },
  { category: 'Appearances & Events', value: 'Conventions & Expos' },
  { category: 'Appearances & Events', value: 'Awards & Galas' },

  // -------------------------------------------------------------------------
  // Performance & Training
  // -------------------------------------------------------------------------
  { category: 'Performance & Training', value: 'Strength & Conditioning' },
  { category: 'Performance & Training', value: 'Speed & Agility' },
  { category: 'Performance & Training', value: 'Sport-Specific Skills Coaching' },
  { category: 'Performance & Training', value: 'Recovery & Mobility' },
  { category: 'Performance & Training', value: 'Sleep Optimization' },
  { category: 'Performance & Training', value: 'Mental Performance Coaching' },
  { category: 'Performance & Training', value: 'Sports Psychology' },
  { category: 'Performance & Training', value: 'Mindfulness & Meditation' },
  { category: 'Performance & Training', value: 'Injury Prevention' },
  { category: 'Performance & Training', value: 'Rehabilitation' },
  { category: 'Performance & Training', value: 'Biomechanics' },
  { category: 'Performance & Training', value: 'Performance Analytics' },

  // -------------------------------------------------------------------------
  // Nutrition & Wellness
  // -------------------------------------------------------------------------
  { category: 'Nutrition & Wellness', value: 'Sports Nutrition' },
  { category: 'Nutrition & Wellness', value: 'Meal Planning' },
  { category: 'Nutrition & Wellness', value: 'Supplements' },
  { category: 'Nutrition & Wellness', value: 'Hydration Science' },
  { category: 'Nutrition & Wellness', value: 'Plant-Based Eating' },
  { category: 'Nutrition & Wellness', value: 'Holistic Wellness' },
  { category: 'Nutrition & Wellness', value: 'Yoga' },

  // -------------------------------------------------------------------------
  // Finance & Business
  // -------------------------------------------------------------------------
  { category: 'Finance & Business', value: 'Financial Literacy' },
  { category: 'Finance & Business', value: 'Tax Planning' },
  { category: 'Finance & Business', value: 'Investing' },
  { category: 'Finance & Business', value: 'Real Estate Investing' },
  { category: 'Finance & Business', value: 'Wealth Management' },
  { category: 'Finance & Business', value: 'Estate Planning' },
  { category: 'Finance & Business', value: 'Insurance Planning' },
  { category: 'Finance & Business', value: 'Crypto & Web3' },
  { category: 'Finance & Business', value: 'Stock Market' },
  { category: 'Finance & Business', value: 'Entrepreneurship' },
  { category: 'Finance & Business', value: 'Startup Investing' },
  { category: 'Finance & Business', value: 'Business Ownership' },
  { category: 'Finance & Business', value: 'Franchising' },

  // -------------------------------------------------------------------------
  // Career & Education
  // -------------------------------------------------------------------------
  { category: 'Career & Education', value: 'Academic Excellence' },
  { category: 'Career & Education', value: 'Scholarships' },
  { category: 'Career & Education', value: 'Tutoring & Test Prep' },
  { category: 'Career & Education', value: 'Career Coaching' },
  { category: 'Career & Education', value: 'Internships' },
  { category: 'Career & Education', value: 'Networking' },
  { category: 'Career & Education', value: 'Public Speaking' },
  { category: 'Career & Education', value: 'Leadership Development' },
  { category: 'Career & Education', value: 'Personal Development' },
  { category: 'Career & Education', value: 'Coaching Career' },
  { category: 'Career & Education', value: 'Broadcasting Career' },
  { category: 'Career & Education', value: 'Front Office Career' },

  // -------------------------------------------------------------------------
  // Legal & Representation
  // -------------------------------------------------------------------------
  { category: 'Legal & Representation', value: 'NIL Contract Review' },
  { category: 'Legal & Representation', value: 'Trademark & IP' },
  { category: 'Legal & Representation', value: 'Image Rights' },
  { category: 'Legal & Representation', value: 'Agent Representation' },
  { category: 'Legal & Representation', value: 'Pro Sports Transition' },
  { category: 'Legal & Representation', value: 'Draft Preparation' },
  { category: 'Legal & Representation', value: 'Compliance & Eligibility' },

  // -------------------------------------------------------------------------
  // Lifestyle & Interests
  // -------------------------------------------------------------------------
  { category: 'Lifestyle & Interests', value: 'Fashion & Style' },
  { category: 'Lifestyle & Interests', value: 'Music & Entertainment' },
  { category: 'Lifestyle & Interests', value: 'Gaming & Esports' },
  { category: 'Lifestyle & Interests', value: 'Travel' },
  { category: 'Lifestyle & Interests', value: 'Food & Dining' },
  { category: 'Lifestyle & Interests', value: 'Automotive' },
  { category: 'Lifestyle & Interests', value: 'Tech & Gadgets' },
  { category: 'Lifestyle & Interests', value: 'Outdoor & Adventure' },
  { category: 'Lifestyle & Interests', value: 'Fitness Apparel' },
  { category: 'Lifestyle & Interests', value: 'Sneakers & Collectibles' },
  { category: 'Lifestyle & Interests', value: 'Art & Design' },
  { category: 'Lifestyle & Interests', value: 'Reading & Books' },
  { category: 'Lifestyle & Interests', value: 'Faith & Spirituality' },
  { category: 'Lifestyle & Interests', value: 'Family Life' },

  // -------------------------------------------------------------------------
  // Sport-Adjacent Industries
  // -------------------------------------------------------------------------
  { category: 'Sport-Adjacent Industries', value: 'Fantasy Sports' },
  { category: 'Sport-Adjacent Industries', value: 'Sports Betting Education' },
  { category: 'Sport-Adjacent Industries', value: 'Sports Technology' },
  { category: 'Sport-Adjacent Industries', value: 'Wearables & Tracking' },
  { category: 'Sport-Adjacent Industries', value: 'Sports Media' },
  { category: 'Sport-Adjacent Industries', value: 'Sports Analytics' },
  { category: 'Sport-Adjacent Industries', value: 'Esports Teams' },
  { category: 'Sport-Adjacent Industries', value: 'Sports Memorabilia' },
  { category: 'Sport-Adjacent Industries', value: 'Trading Cards' },
  { category: 'Sport-Adjacent Industries', value: 'NFTs & Digital Collectibles' },

  // -------------------------------------------------------------------------
  // Health & Mind
  // -------------------------------------------------------------------------
  { category: 'Health & Mind', value: 'Mental Health' },
  { category: 'Health & Mind', value: 'Therapy & Counseling' },
  { category: 'Health & Mind', value: 'Mindset & Resilience' },
  { category: 'Health & Mind', value: 'Stress Management' },
  { category: 'Health & Mind', value: 'Life Coaching' },
]

// Frozen so consumers can't mutate the catalog at runtime.
Object.freeze(INTERESTS_CATALOG)

const INTERESTS_VALUES = INTERESTS_CATALOG.map((i) => i.value)
Object.freeze(INTERESTS_VALUES)

const INTERESTS_VALUE_SET = new Set(INTERESTS_VALUES)

const MIN_INTERESTS_FOR_COMPLETION = 5

export {
  INTERESTS_CATALOG,
  INTERESTS_VALUES,
  INTERESTS_VALUE_SET,
  MIN_INTERESTS_FOR_COMPLETION,
}
