// File: server/seeds/exploreSeed.js
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

dotenv.config()

const athletes = [
  {
    firstName: 'Marcus',
    lastName: 'Smart',
    email: 'marcus.smart@athlete.com',
    password: 'Password123!',
    userType: 'athlete',
    school: 'Oklahoma State',
    sport: 'Basketball',
    nilNeeds: ['Contract Review', 'Brand Matching'],
    profile: {
      bio: 'Point guard focused on defensive excellence and community building.',
      location: 'Stillwater, OK',
      sport: 'Basketball',
      school: 'Oklahoma State',
      position: 'Point Guard',
      verified: true,
      education: 'Oklahoma State University',
      experience: '3',
      certifications: ['NCAA Verified'],
      interests: {
        brandPartnerships: true,
        socialMediaGrowth: true,
      },
      nilPreferences: {
        focusAreas: ['Brand Partnerships', 'Social Media Growth'],
      },
    },
    interests: [
      { category: 'Basketball', level: 'expert' },
      { category: 'Community Service', level: 'intermediate' },
    ],
  },
  {
    firstName: 'Elena',
    lastName: 'Delle',
    email: 'elena.delle@athlete.com',
    password: 'Password123!',
    userType: 'athlete',
    school: 'Delaware',
    sport: 'Basketball',
    nilNeeds: ['Tax Help', 'Legal Advice'],
    profile: {
      bio: 'Professional basketball player exploring NIL opportunities in tech and wellness.',
      location: 'Wilmington, DE',
      sport: 'Basketball',
      school: 'Delaware',
      position: 'Forward',
      verified: true,
      interests: {
        endorsements: true,
        charitableWork: true,
      },
      nilPreferences: {
        focusAreas: ['Endorsements', 'Sponsorships'],
      },
    },
    interests: [
      { category: 'Basketball', level: 'expert' },
      { category: 'Wellness', level: 'expert' },
    ],
  },
  {
    firstName: 'Joe',
    lastName: 'Burrow',
    email: 'joe.burrow@athlete.com',
    password: 'Password123!',
    userType: 'athlete',
    school: 'LSU',
    sport: 'Football',
    nilNeeds: ['Brand Matching', 'Contract Review'],
    profile: {
      bio: 'Quarterback looking to partner with authentic brands.',
      location: 'Baton Rouge, LA',
      sport: 'Football',
      school: 'LSU',
      position: 'Quarterback',
      verified: true,
      interests: {
        brandPartnerships: true,
        contentCreation: true,
      },
      nilPreferences: {
        focusAreas: ['Brand Partnerships', 'Content Creation'],
      },
    },
    interests: [
      { category: 'Football', level: 'expert' },
      { category: 'Fashion', level: 'intermediate' },
    ],
  },
]

const advisors = [
  {
    firstName: 'Robert',
    lastName: 'Kiyosaki',
    email: 'robert.k@advisors.com',
    password: 'Password123!',
    userType: 'advisor',
    specialties: ['Taxes', 'Financial Planning'],
    experience: '10+ years',
    profile: {
      bio: 'Financial educator and advisor specializing in athlete wealth preservation.',
      location: 'Phoenix, AZ',
      specialization: ['Financial Planning', 'Taxes'],
      experience: '20 years',
      clients: 50,
      verified: true,
      education: 'University of Hawaii',
      experience: '20',
      certifications: ['Certified Financial Planner', 'CPA'],
      verificationStatus: 'approved',
      ratings: { averageRating: 4.9, totalReviews: 120 },
    },
    interests: [
      { category: 'Finance', level: 'expert' },
      { category: 'Real Estate', level: 'expert' },
    ],
  },
  {
    firstName: 'Harvey',
    lastName: 'Specter',
    email: 'harvey.s@advisors.com',
    password: 'Password123!',
    userType: 'advisor',
    specialties: ['Legal Advice', 'Contract Review'],
    experience: '10+ years',
    profile: {
      bio: 'Top-tier legal closer specializing in high-stakes contract negotiations.',
      location: 'New York, NY',
      specialization: ['Contract Negotiation', 'Legal Compliance'],
      experience: '15 years',
      clients: 30,
      verified: true,
      education: 'Harvard Law School',
      experience: '15',
      certifications: ['Bar Association', 'Contract Specialist'],
      verificationStatus: 'approved',
      ratings: { averageRating: 5.0, totalReviews: 85 },
    },
    interests: [
      { category: 'Law', level: 'expert' },
      { category: 'Business Strategy', level: 'expert' },
    ],
  },
  {
    firstName: 'Gary',
    lastName: 'Vaynerchuk',
    email: 'gary.v@agents.com',
    password: 'Password123!',
    userType: 'agent',
    specialties: ['Marketing', 'Brand Matching'],
    experience: '10+ years',
    profile: {
      bio: 'Entrepreneur and marketing expert helping athletes build digital empires.',
      location: 'New York, NY',
      specialization: ['Social Media Strategy', 'Brand Building'],
      experience: '25 years',
      clients: 100,
      verified: true,
      locationPreference: 'Hybrid',
      verificationStatus: 'approved',
      ratings: { averageRating: 4.8, totalReviews: 250 },
      agencyName: 'VaynerSports',
    },
    interests: [
      { category: 'Marketing', level: 'expert' },
      { category: 'Social Media', level: 'expert' },
    ],
  },
]

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in .env')
    }

    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const allData = [...athletes, ...advisors]

    for (const item of allData) {
      let user = await User.findOne({ email: item.email })
      
      if (!user) {
        user = new User({
          firstName: item.firstName,
          lastName: item.lastName,
          name: `${item.firstName} ${item.lastName}`,
          email: item.email,
          password: item.password,
          userType: item.userType,
          isVerified: true,
          isProfileComplete: true,
        })
        console.log(`Creating user: ${user.email}`)
      } else {
        console.log(`Updating user: ${user.email}`)
      }

      // Update user fields
      user.school = item.school || user.school
      user.sport = item.sport || user.sport
      user.nilNeeds = item.nilNeeds || user.nilNeeds
      user.specialties = item.specialties || user.specialties
      user.experience = item.experience || user.experience
      user.isVerified = true
      user.isProfileComplete = true

      await user.save()

      let profile = await Profile.findOne({ user: user._id })
      if (!profile) {
        profile = new Profile({
          user: user._id,
          profileType: item.userType,
        })
        console.log(`Creating profile for: ${user.email}`)
      } else {
        console.log(`Updating profile for: ${user.email}`)
      }

      // Update profile fields
      Object.assign(profile, item.profile)
      await profile.save()

      if (item.interests) {
        // Clear old interests and add new ones for simplicity in seeding
        await Interest.deleteMany({ user: user._id })
        for (const inter of item.interests) {
          const interest = new Interest({
            user: user._id,
            ...inter,
          })
          await interest.save()
        }
        console.log(`Updated interests for: ${user.email}`)
      }

      let nilPref = await NILPreference.findOne({ user: user._id })
      if (!nilPref) {
        nilPref = new NILPreference({
          user: user._id,
        })
        console.log(`Creating NIL preferences for: ${user.email}`)
      } else {
        console.log(`Updating NIL preferences for: ${user.email}`)
      }

      // Update NIL preferences
      if (item.profile.nilPreferences) {
        Object.assign(nilPref, item.profile.nilPreferences)
        await nilPref.save()
      }
    }

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Error during seeding:', err)
    process.exit(1)
  }
}

seed()
