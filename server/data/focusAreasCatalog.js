/**
 * NIL Focus Areas Catalog — authoritative list of areas an athlete can request
 * help with. Each value is intended to map one-to-one against an Agent or
 * Advisor's area of expertise so the matching algorithm can surface specialists
 * for exactly what an athlete is looking for.
 *
 * Source of truth for:
 *   - Athlete NIL Preferences modal (focus area typeahead picker)
 *   - Athlete public + private profile read views (Focus Areas pills)
 *   - Future advisor/agent specialty selection + matching
 *
 * Rules:
 *   - The `value` field is the canonical string stored on
 *     Profile.nilPreferences.focusAreas[].
 *   - Athletes must select at least 3 focus areas (validated server-side on save).
 *   - Athletes cannot add custom focus areas; only catalog values are accepted.
 *   - To add or rename, edit this file and re-deploy. Renames require a one-off
 *     migration to rewrite existing profile documents.
 *
 * Categories are not surfaced in the picker UI (the picker is a flat typeahead),
 * but they keep the file readable as the catalog grows.
 */

const FOCUS_AREAS_CATALOG = [
  // -------------------------------------------------------------------------
  // Finance & Tax
  // -------------------------------------------------------------------------
  { category: 'Finance & Tax', value: 'Tax Filing' },
  { category: 'Finance & Tax', value: 'Tax Planning' },
  { category: 'Finance & Tax', value: 'Investment Management' },
  { category: 'Finance & Tax', value: 'Budgeting' },
  { category: 'Finance & Tax', value: 'Retirement Planning' },
  { category: 'Finance & Tax', value: 'Wealth Management' },
  { category: 'Finance & Tax', value: 'Insurance Planning' },

  // -------------------------------------------------------------------------
  // Legal
  // -------------------------------------------------------------------------
  { category: 'Legal', value: 'Contract Review' },
  { category: 'Legal', value: 'NIL Deal Negotiation' },
  { category: 'Legal', value: 'Trademark & IP' },
  { category: 'Legal', value: 'Business Formation' },
  { category: 'Legal', value: 'Dispute Resolution' },
  { category: 'Legal', value: 'Estate Planning' },

  // -------------------------------------------------------------------------
  // Marketing & Social
  // -------------------------------------------------------------------------
  { category: 'Marketing & Social', value: 'Social Media Strategy' },
  { category: 'Marketing & Social', value: 'Content Creation' },
  { category: 'Marketing & Social', value: 'Personal Branding' },
  { category: 'Marketing & Social', value: 'Public Relations' },
  { category: 'Marketing & Social', value: 'Influencer Partnerships' },
  { category: 'Marketing & Social', value: 'Photography & Videography' },

  // -------------------------------------------------------------------------
  // Brand & Business
  // -------------------------------------------------------------------------
  { category: 'Brand & Business', value: 'Starting a Personal Brand' },
  { category: 'Brand & Business', value: 'Apparel & Merch' },
  { category: 'Brand & Business', value: 'Product Licensing' },
  { category: 'Brand & Business', value: 'E-commerce Setup' },
  { category: 'Brand & Business', value: 'Business Strategy' },

  // -------------------------------------------------------------------------
  // Deals & Representation
  // -------------------------------------------------------------------------
  { category: 'Deals & Representation', value: 'Sponsorship Sourcing' },
  { category: 'Deals & Representation', value: 'Endorsement Negotiation' },
  { category: 'Deals & Representation', value: 'Appearance Booking' },
  { category: 'Deals & Representation', value: 'Speaking Engagements' },
  { category: 'Deals & Representation', value: 'Camp & Clinic Organization' },
  { category: 'Deals & Representation', value: 'Autograph & Memorabilia' },

  // -------------------------------------------------------------------------
  // Career & Development
  // -------------------------------------------------------------------------
  { category: 'Career & Development', value: 'Career Coaching' },
  { category: 'Career & Development', value: 'Media Training' },
  { category: 'Career & Development', value: 'Public Speaking' },
  { category: 'Career & Development', value: 'Networking' },
  { category: 'Career & Development', value: 'Mentorship' },
  { category: 'Career & Development', value: 'Post-Athletic Career Planning' },

  // -------------------------------------------------------------------------
  // Wellness & Performance
  // -------------------------------------------------------------------------
  { category: 'Wellness & Performance', value: 'Mental Performance' },
  { category: 'Wellness & Performance', value: 'Nutrition' },
  { category: 'Wellness & Performance', value: 'Strength & Conditioning' },
  { category: 'Wellness & Performance', value: 'Recovery & Physical Therapy' },
  { category: 'Wellness & Performance', value: 'Sports Medicine' },

  // -------------------------------------------------------------------------
  // Education & Compliance
  // -------------------------------------------------------------------------
  { category: 'Education & Compliance', value: 'NIL Compliance Education' },
  { category: 'Education & Compliance', value: 'Financial Literacy' },
  { category: 'Education & Compliance', value: 'Academic Advising' },
  { category: 'Education & Compliance', value: 'Scholarship Strategy' },
]

// Frozen so consumers can't mutate the catalog at runtime.
Object.freeze(FOCUS_AREAS_CATALOG)

const FOCUS_AREAS_VALUES = FOCUS_AREAS_CATALOG.map((i) => i.value)
Object.freeze(FOCUS_AREAS_VALUES)

const FOCUS_AREAS_VALUE_SET = new Set(FOCUS_AREAS_VALUES)

const MIN_FOCUS_AREAS_FOR_COMPLETION = 3

export {
  FOCUS_AREAS_CATALOG,
  FOCUS_AREAS_VALUES,
  FOCUS_AREAS_VALUE_SET,
  MIN_FOCUS_AREAS_FOR_COMPLETION,
}
