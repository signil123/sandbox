// File: client/src/pages/Profile/ProfilePage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit3,
    ExternalLink,
    Eye,
    Globe,
    Linkedin,
    Lock,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    TrendingUp,
    Twitter,
    Upload,
    UserPlus,
    Users,
    X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Toaster, toast } from 'sonner'
import ConnectionsModal from '../../components/Connections/ConnectionsModal'
import { AdvisorRecommendationCard } from '../../components/Dashboard/AdvisorRecommendationCard'
import ProfilePopup from '../../components/Dashboard/ProfilePopup'
import UserPreviewCard from '../../components/Profile/UserPreviewCard'
import { updateProfileImage } from '../../redux/userSlice'
import { connectionService } from '../../services/connectionService'
import { profileService } from '../../services/profileService'
import { getBannerStyle, getImageUrl } from '../../utils/imageUtils'
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
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  // Mobile & Scroll Lock Logic
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const isAnyModalOpen = editModalOpen || preferencesModalOpen || interestsModalOpen || themeModalOpen || previewModalOpen || profilePopupOpen || connectionsModalOpen
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [editModalOpen, preferencesModalOpen, interestsModalOpen, themeModalOpen, previewModalOpen, profilePopupOpen, connectionsModalOpen])

const ProfileSkeleton = () => (
  <div className='mx-auto px-4 py-6 max-w-8xl w-full animate-pulse'>
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
    socialMedia: { linkedin: '', twitter: '', website: '' },
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
  const [advisorPage, setAdvisorPage] = useState(0)
  const advisorsPerPage = 3

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
        setCurrentUserId(user?._id || user?.id || null)

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
          connections: user.totalConnections || 0,
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

        // Refresh connections count from network endpoint
        if (user?._id || user?.id) {
          try {
            const networkResponse = await connectionService.getNetwork(user?._id || user?.id)
            if (networkResponse.data?.status === 'success') {
              const totalConnections = (networkResponse.data.data?.connections || []).length
              setProfileData((prev) => ({ ...prev, connections: totalConnections }))
            }
          } catch (error) {
            console.warn('Error fetching connections count:', error)
          }
        }
      }

      // Fetch advisors
      try {
        const advisorsResponse = await profileService.getRecommendedAdvisors(10)
        if (advisorsResponse.status === 'success') {
          const mappedAdvisors = (advisorsResponse.data.advisors || []).map(u => {
            const userName = u.user?.name || 'Advisor';
            return {
              id: u.user?._id || u.user?.id || u._id,
              name: userName,
              title: u.title || (u.user?.userType ? (u.user.userType.charAt(0).toUpperCase() + u.user.userType.slice(1)) : 'Athlete'),
              location: u.location || 'Remote',
              specialty: u.specialization?.[0] || u.sport || (u.user?.userType ? (u.user.userType.charAt(0).toUpperCase() + u.user.userType.slice(1)) : 'Athlete'),
              specialties: u.specialization || u.specialties || [],
              experience: parseInt(u.experience) || 0,
              connections: 0,
              initials: userName.split(' ').map(n => n[0]).join(''),
              verified: u.verified || false,
              bestMatch: (u.matchScore || u.matchPercentage) > 80,
              matchPercentage: u.matchScore || u.matchPercentage || 0,
              banner: getBannerStyle({
                bannerImage: u?.bannerImage,
                themeId: u?.themeId,
                getThemeById,
              }),
              profileImg: (u.profileImage && !u.profileImage.includes('unsplash.com')) 
                ? getImageUrl(u.profileImage) 
                : (u.photo && !u.photo.includes('unsplash.com'))
                  ? getImageUrl(u.photo)
                  : `https://ui-avatars.com/api/?name=${userName}&background=random`,
              type: u.user?.userType || u.profileType,
              rating: u.ratings?.averageRating || 0,
              reviewCount: u.ratings?.totalReviews || 0,
              about: u.aboutMe || '',
              connectionStatus: u.connectionStatus || 'not_connected',
            };
          })
          setRecommendedAdvisors(mappedAdvisors)
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
      setIsUploadingPhoto(true)
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
      setIsUploadingPhoto(false)
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

  const handleConnect = (user) => {
    setSelectedProfile(user)
    // For now just open the popup, or you could add full connection modal logic
    setProfilePopupOpen(true)
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

  const handleConnectionsCountUpdate = (valueOrUpdater) => {
    setProfileData((prev) => ({
      ...prev,
      connections:
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(prev.connections || 0)
          : valueOrUpdater,
    }))
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
          className='mx-auto px-4 py-6 max-w-8xl w-full'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div variants={itemVariants} className='mb-6'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
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
                className='w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm'
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
                      ? { backgroundImage: `url(${getImageUrl(profileData.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                      : currentTheme.style
                    }
                  >
                    {/* Banner Upload Overlay */}
                    <motion.button 
                      onClick={() => setThemeModalOpen(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className='absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white shadow-lg cursor-pointer hover:bg-white/30 transition-all'
                    >
                      <Edit3 size={14} />
                    </motion.button>
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
                            src={getImageUrl(profileData.photo)}
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
                        <label
                          className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity cursor-pointer ${
                            isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 size={22} className='text-white animate-spin' />
                              <span className='text-[11px] text-white mt-2 font-semibold'>Uploading...</span>
                            </>
                          ) : (
                            <Upload size={20} className='text-white' />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={savingProfile || isUploadingPhoto}
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
                        <div className='flex items-center gap-1.5 mb-1.5'>
                          {profileData.socialMedia?.linkedin && <Linkedin size={14} className='text-slate-400' />}
                          {profileData.socialMedia?.twitter && <Twitter size={14} className='text-slate-400' />}
                          {profileData.socialMedia?.website && <Globe size={14} className='text-slate-400' />}
                          {!profileData.socialMedia?.linkedin && !profileData.socialMedia?.twitter && !profileData.socialMedia?.website && <Globe size={14} className='text-slate-400' />}
                        </div>
                        <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
                          Socials
                        </p>
                        <p className='text-xs text-slate-900 font-medium text-center truncate w-full'>
                          {Object.values(profileData.socialMedia || {}).filter(Boolean).length > 0 ? `${Object.values(profileData.socialMedia || {}).filter(Boolean).length} Links` : 'No links'}
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
                  <div className='relative group'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300'>
                      <AnimatePresence mode='wait'>
                        {(advisors.length > 0 ? advisors : recommendedAdvisors)
                          .slice(advisorPage * advisorsPerPage, (advisorPage + 1) * advisorsPerPage)
                          .map((advisor) => (
                            <motion.div
                              key={advisor.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <AdvisorRecommendationCard 
                                advisor={advisor}
                                onConnect={handleConnect}
                                onView={(a) => {
                                  setSelectedProfile(a)
                                  setProfilePopupOpen(true)
                                }}
                              />
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>

                    {(advisors.length > 0 ? advisors : recommendedAdvisors).length > advisorsPerPage && (
                      <div className='flex justify-center items-center gap-4 mt-8'>
                        <button
                          onClick={() => setAdvisorPage(prev => Math.max(0, prev - 1))}
                          disabled={advisorPage === 0}
                          className={`p-2 rounded-full border transition-all ${
                            advisorPage === 0 
                              ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        <div className='flex gap-1.5'>
                          {Array.from({ length: Math.ceil((advisors.length > 0 ? advisors : recommendedAdvisors).length / advisorsPerPage) }).map((_, i) => (
                            <div 
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === advisorPage ? 'w-6 bg-[#986a41]' : 'w-1.5 bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => setAdvisorPage(prev => Math.min(Math.ceil((advisors.length > 0 ? advisors : recommendedAdvisors).length / advisorsPerPage) - 1, prev + 1))}
                          disabled={advisorPage >= Math.ceil((advisors.length > 0 ? advisors : recommendedAdvisors).length / advisorsPerPage) - 1}
                          className={`p-2 rounded-full border transition-all ${
                            advisorPage >= Math.ceil((advisors.length > 0 ? advisors : recommendedAdvisors).length / advisorsPerPage) - 1
                              ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className='space-y-4'>
              {/* My Network */}
              <motion.div
                variants={itemVariants}
                className='bg-white rounded-2xl border border-slate-200 p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    My Network
                  </h3>
                  <div className='w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
                    <Users size={14} />
                  </div>
                </div>
                <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-xs font-semibold text-slate-700'>
                      {profileData.connections || 0} connections
                    </p>
                    <p className='text-[11px] text-slate-500 mt-1'>
                      See who is in your circle and manage access
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConnectionsModalOpen(true)}
                    className='px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-slate-800 transition-colors'
                  >
                    View
                  </motion.button>
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

      <ConnectionsModal
        isOpen={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        currentUserId={currentUserId}
        title='My Network'
        subtitle='Search, manage, and unfollow your connections'
        onCountUpdate={handleConnectionsCountUpdate}
      />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-2xl w-full md:max-w-sm md:w-full p-6 max-h-[90vh] overflow-y-auto'
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
                    Social Links
                  </label>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='w-16 text-[10px] font-bold text-slate-400 uppercase'>LinkedIn</div>
                      <input
                        type='text'
                        placeholder='LinkedIn URL'
                        value={editFormData.socialMedia?.linkedin || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-16 text-[10px] font-bold text-slate-400 uppercase'>Twitter</div>
                      <input
                        type='text'
                        placeholder='Twitter URL'
                        value={editFormData.socialMedia?.twitter || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              twitter: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-16 text-[10px] font-bold text-slate-400 uppercase'>Website</div>
                      <input
                        type='text'
                        placeholder='Website / Portfolio'
                        value={editFormData.socialMedia?.website || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              website: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                  </div>
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
            className='fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setPreferencesModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-2xl w-full md:max-w-sm md:w-full p-6'
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
            className='fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setInterestsModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-2xl w-full md:max-w-sm md:w-full p-6 max-h-[90vh] overflow-y-auto'
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

      {/* Theme Selection Modal */}
      <AnimatePresence>
        {themeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-[60] flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setThemeModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-[32px] w-full md:max-w-md md:w-full p-8 shadow-2xl relative overflow-hidden'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-xl font-bold text-slate-900'>Choose Your Theme</h2>
                  <p className='text-xs text-slate-500 mt-1'>Personalize your profile aesthetics</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setThemeModalOpen(false)}
                  className='p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors'
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className='grid grid-cols-4 gap-4 mb-8'>
                {themes.map((theme) => (
                  <div key={theme.id} className='relative group'>
                    <motion.button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full aspect-square rounded-2xl transition-all relative overflow-hidden flex items-center justify-center shadow-sm ${
                        selectedThemeId === theme.id 
                          ? 'ring-4 ring-[#986a41] ring-offset-2' 
                          : 'ring-1 ring-slate-100 hover:ring-slate-300'
                      }`}
                    >
                      <div
                        className='absolute inset-0 w-full h-full'
                        style={{ background: theme.style.background || theme.primary }}
                      />
                      {selectedThemeId === theme.id && (
                        <div className='relative z-10 bg-white p-1 rounded-full shadow-lg'>
                          <Check size={14} className='text-[#986a41]' />
                        </div>
                      )}
                    </motion.button>
                    <p className='text-[10px] text-center mt-2 font-medium text-slate-500 line-clamp-1'>
                      {theme.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className='bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4'>
                <div 
                  className='w-12 h-12 rounded-xl shadow-lg shrink-0'
                  style={{ background: currentTheme.style.background || currentTheme.primary }}
                />
                <div className='flex-1'>
                  <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Current Selection</p>
                  <h4 className='text-sm font-bold text-slate-900'>{currentTheme.label}</h4>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setThemeModalOpen(false)}
                  className='px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors'
                >
                  Done
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
            className='fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-[32px] w-full md:max-w-md md:w-full p-8 shadow-2xl relative overflow-hidden'
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
                     ? { backgroundImage: `url(${getImageUrl(profileData.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                     : currentTheme.style,
                   profileImg: profileData.photo 
                     ? getImageUrl(profileData.photo)
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

      <ProfilePopup
        profile={selectedProfile}
        isOpen={profilePopupOpen}
        onClose={() => setProfilePopupOpen(false)}
        currentUserType='athlete'
        onConnect={() => toast.info('Sending connection request from profile...')}
        onMessage={(u) => navigate('/inbox', { state: { recipientId: u.id || u._id } })}
      />
    </DashboardLayout>
  )
}

export default ProfilePage
