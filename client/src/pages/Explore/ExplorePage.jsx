// File: client/src/pages/Explore/ExplorePage.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Sliders,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import ProfilePopup from '../../components/Dashboard/ProfilePopup'
import SkeletonCard from '../../components/ui/SkeletonCard'
import { getThemeById, themes } from '../../constants/themes'
import { selectCurrentUser } from '../../redux/userSlice'
import { exploreService } from '../../services/exploreService'
import DashboardLayout from '../Layout/DashboardLayout'

// Updated Colors
const COLORS = {
  primary: '#163146', // Navy Blue
  accent: '#986a41', // Gold
  lightAccent: '#f4e8d8',
  buttonColor: '#163146',
}

// Mock Data - Advisors/Agents with Dashboard card fields
const mockAdvisors = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    verified: true,
    matchPercentage: 92,
    location: 'New York, NY',
    rating: 4.8,
    activeClients: 12,
    description: 'Expert in brand partnerships and NIL strategy',
    expertise: ['Brand Partnerships and Marketing', 'Contract Negotiation'],
    yearsExperience: 8,
    education: 'Graduate-Level',
    certifications: ['JD', 'NCAA Compliance Officer (former)'],
    sportSpecializations: ['Football', 'Basketball'],
    title: 'Legal Advisor',
    specialty: 'Legal',
    specialties: ['Contract Review', 'NIL Law'],
    connections: 156,
    initials: 'SM',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 24,
    about:
      'Passionate legal advisor with 8+ years of experience specializing in NIL contracts and athlete representation.',
  },
  {
    id: '2',
    name: 'James Chen',
    verified: true,
    matchPercentage: 85,
    location: 'Los Angeles, CA',
    rating: 4.6,
    activeClients: 15,
    description: 'Financial planning and tax optimization specialist',
    expertise: ['Financial Planning', 'Taxes'],
    yearsExperience: 10,
    education: 'Graduate-Level',
    certifications: ['CPA', 'CFP'],
    sportSpecializations: ['NIL Generalist'],
    title: 'Marketing Pro',
    specialty: 'Marketing',
    specialties: ['Brand Strategy', 'Social Media'],
    connections: 203,
    initials: 'JC',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 31,
    about:
      'Digital marketing expert specializing in athlete branding and social media strategy.',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    verified: true,
    matchPercentage: 88,
    location: 'Remote',
    rating: 4.9,
    activeClients: 8,
    description: 'Social media strategy and brand building',
    expertise: ['Social Media Strategy', 'Brand Building'],
    yearsExperience: 6,
    education: 'Undergraduate-Level',
    certifications: [],
    sportSpecializations: ['Soccer', 'Tennis'],
    title: 'Financial Expert',
    specialty: 'Financial',
    specialties: ['Tax Planning', 'Investment'],
    connections: 289,
    initials: 'MJ',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 3,
    about: 'Financial strategist with 10+ years helping athletes build wealth.',
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    verified: true,
    matchPercentage: 78,
    location: 'Chicago, IL',
    rating: 4.7,
    activeClients: 11,
    description: 'Legal compliance and contract specialist',
    expertise: ['Legal Compliance', 'Contract Negotiation'],
    yearsExperience: 12,
    education: 'Professional & Doctoral Degrees',
    certifications: ['JD'],
    sportSpecializations: ['Football', 'Basketball', 'Baseball'],
    title: 'Brand Strategist',
    specialty: 'Brand Strategy',
    specialties: ['Personal Branding', 'Content'],
    connections: 167,
    initials: 'ER',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 18,
    about:
      'Personal branding specialist helping athletes build authentic, marketable brands.',
  },
  {
    id: '5',
    name: 'David Park',
    verified: true,
    matchPercentage: 82,
    location: 'Hybrid',
    rating: 4.5,
    activeClients: 9,
    description: 'Comprehensive NIL and brand strategy consultant',
    expertise: [
      'Brand Partnerships and Marketing',
      'Social Media Strategy',
      'Financial Planning',
    ],
    yearsExperience: 7,
    education: 'Graduate-Level',
    certifications: ['MBA', 'CFA'],
    sportSpecializations: ['Basketball', 'Soccer', 'Track & Field'],
    title: 'NIL Specialist',
    specialty: 'NIL',
    specialties: ['NIL Deals', 'Sponsorship'],
    connections: 134,
    initials: 'DP',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 2,
    about:
      'NIL specialist connecting athletes with brands and sponsorship opportunities.',
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    verified: true,
    matchPercentage: 79,
    location: 'Miami, FL',
    rating: 4.4,
    activeClients: 7,
    description: 'Social media influencer and brand strategist',
    expertise: ['Social Media Strategy', 'Brand Building'],
    yearsExperience: 5,
    education: 'Undergraduate-Level',
    certifications: [],
    sportSpecializations: ['Volleyball', 'Swimming'],
    title: 'Social Media Expert',
    specialty: 'Marketing',
    specialties: ['Content Strategy', 'Engagement'],
    connections: 145,
    initials: 'LA',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 8,
    about: 'Social media expert with a passion for athlete branding.',
  },
  {
    id: '7',
    name: 'Robert Thompson',
    verified: true,
    matchPercentage: 91,
    location: 'Boston, MA',
    rating: 4.8,
    activeClients: 13,
    description: 'Expert in legal and contract negotiations',
    expertise: ['Legal Compliance', 'Contract Negotiation'],
    yearsExperience: 15,
    education: 'Professional & Doctoral Degrees',
    certifications: ['JD'],
    sportSpecializations: ['Football', 'Hockey'],
    title: 'Legal Expert',
    specialty: 'Legal',
    specialties: ['Contract Negotiation', 'Compliance'],
    connections: 198,
    initials: 'RT',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 35,
    about:
      'Expert legal advisor specializing in athlete contracts and NIL agreements.',
  },
  {
    id: '8',
    name: 'Jessica Wong',
    verified: true,
    matchPercentage: 86,
    location: 'San Francisco, CA',
    rating: 4.7,
    activeClients: 10,
    description: 'Tech-savvy brand strategy specialist',
    expertise: [
      'Social Media Strategy',
      'Brand Building',
      'Financial Planning',
    ],
    yearsExperience: 8,
    education: 'Graduate-Level',
    certifications: ['MBA'],
    sportSpecializations: ['Gymnastics', 'Swimming'],
    title: 'Brand Strategist',
    specialty: 'Brand Strategy',
    specialties: ['Brand Building', 'Digital Marketing'],
    connections: 176,
    initials: 'JW',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 22,
    about: 'Brand strategist with expertise in digital marketing.',
  },
  {
    id: '9',
    name: 'Michael Garcia',
    verified: true,
    matchPercentage: 84,
    location: 'Austin, TX',
    rating: 4.6,
    activeClients: 11,
    description: 'Contract negotiation and brand partnership expert',
    expertise: ['Contract Negotiation', 'Brand Partnerships and Marketing'],
    yearsExperience: 9,
    education: 'Graduate-Level',
    certifications: ['CPA'],
    sportSpecializations: ['Football', 'Basketball', 'Wrestling'],
    title: 'Contract Specialist',
    specialty: 'Legal',
    specialties: ['Negotiation', 'Agreements'],
    connections: 154,
    initials: 'MG',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 17,
    about: 'Contract specialist with expertise in NIL agreements.',
  },
  {
    id: '10',
    name: 'Amanda White',
    verified: true,
    matchPercentage: 80,
    location: 'Denver, CO',
    rating: 4.5,
    activeClients: 8,
    description: 'Financial planning and tax specialist',
    expertise: ['Financial Planning', 'Taxes'],
    yearsExperience: 11,
    education: 'Graduate-Level',
    certifications: ['CFA', 'CFP'],
    sportSpecializations: ['Tennis', 'Track & Field', 'NIL Generalist'],
    title: 'Financial Advisor',
    specialty: 'Financial',
    specialties: ['Planning', 'Taxes'],
    connections: 142,
    initials: 'AW',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'agent',
    reviewCount: 28,
    about: 'Financial advisor specializing in athlete wealth management.',
  },
]

// Mock Data - Athletes with Dashboard card fields
const mockAthletes = [
  {
    id: 'a1',
    name: 'Alex Thompson',
    verified: true,
    matchPercentage: 85,
    location: 'Columbus, OH',
    rating: 0,
    school: 'Ohio State University',
    position: 'Quarterback',
    description: 'Seeking brand partnerships and endorsement deals',
    expertise: ['Brand Partnerships and Marketing', 'Social Media Strategy'],
    classYear: 'Junior',
    division: 'Division I',
    sport: 'Football',
    title: 'Student Athlete',
    specialty: 'Football',
    specialties: ['Quarterback', 'Leadership'],
    connections: 87,
    initials: 'AT',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    type: 'athlete',
    reviewCount: 0,
    about: 'Junior quarterback at Ohio State University.',
  },
  {
    id: 'a2',
    name: 'Jordan Williams',
    verified: true,
    matchPercentage: 90,
    location: 'Austin, TX',
    rating: 0,
    school: 'University of Texas',
    position: 'Wide Receiver',
    description: 'Looking for financial planning guidance',
    expertise: ['Financial Planning', 'Taxes'],
    classYear: 'Senior',
    division: 'Division I',
    sport: 'Football',
    title: 'Student Athlete',
    specialty: 'Football',
    specialties: ['Receiver', 'Speed'],
    connections: 102,
    initials: 'JW',
    bestMatch: true,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'athlete',
    reviewCount: 0,
    about: 'Senior wide receiver at University of Texas.',
  },
  {
    id: 'a3',
    name: 'Casey Bennett',
    verified: true,
    matchPercentage: 78,
    location: 'Remote',
    rating: 0,
    school: 'USC',
    position: 'Running Back',
    description: 'Interested in comprehensive brand building',
    expertise: ['Brand Building', 'Contract Negotiation'],
    classYear: 'Sophomore',
    division: 'Division I',
    sport: 'Football',
    title: 'Student Athlete',
    specialty: 'Football',
    specialties: ['Running Back', 'Agility'],
    connections: 76,
    initials: 'CB',
    bestMatch: false,
    banner: 'linear-gradient(135deg, #163146 0%, #986a41 100%)',
    profileImg:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    type: 'athlete',
    reviewCount: 0,
    about: 'Sophomore running back at USC.',
  },
]

const EXPERTISE_OPTIONS = [
  'Brand Partnerships and Marketing',
  'Contract Negotiation',
  'Social Media Strategy',
  'Financial Planning',
  'Taxes',
  'Brand Building',
  'Legal Compliance',
]

const EDUCATION_OPTIONS = [
  'Undergraduate-Level',
  'Graduate-Level',
  'Professional & Doctoral Degrees',
]

const EXPERIENCE_RANGES = ['1–5', '5–10', '10+']

const SPORTS_OPTIONS = [
  'Football',
  'Basketball',
  'Soccer',
  'Track & Field',
  'Volleyball',
  'Baseball',
  'Gymnastics',
  'Tennis',
  'Wrestling',
  'Swimming',
  'NIL Generalist',
]

const CERTIFICATIONS_OPTIONS = {
  legal: [
    { label: 'JD', value: 'JD' },
    {
      label: 'NCAA Compliance Officer (former)',
      value: 'NCAA Compliance Officer (former)',
    },
  ],
  finance: [
    { label: 'CPA', value: 'CPA' },
    { label: 'CFA', value: 'CFA' },
    { label: 'CFP', value: 'CFP' },
    { label: 'MBA', value: 'MBA' },
  ],
}

// Helper to construct full image URL for local uploads
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

// Helper to determine banner style (gradient or custom image)
const getBannerStyle = (profile) => {
  if (profile?.bannerImage) {
    if (profile.bannerImage.startsWith('linear-gradient') || 
        profile.bannerImage.startsWith('radial-gradient') ||
        profile.bannerImage.startsWith('url')) {
      return { background: profile.bannerImage }
    }
    
    if (profile.bannerImage.startsWith('/') || profile.bannerImage.includes('uploads')) {
      const url = getImageUrl(profile.bannerImage)
      return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    
    const theme = getThemeById(profile.bannerImage)
    if (theme?.style) return theme.style
    
    return { background: profile.bannerImage }
  }
  
  if (profile?.themeId) {
    const theme = getThemeById(profile.themeId)
    if (theme?.style) return theme.style
  }
  
  return { background: 'linear-gradient(135deg, #163146 0%, #986a41 100%)' }
}

// Modern Compact Filter Dropdown Component with Floating Popover
function CompactFilterDropdown({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  activeCount,
}) {
  return (
    <motion.div className='w-full relative'>
      <motion.button
        onClick={onToggle}
        className='w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all'
        style={{
          borderColor: activeCount > 0 ? COLORS.primary : '#e5e7eb',
          background: activeCount > 0 ? `${COLORS.lightAccent}` : 'white',
        }}
        whileHover={{ borderColor: COLORS.primary }}
      >
        <div className='flex items-center gap-2 min-w-0'>
          {Icon && (
            <Icon
              size={16}
              style={{ color: COLORS.primary }}
              className='flex-shrink-0'
            />
          )}
          <span
            className='text-sm font-medium truncate'
            style={{ color: activeCount > 0 ? COLORS.primary : '#6b7280' }}
          >
            {title}
          </span>
          {activeCount > 0 && (
            <span
              className='ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0'
              style={{
                background: COLORS.primary,
                color: 'white',
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className='flex-shrink-0'
        >
          <ChevronDown size={16} style={{ color: COLORS.primary }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-0 z-40'
              onClick={onToggle}
            />

            {/* Floating Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className='absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg  z-50 mx-0 sm:w-72'
              style={{ borderColor: '#e5e7eb' }}
            >
              <div className='p-3 space-y-2'>{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ExplorePageContent() {
  const currentUser = useSelector(selectCurrentUser)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [userType, setUserType] = useState(currentUser?.userType || 'athlete')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    expertise: [],
    sortBy: 'bestMatch',
    education: [],
    experienceRange: [],
    certifications: [],
    sportSpecializations: [],
    locationPreference: '',
  })

  // Dropdown states - now only one can be open at a time for cleaner UX
  const [openDropdown, setOpenDropdown] = useState(null)

  const [selectedUser, setSelectedUser] = useState(null)
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')

  const ITEMS_PER_PAGE = 9

  const fetchExploreData = useCallback(async () => {
    if (!currentUser?._id) return
    setLoading(true)
    try {
      const params = {
        search: searchQuery,
        expertise: filters.expertise.join(','),
        sortBy: filters.sortBy,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        locationPreference: filters.locationPreference,
        education: filters.education.join(','),
        experienceRange: filters.experienceRange.join(','),
        certifications: filters.certifications.join(','),
        sportSpecializations: filters.sportSpecializations.join(','),
      }
      
      const response = await exploreService.getUsers(currentUser._id, params)
      if (response.data.status === 'success') {
        // Map backend products to frontend format
        const mappedResults = response.data.data.users.map(u => {
          const profile = u.profile || {}
          return {
            id: u.userId,
            name: u.name,
            verified: profile.verified,
            matchPercentage: u.matchScore,
            location: profile.location || 'Remote',
            rating: profile.ratings?.averageRating || 0,
            activeClients: profile.clients || 0,
            description: profile.aboutMe || '',
            expertise: profile.specialization || [],
            specialties: profile.specialization || profile.specialties || [],
            specialty: profile.specialization?.[0] || (u.userType === 'athlete' ? profile.sport : (u.userType === 'advisor' ? 'Advisor' : 'Agent')),
            title: profile.title || (u.userType === 'advisor' ? 'Advisor' : 'Agent'),
            yearsExperience: parseInt(profile.experience) || 0,
            profileImg: (profile.profileImage && !profile.profileImage.includes('unsplash.com')) 
              ? getImageUrl(profile.profileImage) 
              : (profile.photo && !profile.photo.includes('unsplash.com'))
                ? getImageUrl(profile.photo)
                : `https://ui-avatars.com/api/?name=${u.name}&background=random`,
            banner: getBannerStyle(profile),
            type: u.userType,
            reviewCount: profile.ratings?.totalReviews || 0,
            about: profile.aboutMe || '',
            school: profile.school,
            position: profile.position,
            sport: profile.sport,
            initials: u.name.split(' ').map(n => n[0]).join(''),
          }
        })
        setResults(mappedResults)
        setTotalResults(response.data.totalResults)
        setTotalPages(response.data.totalPages || Math.ceil(response.data.totalResults / ITEMS_PER_PAGE))
      }
    } catch (error) {
      console.error('Error fetching explore data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser?._id, searchQuery, filters, currentPage])

  useEffect(() => {
    fetchExploreData()
  }, [fetchExploreData])

  const filteredResults = results
  const bestMatchIds = useMemo(() => {
    return results.slice(0, 3).map((u) => u.id)
  }, [results])

  const paginatedResults = results

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const toggleExpertise = (expertise) => {
    const newExpertise = filters.expertise.includes(expertise)
      ? filters.expertise.filter((e) => e !== expertise)
      : [...filters.expertise, expertise]
    handleFilterChange({ ...filters, expertise: newExpertise })
  }

  const toggleEducation = (edu) => {
    const newEducation = filters.education.includes(edu)
      ? filters.education.filter((e) => e !== edu)
      : [...filters.education, edu]
    handleFilterChange({ ...filters, education: newEducation })
  }

  const toggleExperience = (exp) => {
    const newExperience = filters.experienceRange.includes(exp)
      ? filters.experienceRange.filter((e) => e !== exp)
      : [...filters.experienceRange, exp]
    handleFilterChange({ ...filters, experienceRange: newExperience })
  }

  const toggleCertification = (cert) => {
    const newCerts = filters.certifications.includes(cert)
      ? filters.certifications.filter((c) => c !== cert)
      : [...filters.certifications, cert]
    handleFilterChange({ ...filters, certifications: newCerts })
  }

  const toggleSport = (sport) => {
    const newSports = filters.sportSpecializations.includes(sport)
      ? filters.sportSpecializations.filter((s) => s !== sport)
      : [...filters.sportSpecializations, sport]
  }

  const clearFilters = () => {
    setFilters({
      expertise: [],
      sortBy: 'best-match',
      education: [],
      experienceRange: [],
      certifications: [],
      sportSpecializations: [],
    })
    setCurrentPage(1)
    setOpenDropdown(null)
  }

  const handleConnect = (user) => {
    setSelectedUser(user)
    setShowConnectionModal(true)
  }

  const handleSendConnection = () => {
    console.log('Connection sent to', selectedUser?.name)
    setShowConnectionModal(false)
    setConnectionMessage('')
    setSelectedUser(null)
  }

  const hasActiveFilters =
    filters.expertise.length > 0 ||
    filters.education.length > 0 ||
    filters.experienceRange.length > 0 ||
    filters.certifications.length > 0 ||
    filters.sportSpecializations.length > 0

  return (
    <>
      <div className='min-h-screen' style={{ backgroundColor: '#fafafa' }}>
        {/* Header - Desktop & Mobile */}
        <div>
          <div className='mx-auto max-w-8xl px-4 md:px-8 py-4 md:py-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8'>
              <div>
                <h1
                  className='text-2xl sm:text-3xl font-bold'
                  style={{ color: COLORS.primary }}
                >
                  Explore
                </h1>
                <p className='text-sm text-gray-500 mt-1'>
                  {userType === 'athlete'
                    ? 'Find trusted advisors and agents'
                    : 'Discover talented athletes'}
                </p>
              </div>

              {/* User Type Toggle */}
              {/* <div className='flex gap-1 md:gap-2 bg-gray-100 p-0.5 md:p-1 rounded-lg flex-shrink-0'>
                {['athlete', 'advisor'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setUserType(type)
                      setCurrentPage(1)
                      setOpenDropdown(null)
                    }}
                    className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md font-medium text-xs md:text-sm transition-all ${
                      userType === type ? 'text-white' : 'text-gray-600'
                    }`}
                    style={{
                      background:
                        userType === type ? COLORS.buttonColor : 'transparent',
                    }}
                  >
                    {type === 'athlete' ? 'Athletes' : 'Advisors'}
                  </button>
                ))}
              </div> */}
            </div>

            {/* Search Bar & Mobile Filter Button */}
            <div className='flex gap-3 mb-1 md:mb-6 items-center'>
              <div className='relative flex-1'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
                <Input
                  type='text'
                  placeholder={
                    userType === 'athlete'
                      ? 'Search advisors...'
                      : 'Search athletes...'
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className='pl-11 pr-4 h-12 border-gray-200 rounded-2xl w-full text-base  bg-white hover:border-gray-300 focus:border-[#163146] focus:ring-1 focus:ring-[#163146] transition-all'
                />
              </div>

               {/* Mobile Filter Trigger */}
               <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpenDropdown('mobile-filters')}
                className='md:hidden h-12 w-12 bg-white border border-gray-200 rounded-2xl  flex items-center justify-center relative hover:border-gray-300 transition-colors'
                style={{
                   borderColor: hasActiveFilters ? COLORS.primary : '',
                   background: hasActiveFilters ? COLORS.lightAccent : 'white'
                }}
              >
                <Sliders size={20} style={{ color: COLORS.primary }} />
                {hasActiveFilters && (
                  <span className='absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white' style={{ background: COLORS.primary }} />
                )}
              </motion.button>
            </div>

            {/* Desktop Filters Section - Hidden on Mobile */}
            <div className='hidden md:block space-y-3'>
              {/* Expertise Horizontal Pills with Filter Header */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Sliders size={16} style={{ color: COLORS.primary }} />
                    <p className='text-xs font-semibold text-gray-600'>
                      Expertise
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <motion.button
                      onClick={clearFilters}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-1'
                      style={{
                        color: COLORS.primary,
                        background: `${COLORS.lightAccent}`,
                      }}
                    >
                      <X size={14} />
                      Clear all
                    </motion.button>
                  )}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {EXPERTISE_OPTIONS.map((expertise) => (
                    <motion.button
                      key={expertise}
                      onClick={() => toggleExpertise(expertise)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='px-2.5 py-1.5 text-xs font-medium rounded-full transition-all border flex-shrink-0'
                      style={{
                        borderColor: filters.expertise.includes(expertise)
                          ? COLORS.primary
                          : '#e5e7eb',
                        background: filters.expertise.includes(expertise)
                          ? COLORS.primary
                          : 'white',
                        color: filters.expertise.includes(expertise)
                          ? 'white'
                          : '#6b7280',
                      }}
                    >
                      {expertise}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Horizontal Filter Dropdowns Row */}
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 pt-2'>
                {/* Education & Experience */}
                <CompactFilterDropdown
                  title='Education & Experience'
                  icon={Settings}
                  isOpen={openDropdown === 'education'}
                  onToggle={() =>
                    setOpenDropdown(
                      openDropdown === 'education' ? null : 'education'
                    )
                  }
                  activeCount={
                    filters.education.length + filters.experienceRange.length
                  }
                >
                  <div>
                    <p className='text-xs font-semibold text-gray-700 mb-2'>
                      Education
                    </p>
                    <div className='space-y-2'>
                      {EDUCATION_OPTIONS.map((edu) => (
                        <label
                          key={edu}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.education.includes(edu)}
                            onChange={() => toggleEducation(edu)}
                            className='rounded w-4 h-4'
                            style={{ accentColor: COLORS.primary }}
                          />
                          <span className='text-xs text-gray-700'>{edu}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className='border-t border-gray-100 pt-3'>
                    <p className='text-xs font-semibold text-gray-700 mb-2'>
                      Experience
                    </p>
                    <div className='space-y-2'>
                      {EXPERIENCE_RANGES.map((range) => (
                        <label
                          key={range}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.experienceRange.includes(range)}
                            onChange={() => toggleExperience(range)}
                            className='rounded w-4 h-4'
                            style={{ accentColor: COLORS.primary }}
                          />
                          <span className='text-xs text-gray-700'>
                            {range} years
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CompactFilterDropdown>

                {/* Certifications */}
                <CompactFilterDropdown
                  title='Certifications'
                  icon={Star}
                  isOpen={openDropdown === 'certifications'}
                  onToggle={() =>
                    setOpenDropdown(
                      openDropdown === 'certifications'
                        ? null
                        : 'certifications'
                    )
                  }
                  activeCount={filters.certifications.length}
                >
                  <div>
                    <p className='text-xs font-semibold text-gray-700 mb-2'>
                      Legal/Compliance
                    </p>
                    <div className='space-y-2'>
                      {CERTIFICATIONS_OPTIONS.legal.map((cert) => (
                        <label
                          key={cert.value}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.certifications.includes(
                              cert.value
                            )}
                            onChange={() => toggleCertification(cert.value)}
                            className='rounded w-4 h-4'
                            style={{ accentColor: COLORS.primary }}
                          />
                          <span className='text-xs text-gray-700'>
                            {cert.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className='border-t border-gray-100 pt-3'>
                    <p className='text-xs font-semibold text-gray-700 mb-2'>
                      Finance/Business
                    </p>
                    <div className='space-y-2'>
                      {CERTIFICATIONS_OPTIONS.finance.map((cert) => (
                        <label
                          key={cert.value}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={filters.certifications.includes(
                              cert.value
                            )}
                            onChange={() => toggleCertification(cert.value)}
                            className='rounded w-4 h-4'
                            style={{ accentColor: COLORS.primary }}
                          />
                          <span className='text-xs text-gray-700'>
                            {cert.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CompactFilterDropdown>

                {/* Sports Specialization */}
                <CompactFilterDropdown
                  title='Sports'
                  icon={Users}
                  isOpen={openDropdown === 'sports'}
                  onToggle={() =>
                    setOpenDropdown(openDropdown === 'sports' ? null : 'sports')
                  }
                  activeCount={filters.sportSpecializations.length}
                >
                  <div className='space-y-2 max-h-48 overflow-y-auto'>
                    {SPORTS_OPTIONS.map((sport) => (
                      <label
                        key={sport}
                        className='flex items-center gap-2 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={filters.sportSpecializations.includes(sport)}
                          onChange={() => toggleSport(sport)}
                          className='rounded w-4 h-4'
                          style={{ accentColor: COLORS.primary }}
                        />
                        <span className='text-xs text-gray-700'>{sport}</span>
                      </label>
                    ))}
                  </div>
                </CompactFilterDropdown>

                {/* Sort By */}
                <CompactFilterDropdown
                  title='Sort By'
                  icon={ChevronDown}
                  isOpen={openDropdown === 'sortby'}
                  onToggle={() =>
                    setOpenDropdown(openDropdown === 'sortby' ? null : 'sortby')
                  }
                  activeCount={0}
                >
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='sort'
                        value='best-match'
                        checked={filters.sortBy === 'best-match'}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            sortBy: e.target.value,
                          })
                        }
                        className='w-4 h-4'
                        style={{ accentColor: COLORS.primary }}
                      />
                      <span className='text-xs text-gray-700'>Best Match</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='sort'
                        value='highest-rated'
                        checked={filters.sortBy === 'highest-rated'}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            sortBy: e.target.value,
                          })
                        }
                        className='w-4 h-4'
                        style={{ accentColor: COLORS.primary }}
                      />
                      <span className='text-xs text-gray-700'>
                        Highest Rated
                      </span>
                    </label>
                  </div>
                </CompactFilterDropdown>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='flex flex-wrap gap-2 pt-3'
                >
                  {filters.expertise.map((exp) => (
                    <motion.button
                      key={`exp-${exp}`}
                      onClick={() => toggleExpertise(exp)}
                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium'
                      style={{
                        background: `${COLORS.lightAccent}`,
                        color: COLORS.primary,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {exp}
                      <X size={12} />
                    </motion.button>
                  ))}
                  {filters.education.map((edu) => (
                    <motion.button
                      key={`edu-${edu}`}
                      onClick={() => toggleEducation(edu)}
                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium'
                      style={{
                        background: `${COLORS.lightAccent}`,
                        color: COLORS.primary,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {edu}
                      <X size={12} />
                    </motion.button>
                  ))}
                  {filters.experienceRange.map((exp) => (
                    <motion.button
                      key={`exp-${exp}`}
                      onClick={() => toggleExperience(exp)}
                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium'
                      style={{
                        background: `${COLORS.lightAccent}`,
                        color: COLORS.primary,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {exp} years
                      <X size={12} />
                    </motion.button>
                  ))}
                  {filters.certifications.map((cert) => (
                    <motion.button
                      key={`cert-${cert}`}
                      onClick={() => toggleCertification(cert)}
                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium'
                      style={{
                        background: `${COLORS.lightAccent}`,
                        color: COLORS.primary,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {cert}
                      <X size={12} />
                    </motion.button>
                  ))}
                  {filters.sportSpecializations.map((sport) => (
                    <motion.button
                      key={`sport-${sport}`}
                      onClick={() => toggleSport(sport)}
                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium'
                      style={{
                        background: `${COLORS.lightAccent}`,
                        color: COLORS.primary,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {sport}
                      <X size={12} />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Mobile Filters Modal */}
            <Dialog 
               open={openDropdown === 'mobile-filters'} 
               onOpenChange={(open) => setOpenDropdown(open ? 'mobile-filters' : null)}
            >
               <DialogContent className="w-[100vw] h-[100dvh] max-w-none p-0 flex flex-col gap-0 rounded-none sm:rounded-lg sm:h-auto sm:max-w-md sm:translate-y-[-50%]">
                  <DialogHeader className="p-4 border-b flex-shrink-0 text-left flex flex-row items-center justify-between">
                     <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
                        <Sliders size={20} />
                        Filters
                     </DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto p-4 space-y-8">
                     {/* Sort By Section */}
                     <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Sort By</h3>
                        <div className='space-y-3'>
                        <label className='flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50'>
                           <input
                              type='radio'
                              name='mobile-sort'
                              value='best-match'
                              checked={filters.sortBy === 'best-match'}
                              onChange={(e) =>
                              handleFilterChange({
                                 ...filters,
                                 sortBy: e.target.value,
                              })
                              }
                              className='w-5 h-5'
                              style={{ accentColor: COLORS.primary }}
                           />
                           <div className="flex flex-col">
                              <span className='text-sm font-semibold text-gray-900'>Best Match</span>
                              <span className='text-xs text-gray-500'>Recommended for you</span>
                           </div>
                        </label>
                        <label className='flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50'>
                           <input
                              type='radio'
                              name='mobile-sort'
                              value='highest-rated'
                              checked={filters.sortBy === 'highest-rated'}
                              onChange={(e) =>
                              handleFilterChange({
                                 ...filters,
                                 sortBy: e.target.value,
                              })
                              }
                              className='w-5 h-5'
                              style={{ accentColor: COLORS.primary }}
                           />
                           <div className="flex flex-col">
                              <span className='text-sm font-semibold text-gray-900'>Highest Rated</span>
                              <span className='text-xs text-gray-500'>Top rated first</span>
                           </div>
                        </label>
                        </div>
                     </section>

                     {/* Expertise Section */}
                     <section>
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Expertise</h3>
                           {filters.expertise.length > 0 && (
                              <button onClick={() => handleFilterChange({...filters, expertise: []})} className="text-xs font-medium text-red-500">Clear</button>
                           )}
                        </div>
                        <div className='flex flex-wrap gap-2'>
                        {EXPERTISE_OPTIONS.map((expertise) => (
                           <button
                              key={expertise}
                              onClick={() => toggleExpertise(expertise)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all border flex-shrink-0 ${
                                 filters.expertise.includes(expertise) ? '' : ''
                              }`}
                              style={{
                                 borderColor: filters.expertise.includes(expertise)
                                 ? COLORS.primary
                                 : '#e5e7eb',
                                 background: filters.expertise.includes(expertise)
                                 ? COLORS.primary
                                 : 'white',
                                 color: filters.expertise.includes(expertise)
                                 ? 'white'
                                 : '#6b7280',
                              }}
                           >
                              {expertise}
                           </button>
                        ))}
                        </div>
                     </section>

                     <div className="h-px bg-gray-100"></div>

                     {/* Education Section */}
                     <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Education</h3>
                        <div className='space-y-3 pl-1'>
                        {EDUCATION_OPTIONS.map((edu) => (
                           <label key={edu} className='flex items-center gap-3 cursor-pointer py-1'>
                              <input
                              type='checkbox'
                              checked={filters.education.includes(edu)}
                              onChange={() => toggleEducation(edu)}
                              className='rounded w-5 h-5'
                              style={{ accentColor: COLORS.primary }}
                              />
                              <span className='text-sm text-gray-700'>{edu}</span>
                           </label>
                        ))}
                        </div>
                     </section>

                     {/* Experience Section */}
                     <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Experience</h3>
                        <div className='space-y-3 pl-1'>
                        {EXPERIENCE_RANGES.map((range) => (
                           <label key={range} className='flex items-center gap-3 cursor-pointer py-1'>
                              <input
                              type='checkbox'
                              checked={filters.experienceRange.includes(range)}
                              onChange={() => toggleExperience(range)}
                              className='rounded w-5 h-5'
                              style={{ accentColor: COLORS.primary }}
                              />
                              <span className='text-sm text-gray-700'>{range} years</span>
                           </label>
                        ))}
                        </div>
                     </section>
                     
                     <div className="h-px bg-gray-100"></div>

                     {/* Certifications Section */}
                     <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Certifications</h3>
                        <div className='space-y-6 pl-1'>
                           <div>
                              <p className='text-xs font-bold text-slate-500 mb-3'>LEGAL & COMPLIANCE</p>
                              <div className='space-y-3'>
                                 {CERTIFICATIONS_OPTIONS.legal.map((cert) => (
                                 <label key={cert.value} className='flex items-center gap-3 cursor-pointer py-1'>
                                    <input
                                       type='checkbox'
                                       checked={filters.certifications.includes(cert.value)}
                                       onChange={() => toggleCertification(cert.value)}
                                       className='rounded w-5 h-5'
                                       style={{ accentColor: COLORS.primary }}
                                    />
                                    <span className='text-sm text-gray-700'>{cert.label}</span>
                                 </label>
                                 ))}
                              </div>
                           </div>
                           <div>
                              <p className='text-xs font-bold text-slate-500 mb-3'>FINANCE & BUSINESS</p>
                              <div className='space-y-3'>
                                 {CERTIFICATIONS_OPTIONS.finance.map((cert) => (
                                 <label key={cert.value} className='flex items-center gap-3 cursor-pointer py-1'>
                                    <input
                                       type='checkbox'
                                       checked={filters.certifications.includes(cert.value)}
                                       onChange={() => toggleCertification(cert.value)}
                                       className='rounded w-5 h-5'
                                       style={{ accentColor: COLORS.primary }}
                                    />
                                    <span className='text-sm text-gray-700'>{cert.label}</span>
                                 </label>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </section>

                     <div className="h-px bg-gray-100"></div>

                     {/* Sports Section */}
                     <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Sports</h3>
                        <div className='grid grid-cols-2 gap-3'>
                        {SPORTS_OPTIONS.map((sport) => (
                           <label key={sport} className='flex items-center gap-3 cursor-pointer p-2 rounded border border-gray-100 bg-gray-50/50'>
                              <input
                              type='checkbox'
                              checked={filters.sportSpecializations.includes(sport)}
                              onChange={() => toggleSport(sport)}
                              className='rounded w-4 h-4'
                              style={{ accentColor: COLORS.primary }}
                              />
                              <span className='text-xs font-medium text-gray-700'>{sport}</span>
                           </label>
                        ))}
                        </div>
                     </section>
                  </div>

                  <div className="p-4 border-t flex gap-3 bg-white flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                     <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex-1 h-11"
                     >
                        Reset All
                     </Button>
                     <Button 
                        onClick={() => setOpenDropdown(null)}
                        className="flex-1 h-11 text-base font-semibold"
                        style={{ background: COLORS.buttonColor, color: 'white' }}
                     >
                        Show {totalResults} Results
                     </Button>
                  </div>
               </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Results Grid */}
        <div className='mx-auto max-w-8xl px-4 md:px-8 pt-2 pb-6 md:py-8'>
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8'>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className='flex flex-col items-center justify-center min-h-96 text-center'>
              <Users className='w-16 h-16 text-gray-300 mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No users found
              </h3>
              <p className='text-gray-600 text-sm'>
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8'>
                {paginatedResults.map((user, index) => {
                  const isBestMatch = bestMatchIds.includes(user.id)

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className='border border-gray-200 rounded-2xl overflow-hidden  flex flex-col bg-white h-full'
                    >
                      {/* Banner */}
                      <div
                        className='h-32 relative'
                        style={user.banner}
                      >
                        {/* Match Percentage Badge */}
                        {user.matchPercentage > 0 && (
                          <div className='absolute top-3 left-3 z-10'>
                             <Badge className={`bg-white/90 backdrop-blur-sm border-none  flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 ${
                                user.matchPercentage >= 80 ? 'text-emerald-700' :
                                user.matchPercentage >= 50 ? 'text-amber-700' :
                                'text-slate-700'
                             }`}>
                                <TrendingUp size={12} className={
                                   user.matchPercentage >= 80 ? 'text-emerald-500' :
                                   user.matchPercentage >= 50 ? 'text-amber-500' :
                                   'text-slate-400'
                                } />
                                {user.matchPercentage >= 90 ? 'Best Match' : `${user.matchPercentage}% Match`}
                             </Badge>
                          </div>
                        )}
                      </div>

                       {/* Profile Section */}
                      <div className='px-4 py-4 flex-1 flex flex-col relative'>
                        {/* Profile Image */}
                        <div className='-mt-12 mb-3 flex-shrink-0 w-fit'>
                          <img
                            src={user.profileImg}
                            alt={user.name}
                            className='w-16 h-16 rounded-full border-2 border-white object-cover '
                          />
                        </div>

                        {/* Location */}
                        <div className='absolute top-2 right-2 text-right'>
                          <p className='text-[11px] font-semibold text-gray-900'>
                            {user.location}
                          </p>
                        </div>

                        {/* Name and Title Container (Standardized Height) */}
                        <div className='min-h-[3.5rem]'>
                          <p className='font-bold text-gray-900 text-sm line-clamp-1'>
                            {user.name}
                          </p>
                          <p className='text-xs text-gray-500 mb-2 line-clamp-2'>
                            {user.title}
                          </p>
                        </div>

                        {/* Specialty Bubbles (Standardized Height) */}
                        <div className='flex flex-wrap gap-1.5 mb-3 min-h-[2.5rem]'>
                          {user.specialties.slice(0, 2).map((spec, idx) => (
                            <span
                              key={idx}
                              className='text-[10px] px-2.5 py-0.5 bg-slate-50 text-slate-700 rounded-full font-bold border border-slate-200 truncate flex items-center justify-center tracking-wide'
                            >
                              {spec}
                            </span>
                          ))}
                          {user.specialties.length > 2 && (
                            <div className='relative group'>
                              <span className='text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold border border-slate-200 flex items-center justify-center cursor-help transition-colors hover:bg-slate-200'>
                                +{user.specialties.length - 2}
                              </span>
                              
                              {/* Tooltip */}
                              <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 text-center leading-relaxed font-medium pointer-events-none'>
                                {user.specialties.slice(2).join(', ')}
                                <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800'></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-gray-50 rounded-lg'>
                          <div className='text-center px-1 flex flex-col justify-center overflow-hidden'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                              Experience
                            </p>
                            <p className='text-xs font-bold text-gray-900'>
                              {user.yearsExperience || 0}y
                            </p>
                          </div>
                          <div className='text-center px-1 border-l border-r border-gray-200 flex flex-col justify-center'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                              Stars
                            </p>
                            <p className='text-xs font-bold text-gray-900'>
                              {user.rating && user.reviewCount >= 5 ? user.rating : 'New'}
                            </p>
                          </div>
                          <div className='text-center px-1 flex flex-col justify-center'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                              Connections
                            </p>
                            <p className='text-xs font-bold text-gray-900'>
                              {user.connections}
                            </p>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className='flex gap-2 mt-auto'>
                          <motion.button
                            onClick={() => {
                              setSelectedUser(user)
                              setProfilePopupOpen(true)
                            }}
                            className='flex-1 py-2 px-2 border border-gray-200 text-gray-900 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ExternalLink size={14} />
                            View
                          </motion.button>
                          <motion.button
                            onClick={() => handleConnect(user)}
                            className='flex-1 py-2 px-2 bg-[#163146] text-white rounded-lg font-medium text-xs hover:bg-[#0f2a36] transition-colors flex items-center justify-center gap-1'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <UserPlus size={14} />
                            Connect
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2'>
                  <motion.button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='p-2 rounded-lg border border-gray-200'
                  >
                    <ChevronLeft
                      className='w-5 h-5'
                      style={{ color: COLORS.primary }}
                    />
                  </motion.button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <motion.button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
                          currentPage === page
                            ? 'text-white'
                            : 'text-gray-700 border border-gray-200'
                        }`}
                        style={{
                          background:
                            currentPage === page
                              ? COLORS.buttonColor
                              : 'transparent',
                        }}
                      >
                        {page}
                      </motion.button>
                    )
                  )}

                  <motion.button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='p-2 rounded-lg border border-gray-200'
                  >
                    <ChevronRight
                      className='w-5 h-5'
                      style={{ color: COLORS.primary }}
                    />
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Connection Modal */}
        <Dialog
          open={showConnectionModal}
          onOpenChange={setShowConnectionModal}
        >
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Send Connection Request</DialogTitle>
            </DialogHeader>

            <div className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Sending to{' '}
                <span className='font-semibold'>{selectedUser?.name}</span>
              </p>

              <div>
                <label className='block text-sm font-medium text-gray-900 mb-2'>
                  Message (Optional)
                </label>
                <Textarea
                  placeholder='Add a personal message (max 300 characters)'
                  value={connectionMessage}
                  onChange={(e) =>
                    setConnectionMessage(e.target.value.slice(0, 300))
                  }
                  rows={4}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  {connectionMessage.length}/300
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setShowConnectionModal(false)
                  setConnectionMessage('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendConnection}
                style={{ background: COLORS.buttonColor, color: 'white' }}
              >
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Popup - Same as Dashboard */}
        <ProfilePopup
          profile={selectedUser}
          isOpen={profilePopupOpen}
          onClose={() => setProfilePopupOpen(false)}
          currentUserType={userType === 'athlete' ? 'athlete' : 'advisor'}
        />
      </div>
    </>
  )
}

export default function ExplorePage() {
  return (
    <DashboardLayout>
      <ExplorePageContent />
    </DashboardLayout>
  )
}
