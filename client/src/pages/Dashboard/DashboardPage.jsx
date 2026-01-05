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

import { AdvisorRecommendationCard } from '../../components/Dashboard/AdvisorRecommendationCard'
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
        const mappedAdvisors = response.data.data.recommendations.slice(0, 6).map(u => ({
          id: u.userId,
          name: u.name,
          title: u.profile?.title || (u.userType === 'advisor' ? 'Advisor' : 'Agent'),
          location: u.profile?.location || 'Remote',
          specialty: u.profile?.specialization?.[0] || (u.userType === 'advisor' ? 'Advisor' : 'Agent'),
          specialties: u.profile?.specialization || u.profile?.specialties || [],
          experience: parseInt(u.profile?.experience) || 0,
          connections: 0,
          initials: (u.name || 'A').split(' ').map(n => n[0]).join(''),
          verified: u.profile?.verified || false,
          bestMatch: u.matchScore > 80,
          matchPercentage: u.matchScore,
          banner: getBannerStyle(u.profile),
          profileImg: (u.profile?.profileImage && !u.profile.profileImage.includes('unsplash.com')) 
            ? getImageUrl(u.profile.profileImage) 
            : (u.profile?.photo && !u.profile.photo.includes('unsplash.com'))
              ? getImageUrl(u.profile.photo)
              : `https://ui-avatars.com/api/?name=${u.name || 'Advisor'}&background=random`,
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
    return advisors.slice(0, 3)
  }, [advisors])

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
            className='grid grid-cols-2 lg:grid-cols-4 gap-6'
          >
            {keyInsights.map((insight, index) => {
              const Icon = insight.icon
              const isPrimary = index % 2 === 0
              return (
                <motion.div
                  key={insight.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => navigate(insightRoutes[insight.label])}
                  className='bg-white rounded-2xl p-3 md:p-4 border border-gray-50 cursor-pointer transition-all hover:border-[#163146]/10 hover:shadow-sm flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 group min-w-0'
                >
                  <div className={`p-2 md:p-2.5 rounded-xl transition-colors shrink-0 ${
                    isPrimary 
                      ? 'bg-[#163146]/5 text-[#163146] group-hover:bg-[#163146] group-hover:text-white' 
                      : 'bg-[#986a41]/5 text-[#986a41] group-hover:bg-[#986a41] group-hover:text-white'
                  }`}>
                    <Icon size={16} className='md:hidden' />
                    <Icon size={18} className='hidden md:block' />
                  </div>
                  <div className='flex-1 min-w-0 w-full'>
                    <p className='text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 md:mb-1.5 truncate'>
                      {insight.label}
                    </p>
                    <div className='flex items-end justify-between md:justify-start md:gap-2'>
                      <h4 className='text-lg md:text-xl font-black text-gray-900 leading-none truncate'>
                        {insight.value}
                      </h4>
                      <span className='text-[8px] md:text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {insight.trend}
                      </span>
                    </div>
                  </div>
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
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-50'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 mb-1.5'>
                    <div className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0' />
                    <h2 className='text-xl md:text-2xl font-black text-gray-900 leading-tight truncate'>
                      Recommended For You
                    </h2>
                  </div>
                  <p className='text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest truncate'>
                    Based on your profile & goals
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/explore')}
                  className='w-full sm:w-auto px-5 py-2.5 bg-gray-50 text-[#163146] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#163146] hover:text-white transition-all border border-gray-100 shrink-0'
                >
                  Explore All
                </button>
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
                      <AdvisorRecommendationCard 
                        key={advisor.id}
                        advisor={advisor}
                        onConnect={handleConnect}
                        onView={(a) => {
                          setSelectedProfile(a)
                          setProfilePopupOpen(true)
                        }}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
              {/* Navigation CTA */}
              <div className='mt-10 pt-6 border-t border-gray-50 text-center'>
                 <p className='text-xs text-gray-400 mb-4 font-medium'>Want to see expert matches with different specialties?</p>
                 <button 
                    onClick={() => navigate('/explore')}
                    className='text-xs font-black text-[#163146] hover:text-[#986a41] transition-colors flex items-center gap-2 mx-auto uppercase tracking-widest'
                 >
                    Search full expert directory <ChevronRight size={14} />
                 </button>
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
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className='bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm relative overflow-hidden'
            >
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-[#163146]/5 rounded-xl text-[#163146]'>
                    <Calendar size={20} />
                  </div>
                  <h2 className='text-xl font-bold text-gray-900'>
                    Upcoming Events
                  </h2>
                </div>
                <button className='text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#163146] transition-colors'>
                  See All
                </button>
              </div>

              <div className='space-y-4'>
                {upcomingEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className='group flex items-start gap-4 p-4 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all cursor-pointer'
                  >
                    <div className='flex flex-col items-center justify-center w-12 h-14 bg-[#163146] text-white rounded-2xl transition-all duration-300'>
                      <span className='text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none mb-1'>JAN</span>
                      <span className='text-lg font-black leading-none'>{25 + index}</span>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-amber-400' : 'bg-[#163146]'}`} />
                        <h4 className='font-bold text-gray-900 text-sm truncate group-hover:text-[#163146] transition-colors'>
                          {event.title}
                        </h4>
                      </div>
                      <p className='text-[11px] text-gray-400 font-medium flex items-center gap-2'>
                        <span>{event.time}</span>
                        <span className='w-1 h-1 rounded-full bg-gray-200' />
                        <span className='font-bold text-[#986a41]'>{event.type}</span>
                      </p>
                    </div>

                    <div className='w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-[#163146] group-hover:border-[#163146]/20 group-hover:bg-white transition-all'>
                      <ChevronRight size={14} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className='w-full mt-6 py-4 bg-gray-50 text-gray-900 rounded-2xl text-xs font-bold hover:bg-[#163146] hover:text-white transition-all active:scale-[0.98]'
                whileHover={{ y: -2 }}
              >
                Launch Calendar
              </motion.button>
            </motion.div>

            {/* Toggle between News and Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className='bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm'
            >
              {/* Header with Toggle */}
              <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center gap-3'>
                  <div className={`p-2 rounded-xl transition-all ${showStats ? 'bg-[#163146]/5 text-[#163146]' : 'bg-[#986a41]/5 text-[#986a41]'}`}>
                    {showStats ? <LineChart size={20} /> : <Newspaper size={20} />}
                  </div>
                  <h2 className='text-xl font-bold text-gray-900'>
                    {showStats ? 'Network Analytics' : 'Latest News'}
                  </h2>
                </div>
                
                <div className='bg-gray-50 p-1 rounded-xl flex gap-1'>
                  <button
                    onClick={() => setShowStats(true)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      showStats ? 'bg-white shadow-sm text-[#163146]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setShowStats(false)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      !showStats ? 'bg-white shadow-sm text-[#986a41]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    News
                  </button>
                </div>
              </div>

              <AnimatePresence mode='wait'>
                {showStats ? (
                  <motion.div
                    key='stats'
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Time Range Selector */}
                    <div className='flex gap-2 mb-8'>
                      {['1W', '1M', '1Y', 'ALL'].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${
                            timeRange === range
                              ? 'bg-[#163146] text-white shadow-lg shadow-[#163146]/20'
                              : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    {/* Chart */}
                    <div className='h-64 -ml-4'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <RechartsLineChart data={currentStatsData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#163146" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#163146" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            vertical={false}
                            stroke='#f1f5f9'
                          />
                          <XAxis
                            dataKey={
                              timeRange === '1W' ? 'day' :
                              timeRange === '1M' ? 'week' :
                              timeRange === '1Y' ? 'month' : 'year'
                            }
                            stroke='#94a3b8'
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '10px', fontWeight: '700' }}
                            dy={10}
                          />
                          <YAxis
                            stroke='#94a3b8'
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '10px', fontWeight: '700' }}
                            dx={-10}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#163146',
                              border: 'none',
                              borderRadius: '16px',
                              color: 'white',
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                              padding: '12px'
                            }}
                            itemStyle={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                          />
                          <Line
                            type='monotone'
                            dataKey='value'
                            stroke='#163146'
                            strokeWidth={4}
                            dot={false}
                            activeDot={{ r: 6, fill: '#163146', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className='mt-8 p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between'>
                      <div>
                        <p className='text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5'>Connection Growth</p>
                        <p className='text-sm text-gray-900 font-black'>+480 New Connections</p>
                      </div>
                      <div className='flex items-center gap-1 text-emerald-500 font-black text-xs'>
                        <TrendingUp size={14} />
                        12%
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key='news'
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className='space-y-4'
                  >
                    {latestNews.map((news, index) => (
                      <motion.div
                        key={news.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className='group p-4 rounded-3xl border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer'
                      >
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='px-2 py-0.5 bg-[#986a41]/10 text-[#986a41] text-[9px] font-black uppercase tracking-tighter rounded-md'>
                            {news.category}
                          </span>
                          <span className='text-[10px] text-gray-400 font-bold'>{news.timestamp}</span>
                        </div>
                        <p className='text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-[#163146] transition-colors'>
                          {news.title}
                        </p>
                        <div className='flex items-center gap-2 mt-3'>
                           <div className='w-5 h-5 rounded-full bg-gray-200' />
                           <span className='text-[10px] text-gray-500 font-bold'>{news.source}</span>
                        </div>
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