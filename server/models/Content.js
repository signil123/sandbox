// File: server/models/Content.js
import mongoose from 'mongoose'

// Interest Schema
const InterestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      // Examples: 'football', 'basketball', 'hockey', 'tennis', 'soccer', etc.
    },
    subcategories: [String],
    // Examples: ['NFL', 'college football']
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate',
    },
  },
  {
    timestamps: true,
  }
)

// NIL Preference Schema
const NILPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    categories: [String],
    // Examples: ['apparel', 'sports equipment', 'technology', 'food & beverage']
    minValue: Number, // Minimum deal value in cents
    maxValue: Number,
    preferredBrand: [String],
    excludedBrand: [String],
    allowPhotoshoot: {
      type: Boolean,
      default: false,
    },
    allowVideo: {
      type: Boolean,
      default: false,
    },
    allowSocial: {
      type: Boolean,
      default: true,
    },
    allowTestimonial: {
      type: Boolean,
      default: false,
    },
    allowExclusive: {
      type: Boolean,
      default: false,
    },
    geo_restrictions: [String], // Countries where willing to promote
    additionalNotes: String,
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// News Article Schema
const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['news', 'blog', 'announcement', 'feature', 'interview'],
      default: 'news',
    },
    tags: [String],
    featuredImage: String,
    images: [String],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        likes: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
      },
    ],
    seo: {
      metaDescription: String,
      metaKeywords: [String],
      canonicalUrl: String,
    },
    publishedAt: Date,
    updatedAt: Date,
    allowComments: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for Interest
InterestSchema.index({ user: 1 })
InterestSchema.index({ category: 1 })
InterestSchema.index({ user: 1, category: 1 }, { unique: true })

// Indexes for NIL Preference
NILPreferenceSchema.index({ isPublic: 1 })
NILPreferenceSchema.index({ categories: 1 })

// Indexes for News
NewsSchema.index({ author: 1 })
NewsSchema.index({ status: 1 })
NewsSchema.index({ category: 1 })
NewsSchema.index({ tags: 1 })
NewsSchema.index({ publishedAt: -1 })
NewsSchema.index({ views: -1 })

// Pre-save middleware for News
NewsSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

// Interest Methods
InterestSchema.methods.addSubcategory = async function (subcategory) {
  if (!this.subcategories.includes(subcategory)) {
    this.subcategories.push(subcategory)
    return await this.save()
  }
  return this
}

InterestSchema.methods.removeSubcategory = async function (subcategory) {
  this.subcategories = this.subcategories.filter((s) => s !== subcategory)
  return await this.save()
}

// Static methods for Interest
InterestSchema.statics.getUserInterests = function (userId) {
  return this.find({ user: userId })
}

InterestSchema.statics.getUserInterestCategories = async function (userId) {
  const interests = await this.find({ user: userId })
  return interests.map((i) => i.category)
}

// NIL Preference Methods
NILPreferenceSchema.methods.addBrand = async function (brand) {
  if (!this.preferredBrand.includes(brand)) {
    this.preferredBrand.push(brand)
    return await this.save()
  }
  return this
}

NILPreferenceSchema.methods.removeBrand = async function (brand) {
  this.preferredBrand = this.preferredBrand.filter((b) => b !== brand)
  return await this.save()
}

NILPreferenceSchema.methods.addExcludedBrand = async function (brand) {
  if (!this.excludedBrand.includes(brand)) {
    this.excludedBrand.push(brand)
    return await this.save()
  }
  return this
}

NILPreferenceSchema.methods.removeExcludedBrand = async function (brand) {
  this.excludedBrand = this.excludedBrand.filter((b) => b !== brand)
  return await this.save()
}

// Static methods for NIL Preference
NILPreferenceSchema.statics.getUserPreferences = function (userId) {
  return this.findOne({ user: userId })
}

// News Methods
NewsSchema.methods.publish = async function () {
  this.status = 'published'
  this.publishedAt = new Date()
  return await this.save()
}

NewsSchema.methods.archive = async function () {
  this.status = 'archived'
  return await this.save()
}

NewsSchema.methods.incrementViews = async function () {
  this.views += 1
  return await this.save()
}

NewsSchema.methods.incrementShares = async function () {
  this.shares += 1
  return await this.save()
}

NewsSchema.methods.like = async function () {
  this.likes += 1
  return await this.save()
}

NewsSchema.methods.unlike = async function () {
  this.likes = Math.max(0, this.likes - 1)
  return await this.save()
}

NewsSchema.methods.addComment = async function (userId, text) {
  if (!this.allowComments) {
    throw new Error('Comments are disabled for this article')
  }

  this.comments.push({
    user: userId,
    text: text,
  })

  return await this.save()
}

NewsSchema.methods.removeComment = async function (commentId) {
  this.comments = this.comments.filter((c) => c._id.toString() !== commentId.toString())
  return await this.save()
}

// Static methods for News
NewsSchema.statics.getPublishedArticles = function (limit = 10, skip = 0) {
  return this.find({ status: 'published' })
    .populate('author', 'name profileImage')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip)
}

NewsSchema.statics.searchArticles = function (query) {
  return this.find({
    status: 'published',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  })
    .populate('author', 'name profileImage')
    .sort({ publishedAt: -1 })
}

NewsSchema.statics.getArticlesByCategory = function (category, limit = 10, skip = 0) {
  return this.find({ status: 'published', category })
    .populate('author', 'name profileImage')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip)
}

NewsSchema.statics.getTrendingArticles = function (limit = 5) {
  return this.find({ status: 'published' })
    .sort({ views: -1, likes: -1, shares: -1 })
    .limit(limit)
}

// Virtuals for News
NewsSchema.virtual('readingTime').get(function () {
  const wordsPerMinute = 200
  const wordCount = this.content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
})

NewsSchema.virtual('commentCount').get(function () {
  return this.comments.length
})

export const Interest = mongoose.model('Interest', InterestSchema)
export const NILPreference = mongoose.model('NILPreference', NILPreferenceSchema)
export const News = mongoose.model('News', NewsSchema)
