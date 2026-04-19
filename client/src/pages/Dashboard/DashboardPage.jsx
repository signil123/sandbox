// File: client/src/pages/Dashboard/DashboardPage.jsx
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
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
import api from '../../config'

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
import { getBannerStyle, getImageUrl } from '../../utils/imageUtils'
import DashboardLayout from '../Layout/DashboardLayout'

const DashboardPage = () => {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      navigate('/admin')
    }
  }, [currentUser?.role, navigate])
  const dispatch = useDispatch()
  const network = useSelector(state => state.user.network) || { advisors: [], roster: [], loading: false }
  const [showStats, setShowStats] = useState(false)
  const [timeRange, setTimeRange] = useState('1M')
  const [advisorPageIndex, setAdvisorPageIndex] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [addNoteMode, setAddNoteMode] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [advisorsListData, setAdvisorsListData] = useState([])
  const [stableAdvisors, setStableAdvisors] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(true)

  // Fetch Network Summary
  const [statsSummary, setStatsSummary] = useState(null)
  
  // Real Data States
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [news, setNews] = useState([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [eventsPage, setEventsPage] = useState(0)
  const ITEMS_PER_PAGE = 4

  // Fetch Real Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Upcoming Events
        const eventsRes = await api.get('/events/upcoming')
        if (eventsRes.data.status === 'success') {
          setUpcomingEvents(eventsRes.data.data?.events || eventsRes.data.events || [])
        }

        // 2. Fetch Network Summary
        if (currentUser?._id) {
           try {
             const summaryRes = await connectionService.getSummary(currentUser._id)
             if (summaryRes.data.status === 'success') {
               setStatsSummary(summaryRes.data.data)
             }
           } catch (e) {
             // specific console log or ignore
           }
        }

        // 3. Fetch News
        const apiKey = import.meta.env.VITE_NEWS_API
        if (apiKey) {
           const newsRes = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: '"NIL" OR "athlete endorsement" OR "sports business"',
              language: 'en',
              sortBy: 'publishedAt',
              apiKey: apiKey,
              pageSize: 3
            },
          })
          
          if (newsRes.data.status === 'ok') {
            const formattedNews = newsRes.data.articles
              .filter((article) => article.urlToImage)
              .map((article, index) => ({
                id: index,
                title: article.title,
                source: article.source.name,
                timestamp: new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                category: 'News',
                url: article.url
              }))
            setNews(formattedNews)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoadingNews(false)
      }
    }

    fetchDashboardData()
  }, [currentUser?._id])

  // Reset carousel index/pagination when data changes
  useEffect(() => {
    setAdvisorPageIndex(0)
    setEventsPage(0)
  }, [advisorsListData.length, upcomingEvents.length])

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
      value: statsSummary?.profileViews?.toString() || '0',
      trend: statsSummary?.viewsTrend || '0%',
      icon: Eye,
    },
    {
      label: 'New Messages',
      value: statsSummary?.unreadMessages?.toString() || '0',
      trend: '+0%',
      icon: MessageSquare,
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents.length.toString(),
      trend: upcomingEvents.length > 0 ? '+1' : '0',
      icon: Calendar,
    },
    {
      label: 'Connected Advisors',
      value: ((network.advisors?.length || 0) + (network.roster?.length || 0)).toString(),
      trend: '+0%',
      icon: Users,
    },
  ]
  // Recommended Advisors logic
  const fetchRecommendations = useCallback(async () => {
    if (!currentUser?._id) return
    setLoadingAdvisors(true)
    try {
      const response = await exploreService.getRecommendations(currentUser._id, 6)
      if (response.data.status === 'success') {
        const mappedAdvisors = response.data.data.recommendations.map(u => ({
          id: u.userId,
          name: u.name,
          title: u.profile?.title || (u.userType.charAt(0).toUpperCase() + u.userType.slice(1)),
          location: u.profile?.location || 'Remote',
          specialty: u.profile?.specialization?.[0] || u.profile?.sport || (u.userType.charAt(0).toUpperCase() + u.userType.slice(1)),
          specialties: u.profile?.specialization || u.profile?.specialties || [],
          experience: parseInt(u.profile?.experience) || 0,
          connections: u.totalConnections || 0,
          initials: (u.name || 'A').split(' ').map(n => n[0]).join(''),
          verified: u.profile?.verified || false,
          bestMatch: u.matchScore > 80,
          matchPercentage: u.matchScore,
          banner: getBannerStyle({
            bannerImage: u?.profile?.bannerImage,
            themeId: u?.profile?.themeId,
            getThemeById,
          }),
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
          isBlurred: Boolean(u.isBlurred),
        }))
        setAdvisorsListData(mappedAdvisors)
        if (mappedAdvisors.length > 0) {
          setStableAdvisors(mappedAdvisors)
        }
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
  }, [fetchRecommendations, currentUser?._id, currentUser?.userType, dispatch])

  const advisors = advisorsListData.length > 0 ? advisorsListData : stableAdvisors
  // Upcoming Events
  // upcomingEvents state managed above
  // Latest News
  // latestNews state managed above
  // Statistics Data
  const statisticsData = useMemo(() => {
    if (statsSummary?.analytics) {
      return statsSummary.analytics
    }
    
    return {
      '1W': [],
      '1M': [],
      '1Y': [],
      ALL: [],
    }
  }, [statsSummary?.analytics])
  const currentStatsData = statisticsData[timeRange]
  // Advisor Carousel Navigation
  const totalAdvisorPages = Math.max(1, Math.ceil(advisors.length / 3))
  const nextAdvisor = () => {
    if (totalAdvisorPages <= 1) return
    setAdvisorPageIndex((prev) => Math.min(prev + 1, totalAdvisorPages - 1))
  }
  const prevAdvisor = () => {
    if (totalAdvisorPages <= 1) return
    setAdvisorPageIndex((prev) => Math.max(prev - 1, 0))
  }

  useEffect(() => {
    if (advisors.length === 0) {
      setAdvisorPageIndex(0)
      return
    }
    if (advisorPageIndex >= totalAdvisorPages) {
      setAdvisorPageIndex(totalAdvisorPages - 1)
    }
  }, [advisors.length, advisorPageIndex, totalAdvisorPages])

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
    const start = advisorPageIndex * 3
    return advisors.slice(start, start + 3)
  }, [advisors, advisorPageIndex])

  const SIDEBAR_W = 228 // matches DashboardLayout default; collapses handled by layout

  return (
    <DashboardLayout>
      {/* Full-viewport dashboard grid — desktop only one-page layout */}
      <div
        className='hidden md:grid'
        style={{
          position: 'fixed',
          left: SIDEBAR_W + 32,
          right: 16,
          top: 16,
          bottom: 16,
          gridTemplateRows: 'auto auto 2fr 1fr',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        {/* Row 1: Greeting */}
        <div style={{ fontSize: 34, fontWeight: 900, color: '#163146', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Welcome back, <span style={{ color: '#986a41' }}>{currentUser?.firstName || 'Alex'}</span>!
        </div>

        {/* Row 2: KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {keyInsights.map((insight, index) => {
            const isHighlighted = index === 0
            return (
              <motion.div
                key={insight.label}
                onClick={() => navigate(insightRoutes[insight.label])}
                style={{
                  background: isHighlighted ? '#163146' : '#fff',
                  color: isHighlighted ? '#fff' : '#163146',
                  border: isHighlighted ? '1px solid #163146' : '1px solid rgba(22,49,70,.05)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  position: 'relative',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px -8px rgba(22,49,70,.18)' }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: isHighlighted ? 'rgba(255,255,255,.55)' : 'rgba(22,49,70,.4)', marginBottom: 8 }}>{insight.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{insight.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isHighlighted ? 'rgba(255,255,255,.5)' : 'rgba(22,49,70,.4)', marginTop: 6 }}>{insight.trend}</div>
                <div style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: '#986a41', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ExternalLink size={13} strokeWidth={2} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Row 3: Recommended + Scout (fills remaining) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, minHeight: 0, overflow: 'hidden' }}>
          {/* Recommended section — spans 3 cols to align with Upcoming Events KPI above */}
          <div style={{ gridColumn: 'span 3', minWidth: 0, minHeight: 0, background: '#fff', border: '1px solid rgba(22,49,70,.05)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#163146', letterSpacing: '-0.005em' }}>Recommended For You</div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,49,70,.4)', marginTop: 4 }}>Based on your profile & goals</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {advisors.length > 3 && (
                  <>
                    <button onClick={prevAdvisor} disabled={advisorPageIndex === 0} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(22,49,70,.04)', border: '1px solid rgba(22,49,70,.08)', color: 'rgba(22,49,70,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: advisorPageIndex === 0 ? 0.4 : 1 }}>
                      <ChevronLeft size={13} strokeWidth={2.2} />
                    </button>
                    <button onClick={nextAdvisor} disabled={advisorPageIndex >= totalAdvisorPages - 1} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(22,49,70,.04)', border: '1px solid rgba(22,49,70,.08)', color: 'rgba(22,49,70,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: advisorPageIndex >= totalAdvisorPages - 1 ? 0.4 : 1 }}>
                      <ChevronRight size={13} strokeWidth={2.2} />
                    </button>
                  </>
                )}
                <button onClick={() => navigate('/explore')} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#163146', padding: '7px 13px', borderRadius: 10, background: 'rgba(22,49,70,.04)', border: '1px solid rgba(22,49,70,.08)', cursor: 'pointer' }}>
                  Explore All
                </button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, minHeight: 0, overflow: 'hidden' }}>
              <AnimatePresence mode='wait'>
                {loadingAdvisors ? (
                  <>
                    <SkeletonCard type="recommendation" />
                    <SkeletonCard type="recommendation" />
                    <SkeletonCard type="recommendation" />
                  </>
                ) : visibleAdvisors.length === 0 ? (
                  <>
                    <SkeletonCard type="recommendation" />
                    <SkeletonCard type="recommendation" />
                    <SkeletonCard type="recommendation" />
                  </>
                ) : (
                  visibleAdvisors.map((advisor, index) => (
                    <AdvisorRecommendationCard
                      key={`${advisor.id}-${index}`}
                      advisor={advisor}
                      onConnect={handleConnect}
                      onView={(a) => {
                        if (a.isBlurred && ['advisor', 'agent'].includes(currentUser?.userType) && currentUser?.tier === 'free') {
                          navigate('/settings?tab=plans')
                          return
                        }
                        setSelectedProfile(a)
                        setProfilePopupOpen(true)
                      }}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scout AI Panel — 1 col, aligns with Connected Advisors KPI above */}
          <div style={{ minWidth: 0, minHeight: 0, background: '#fff', border: '1px solid rgba(22,49,70,.05)', borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '13px 15px', background: '#163146', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src='/scout.png' alt='' style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={(e) => { e.target.style.display = 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>Scout AI</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>Signil assistant</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const isScoutSidebarOpen = true
                  // startNewChat via DashboardLayout — here we just use our local scout state
                }}
                style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.15em', padding: '4px 8px', borderRadius: 5, background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                NEW CHAT
              </button>
            </div>
            <div style={{ flex: 1, padding: 12, background: '#faf7f2', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#fff', border: '1px solid rgba(22,49,70,.06)', borderRadius: 12, padding: '10px 12px', fontSize: 11, lineHeight: 1.55, color: '#163146' }}>
                Hi there. I can help you find the right people on Signil. Share the role, sport, or expertise you need.
              </div>
            </div>
            <div style={{ padding: '9px 11px', borderTop: '1px solid rgba(22,49,70,.06)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <input
                type='text'
                placeholder='Ask for athletes, advisors...'
                style={{ flex: 1, background: '#f4f1ea', border: 0, borderRadius: 9, padding: '8px 11px', fontSize: 11, color: '#163146', fontFamily: 'inherit', outline: 'none' }}
              />
              <button style={{ width: 30, height: 30, borderRadius: 9, background: '#986a41', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 4: Network + Events + News */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, minHeight: 0 }}>
          {/* My Advisors / Athlete Roster */}
          <div style={{ background: '#fff', border: '1px solid rgba(22,49,70,.05)', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
            {(() => {
              const isAthlete = currentUser?.userType === 'athlete'
              const list = isAthlete ? (network.advisors || []) : (network.roster || [])
              const title = isAthlete ? 'My Advisors' : 'Athlete Roster'
              const colors = ['#b5c3d4', '#986a41', '#8aa8d4', '#4a9e8e']
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={14} strokeWidth={2} style={{ color: '#163146' }} />
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#163146' }}>{title}</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,49,70,.4)' }}>
                      {list.length} Connected
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                    {list.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(22,49,70,.45)', fontWeight: 500 }}>
                        No connections yet
                      </div>
                    ) : (
                      list.slice(0, 3).map((p, i) => {
                        const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'User'
                        const role = p.title || p.profile?.title || (p.userType ? p.userType.charAt(0).toUpperCase() + p.userType.slice(1) : '')
                        const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
                        const avatarImg = p.profileImage || p.profileImg || p.profile?.profileImage
                        const avatarUrl = avatarImg && avatarImg.startsWith('http') ? avatarImg : (avatarImg ? getImageUrl(avatarImg) : null)
                        return (
                          <div
                            key={p._id || p.id || i}
                            onClick={() => navigate('/inbox', { state: { recipientId: p._id || p.id } })}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px', cursor: 'pointer' }}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors[i % colors.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                initials
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#163146', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                              <div style={{ fontSize: 10, color: 'rgba(22,49,70,.55)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate('/inbox', { state: { recipientId: p._id || p.id } }) }}
                              style={{ width: 26, height: 26, borderRadius: 8, color: 'rgba(22,49,70,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <MessageSquare size={13} strokeWidth={1.8} />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )
            })()}
          </div>

          {/* Upcoming Events */}
          <div style={{ background: '#fff', border: '1px solid rgba(22,49,70,.05)', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} strokeWidth={2} style={{ color: '#163146' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#163146' }}>Upcoming Events</span>
              </div>
              <button onClick={() => navigate('/calendar')} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#163146', padding: '5px 10px', borderRadius: 8, background: 'rgba(22,49,70,.04)', border: '1px solid rgba(22,49,70,.08)', cursor: 'pointer' }}>
                View Calendar
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((event, index) => {
                  const dateObj = new Date(event.startDate)
                  const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                  const day = dateObj.getDate()
                  const time = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  const isPrimary = index === 0
                  return (
                    <div
                      key={event._id}
                      onClick={() => navigate(`/calendar?eventId=${event._id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 12, cursor: 'pointer',
                        background: isPrimary ? '#163146' : 'rgba(22,49,70,.02)',
                        border: isPrimary ? '1px solid #163146' : '1px solid rgba(22,49,70,.06)',
                        color: isPrimary ? '#fff' : '#163146',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: isPrimary ? 'rgba(255,255,255,.12)' : 'rgba(22,49,70,.04)', flexShrink: 0 }}>
                        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.1em', opacity: isPrimary ? 0.7 : 0.5 }}>{month}</span>
                        <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{day}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                        <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{time}</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(22,49,70,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(22,49,70,.35)', marginBottom: 10 }}>
                    <Calendar size={18} strokeWidth={1.8} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#163146', marginBottom: 4 }}>No upcoming events</div>
                  <div style={{ fontSize: 11, color: 'rgba(22,49,70,.5)', fontWeight: 500, maxWidth: 170, marginBottom: 12 }}>Your schedule is clear for now.</div>
                  <button onClick={() => navigate('/calendar?action=create')} style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '9px 16px', borderRadius: 10, background: '#163146', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Schedule Event
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Latest News */}
          <div style={{ background: '#fff', border: '1px solid rgba(22,49,70,.05)', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexShrink: 0 }}>
              <Newspaper size={14} strokeWidth={2} style={{ color: '#163146' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#163146' }}>Latest News</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
              {!loadingNews && news.length > 0 ? (
                news.slice(0, 3).map((newsItem, index) => (
                  <div
                    key={newsItem.id}
                    onClick={() => window.open(newsItem.url, '_blank')}
                    style={{ paddingBottom: index < 2 ? 10 : 0, borderBottom: index < 2 ? '1px solid rgba(22,49,70,.05)' : 'none', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', padding: '2px 5px', borderRadius: 4, background: 'rgba(152,106,65,.1)', color: '#986a41', textTransform: 'uppercase' }}>{newsItem.category}</span>
                      <span style={{ fontSize: 9, color: 'rgba(22,49,70,.4)', fontWeight: 600 }}>{newsItem.timestamp}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#163146', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{newsItem.title}</div>
                    <div style={{ fontSize: 9, color: 'rgba(22,49,70,.45)', fontWeight: 500, marginTop: 3 }}>{newsItem.source}</div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'rgba(22,49,70,.4)', textAlign: 'center' }}>No latest news available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout — scrollable, same data */}
      <div className='md:hidden flex-1 overflow-y-auto pt-14' style={{ background: '#ede9df' }}>
        <div className='px-4 py-5 space-y-4'>
          {/* Greeting */}
          <div>
            <div className='text-[10px] font-black uppercase tracking-widest text-[#163146]/50 mb-1'>Happy {dayOfWeek}</div>
            <h1 className='text-2xl font-black text-[#163146] leading-tight'>
              Welcome back, <span className='text-[#986a41]'>{currentUser?.firstName || 'Alex'}</span>!
            </h1>
          </div>

          {/* KPI row */}
          <div className='grid grid-cols-2 gap-3'>
            {keyInsights.map((insight, index) => {
              const Icon = insight.icon
              const isHighlighted = index === 0
              return (
                <div
                  key={insight.label}
                  onClick={() => navigate(insightRoutes[insight.label])}
                  className='rounded-2xl p-3 cursor-pointer'
                  style={{ background: isHighlighted ? '#163146' : '#fff', color: isHighlighted ? '#fff' : '#163146', border: '1px solid rgba(22,49,70,.06)' }}
                >
                  <div className='text-[8px] font-black uppercase tracking-widest mb-2' style={{ color: isHighlighted ? 'rgba(255,255,255,.5)' : 'rgba(22,49,70,.4)' }}>{insight.label}</div>
                  <div className='text-2xl font-black'>{insight.value}</div>
                </div>
              )
            })}
          </div>

          {/* Recommended */}
          <div className='bg-white rounded-2xl p-4' style={{ border: '1px solid rgba(22,49,70,.05)' }}>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm font-black text-[#163146]'>Recommended For You</div>
              <button onClick={() => navigate('/explore')} className='text-[9px] font-black uppercase tracking-widest text-[#163146] px-3 py-1.5 rounded-lg' style={{ background: 'rgba(22,49,70,.05)', border: '1px solid rgba(22,49,70,.08)' }}>
                Explore All
              </button>
            </div>
            <div className='space-y-3'>
              {loadingAdvisors ? (
                <><SkeletonCard type="recommendation" /><SkeletonCard type="recommendation" /></>
              ) : visibleAdvisors.slice(0, 2).map((advisor, index) => (
                <AdvisorRecommendationCard
                  key={`${advisor.id}-${index}`}
                  advisor={advisor}
                  onConnect={handleConnect}
                  onView={(a) => { setSelectedProfile(a); setProfilePopupOpen(true) }}
                />
              ))}
            </div>
          </div>

          {/* Network */}
          <div className='bg-white rounded-2xl p-4' style={{ border: '1px solid rgba(22,49,70,.05)' }}>
            {currentUser?.userType === 'athlete' ? (
              <CurrentAdvisors advisors={network.advisors} loading={network.loading} />
            ) : (
              <AdvisorRoster athletes={network.roster} loading={network.loading} />
            )}
          </div>

          {/* Events */}
          <div className='bg-white rounded-2xl p-4' style={{ border: '1px solid rgba(22,49,70,.05)' }}>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm font-black text-[#163146]'>Upcoming Events</div>
              <button onClick={() => navigate('/calendar')} className='text-[9px] font-black uppercase tracking-widest text-[#163146]'>View Calendar</button>
            </div>
            {upcomingEvents.length === 0 && (
              <p className='text-xs text-[#163146]/50 text-center py-4'>No upcoming events</p>
            )}
            {upcomingEvents.slice(0, 3).map((event, index) => {
              const dateObj = new Date(event.startDate)
              const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
              const day = dateObj.getDate()
              const time = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              return (
                <div key={event._id} onClick={() => navigate(`/calendar?eventId=${event._id}`)} className='flex items-center gap-3 p-2.5 rounded-xl mb-2 cursor-pointer' style={{ background: index === 0 ? '#163146' : 'rgba(22,49,70,.03)', border: '1px solid rgba(22,49,70,.06)', color: index === 0 ? '#fff' : '#163146' }}>
                  <div className='flex flex-col items-center w-9 h-9 rounded-lg justify-center' style={{ background: index === 0 ? 'rgba(255,255,255,.12)' : 'rgba(22,49,70,.06)', flexShrink: 0 }}>
                    <span className='text-[7px] font-black opacity-60'>{month}</span>
                    <span className='text-sm font-black leading-none'>{day}</span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-xs font-bold truncate'>{event.title}</div>
                    <div className='text-[9px] opacity-60'>{time}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* News */}
          <div className='bg-white rounded-2xl p-4 mb-24' style={{ border: '1px solid rgba(22,49,70,.05)' }}>
            <div className='text-sm font-black text-[#163146] mb-3'>Latest News</div>
            {!loadingNews && news.length > 0 ? news.slice(0, 3).map((n, i) => (
              <div key={n.id} onClick={() => window.open(n.url, '_blank')} className='pb-3 mb-3 cursor-pointer' style={{ borderBottom: i < 2 ? '1px solid rgba(22,49,70,.05)' : 'none' }}>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-[7px] font-black uppercase px-1.5 py-0.5 rounded' style={{ background: 'rgba(152,106,65,.1)', color: '#986a41' }}>{n.category}</span>
                  <span className='text-[9px] text-[#163146]/40 font-bold'>{n.timestamp}</span>
                </div>
                <div className='text-xs font-bold text-[#163146] line-clamp-2'>{n.title}</div>
                <div className='text-[9px] text-[#163146]/40 mt-1'>{n.source}</div>
              </div>
            )) : (
              <p className='text-xs text-[#163146]/40 text-center py-4'>No news available.</p>
            )}
          </div>
        </div>
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
    </DashboardLayout>
  )
}
export default DashboardPage
