// File: client/src/pages/Profile/ProfilePage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Check,
    Edit3,
    ExternalLink,
    Eye,
    Lock,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    TrendingUp,
    Upload,
    UserPlus,
    X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Toaster, toast } from 'sonner'
import UserPreviewCard from '../../components/Profile/UserPreviewCard'
import { updateProfileImage } from '../../redux/userSlice'
import { profileService } from '../../services/profileService'
import DashboardLayout from '../Layout/DashboardLayout'

import { getThemeById, themes } from '../../constants/themes'


const dealSizeOptions = [
  { value: '50k-100k', label: '$50k - $100k' },
  { value: '100k-250k', label: '$100k - $250k' },
  { value: '250k-500k', label: '$250k - $500k' },
  { value: '500k-1m', label: '$500k - $1M' },
  { value: '1m-5m', label: '$1M - $5M' },
  { value: '5m+', label: '$5M+' },
]

const timelineOptions = [
  { value: 'short', label: 'Short-term (< 3 months)' },
  { value: 'medium', label: 'Medium-term (3-6 months)' },
  { value: 'long', label: 'Long-term (6+ months)' },
]

const focusOptions = [
  'Brand Partnerships',
  'Content Creation',
  'Event Appearances',
  'Social Media Growth',
  'Endorsements',
  'Sponsorships',
]

// Interest options with keys matching the backend
const interestOptions = [
  { key: 'brandPartnerships', label: 'Brand Partnerships' },
  { key: 'contentCreation', label: 'Content Creation' },
  { key: 'eventAppearances', label: 'Event Appearances' },
  { key: 'socialMediaGrowth', label: 'Social Media Growth' },
  { key: 'endorsements', label: 'Endorsements' },
  { key: 'sponsorships', label: 'Sponsorships' },
  { key: 'merchandising', label: 'Merchandising' },
  { key: 'charitableWork', label: 'Charitable Work' },
  { key: 'speakingEngagements', label: 'Speaking Engagements' },
  { key: 'mediaTraining', label: 'Media Training' },
]

// Skeleton Component
const AdvisorSkeleton = () => (
  <motion.div className='border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white h-full animate-pulse'>
    <div className='h-32 bg-gradient-to-r from-slate-200 to-slate-100' />
    <div className='px-4 py-4 flex-1 flex flex-col relative'>
      <div className='-mt-12 mb-3 flex-shrink-0 w-fit'>
        <div className='w-16 h-16 rounded-full border-4 border-white bg-slate-200 shadow-md' />
      </div>
      <div className='h-4 bg-slate-200 rounded w-24 mb-2' />
      <div className='h-3 bg-slate-100 rounded w-20 mb-3' />
      <div className='flex flex-wrap gap-1.5 mb-3'>
        <div className='h-6 bg-slate-100 rounded-full w-20' />
        <div className='h-6 bg-slate-100 rounded-full w-24' />
      </div>
      <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-slate-50 rounded-lg'>
        <div className='text-center px-1 min-h-[50px] flex flex-col justify-center'>
          <div className='h-2 bg-slate-200 rounded w-12 mx-auto mb-1' />
          <div className='h-3 bg-slate-200 rounded w-8 mx-auto' />
        </div>
        <div className='text-center px-1 border-l border-r border-slate-200 min-h-[50px] flex flex-col justify-center'>
          <div className='h-2 bg-slate-200 rounded w-10 mx-auto mb-1' />
          <div className='h-3 bg-slate-200 rounded w-6 mx-auto' />
        </div>
        <div className='text-center px-1 min-h-[50px] flex flex-col justify-center'>
          <div className='h-2 bg-slate-200 rounded w-12 mx-auto mb-1' />
          <div className='h-3 bg-slate-200 rounded w-8 mx-auto' />
        </div>
      </div>
      <div className='flex gap-2 mt-auto'>
        <div className='flex-1 h-8 bg-slate-100 rounded-lg' />
        <div className='flex-1 h-8 bg-slate-200 rounded-lg' />
      </div>
    </div>
  </motion.div>
)

const ProfilePage = () => {
  const dispatch = useDispatch()
  // State
  const [selectedThemeId, setSelectedThemeId] = useState('ocean')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false)
  const [interestsModalOpen, setInterestsModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

const ProfileSkeleton = () => (
  <div className='mx-auto px-4 py-6 max-w-7xl w-full animate-pulse'>
    {/* Header Skeleton */}
    <div className='mb-6'>
      <div className='h-8 w-40 bg-slate-200 rounded-lg mb-2' />
      <div className='h-4 w-60 bg-slate-200 rounded-lg' />
    </div>

    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
      {/* Left Content Skeleton */}
      <div className='lg:col-span-2 space-y-6'>
        {/* Profile Card Skeleton */}
        <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden'>
          <div className='h-32 bg-slate-200' />
          <div className='px-6 pb-6'>
            <div className='-mt-16 mb-4 flex flex-col items-center relative z-10'>
              <div className='w-32 h-32 rounded-full border-4 border-white bg-slate-300 mb-4' />
              <div className='h-8 w-48 bg-slate-200 rounded-lg mb-2' />
              <div className='h-4 w-32 bg-slate-200 rounded-lg mb-1' />
              <div className='h-3 w-24 bg-slate-200 rounded-lg' />
            </div>
            <div className='mb-5 pb-5 border-b border-slate-200 space-y-2'>
              <div className='h-3 w-full bg-slate-200 rounded' />
              <div className='h-3 w-5/6 mx-auto bg-slate-200 rounded' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='h-16 bg-slate-100 rounded-xl' />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='bg-white rounded-2xl border border-slate-200 p-4'>
            <div className='h-5 w-32 bg-slate-200 rounded mb-4' />
            <div className='space-y-3'>
              <div className='h-10 w-full bg-slate-100 rounded-lg' />
              <div className='h-10 w-full bg-slate-100 rounded-lg' />
              <div className='h-10 w-full bg-slate-100 rounded-lg' />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingInterests, setSavingInterests] = useState(false)
  const [error, setError] = useState(null)

  const currentTheme = getThemeById(selectedThemeId)
  const primaryColor = currentTheme.primary
  const accentColor = currentTheme.accent

  // Profile data
  const [profileData, setProfileData] = useState({
    name: '',
    photo: null,
    school: '',
    sport: '',
    position: '',
    classYear: '',
    aboutMe: '',
    email: '',
    phone: '',
    socialMedia: { instagram: '', twitter: '', tiktok: '' },
    contactVisible: true,
  })

  const [editFormData, setEditFormData] = useState(profileData)

  // Preferences
  const [preferences, setPreferences] = useState({
    dealSize: '250k-500k',
    timeline: 'medium',
    focus: ['Brand Partnerships', 'Content Creation'],
  })

  // Interests (toggleable)
  const [interests, setInterests] = useState({
    brandPartnerships: false,
    contentCreation: false,
    eventAppearances: false,
    socialMediaGrowth: false,
    endorsements: false,
    sponsorships: false,
    merchandising: false,
    charitableWork: false,
    speakingEngagements: false,
    mediaTraining: false,
  })

  // Advisors
  const [advisors, setAdvisors] = useState([])
  const [recommendedAdvisors, setRecommendedAdvisors] = useState([])
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [missingFields, setMissingFields] = useState([])

  // Fetch profile on mount
  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      // Use the bundle endpoint for efficient single request
      const bundleResponse = await profileService.getAthleteProfileBundle()

      if (bundleResponse.status === 'success' && bundleResponse.data) {
        const {
          user,
          profile,
          interests: profileInterests,
          nilPreferences,
          completion,
        } = bundleResponse.data

        const profileInfo = {
          name: profile.user?.name || user.name || '',
          photo: (profile.profileImage && !profile.profileImage.includes('unsplash.com')) 
            ? profile.profileImage 
            : (profile.photo && !profile.photo.includes('unsplash.com')) 
              ? profile.photo 
              : null,
          school: profile.school || '',
          sport: profile.sport || '',
          position: profile.position || '',
          classYear: profile.classYear || '',
          aboutMe: profile.aboutMe || '',
          email: user.email || '',
          phone: user.phone || '',
          socialMedia: profile.socialMedia || {
            instagram: '',
            twitter: '',
            tiktok: '',
          },
          contactVisible: profile.contactVisible !== false,
          banner: profile.bannerImage || null,
        }

        setProfileData(profileInfo)
        setEditFormData(profileInfo)

        // Set interests
        if (profileInterests) {
          setInterests(profileInterests)
        }

        // Set NIL preferences
        if (nilPreferences) {
          setPreferences({
            dealSize: nilPreferences.dealSize || '250k-500k',
            timeline: nilPreferences.timeline || 'medium',
            focus: nilPreferences.focusAreas || [
              'Brand Partnerships',
              'Content Creation',
            ],
          })
        }

        // Set completion
        if (completion) {
          setProfileCompletion(completion.percentage || 0)
          setMissingFields(completion.missingFields || [])
        }

        // Set theme
        if (profile.themeId) {
          setSelectedThemeId(profile.themeId)
        } else if (profile.themeColor) {
           // Fallback for old themes
           const oldThemeMap = {
             'Ocean': 'ocean',
             'Sunset': 'sunset',
             'Forest': 'emerald',
             'Berry': 'lavender',
             'Gold': 'sunset'
           }
           setSelectedThemeId(oldThemeMap[profile.themeColor] || 'ocean')
        }
      }

      // Fetch advisors
      try {
        const advisorsResponse = await profileService.getRecommendedAdvisors(10)
        if (advisorsResponse.status === 'success') {
          setRecommendedAdvisors(advisorsResponse.data.advisors || [])
        }
      } catch (err) {
        console.warn('Error fetching advisors:', err)
      }

      setError(null)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err.message || 'Failed to load profile')
      toast.error(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = async () => {
    try {
      setSavingProfile(true)

      const response = await profileService.updateAthleteProfile({
        name: editFormData.name,
        photo: editFormData.photo,
        school: editFormData.school,
        sport: editFormData.sport,
        position: editFormData.position,
        classYear: editFormData.classYear,
        aboutMe: editFormData.aboutMe,
        email: editFormData.email,
        phone: editFormData.phone,
        socialMedia: editFormData.socialMedia,
      })

      if (response.status === 'success') {
        setProfileData(editFormData)
        setEditModalOpen(false)
        toast.success('Profile updated successfully!')
        fetchProfileData()
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true)

      const response = await profileService.updateNILPreferences({
        dealSize: preferences.dealSize,
        timeline: preferences.timeline,
        focusAreas: preferences.focus,
      })

      if (response.status === 'success') {
        setPreferencesModalOpen(false)
        toast.success('Preferences updated successfully!')
        fetchProfileData()
      }
    } catch (err) {
      console.error('Error updating preferences:', err)
      toast.error(err.message || 'Failed to update preferences')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleSaveInterests = async () => {
    try {
      setSavingInterests(true)

      const response = await profileService.updateAthleteInterests(interests)

      if (response.status === 'success') {
        setInterestsModalOpen(false)
        toast.success('Interests updated successfully!')
        fetchProfileData()
      }
    } catch (err) {
      console.error('Error updating interests:', err)
      toast.error(err.message || 'Failed to update interests')
    } finally {
      setSavingInterests(false)
    }
  }

  const handleToggleInterest = (key) => {
    setInterests((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setSavingProfile(true)
      const uploadResponse = await profileService.uploadFile(file)
      
      if (uploadResponse?.url) {
        const photoUrl = uploadResponse.url
        await profileService.updateBasicProfile({
          profileImage: photoUrl
        })
        
        setProfileData(prev => ({ ...prev, photo: photoUrl }))
        dispatch(updateProfileImage(photoUrl))
        toast.success('Profile photo updated successfully!')
      }
    } catch (err) {
      console.error('Photo upload failed:', err)
      toast.error('Failed to upload profile photo')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setSavingProfile(true)
      const uploadResponse = await profileService.uploadFile(file)
      
      if (uploadResponse?.url) {
        const url = uploadResponse.url
        await profileService.updateBasicProfile({
          bannerImage: url
        })
        
        setProfileData(prev => ({ ...prev, banner: url }))
        toast.success('Cover photo updated successfully!')
      }
    } catch (err) {
      console.error('Banner upload failed:', err)
      toast.error('Failed to upload cover photo')
    } finally {
      setSavingProfile(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleThemeChange = async (themeId) => {
    try {
      setSelectedThemeId(themeId)
      const theme = getThemeById(themeId)

      await profileService.updateBasicProfile({
        themeId: themeId,
        themeColor: theme.label, // Keep for backward compat if needed
      })

      toast.success(`Theme changed to ${theme.label}!`)
    } catch (err) {
      console.error('Error saving theme:', err)
      toast.error('Failed to save theme preference')
    }
  }

  const handleConnectAdvisor = (advisorId) => {
    const advisor = recommendedAdvisors.find((a) => a._id === advisorId)
    if (advisor) {
      setAdvisors([...advisors, advisor])
      setRecommendedAdvisors(
        recommendedAdvisors.filter((a) => a._id !== advisorId)
      )
    }
  }

  const getActiveInterestsCount = () => {
    return Object.values(interests).filter(Boolean).length
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster position='bottom-right' theme='dark' />

      <div className='w-full h-full max-w-8xl mx-auto flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen'>
        <motion.div
          className='mx-auto px-4 py-6 max-w-7xl w-full'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div variants={itemVariants} className='mb-6'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
                  Your Profile
                </h1>
                <p className='text-xs text-slate-600 mt-1'>
                  Complete your profile to unlock opportunities
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreviewModalOpen(true)}
                className='flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm'
              >
                <Eye size={16} />
                <span>View As</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            {/* Left Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Profile Card */}
              <motion.div variants={itemVariants}>
                <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden'>
                  {/* Hero */}
                  <div
                    className='h-32 relative z-0 group/banner overflow-hidden'
                    style={profileData.banner 
                      ? { backgroundImage: `url(${profileData.banner.startsWith('http') ? profileData.banner : `${import.meta.env.VITE_API_URL.replace('/api', '')}${profileData.banner}`})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                      : currentTheme.style
                    }
                  >
                    {/* Banner Upload Overlay */}
                    <label className='absolute inset-0 bg-black/20 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10'>
                      <div className='flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white'>
                        <Upload size={14} />
                        <span className='text-[10px] font-bold uppercase tracking-wider'>Change Cover</span>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={savingProfile}
                      />
                    </label>
                    <div className='absolute inset-0 opacity-10'>
                       {/* Optional overlay texture if needed */}
                    </div>
                  </div>

                  {/* Content */}
                  <div className='px-6 pb-6'>
                    {/* Profile Header */}
                    <div className='-mt-16 mb-4 flex flex-col items-center text-center relative z-10'>
                      <motion.div
                        className='w-32 h-32 rounded-full border-4 border-white flex-shrink-0 shadow-lg overflow-hidden mb-4 relative group bg-white/10 backdrop-blur-sm'
                        whileHover={{ scale: 1.02 }}
                      >
                        {profileData.photo ? (
                          <img
                            src={profileData.photo.startsWith('http') ? profileData.photo : `${import.meta.env.VITE_API_URL.replace('/api', '')}${profileData.photo}`}
                            alt={profileData.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div 
                            className='w-full h-full flex items-center justify-center text-white font-bold text-3xl shadow-inner'
                            style={{ background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent || currentTheme.primary} 100%)` }}
                          >
                            {getInitials(profileData.name)}
                          </div>
                        )}
                        
                        {/* Upload Overlay */}
                        <label className='absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                          <Upload size={24} className='text-white mb-1' />
                          <span className='text-[10px] font-bold text-white uppercase tracking-wider'>Change</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={savingProfile}
                          />
                        </label>
                      </motion.div>

                      <div className='mb-3'>
                        <div className='flex items-center justify-center gap-2'>
                          <h2 className='text-2xl font-bold text-slate-900'>
                            {profileData.name || 'Your Name'}
                          </h2>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setEditFormData(profileData)
                              setEditModalOpen(true)
                            }}
                            className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                          >
                            <Edit3 size={14} className='text-slate-600' />
                          </motion.button>
                        </div>

                        <div className='mt-2 space-y-1'>
                          <p className='text-sm font-semibold text-slate-700'>
                            {profileData.position || 'Position'} •{' '}
                            {profileData.sport || 'Sport'}
                          </p>
                          <p className='text-xs text-slate-500'>
                            {profileData.school || 'School'} •{' '}
                            {profileData.classYear || 'Class'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* About */}
                    <div className='mb-5 pb-5 border-b border-slate-200'>
                      <p className='text-sm text-slate-600 leading-relaxed text-center'>
                        {profileData.aboutMe ||
                          'Add a bio to tell others about yourself'}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className='grid grid-cols-2 gap-4 mb-5'>
                      <div className='flex flex-col items-center p-3 bg-slate-50 rounded-xl'>
                        <Mail size={16} className='text-slate-400 mb-1.5' />
                        <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
                          Email
                        </p>
                        <p className='text-xs text-slate-900 font-medium text-center truncate w-full'>
                          {profileData.email || 'email@example.com'}
                        </p>
                      </div>
                      <div className='flex flex-col items-center p-3 bg-slate-50 rounded-xl'>
                        <Phone size={16} className='text-slate-400 mb-1.5' />
                        <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
                          Phone
                        </p>
                        <p className='text-xs text-slate-900 font-medium text-center'>
                          {profileData.phone || '+1 (555) 000-0000'}
                        </p>
                      </div>
                      <div className='flex flex-col items-center p-3 bg-slate-50 rounded-xl'>
                        <MapPin size={16} className='text-slate-400 mb-1.5' />
                        <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
                          School
                        </p>
                        <p className='text-xs text-slate-900 font-medium text-center truncate w-full'>
                          {profileData.school || 'University'}
                        </p>
                      </div>
                      <div className='flex flex-col items-center p-3 bg-slate-50 rounded-xl'>
                        <Mail size={16} className='text-slate-400 mb-1.5' />
                        <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
                          Social
                        </p>
                        <p className='text-xs text-slate-900 font-medium text-center truncate w-full'>
                          {profileData.socialMedia?.instagram || '@handle'}
                        </p>
                      </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div className='pt-4 border-t border-slate-200 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Lock size={14} className='text-slate-400' />
                        <span className='text-xs font-medium text-slate-600'>
                          Contact visibility
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setProfileData({
                            ...profileData,
                            contactVisible: !profileData.contactVisible,
                          })
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          profileData.contactVisible
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        <motion.span
                          className='inline-block h-3.5 w-3.5 transform rounded-full bg-white'
                          animate={{
                            x: profileData.contactVisible ? 16 : 2,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 40,
                          }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Interests Section */}
              <motion.div variants={itemVariants}>
                <div className='bg-white rounded-2xl border border-slate-200 p-5'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h3 className='text-lg font-bold text-slate-900'>
                        Your Interests
                      </h3>
                      <p className='text-xs text-slate-500 mt-0.5'>
                        {getActiveInterestsCount()} interests selected
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setInterestsModalOpen(true)}
                      className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                    >
                      <Edit3 size={14} className='text-slate-600' />
                    </motion.button>
                  </div>

                  {getActiveInterestsCount() === 0 ? (
                    <div className='text-center py-6 border border-dashed border-slate-200 rounded-xl'>
                      <p className='text-sm text-slate-500 mb-2'>
                        No interests selected
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInterestsModalOpen(true)}
                        className='text-xs font-medium text-slate-700 flex items-center gap-1 mx-auto'
                      >
                        <Plus size={14} />
                        Add interests
                      </motion.button>
                    </div>
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {interestOptions
                        .filter((opt) => interests[opt.key])
                        .map((opt) => (
                          <span
                            key={opt.key}
                            className='px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5'
                          >
                            <Check size={12} className='text-[#986a41]' />
                            {opt.label}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Advisors Section */}
              <motion.div variants={itemVariants}>
                <div className='mb-4'>
                  <h2 className='text-lg font-bold text-slate-900'>
                    {advisors.length > 0
                      ? 'Your Advisors'
                      : 'Recommended Advisors'}
                  </h2>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Connect with experts to grow your NIL opportunities
                  </p>
                </div>

                {loading ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {[1, 2, 3, 4].map((i) => (
                      <AdvisorSkeleton key={i} />
                    ))}
                  </div>
                ) : advisors.length === 0 &&
                  recommendedAdvisors.length === 0 ? (
                  <div className='border border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50'>
                    <div className='flex justify-center mb-3'>
                      <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center'>
                        <UserPlus size={24} className='text-slate-400' />
                      </div>
                    </div>
                    <p className='text-slate-600 font-medium mb-1'>
                      No advisors available
                    </p>
                    <p className='text-xs text-slate-500'>
                      Check back soon for recommended advisors in your area
                    </p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(advisors.length > 0 ? advisors : recommendedAdvisors)
                      .slice(0, 6)
                      .map((advisor) => (
                        <motion.div
                          key={advisor._id || advisor.id}
                          variants={itemVariants}
                          whileHover={{ y: -2 }}
                          className='border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white h-full'
                        >
                          <div
                            className='h-32 relative'
                            style={{
                              background: `linear-gradient(135deg, #163146 0%, #1e90ff 100%)`,
                            }}
                          >
                            {advisor.matchScore > 0 && (
                              <motion.div
                                className={`absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm overflow-hidden border ${
                                  advisor.matchScore >= 80 ? 'text-emerald-700 border-emerald-100' :
                                  advisor.matchScore >= 50 ? 'text-amber-700 border-amber-100' :
                                  'text-slate-700 border-slate-100'
                                }`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                              >
                                <TrendingUp size={12} className={
                                  advisor.matchScore >= 80 ? 'text-emerald-500' :
                                  advisor.matchScore >= 50 ? 'text-amber-500' :
                                  'text-slate-400'
                                } />
                                <span>{advisor.matchScore >= 90 ? 'Best Match' : `${advisor.matchScore}% Match`}</span>
                              </motion.div>
                            )}
                          </div>

                          <div className='px-4 py-4 flex-1 flex flex-col relative'>
                            <div className='-mt-12 mb-3 flex-shrink-0 w-fit relative z-10'>
                              {advisor.photo || advisor.profileImage ? (
                                <img
                                  src={
                                    (advisor.photo || advisor.profileImage).startsWith('http') 
                                      ? (advisor.photo || advisor.profileImage) 
                                      : `${import.meta.env.VITE_API_URL.replace('/api', '')}${advisor.photo || advisor.profileImage}`
                                  }
                                  alt={advisor.user?.name || 'Advisor'}
                                  className='w-16 h-16 rounded-full border-2 border-white object-cover shadow-md bg-white'
                                />
                              ) : (
                                <div 
                                  className='w-16 h-16 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xl shadow-md'
                                  style={{ background: `linear-gradient(135deg, #163146 0%, #1e90ff 100%)` }}
                                >
                                  {getInitials(advisor.user?.name)}
                                </div>
                              )}
                            </div>

                            {/* Name and Title Container (Standardized Height) */}
                            <div className='min-h-[3.5rem]'>
                              <p className='font-bold text-gray-900 text-sm line-clamp-1'>
                                {advisor.user?.name || 'Advisor Name'}
                              </p>
                              <p className='text-xs text-gray-500 mb-2 line-clamp-2'>
                                {advisor.title || 'Professional'}
                              </p>
                            </div>

                            {/* Specialty Bubbles (Standardized Height) */}
                            <div className='flex flex-wrap gap-1.5 mb-3 min-h-[2.5rem]'>
                              {(advisor.specialties || [])
                                .slice(0, 2)
                                .map((spec, idx) => (
                                  <span
                                    key={idx}
                                    className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium truncate'
                                  >
                                    {spec}
                                  </span>
                                ))}
                              {(advisor.specialties || []).length > 2 && (
                                <span className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium'>
                                  +{(advisor.specialties || []).length - 2}
                                </span>
                              )}
                            </div>

                            {/* Stats Grid */}
                            <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-gray-50 rounded-lg'>
                              <div className='text-center px-1 flex flex-col justify-center overflow-hidden'>
                                <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                                  Experience
                                </p>
                                <p className='text-xs font-bold text-gray-900'>
                                  {advisor.experience || 0}y
                                </p>
                              </div>
                              <div className='text-center px-1 border-l border-r border-gray-200 flex flex-col justify-center overflow-hidden'>
                                <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                                  {advisor.specialization?.[0] || 'Advisor'}
                                </p>
                                <p className='text-xs font-bold text-gray-900'>
                                  Pro
                                </p>
                              </div>
                              <div className='text-center px-1 flex flex-col justify-center'>
                                <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                                  Connections
                                </p>
                                <p className='text-xs font-bold text-gray-900'>
                                  {advisor.connections || 0}
                                </p>
                              </div>
                            </div>

                            {/* Buttons */}
                            <div className='flex gap-2 mt-auto'>
                              <motion.button
                                onClick={() => {
                                  setSelectedProfile(advisor)
                                  setProfilePopupOpen(true)
                                }}
                                className='flex-1 py-2 px-2 border border-gray-200 text-gray-900 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1'
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <ExternalLink size={14} />
                                View
                              </motion.button>
                              
                              {!(advisors || []).find((a) => a._id === (advisor._id || advisor.userId)) ? (
                                <motion.button
                                  onClick={() => handleConnectAdvisor(advisor._id || advisor.userId)}
                                  className='flex-1 py-2 px-2 bg-[#163146] text-white rounded-lg font-medium text-xs hover:bg-[#0f2a36] transition-colors flex items-center justify-center gap-1'
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <UserPlus size={14} />
                                  Connect
                                </motion.button>
                              ) : (
                                <motion.button
                                  className='flex-1 py-2 px-2 bg-[#986a41] text-white rounded-lg font-medium text-xs hover:bg-[#855c36] transition-colors flex items-center justify-center gap-1'
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <MessageSquare size={14} />
                                  Chat
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className='space-y-4'>
              {/* Theme Selector */}
              <motion.div
                variants={itemVariants}
                className='bg-white rounded-2xl border border-slate-200 p-4'
              >
                <h3 className='text-sm font-semibold text-slate-900 mb-3'>
                  Theme
                </h3>
                <div className='space-y-2'>
                  {themes.map((theme) => (
                    <motion.button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className='w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all'
                      style={{
                        border: `0.5px solid ${
                          selectedThemeId === theme.id ? '#0f172a' : '#cbd5e1'
                        }`,
                        backgroundColor:
                          selectedThemeId === theme.id
                            ? '#f1f5f9'
                            : 'transparent',
                      }}
                    >
                      <div
                        className='w-4 h-4 rounded-full shadow-sm'
                        style={{ background: theme.style.background || theme.primary }}
                      ></div>
                      <span className='text-xs font-medium text-slate-900'>
                        {theme.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* NIL Preferences */}
              <motion.div
                variants={itemVariants}
                className='bg-white rounded-2xl border border-slate-200 p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    NIL Preferences
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setPreferencesModalOpen(true)}
                    className='p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                  >
                    <Edit3 size={12} className='text-slate-600' />
                  </motion.button>
                </div>

                <div className='space-y-3'>
                  <div className='p-3 bg-slate-50 rounded-lg'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                      Deal Size
                    </p>
                    <p className='text-sm font-bold text-slate-900'>
                      {dealSizeOptions.find(
                        (opt) => opt.value === preferences.dealSize
                      )?.label || preferences.dealSize}
                    </p>
                  </div>
                  <div className='p-3 bg-slate-50 rounded-lg'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                      Timeline
                    </p>
                    <p className='text-sm font-semibold text-slate-900'>
                      {timelineOptions.find(
                        (opt) => opt.value === preferences.timeline
                      )?.label || preferences.timeline}
                    </p>
                  </div>
                  <div className='p-3 bg-slate-50 rounded-lg'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                      Focus Areas
                    </p>
                    <div className='flex flex-wrap gap-1.5'>
                      {preferences.focus.map((item) => (
                        <span
                          key={item}
                          className='px-2 py-1 rounded-lg bg-slate-200 text-xs font-medium text-slate-700'
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Profile Strength */}
              <motion.div
                variants={itemVariants}
                className='bg-white rounded-2xl border border-slate-200 p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <h3 className='text-sm font-semibold text-slate-900'>
                      Profile Strength
                    </h3>
                    <p className='text-xs text-slate-500 mt-0.5'>
                      {profileCompletion}% complete
                    </p>
                  </div>
                  <div className='flex items-baseline gap-0.5'>
                    <span className='text-2xl font-bold text-slate-900'>
                      {profileCompletion}
                    </span>
                    <span className='text-xs text-slate-400'>%</span>
                  </div>
                </div>
                <div className='relative h-2 bg-slate-100 rounded-full overflow-hidden mb-3'>
                  <motion.div
                    className='h-full rounded-full'
                    style={{
                      backgroundColor:
                        profileCompletion >= 80
                          ? '#10b981'
                          : profileCompletion >= 50
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                {missingFields.length > 0 && (
                  <div className='text-xs text-slate-500'>
                    <p className='font-medium mb-1'>
                      Complete these to improve:
                    </p>
                    <ul className='space-y-0.5'>
                      {missingFields.slice(0, 3).map((field) => (
                        <li
                          key={field.field}
                          className='flex items-center gap-1'
                        >
                          <span className='w-1 h-1 rounded-full bg-slate-400' />
                          {field.label}
                        </li>
                      ))}
                      {missingFields.length > 3 && (
                        <li className='text-slate-400'>
                          +{missingFields.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className='bg-white rounded-2xl border border-slate-200 p-4'
              >
                <h3 className='text-sm font-semibold text-slate-900 mb-3'>
                  Profile Stats
                </h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-slate-600'>
                      Profile Views
                    </span>
                    <span className='text-sm font-semibold text-slate-900'>
                      1,240
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-slate-600'>
                      Advisor Inquiries
                    </span>
                    <span className='text-sm font-semibold text-slate-900'>
                      8
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-slate-600'>
                      Connected Advisors
                    </span>
                    <span className='text-sm font-semibold text-slate-900'>
                      {advisors.length}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-slate-600'>
                      Active Interests
                    </span>
                    <span className='text-sm font-semibold text-slate-900'>
                      {getActiveInterestsCount()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto'
            >
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-slate-900'>
                  Edit Profile
                </h2>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setEditModalOpen(false)}
                  className='p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                >
                  <X size={16} className='text-slate-600' />
                </motion.button>
              </div>

              <div className='space-y-3 mb-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    placeholder='Your name'
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      School
                    </label>
                    <input
                      type='text'
                      placeholder='University'
                      value={editFormData.school}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          school: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      Sport
                    </label>
                    <input
                      type='text'
                      placeholder='Sport'
                      value={editFormData.sport}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          sport: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      Position
                    </label>
                    <input
                      type='text'
                      placeholder='Position'
                      value={editFormData.position}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          position: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      Class Year
                    </label>
                    <input
                      type='text'
                      placeholder='Sophomore'
                      value={editFormData.classYear}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          classYear: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Email
                  </label>
                  <input
                    type='email'
                    placeholder='Email'
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Phone
                  </label>
                  <input
                    type='tel'
                    placeholder='Phone'
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    About You
                  </label>
                  <textarea
                    placeholder='Tell us about yourself'
                    value={editFormData.aboutMe}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        aboutMe: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 resize-none transition'
                    rows='3'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Instagram Handle
                  </label>
                  <input
                    type='text'
                    placeholder='@username'
                    value={editFormData.socialMedia?.instagram || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        socialMedia: {
                          ...editFormData.socialMedia,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>
              </div>

              <div className='flex gap-2'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditProfile}
                  disabled={savingProfile}
                  className='flex-1 py-2 rounded-lg font-semibold text-xs text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50'
                >
                  {savingProfile ? 'Saving...' : 'Save'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditModalOpen(false)}
                  className='flex-1 py-2 rounded-lg font-semibold text-xs border border-slate-300 text-slate-900 hover:bg-slate-50 transition'
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {preferencesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setPreferencesModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl max-w-sm w-full p-6'
            >
              <div className='flex items-center justify-between mb-5'>
                <h2 className='text-lg font-bold text-slate-900'>
                  NIL Preferences
                </h2>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setPreferencesModalOpen(false)}
                  className='p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                >
                  <X size={16} className='text-slate-600' />
                </motion.button>
              </div>

              <div className='space-y-5 mb-6'>
                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-2'>
                    Deal Size
                  </label>
                  <select
                    value={preferences.dealSize}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        dealSize: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition bg-white'
                  >
                    {dealSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-2'>
                    Preferred Timeline
                  </label>
                  <select
                    value={preferences.timeline}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        timeline: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition bg-white'
                  >
                    {timelineOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-3'>
                    Focus Areas
                  </label>
                  <div className='space-y-2'>
                    {focusOptions.map((option) => (
                      <div key={option} className='flex items-center'>
                        <input
                          type='checkbox'
                          id={option}
                          checked={preferences.focus.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferences({
                                ...preferences,
                                focus: [...preferences.focus, option],
                              })
                            } else {
                              setPreferences({
                                ...preferences,
                                focus: preferences.focus.filter(
                                  (f) => f !== option
                                ),
                              })
                            }
                          }}
                          className='w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer'
                        />
                        <label
                          htmlFor={option}
                          className='ml-2.5 text-sm text-slate-700 cursor-pointer'
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className='flex-1 py-2.5 rounded-lg font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50'
                >
                  {savingPreferences ? 'Saving...' : 'Save'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPreferencesModalOpen(false)}
                  className='flex-1 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-900 hover:bg-slate-50 transition'
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interests Modal */}
      <AnimatePresence>
        {interestsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setInterestsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto'
            >
              <div className='flex items-center justify-between mb-5'>
                <div>
                  <h2 className='text-lg font-bold text-slate-900'>
                    Your Interests
                  </h2>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Toggle the areas you're interested in
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setInterestsModalOpen(false)}
                  className='p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                >
                  <X size={16} className='text-slate-600' />
                </motion.button>
              </div>

              <div className='space-y-2 mb-6'>
                {interestOptions.map((option) => (
                  <motion.button
                    key={option.key}
                    onClick={() => handleToggleInterest(option.key)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      interests[option.key]
                        ? 'border-[#163146] bg-[#163146]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        interests[option.key]
                          ? 'text-[#163146]'
                          : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        interests[option.key] ? 'bg-[#163146]' : 'bg-slate-200'
                      }`}
                    >
                      {interests[option.key] && (
                        <Check size={12} className='text-white' />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className='flex gap-2'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveInterests}
                  disabled={savingInterests}
                  className='flex-1 py-2.5 rounded-lg font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50'
                >
                  {savingInterests ? 'Saving...' : 'Save'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInterestsModalOpen(false)}
                  className='flex-1 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-900 hover:bg-slate-50 transition'
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden'
            >
               {/* Close button */}
               <button
                  onClick={() => setPreviewModalOpen(false)}
                  className='absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors'
               >
                  <X size={20} />
               </button>

               <div className="mb-6 text-center">
                 <h2 className='text-xl font-bold text-gray-900'>Profile Preview</h2>
                 <p className='text-sm text-gray-500'>This is how your card appears to others on the dashboard</p>
               </div>

               <UserPreviewCard 
                 userData={{
                   name: profileData.name,
                   title: profileData.position ? `${profileData.position} • ${profileData.sport}` : (profileData.sport || 'Athlete'),
                   location: profileData.school || 'Remote',
                   specialties: interestOptions
                     .filter((opt) => interests[opt.key])
                     .map(opt => opt.label),
                   experience: 0,
                   specialty: profileData.sport || 'Athlete',
                   connections: 0,
                   banner: profileData.banner 
                     ? { backgroundImage: `url(${profileData.banner.startsWith('http') ? profileData.banner : `${import.meta.env.VITE_API_URL.replace('/api', '')}${profileData.banner}`})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                     : currentTheme.style,
                   profileImg: profileData.photo 
                     ? (profileData.photo.startsWith('http') ? profileData.photo : `${import.meta.env.VITE_API_URL.replace('/api', '')}${profileData.photo}`)
                     : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=random`,
                   matchPercentage: 98
                 }}
               />

               <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreviewModalOpen(false)}
                className='w-full mt-8 py-3 bg-[#163146] text-white font-bold rounded-xl hover:bg-[#0f2332] transition-all shadow-lg shadow-[#163146]/20'
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

export default ProfilePage
