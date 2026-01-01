// File: client/src/pages/Dashboard/DashboardPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    LineChart,
    MessageSquare,
    Newspaper,
    PenLine,
    Plus,
    Search,
    Send,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    CartesianGrid,
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { toast } from 'sonner'

import { AdvisorRoster, CurrentAdvisors } from '../../components/Dashboard/NetworkWidgets'
import ProfilePopup from '../../components/Dashboard/ProfilePopup'
import { Button } from '../../components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import SkeletonCard from '../../components/ui/SkeletonCard'
import { Textarea } from '../../components/ui/textarea'
import { getThemeById, themes } from '../../constants/themes'
import { fetchUserNetwork, selectCurrentUser } from '../../redux/userSlice'
import { connectionService } from '../../services/connectionService'
import { exploreService } from '../../services/exploreService'
import DashboardLayout from '../Layout/DashboardLayout'

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
    // If it's already a gradient or URL, return as is
    if (profile.bannerImage.startsWith('linear-gradient') || 
        profile.bannerImage.startsWith('radial-gradient') ||
        profile.bannerImage.startsWith('url')) {
      return { background: profile.bannerImage }
    }
    
    // If it's a file path, wrap in url()
    if (profile.bannerImage.startsWith('/') || profile.bannerImage.includes('uploads')) {
      const url = getImageUrl(profile.bannerImage)
      return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    
    // Check if it's a theme ID
    const theme = getThemeById(profile.bannerImage)
    if (theme?.style) return theme.style
    
    // Fallback: treat as a color/path and let CSS handle it
    return { background: profile.bannerImage }
  }
  
  // Fallback to themeId if bannerImage is not set
  if (profile?.themeId) {
    const theme = getThemeById(profile.themeId)
    if (theme?.style) return theme.style
  }
  
  return { background: 'linear-gradient(135deg, #163146 0%, #986a41 100%)' }
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const network = useSelector(state => state.user.network) || { advisors: [], roster: [], loading: false }
  const [showStats, setShowStats] = useState(true)
  const [timeRange, setTimeRange] = useState('1M')
  const [advisorCarouselIndex, setAdvisorCarouselIndex] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [addNoteMode, setAddNoteMode] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [advisorsListData, setAdvisorsListData] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(true)

  // Reset carousel index when data changes
  useEffect(() => {
    setAdvisorCarouselIndex(0)
  }, [advisorsListData.length])

  // Mapping of stat card labels to their routes
  const insightRoutes = {
    'Profile Views': '/profile/athlete',
    'New Messages': '/inbox',
    'Upcoming Events': '/calendar',
    'Connected Advisors': '/profile/athlete',
  }

  // Get current date and time
  const today = new Date()
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' })
  // Motivational quotes
  const quotes = [
    'Your potential has no limits. Keep pushing!',
    'Success is a journey, not a destination.',
    'Every connection brings you closer to your goals.',
    'Champion mindset starts with belief in yourself.',
    'Growth happens when you step outside your comfort zone.',
  ]
  const dailyQuote = useMemo(() => {
    return quotes[today.getDate() % quotes.length]
  }, [today])
  // Key Insights Data
  const keyInsights = [
    {
      label: 'Profile Views',
      value: '2,451',
      trend: '+12%',
      icon: Eye,
    },
    {
      label: 'New Messages',
      value: '18',
      trend: '+5%',
      icon: MessageSquare,
    },
    {
      label: 'Upcoming Events',
      value: '7',
      trend: '+2',
      icon: Calendar,
    },
    {
      label: 'Connected Advisors',
      value: '12',
      trend: '+3',
      icon: Users,
    },
  ]
  // Recommended Advisors logic
  const fetchRecommendations = useCallback(async () => {
    if (!currentUser?._id) return
    setLoadingAdvisors(true)
    try {
      const response = await exploreService.getRecommendations(currentUser._id)
      if (response.data.status === 'success') {
        const mappedAdvisors = response.data.data.recommendations.map(u => ({
          id: u.userId,
          name: u.name,
          title: u.profile?.title || (u.userType === 'advisor' ? 'Advisor' : 'Agent'),
          location: u.profile?.location || 'Remote',
          specialty: u.profile?.specialization?.[0] || (u.userType === 'advisor' ? 'Advisor' : 'Agent'),
          specialties: u.profile?.specialization || u.profile?.specialties || [],
          experience: parseInt(u.profile?.experience) || 0,
          connections: 0,
          initials: u.name.split(' ').map(n => n[0]).join(''),
          verified: u.profile?.verified || false,
          bestMatch: u.matchScore > 80,
          matchPercentage: u.matchScore,
          banner: getBannerStyle(u.profile),
          profileImg: (u.profile?.profileImage && !u.profile.profileImage.includes('unsplash.com')) 
            ? getImageUrl(u.profile.profileImage) 
            : (u.profile?.photo && !u.profile.photo.includes('unsplash.com'))
              ? getImageUrl(u.profile.photo)
              : `https://ui-avatars.com/api/?name=${u.name}&background=random`,
          type: u.userType,
          rating: u.ratings?.averageRating || 0,
          reviewCount: u.ratings?.totalReviews || 0,
          about: u.aboutMe || '',
          certifications: u.profile?.certifications || [],
          expertise: u.specialization || [],
          connectionStatus: u.connectionStatus || 'not_connected',
        }))
        setAdvisorsListData(mappedAdvisors)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoadingAdvisors(false)
    }
  }, [currentUser?._id])

  useEffect(() => {
    fetchRecommendations()
    if (currentUser?._id && currentUser?.userType) {
      dispatch(fetchUserNetwork({ userId: currentUser._id, userType: currentUser.userType }))
    }
  }, [fetchRecommendations, currentUser, dispatch])

  const advisors = advisorsListData
  // Upcoming Events
  const upcomingEvents = [
    {
      id: 1,
      title: 'NIL Strategy Workshop',
      date: 'Jan 25, 2025',
      time: '2:00 PM',
      type: 'Workshop',
    },
    {
      id: 2,
      title: 'Meet with Financial Advisor',
      date: 'Jan 27, 2025',
      time: '3:30 PM',
      type: 'Meeting',
    },
    {
      id: 3,
      title: 'Brand Partnership Discussion',
      date: 'Jan 29, 2025',
      time: '1:00 PM',
      type: 'Meeting',
    },
  ]
  // Latest News
  const latestNews = [
    {
      id: 1,
      title: 'New NIL Regulations Announced for College Athletes',
      source: 'Sports Business Journal',
      timestamp: '2 hours ago',
      category: 'Regulations',
    },
    {
      id: 2,
      title: 'Top 10 Emerging NIL Opportunities in 2025',
      source: 'NIL Insider',
      timestamp: '5 hours ago',
      category: 'Opportunities',
    },
    {
      id: 3,
      title: 'How to Maximize Your Personal Brand',
      source: 'Sports Marketing Today',
      timestamp: '1 day ago',
      category: 'Strategy',
    },
  ]
  // Statistics Data
  const statisticsData = {
    '1W': [
      { day: 'Mon', value: 12 },
      { day: 'Tue', value: 19 },
      { day: 'Wed', value: 15 },
      { day: 'Thu', value: 25 },
      { day: 'Fri', value: 22 },
      { day: 'Sat', value: 28 },
      { day: 'Sun', value: 35 },
    ],
    '1M': [
      { week: 'W1', value: 65 },
      { week: 'W2', value: 78 },
      { week: 'W3', value: 92 },
      { week: 'W4', value: 110 },
    ],
    '1Y': [
      { month: 'Jan', value: 120 },
      { month: 'Feb', value: 150 },
      { month: 'Mar', value: 180 },
      { month: 'Apr', value: 210 },
      { month: 'May', value: 240 },
      { month: 'Jun', value: 280 },
      { month: 'Jul', value: 320 },
      { month: 'Aug', value: 350 },
      { month: 'Sep', value: 380 },
      { month: 'Oct', value: 420 },
      { month: 'Nov', value: 450 },
      { month: 'Dec', value: 480 },
    ],
    ALL: [
      { year: '2022', value: 150 },
      { year: '2023', value: 420 },
      { year: '2024', value: 1200 },
      { year: '2025', value: 480 },
    ],
  }
  const currentStatsData = statisticsData[timeRange]
  // Advisor Carousel Navigation
  const nextAdvisor = () => {
    if (advisors.length <= 3) return
    setAdvisorCarouselIndex((prev) => (prev + 3) % advisors.length)
  }
  const prevAdvisor = () => {
    if (advisors.length <= 3) return
    setAdvisorCarouselIndex((prev) =>
      (prev - 3 + advisors.length) % advisors.length
    )
  }

  const handleConnect = (user) => {
    setSelectedProfile(user)
    setAddNoteMode(false)
    setConnectionMessage('')
    setShowConnectionModal(true)
  }

  const handleSendConnection = async () => {
    if (!selectedProfile || !currentUser) return
    try {
      setIsSending(true)
      const response = await connectionService.sendRequest(
        currentUser._id,
        selectedProfile.id || selectedProfile._id,
        connectionMessage
      )
      if (response.data.status === 'success') {
        toast.success(`Connection request sent to ${selectedProfile.name}`)
        setShowConnectionModal(false)
        setConnectionMessage('')
        setSelectedProfile(null)
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error(error.response?.data?.message || 'Failed to send connection request')
    } finally {
      setIsSending(false)
    }
  }
  const visibleAdvisors = useMemo(() => {
    if (advisors.length === 0) return []
    if (advisors.length === 1) return [advisors[0]]
    if (advisors.length === 2) return [advisors[0], advisors[1]]
    return [
      advisors[advisorCarouselIndex],
      advisors[(advisorCarouselIndex + 1) % advisors.length],
      advisors[(advisorCarouselIndex + 2) % advisors.length],
    ]
  }, [advisors, advisorCarouselIndex])

  return (
    <DashboardLayout>
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-8xl mx-auto px-4 md:px-8 py-6 space-y-6'>
          {/* Greeting Banner - Text Only */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='mb-2'
            >
              <p className='text-xs font-semibold tracking-wide text-gray-600 uppercase'>
                Happy {dayOfWeek}
              </p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='text-2xl md:text-3xl font-bold leading-tight text-gray-900'
            >
              Welcome back, <span className='text-[#163146]'>{currentUser?.firstName || 'Alex'}</span>!
            </motion.h1>
            <div className='flex flex-wrap gap-2 mt-2'>
             
              {(currentUser?.specialization || currentUser?.profile?.specialization || [])[0] && (
                <span className='text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full font-medium border border-gray-100 uppercase tracking-wide'>
                  {(currentUser?.specialization || currentUser?.profile?.specialization || [])[0]}
                </span>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className='mt-2'
            >
              <p className='text-sm italic font-light text-gray-600'>
                "{dailyQuote}"
              </p>
            </motion.div>
          </motion.div>

          {/* Key Insights Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className='grid grid-cols-2 md:grid-cols-4 gap-4'
          >
            {keyInsights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={insight.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  onClick={() => navigate(insightRoutes[insight.label])}
                  className='bg-white rounded-lg p-3 border border-gray-200 cursor-pointer transition-all hover:shadow-md'
                  whileHover={{ y: -1 }}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='p-1.5 bg-gray-100 rounded'>
                      <Icon size={16} className='text-gray-700' />
                    </div>
                    <span className='text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full'>
                      {insight.trend}
                    </span>
                  </div>

                  <p className='text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide'>
                    {insight.label}
                  </p>

                  <p className='text-xl font-bold text-gray-900'>
                    {insight.value}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
          {/* Main Content Grid */}
          <div className='grid grid-cols-1 gap-6'>
            {/* Recommended Advisors - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className='bg-white rounded-2xl p-6 border border-gray-200'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Recommended Advisors
                  </h2>
                  <p className='text-sm text-gray-500 mt-1'>
                    Curated for your profile
                  </p>
                </div>
                <div className='flex gap-2'>
                  <motion.button
                    onClick={prevAdvisor}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft size={20} className='text-gray-600' />
                  </motion.button>
                  <motion.button
                    onClick={nextAdvisor}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight size={20} className='text-gray-600' />
                  </motion.button>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <AnimatePresence mode='wait'>
                  {loadingAdvisors ? (
                    <>
                      <SkeletonCard type="recommendation" />
                      <SkeletonCard type="recommendation" />
                      <SkeletonCard type="recommendation" />
                    </>
                  ) : visibleAdvisors.length === 0 ? (
                    <div className='col-span-1 md:col-span-3 h-64 flex items-center justify-center'>
                      <p className='text-gray-500 font-medium'>
                        No advisors found for your profile.
                      </p>
                    </div>
                  ) : (
                    visibleAdvisors.map((advisor, index) => (
                      <motion.div
                        key={advisor.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className='border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white h-full'
                      >
                      {/* Banner */}
                      <div
                        className='h-32 relative'
                        style={advisor.banner}
                      >
                        {/* Match Percentage Badge */}
                        {advisor.matchPercentage > 0 && (
                          <motion.div
                            className={`absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm overflow-hidden border ${
                              advisor.matchPercentage >= 80 
                                ? 'text-emerald-700 border-emerald-100' 
                                : advisor.matchPercentage >= 50 
                                  ? 'text-amber-700 border-amber-100' 
                                  : 'text-slate-700 border-slate-100'
                            }`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60`}
                              animate={{ x: advisor.matchPercentage >= 90 ? ['-100%', '100%'] : '0%' }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />
                            <div className='flex items-center gap-1 relative'>
                              <TrendingUp size={12} className={
                                advisor.matchPercentage >= 80 ? 'text-emerald-500' :
                                advisor.matchPercentage >= 50 ? 'text-amber-500' :
                                'text-slate-400'
                              } />
                              <span>{advisor.matchPercentage >= 90 ? 'Best Match' : `${advisor.matchPercentage}% Match`}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                       {/* Profile Section */}
                      <div className='px-4 py-4 flex-1 flex flex-col relative'>
                        {/* Profile Image - overlaps banner */}
                        <div className='-mt-12 mb-3 flex-shrink-0 w-fit'>
                          <img
                            src={advisor.profileImg}
                            alt={advisor.name}
                            className='w-16 h-16 rounded-full border-2 border-white object-cover shadow-md'
                          />
                        </div>

                        {/* Location - Top Right */}
                        <div className='absolute top-2 right-2 text-right'>
                          <p className='text-[11px] font-semibold text-gray-900'>
                            {advisor.location}
                          </p>
                        </div>

                        {/* Name and Title */}
                        <div className='min-h-[4rem]'>
                          <div className='flex items-center gap-2 mb-1'>
                            <p className='font-bold text-gray-900 text-sm line-clamp-1'>
                              {advisor.name}
                            </p>
                          </div>
                          <p className='text-xs text-gray-500 mb-2 line-clamp-2'>
                            {advisor.title}
                          </p>
                        </div>

                        {/* Specialty Bubbles */}
                        <div className='flex flex-wrap gap-1.5 mb-3 min-h-[2.5rem]'>
                          {advisor.specialties.slice(0, 2).map((spec, idx) => (
                            <span
                              key={idx}
                              className='text-[10px] px-2.5 py-0.5 bg-slate-50 text-slate-700 rounded-full font-bold border border-slate-200 truncate flex items-center justify-center tracking-wide'
                            >
                              {spec}
                            </span>
                          ))}
                          {advisor.specialties.length > 2 && (
                            <div className='relative group'>
                              <span className='text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold border border-slate-200 flex items-center justify-center cursor-help transition-colors hover:bg-slate-200'>
                                +{advisor.specialties.length - 2}
                              </span>
                              
                              {/* Tooltip */}
                              <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 text-center leading-relaxed font-medium pointer-events-none'>
                                {advisor.specialties.slice(2).join(', ')}
                                <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800'></div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Stats */}
                        <div className='grid grid-cols-3 gap-1 mb-4 py-2 bg-gray-50 rounded-lg'>
                          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center text-ellipsis overflow-hidden'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
                              Experience
                            </p>
                            <p className='text-xs font-bold text-gray-900 leading-tight'>
                              {advisor.experience}y
                            </p>
                          </div>
                          <div className='text-center px-1 border-l border-r border-gray-200 min-h-[50px] flex flex-col justify-center overflow-hidden'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate px-1'>
                              {advisor.specialty}
                            </p>
                            <p className='text-xs font-bold text-gray-900 leading-tight'>
                              Pro
                            </p>
                          </div>
                          <div className='text-center px-1 min-h-[50px] flex flex-col justify-center'>
                            <p className='text-[10px] text-gray-500 font-medium leading-tight truncate'>
                              Connections
                            </p>
                            <p className='text-xs font-bold text-gray-900 leading-tight'>
                              {advisor.connections}
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
                           <motion.button
                            onClick={() => handleConnect(advisor)}
                            disabled={advisor.connectionStatus !== 'not_connected'}
                            className={`flex-1 py-2 px-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1 ${
                              advisor.connectionStatus === 'connected' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : advisor.connectionStatus === 'pending' || advisor.connectionStatus === 'received'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-[#163146] text-white hover:bg-[#0f2a36]'
                            }`}
                            whileHover={advisor.connectionStatus === 'not_connected' ? { scale: 1.02 } : {}}
                            whileTap={advisor.connectionStatus === 'not_connected' ? { scale: 0.98 } : {}}
                          >
                            {advisor.connectionStatus === 'connected' ? (
                              <>
                                <Users size={14} />
                                Connected
                              </>
                            ) : advisor.connectionStatus === 'pending' ? (
                              <>
                                <Send size={14} />
                                Sent
                              </>
                            ) : advisor.connectionStatus === 'received' ? (
                                <>
                                  <UserPlus size={14} />
                                  Review
                                </>
                            ) : (
                              <>
                                <UserPlus size={14} />
                                Connect
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
              {/* Carousel Indicators */}
              <div className='flex items-center justify-center gap-2 mt-6'>
                {Array.from({ length: Math.ceil(advisors.length / 3) }).map((_, index) => (
                  <motion.div
                    key={index}
                    onClick={() => setAdvisorCarouselIndex(index * 3)}
                    className={`h-2 rounded-full transition-colors cursor-pointer ${
                      Math.floor(advisorCarouselIndex / 3) === index
                        ? 'bg-[#163146] w-6'
                        : 'bg-gray-200 w-2'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Network Section - Role Specific */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              {currentUser?.userType === 'athlete' ? (
                <CurrentAdvisors 
                  advisors={network.advisors} 
                  loading={network.loading} 
                />
              ) : (
                <AdvisorRoster 
                  athletes={network.roster} 
                  loading={network.loading} 
                />
              )}
            </motion.div>
          </div>
          {/* Bottom Grid - Events, News/Stats */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className='bg-white rounded-2xl p-6 border border-gray-200'
            >
              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                Upcoming Events
              </h2>
              <div className='space-y-3'>
                {upcomingEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                    className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start gap-3'>
                      <div className='flex-shrink-0'>
                        <Calendar size={18} className='text-[#163146]' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-gray-900 text-sm'>
                          {event.title}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          {event.date} at {event.time}
                        </p>
                        <span className='inline-block text-xs font-medium text-white bg-[#163146] px-2 py-1 rounded mt-2'>
                          {event.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.button
                className='w-full mt-4 py-2 text-sm font-medium text-[#163146] hover:bg-gray-50 rounded-lg transition-colors'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View Calendar →
              </motion.button>
            </motion.div>
            {/* Toggle between News and Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className='bg-white rounded-2xl p-6 border border-gray-200'
            >
              {/* Header with Toggle */}
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-gray-900'>
                  {showStats ? 'Connection Growth' : 'Latest News'}
                </h2>
                <div className='flex gap-2'>
                  <motion.button
                    onClick={() => setShowStats(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      showStats
                        ? 'bg-[#163146] bg-opacity-10 text-[#163146]'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LineChart size={20} />
                  </motion.button>
                  <motion.button
                    onClick={() => setShowStats(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      !showStats
                        ? 'bg-[#163146] bg-opacity-10 text-[#163146]'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Newspaper size={20} />
                  </motion.button>
                </div>
              </div>
              <AnimatePresence mode='wait'>
                {showStats ? (
                  <motion.div
                    key='stats'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Time Range Selector */}
                    <div className='flex gap-2 mb-6'>
                      {['1W', '1M', '1Y', 'ALL'].map((range) => (
                        <motion.button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            timeRange === range
                              ? 'bg-[#163146] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {range}
                        </motion.button>
                      ))}
                    </div>
                    {/* Chart */}
                    <div className='h-64'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <RechartsLineChart data={currentStatsData}>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='#e5e7eb'
                          />
                          <XAxis
                            dataKey={
                              timeRange === '1W'
                                ? 'day'
                                : timeRange === '1M'
                                ? 'week'
                                : timeRange === '1Y'
                                ? 'month'
                                : 'year'
                            }
                            stroke='#9ca3af'
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis
                            stroke='#9ca3af'
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                            }}
                          />
                          <Line
                            type='monotone'
                            dataKey='value'
                            stroke='#163146'
                            strokeWidth={3}
                            dot={{ fill: '#163146', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                      <p className='text-xs text-blue-600 font-medium'>
                        You gained 480 new connections this period
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key='news'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className='space-y-3'
                  >
                    {latestNews.map((news, index) => (
                      <motion.div
                        key={news.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className='border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer'
                      >
                        <p className='text-sm font-semibold text-gray-900 line-clamp-2'>
                          {news.title}
                        </p>
                        <div className='flex items-center justify-between mt-2'>
                          <span className='text-xs text-gray-500'>
                            {news.source}
                          </span>
                          <span className='text-xs text-gray-400'>
                            {news.timestamp}
                          </span>
                        </div>
                        <span className='inline-block text-xs font-medium text-[#163146] bg-[#163146] bg-opacity-10 px-2 py-1 rounded mt-2'>
                          {news.category}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Profile Popup */}
          <ProfilePopup
            profile={selectedProfile}
            isOpen={profilePopupOpen}
            onClose={() => setProfilePopupOpen(false)}
            currentUserType={currentUser?.userType || 'athlete'}
            onConnect={handleConnect}
            onMessage={(u) => navigate('/inbox', { state: { recipientId: u.id || u._id } })}
          />

          {/* Connection Modal */}
          <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
            <DialogContent className='max-w-md rounded-3xl p-0 overflow-hidden border-0'>
              {/* Header */}
              <div className='bg-white p-6 pb-2'>
                <DialogHeader>
                  <DialogTitle className='text-2xl font-bold text-slate-900'>Connect with {selectedProfile?.name}</DialogTitle>
                  <p className='text-slate-500 text-sm mt-1'>
                    {addNoteMode 
                      ? 'Add a personal message to your invitation.' 
                      : 'Grow your network by connecting with this profile.'
                    }
                  </p>
                </DialogHeader>
              </div>

              <div className='px-6 pb-6'>
                <AnimatePresence mode='wait'>
                  {addNoteMode ? (
                    <motion.div 
                      key="message-input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className='space-y-4'
                    >
                      <div className='space-y-2 mt-2'>
                        <Textarea
                          autoFocus
                          placeholder={`Hi ${selectedProfile?.name?.split(' ')[0]}, I'd like to connect...`}
                          value={connectionMessage}
                          onChange={(e) => setConnectionMessage(e.target.value.slice(0, 150))}
                          rows={4}
                          className="resize-none border-slate-200 bg-slate-50 rounded-xl focus:bg-white transition-all text-base"
                        />
                        <div className='flex justify-between items-center px-1'>
                          <p className='text-[10px] text-slate-400'>150 characters max</p>
                          <p className='text-[10px] text-slate-400 font-mono'>
                          {connectionMessage.length}/150
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-3 pt-2'>
                        <Button 
                          variant="outline" 
                          onClick={() => setAddNoteMode(false)}
                          className="flex-1 rounded-xl h-12 border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 rounded-xl h-12 text-white shadow-lg shadow-blue-500/20 bg-[#163146] hover:bg-[#0f2a36]"
                          onClick={handleSendConnection}
                          disabled={isSending}
                        >
                          {isSending ? 'Sending...' : 'Send Request'}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="action-buttons"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className='space-y-3 pt-2'
                    >
                      <Button 
                        className="w-full rounded-xl h-14 text-white shadow-lg shadow-blue-500/20 text-base font-semibold justify-between px-6 group bg-[#163146] hover:bg-[#0f2a36]"
                        onClick={handleSendConnection}
                        disabled={isSending}
                      >
                        <div className='flex items-center gap-3'>
                          <Send size={20} />
                          <span>Send Request Now</span>
                        </div>
                        <div className='bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>Fast</div>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="w-full rounded-xl h-14 border-slate-200 hover:bg-slate-50 text-slate-700 text-base font-medium justify-between px-6 group"
                        onClick={() => setAddNoteMode(true)}
                      >
                        <div className='flex items-center gap-3'>
                          <PenLine size={20} className='text-slate-400 group-hover:text-slate-600' />
                          <span>Add a Note</span>
                        </div>
                        <span className='text-slate-400 group-hover:text-slate-600'>Optional</span>
                      </Button>

                      <p className='text-xs text-center text-slate-400 pt-2'>
                        {selectedProfile?.name} will receive a notification immediately.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default DashboardPage