import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true })

const KNOWLEDGE_PATH = path.resolve(__dirname, '../data/scoutKnowledge.json')
let knowledgeEntries = []
try {
  const raw = fs.readFileSync(KNOWLEDGE_PATH, 'utf-8')
  const parsed = JSON.parse(raw)
  if (Array.isArray(parsed)) {
    knowledgeEntries = parsed
  }
} catch (error) {
  console.error('Failed to load Scout knowledge file:', error.message || error)
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const MAX_HISTORY_ITEMS = 8
const MAX_CANDIDATES = 60
const MAX_SUGGESTIONS = 3
const ALL_SEARCHABLE_USER_TYPES = ['athlete', 'advisor', 'agent']
const GREETING_REGEX =
  /^(hi|hello|hey|yo|good morning|good afternoon|good evening|sup|what's up)\b/i
const SMALL_TALK_REGEX =
  /\b(how are you|how r you|how's it going|hows it going|what's up|whats up|thank you|thanks|nice|good bot)\b/i
const IDENTITY_REGEX =
  /\b(who are you|what are you|tell me about yourself|introduce yourself)\b/i
const SIGNIL_NAME_REGEX = /\b(signil|signal)\b/i
const PLATFORM_KEYWORDS = [
  'signil',
  'account',
  'accounts',
  'profile',
  'profiles',
  'athlete',
  'athletes',
  'advisor',
  'advisors',
  'agent',
  'agents',
  'nil',
  'expertise',
  'specialty',
  'specialties',
  'sport',
  'sports',
  'partnership',
  'partnerships',
  'brand',
  'matching',
  'match',
  'connect',
  'connection',
  'message',
  'outreach',
  'discover',
  'find',
  'search',
  'pricing',
  'tier',
  'tiers',
  'waitlist',
  'legal protection',
  'brand building',
  'financial growth',
  'verified status',
  'membership',
  'associate',
  'business',
  'corporation',
  'enterprise',
  'professional success',
  'nil excellence',
  'advisor pricing',
  'agent pricing',
]

const PROFILE_DISCOVERY_KEYWORDS = [
  'find',
  'search',
  'looking for',
  'discover',
  'recommend',
  'match',
  'profiles',
  'profile',
  'athlete',
  'athletes',
  'advisor',
  'advisors',
  'agent',
  'agents',
  'connect',
  'connections',
]

const SIGNIL_PLATFORM_KNOWLEDGE = {
  homePage: {
    headline: 'Empowering Champions, Athletes, Agents, Advisors, and Institutions to Win.',
    corePromise:
      'Signil matches NIL athletes with trusted advisors using fast AI-powered matching.',
    highlights: ['Free for Athletes', 'Vetted Professionals', 'AI-Powered Matching'],
    ctas: ['Join the Inner Circle', 'See the Experience'],
    trustSignals: ['Authentic NIL', 'Success Rate 99.2%', 'Enterprise Shield Security'],
  },
  athletesPage: {
    positioning:
      'Athletes are paired with expert guidance to build a protected, sustainable NIL legacy.',
    featurePillars: [
      'Legal Protection: NCAA compliance, contract review, eligibility guidance.',
      'Brand Building: personal brand strategy and digital presence growth.',
      'Financial Growth: tax planning and long-term wealth support.',
    ],
    networkTools:
      'Athletes can view and manage their network from "View My Network".',
    pricing: {
      tier: 'ASSOCIATE',
      price: '$0 / lifetime',
      included: [
        'Personalized Advisor Matching',
        'Unlimited Secure Messaging',
        'Contract & Opportunity Screening',
        'Brand Growth Digital Resources',
        'Exclusive NIL Marketplace Access',
      ],
      cta: 'Join the Waitlist',
    },
  },
  advisorsAndAgentsPage: {
    advisors: [
      'Connect with athletes via AI matching aligned to expertise and experience.',
      "Verified status through Signil's vetting process.",
      'Advisor dashboard to grow practice with tools, resources, and insights.',
    ],
    agents: [
      'Purpose-driven connection model with trust-first matching.',
      'Smart athlete discovery based on specialization.',
      "Verified status to build trust with athletes and families.",
    ],
    pricingTiers: [
      'ASSOCIATE: $0/month, includes Scout, basic listing, standard matching, secure messaging.',
      'BUSINESS: coming soon, enhanced recommendations, limited matches, verification badge, basic analytics.',
      'CORPORATION: coming soon, unlimited matching, advanced analytics, priority algorithm, dedicated account manager.',
      'ENTERPRISE: coming soon, multi-user permissions, custom branding, tailored bundles, API access.',
    ],
  },
}

const clampString = (value, max = 600) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const normalizeText = (value) => {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const parseJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null
  try {
    return JSON.parse(text)
  } catch (_) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch (_) {
        return null
      }
    }
    return null
  }
}

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return []

  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: clampString(item.content, 500),
    }))
    .filter((item) => item.content)
}

const isOnPlatformTopic = (message) => {
  const normalized = message.toLowerCase().trim()
  if (!normalized) return false
  if (GREETING_REGEX.test(normalized) || SMALL_TALK_REGEX.test(normalized)) {
    return true
  }
  if (SIGNIL_NAME_REGEX.test(normalized)) return true
  return PLATFORM_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

const isIdentityQuestion = (message) => {
  const normalized = message.toLowerCase().trim()
  return IDENTITY_REGEX.test(normalized)
}

const getRankingIntent = (message) => {
  const normalized = message.toLowerCase()
  if (
    /\b(worst|lowest|bottom|weakest|least rated|low rated)\b/.test(normalized)
  ) {
    return 'worst'
  }
  if (
    /\b(best|top|highest|strongest|most rated|high rated)\b/.test(normalized)
  ) {
    return 'best'
  }
  return 'default'
}

const shouldSuggestProfiles = (message) => {
  const normalized = message.toLowerCase()
  const hasDiscoveryVerb = PROFILE_DISCOVERY_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  )

  const hasTargetRole = /\b(athlete|athletes|advisor|advisors|agent|agents|profile|profiles)\b/.test(
    normalized
  )

  const rankingDiscovery = /\b(best|top|good|strong|worst|lowest|bottom)\b.*\b(athlete|athletes|advisor|advisors|agent|agents|profile|profiles)\b/.test(
    normalized
  )

  return (hasDiscoveryVerb && hasTargetRole) || rankingDiscovery
}

const getMessageIntent = (message) => {
  const normalized = message.toLowerCase().trim()
  if (isIdentityQuestion(normalized)) return 'identity'
  if (GREETING_REGEX.test(normalized) || SMALL_TALK_REGEX.test(normalized)) {
    return 'small_talk'
  }
  if (shouldSuggestProfiles(normalized)) return 'discovery'
  if (SIGNIL_NAME_REGEX.test(normalized)) return 'platform_info'
  if (
    /\b(pricing|tier|tiers|feature|features|membership|waitlist|how.*work|best thing|what can i do)\b/.test(
      normalized
    )
  ) {
    return 'platform_info'
  }
  return 'other'
}

const findKnowledgeMatch = (message) => {
  const normalized = normalizeText(message)
  if (!normalized || knowledgeEntries.length === 0) return null

  let bestMatch = null
  let bestScore = 0

  knowledgeEntries.forEach((entry) => {
    if (!Array.isArray(entry.patterns)) return
    entry.patterns.forEach((pattern) => {
      const normalizedPattern = normalizeText(pattern)
      if (!normalizedPattern) return
      if (normalized.includes(normalizedPattern)) {
        const score = normalizedPattern.length
        if (score > bestScore) {
          bestScore = score
          bestMatch = entry
        }
      }
    })
  })

  return bestMatch
}

const toOption = (label) => ({
  label,
  value: label,
})

const buildQuickReplies = (entry, intent) => {
  if (entry?.quickReplies && entry.quickReplies.length >= 3) {
    return entry.quickReplies.slice(0, 3).map(toOption)
  }

  if (intent === 'discovery') {
    return [
      toOption('Find best athletes'),
      toOption('Find advisors for brand building'),
      toOption('Find agents for NIL strategy'),
    ]
  }

  return [
    toOption('What is Signil'),
    toOption('How Signil works'),
    toOption('Signil pricing'),
  ]
}

const rankCandidatesByMessage = (message, candidates) => {
  if (!message || !Array.isArray(candidates) || candidates.length === 0) return []
  const keywords = message
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3)

  if (keywords.length === 0) return []

  return candidates
    .map((candidate) => {
      const haystack = [
        candidate.name,
        candidate.userType,
        candidate.sport,
        candidate.title,
        candidate.location,
        ...(candidate.specialization || []),
        ...(candidate.specialties || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const score = keywords.reduce(
        (acc, token) => (haystack.includes(token) ? acc + 1 : acc),
        0
      )

      return { candidate, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => item.candidate.userId.toString())
}

const callGroq = async ({ apiKey, model, messages, withJsonFormat = true }) => {
  const body = {
    model,
    temperature: 0.2,
    max_tokens: 500,
    messages,
  }

  if (withJsonFormat) {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json()

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `Groq request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

export const chatWithScout = async (req, res, next) => {
  try {
    const message = clampString(req.body?.message, 900)
    const history = normalizeHistory(req.body?.history)
    const requester = req.user

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required',
      })
    }

    const intent = getMessageIntent(message)
    const knowledgeMatch = intent === 'discovery' ? null : findKnowledgeMatch(message)

    const groqApiKey = process.env.GROQ_API_KEY
    const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL

    if (!groqApiKey) {
      if (knowledgeMatch) {
        return res.status(200).json({
          status: 'success',
          data: {
            reply: clampString(knowledgeMatch.answer, 1200),
            suggestions: [],
            options: buildQuickReplies(knowledgeMatch, intent),
            searchSummary: '',
            model,
            fallbackMode: true,
          },
        })
      }
      return res.status(200).json({
        status: 'success',
        data: {
          reply:
            'I can only answer Signil questions from my knowledge base. Please choose an option.',
          suggestions: [],
          options: buildQuickReplies(null, intent),
          searchSummary: '',
          model,
          fallbackMode: true,
        },
      })
    }
    const candidateUsers = await User.find({
      userType: { $in: ALL_SEARCHABLE_USER_TYPES },
      _id: { $ne: requester._id },
      isActive: true,
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
    })
      .select('name firstName lastName userType sport specialties')
      .limit(MAX_CANDIDATES * 2)
      .lean()

    const candidateUserIds = candidateUsers.map((user) => user._id)

    const profiles = await Profile.find({
      user: { $in: candidateUserIds },
      verified: true,
      isPublic: true,
    })
      .select(
        'user bio aboutMe location sport title specialization specialties school profileImage photo ratings'
      )
      .sort({ 'ratings.averageRating': -1, updatedAt: -1 })
      .limit(MAX_CANDIDATES)
      .lean()

    const userById = new Map(
      candidateUsers.map((user) => [user._id.toString(), user])
    )

    const candidates = profiles
      .map((profile) => {
        const user = userById.get(profile.user.toString())
        if (!user) return null

        return {
          userId: profile.user.toString(),
          name:
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Unknown',
          userType: user.userType,
          sport: profile.sport || user.sport || '',
          title: profile.title || '',
          location: profile.location || '',
          school: profile.school || '',
          specialization: profile.specialization || [],
          specialties: profile.specialties || user.specialties || [],
          bio: clampString(profile.bio || profile.aboutMe || '', 160),
          rating: profile.ratings?.averageRating || 0,
        }
      })
      .filter(Boolean)

    const rankingIntent = getRankingIntent(message)
    const enableSuggestions = intent === 'discovery'
    const candidatesByIntent = [...candidates].sort((a, b) => {
      if (rankingIntent === 'worst') {
        return (a.rating || 0) - (b.rating || 0)
      }
      return (b.rating || 0) - (a.rating || 0)
    })

    const candidatesById = new Map(
      candidates.map((candidate) => [candidate.userId, candidate])
    )

    const systemPrompt = [
      'You are Scout AI, the in-app Signil assistant.',
      'Signil is a networking and NIL collaboration platform for athletes, advisors, and agents.',
      'Your personality is warm, human, helpful, and concise.',
      'Respond naturally to greetings/small talk, like a real assistant.',
      'For identity questions, clearly introduce yourself as Scout AI for Signil.',
      'For Signil product questions, answer accurately from knowledgeBase only.',
      'For discovery requests, recommend matching profiles from candidateCatalog.',
      'If user asks unrelated non-Signil questions, politely decline and redirect to Signil help.',
      'Reply in the same language style as the user when possible.',
      'You also know Signil product details from the provided knowledgeBase and should answer those questions accurately.',
      'If the user asks about pricing, tiers, features, or page content, answer from knowledgeBase and do not fabricate.',
      'If the answer is not in knowledgeBase and the user is not asking for discovery, respond with: "I cannot answer that. I can only help with Signil."',
      'Only include suggestedProfileIds when shouldSuggestProfiles is true.',
      `When suggesting people, use only IDs from the provided candidate catalog and suggest at most ${MAX_SUGGESTIONS}.`,
      'Respond as JSON only with this shape:',
      '{"reply":"string","suggestedProfileIds":["id1","id2"],"searchSummary":"string"}',
    ].join(' ')

    const requestPayload = {
      requester: {
        userType: requester.userType,
        name: requester.name,
      },
      detectedIntent: intent,
      latestMessage: message,
      knowledgeBase: knowledgeEntries,
      shouldSuggestProfiles: enableSuggestions,
      candidateCatalog: candidates,
    }

    const modelMessages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: JSON.stringify(requestPayload) },
    ]

    let completion
    let groqUnavailable = false
    try {
      completion = await callGroq({
        apiKey: groqApiKey,
        model,
        messages: modelMessages,
        withJsonFormat: true,
      })
    } catch (error) {
      try {
        completion = await callGroq({
          apiKey: groqApiKey,
          model,
          messages: modelMessages,
          withJsonFormat: false,
        })
      } catch (fallbackError) {
        groqUnavailable = true
      }
    }

    const assistantContent = completion?.choices?.[0]?.message?.content || ''
    const parsed = parseJsonObject(assistantContent)

    const fallbackReply =
      intent === 'discovery'
        ? 'Tell me who you want to discover on Signil and I will find strong matches for you.'
        : 'I cannot answer that. I can only help with Signil.'
    const reply = clampString(parsed?.reply || assistantContent, 1200) || fallbackReply

    let suggestedIds = enableSuggestions
      ? Array.isArray(parsed?.suggestedProfileIds)
      ? parsed.suggestedProfileIds.map((id) => String(id))
      : []
      : []

    suggestedIds = suggestedIds
      .filter((id) => candidatesById.has(id))
      .slice(0, MAX_SUGGESTIONS)

    if (enableSuggestions && (rankingIntent === 'best' || rankingIntent === 'worst')) {
      suggestedIds = candidatesByIntent
        .slice(0, MAX_SUGGESTIONS)
        .map((candidate) => candidate.userId)
    }

    if (enableSuggestions && suggestedIds.length === 0) {
      suggestedIds = rankCandidatesByMessage(message, candidates)
    }

    if (enableSuggestions && suggestedIds.length === 0 && candidates.length > 0) {
      suggestedIds = candidatesByIntent
        .slice(0, MAX_SUGGESTIONS)
        .map((candidate) => candidate.userId)
    }

    const suggestions = suggestedIds
      .map((id) => candidatesById.get(id))
      .filter(Boolean)
      .slice(0, MAX_SUGGESTIONS)
      .map((candidate) => ({
        userId: candidate.userId,
        name: candidate.name,
        userType: candidate.userType,
        sport: candidate.sport,
        title: candidate.title,
        location: candidate.location,
        specialization: candidate.specialization,
        specialties: candidate.specialties,
        bio: candidate.bio,
        profilePath: `/profile/public/${candidate.userId}`,
      }))

    res.status(200).json({
      status: 'success',
      data: {
        reply: groqUnavailable
          ? enableSuggestions
            ? 'I found some strong matches for you.'
            : knowledgeMatch
              ? clampString(knowledgeMatch.answer, 1200)
              : 'I cannot answer that. I can only help with Signil.'
          : reply,
        suggestions,
        options: buildQuickReplies(knowledgeMatch, intent),
        searchSummary: clampString(parsed?.searchSummary || '', 180),
        model,
        fallbackMode: groqUnavailable,
      },
    })
  } catch (error) {
    console.error('Error in chatWithScout:', error)
    next(error)
  }
}
