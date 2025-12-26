// File: server/seeds/advisorSeedData.js
// File: server/seeds/advisorSeedData.js
/**
 * Seed data for testing advisor and agent profiles
 * Run this file to populate test advisors in database
 */

import mongoose from 'mongoose'
import {
  default as Interest,
  default as NILPreference,
} from '../models/Content.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'
import Document from '../models/Verification.js'

const seedAdvisors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({ userType: { $in: ['advisor', 'agent'] } })
    await Profile.deleteMany({ profileType: { $in: ['advisor', 'agent'] } })
    console.log('Cleared existing advisor data')

    // Create sample advisors and agents
    const sampleUsers = [
      {
        user: {
          name: 'John Smith',
          email: 'john.smith@advisors.com',
          password: 'TestPassword123!',
          userType: 'advisor',
        },
        profile: {
          profileType: 'advisor',
          specialization: ['contract negotiation', 'brand deals'],
          experience: '15 years',
          certifications: [
            'Sports Law (Degree)',
            'Contract Negotiation (Certification)',
          ],
          clients: 45,
          phone: '+1-212-555-0100',
          profileImage: 'https://example.com/john-profile.jpg',
          aboutMe:
            'Experienced sports advisor specializing in NIL deals and contract negotiations. Worked with top college athletes for 15+ years.',
          socialLinks: {
            twitter: '@JohnSmithAdvisor',
            linkedin: '@johnsmith-sports',
          },
          verified: true,
          verificationStatus: 'approved',
          ratings: { averageRating: 4.8, totalReviews: 42 },
          isPublic: true,
        },
        interests: [
          {
            category: 'sports law',
            subcategories: ['contract law', 'NIL deals'],
            level: 'expert',
          },
          {
            category: 'business',
            subcategories: ['negotiation', 'marketing'],
            level: 'expert',
          },
        ],
        nilPreferences: {
          categories: ['apparel', 'sports equipment', 'technology'],
          minValue: 50000,
          maxValue: 500000,
          preferredBrand: ['Nike', 'Adidas', 'Apple'],
          excludedBrand: [],
          serviceTypes: [
            'contract negotiation',
            'brand matching',
            'deal structuring',
          ],
          geo_restrictions: ['USA'],
          additionalNotes: 'Prefer high-value, long-term partnerships',
          isPublic: true,
        },
        documents: [
          {
            documentType: 'license',
            issuer: 'State Bar Association',
            documentId: 'BAR-2010-12345',
            issueDate: new Date('2010-01-15'),
            expirationDate: new Date('2025-12-31'),
            status: 'verified',
            reviewedAt: new Date(),
            reviewedBy: 'admin@example.com',
          },
        ],
      },
      {
        user: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@agents.com',
          password: 'TestPassword123!',
          userType: 'agent',
        },
        profile: {
          profileType: 'agent',
          agencyName: 'Elite Sports Management',
          agencySince: new Date('2015-06-01'),
          representedAthletes: 28,
          phone: '+1-310-555-0200',
          profileImage: 'https://example.com/sarah-profile.jpg',
          aboutMe:
            'CEO of Elite Sports Management. Representing 28+ professional athletes across multiple sports. Specializing in NIL and sponsorship deals.',
          socialLinks: {
            twitter: '@EliteSportsMgmt',
            instagram: '@elitesportsmgmt',
            linkedin: '@sarahjohnson-sports',
          },
          verified: true,
          verificationStatus: 'approved',
          ratings: { averageRating: 4.9, totalReviews: 68 },
          isPublic: true,
        },
        interests: [
          {
            category: 'athlete representation',
            subcategories: ['sponsorships', 'NIL deals'],
            level: 'expert',
          },
          {
            category: 'business development',
            subcategories: ['partnership creation', 'brand strategy'],
            level: 'expert',
          },
        ],
        nilPreferences: {
          categories: [
            'apparel',
            'energy drinks',
            'technology',
            'food & beverage',
          ],
          minValue: 100000,
          maxValue: 1000000,
          preferredBrand: [
            'Nike',
            'Gatorade',
            'Apple',
            'Red Bull',
            'Beats by Dre',
          ],
          excludedBrand: [],
          serviceTypes: [
            'athlete representation',
            'deal structuring',
            'brand matching',
          ],
          geo_restrictions: ['USA'],
          additionalNotes: 'Looking for major endorsement opportunities',
          isPublic: true,
        },
        documents: [
          {
            documentType: 'certification',
            issuer: 'Sports Agents Association',
            documentId: 'SAA-2016-67890',
            issueDate: new Date('2016-03-20'),
            expirationDate: new Date('2026-03-20'),
            status: 'verified',
            reviewedAt: new Date(),
            reviewedBy: 'admin@example.com',
          },
          {
            documentType: 'credential',
            issuer: 'Business License - California',
            documentId: 'CA-BUS-2015-11111',
            issueDate: new Date('2015-06-01'),
            expirationDate: new Date('2026-06-01'),
            status: 'verified',
            reviewedAt: new Date(),
            reviewedBy: 'admin@example.com',
          },
        ],
      },
      {
        user: {
          name: 'Michael Chen',
          email: 'michael.chen@advisors.com',
          password: 'TestPassword123!',
          userType: 'advisor',
        },
        profile: {
          profileType: 'advisor',
          specialization: ['financial planning', 'investment strategy'],
          experience: '12 years',
          certifications: [
            'CFA (Chartered Financial Analyst)',
            'CFP (Certified Financial Planner)',
          ],
          clients: 32,
          phone: '+1-415-555-0300',
          profileImage: 'https://example.com/michael-profile.jpg',
          aboutMe:
            'Financial advisor specializing in athlete wealth management and investment strategy. CFA certified with 12+ years experience.',
          socialLinks: {
            twitter: '@MichaelFinance',
            linkedin: '@michaelchen-advisor',
          },
          verified: false,
          verificationStatus: 'pending_review',
          ratings: { averageRating: 4.7, totalReviews: 35 },
          isPublic: false,
        },
        interests: [
          {
            category: 'finance',
            subcategories: ['investment', 'wealth management'],
            level: 'expert',
          },
          {
            category: 'business',
            subcategories: ['financial planning', 'tax strategy'],
            level: 'expert',
          },
        ],
        nilPreferences: {
          categories: ['financial services', 'technology'],
          minValue: 25000,
          maxValue: 250000,
          preferredBrand: [],
          excludedBrand: [],
          serviceTypes: ['financial advisory', 'investment management'],
          geo_restrictions: ['USA'],
          additionalNotes:
            'Focused on athlete financial literacy and wealth building',
          isPublic: false,
        },
        documents: [
          {
            documentType: 'certification',
            issuer: 'CFA Institute',
            documentId: 'CFA-2013-22222',
            issueDate: new Date('2013-09-01'),
            expirationDate: new Date('2026-09-01'),
            status: 'pending_review',
            submittedAt: new Date(),
            submittedNotes: 'CFA Level III certification',
          },
        ],
      },
    ]

    // Create advisors/agents
    for (const userData of sampleUsers) {
      try {
        // Create user
        const user = await User.create({
          ...userData.user,
        })

        console.log(`Created user: ${user.name}`)

        // Create profile
        const profile = await Profile.create({
          ...userData.profile,
          user: user._id,
        })

        console.log(`Created profile for: ${user.name}`)

        // Create interests
        if (userData.interests) {
          await Interest.insertMany(
            userData.interests.map((interest) => ({
              ...interest,
              user: user._id,
            }))
          )
          console.log(`Created ${userData.interests.length} interests`)
        }

        // Create NIL preferences
        if (userData.nilPreferences) {
          await NILPreference.create({
            ...userData.nilPreferences,
            user: user._id,
          })
          console.log('Created NIL preferences')
        }

        // Create documents
        if (userData.documents) {
          await Document.insertMany(
            userData.documents.map((doc) => ({
              ...doc,
              user: user._id,
            }))
          )
          console.log(`Created ${userData.documents.length} documents`)
        }

        console.log(`✓ Successfully created: ${user.name}\n`)
      } catch (error) {
        console.error(`Error creating user: ${error.message}`)
      }
    }

    console.log('✓ Seed data created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

// Run seed
seedAdvisors()
