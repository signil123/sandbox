// File: client/src/pages/Calendar/CalendarPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download, // Added Download icon
  ExternalLink,
  File,
  Filter,
  Info,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Menu,
  PartyPopper,
  Phone,
  Plus,
  Search,
  Settings,
  Share,
  Shield,
  Smartphone,
  Star,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../config'
import { selectCurrentUser } from '../../redux/userSlice'
import DashboardLayout from '../Layout/DashboardLayout'

// Helper to construct full image URL for local uploads
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

// Get deterministic avatar color
const getAvatarColor = (user) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-amber-400 to-amber-600',
  ]
  const seed = user?.name || user?._id || 'User'
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const CalendarSkeleton = () => (
  <div className='w-full h-full max-w-8xl mx-auto flex flex-col px-4 md:px-8 py-6 gap-6 bg-stone-50 animate-pulse'>
    {/* Header Skeleton */}
    <div className='flex items-center justify-between'>
      <div className='h-8 w-48 bg-gray-200 rounded-lg'></div>
      <div className='flex gap-3'>
        <div className='hidden md:block h-9 w-48 bg-gray-200 rounded-lg'></div>
        <div className='h-9 w-32 bg-gray-200 rounded-lg'></div>
      </div>
    </div>

    <div className='flex gap-4 md:gap-6 flex-1 overflow-hidden'>
      {/* Sidebar Skeleton */}
      <div className='hidden md:flex w-72 flex-col gap-4'>
        <div className='h-80 bg-white rounded-xl border border-gray-200'></div>
        <div className='h-40 bg-white rounded-xl border border-gray-200'></div>
        <div className='h-32 bg-white rounded-xl border border-gray-200'></div>
      </div>

      {/* Main Calendar Skeleton */}
      <div className='flex-1 bg-white rounded-xl border border-gray-200 p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div className='h-8 w-32 bg-gray-200 rounded'></div>
          <div className='flex gap-2'>
            <div className='h-8 w-8 bg-gray-200 rounded'></div>
            <div className='h-8 w-8 bg-gray-200 rounded'></div>
          </div>
        </div>
        <div className='grid grid-cols-8 gap-4 h-full'>
          <div className='col-span-1 space-y-4'>
            {[...Array(10)].map((_, i) => (
              <div key={i} className='h-4 w-12 bg-gray-100 rounded'></div>
            ))}
          </div>
          <div className='col-span-7 grid grid-cols-7 gap-1 h-full'>
             {[...Array(7)].map((_, i) => (
               <div key={i} className='bg-gray-50 rounded-lg h-full border border-gray-100'></div>
             ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const CalendarPage = () => {
  const currentUser = useSelector(selectCurrentUser)
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [invites, setInvites] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week')
  const [selectedFilter, setSelectedFilter] = useState('All Events')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [loading, setLoading] = useState(true)
  const [network, setNetwork] = useState([])
  const [syncInfo, setSyncInfo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvitees, setSelectedInvitees] = useState([])
  const [isSearchingConnections, setIsSearchingConnections] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [processingInviteId, setProcessingInviteId] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [timeFormat, setTimeFormat] = useState(
    localStorage.getItem('calendarTimeFormat') || '12'
  )
  
  // Form states for validation
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')

  // Handle window resize for mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch sync info
  useEffect(() => {
    const fetchSyncInfo = async () => {
      try {
        const res = await api.get('/events/sync-info')
        if (res.data.status === 'success') {
          setSyncInfo(res.data.data)
        }
      } catch (error) {
        console.error('Error fetching sync info:', error)
      }
    }
    fetchSyncInfo()
  }, [])

  // Helper for generating external calendar links
  const generateCalendarLink = (event, type) => {
    const title = encodeURIComponent(event.title)
    const desc = encodeURIComponent(event.description || '')
    const loc = encodeURIComponent(event.location?.address || event.virtualLocation?.link || '')
    
    // Format: YYYYMMDDTHHmmssZ
    const formatDate = (dateStr) => {
      const d = new Date(dateStr)
      return d.toISOString().replace(/-|:|\.\d+/g, '')
    }
    
    const start = formatDate(event.startDate)
    const end = formatDate(event.endDate)

    if (type === 'google') {
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${desc}&location=${loc}`
    } else if (type === 'outlook') {
      return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start}&enddt=${end}&body=${desc}&location=${loc}`
    }
    return '#'
  }

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [eventsRes, upcomingRes, invitesRes] = await Promise.all([
        api.get('/events'),
        api.get('/events/upcoming'),
        api.get('/events/invites'),
      ])

      setEvents((eventsRes.data?.data?.events || eventsRes.data?.events || []).map(e => ({ ...e, date: new Date(e.startDate) })))
      setUpcomingEvents(upcomingRes.data?.data?.events || upcomingRes.data?.events || [])
      setInvites(invitesRes.data?.data?.invitations || invitesRes.data?.invitations || [])
    } catch (error) {
      console.error('Error fetching calendar data:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchNetwork = async () => {
      if (!currentUser?._id) return
      try {
        const response = await api.get(`/connections/network/${currentUser._id}`)
        if (response.data.status === 'success') {
          setNetwork(response.data.data.connections || [])
        }
      } catch (error) {
        console.error('Error fetching network:', error)
      }
    }

    fetchData()
    fetchNetwork()
  }, [fetchData, currentUser])

  // Handle deep linking from URL
  useEffect(() => {
    const eventId = searchParams.get('eventId')
    if (eventId && events.length > 0 && !loading) {
      const event = events.find(e => e._id === eventId)
      if (event) {
        setSelectedEvent(event)
        setShowEventDetails(true)
      }
    }
  }, [searchParams, events, loading])

  // Handle ?action=create from URL
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsAddEventOpen(true)
      
      // Auto-populate invitee if provided
      const inviteeId = searchParams.get('inviteeId')
      const name = searchParams.get('name')
      const profileImage = searchParams.get('profileImage')
      
      if (inviteeId && name) {
        setSelectedInvitees([{
          _id: inviteeId,
          name: decodeURIComponent(name),
          profileImage: profileImage ? decodeURIComponent(profileImage) : null
        }])
      }
    }
  }, [searchParams])

  const handleRespond = async (eventId, status) => {
    setProcessingInviteId(eventId);
    
    toast.promise(api.patch(`/events/${eventId}/respond`, { status }), {
      loading: `Updating: ${status}...`,
      success: (response) => {
        if (response.data.status === 'success') {
          fetchData();
          return `Invitation ${status}`;
        }
        throw new Error(response.data.message || 'Failed to update invite');
      },
      error: 'Failed to respond to invitation',
      finally: () => setProcessingInviteId(null)
    });
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    try {
      await api.delete(`/events/${eventId}`)
      toast.success('Event deleted successfully')
      setShowEventDetails(false)
      fetchData()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    localStorage.setItem('calendarTimeFormat', timeFormat)
  }, [timeFormat])

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = isAddEventOpen || showEventDetails || showSuccessModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddEventOpen, showEventDetails, showSuccessModal]);

  // Events state is now handled above with fetchData

  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getEventColor = (type) => {
    switch (type) {
      case 'Video Call':
        return 'bg-blue-50 border-l-4 border-blue-500 text-[#163146]'
      case 'In-Person':
        return 'bg-green-50 border-l-4 border-green-500 text-[#163146]'
      case 'Phone Call':
        return 'bg-yellow-50 border-l-4 border-yellow-500 text-[#163146]'
      default:
        return 'bg-stone-50 border-l-4 border-stone-300 text-[#163146]'
    }
  }

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'Video Call':
        return <Video size={16} className="text-blue-500" />
      case 'In-Person':
        return <MapPin size={16} className="text-green-500" />
      case 'Phone Call':
        return <Phone size={16} className="text-yellow-500" />
      default:
        return <Info size={16} className="text-stone-400" />
    }
  }

  const downloadEventIcs = (event) => {
    if (!event?._id) return
    const formatIcalDate = (dateInput) => {
      const d = new Date(dateInput)
      if (Number.isNaN(d.getTime())) return ''
      return d.toISOString().replace(/-|:|\.\d+/g, '')
    }
    const escapeText = (value) =>
      String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')

    const location =
      event.location?.address || event.virtualLocation?.link || ''
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Signil//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event._id}@signil.com`,
      `DTSTAMP:${formatIcalDate(new Date())}`,
      `DTSTART:${formatIcalDate(event.startDate)}`,
      `DTEND:${formatIcalDate(event.endDate || event.startDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
      event.description
        ? `DESCRIPTION:${escapeText(event.description)}`
        : null,
      location ? `LOCATION:${escapeText(location)}` : null,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean)

    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-${event._id}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const formatTime = (dateInput) => {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12',
    })
  }

  const formatTimeSlotLabel = (time) => {
    const [h, m] = time.split(':').map(Number)
    const date = new Date(currentDate)
    date.setHours(h, m, 0, 0)
    return formatTime(date)
  }

  const getWeekDates = () => {
    const curr = new Date(currentDate)
    const first = curr.getDate() - curr.getDay()
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr.getFullYear(), curr.getMonth(), first + i))
    }
    return week
  }

  const weekDates = getWeekDates()
  const filteredEvents =
    selectedFilter === 'All Events'
      ? events
      : events.filter((e) => e.locationType === selectedFilter)

  const getEventPosition = (event) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate || start.getTime() + 3600000) // Default 1h if no end
    
    const startHours = start.getHours()
    const startMinutes = start.getMinutes()
    const topPercent = ((startHours * 60 + startMinutes) / (24 * 60)) * 100
    
    const endHours = end.getHours()
    const endMinutes = end.getMinutes()
    const durationMinutes = (end.getTime() - start.getTime()) / (60000)
    const heightPercent = (durationMinutes / (24 * 60)) * 100
    
    return { topPercent, heightPercent }
  }

  const getEventsForDate = (date) => {
    return filteredEvents.filter(
      (e) => new Date(e.startDate).toDateString() === date.toDateString()
    )
  }

  const monthDays = Array.from(
    { length: daysInMonth(currentDate) },
    (_, i) => i + 1
  )
  const emptyDays = Array.from(
    { length: firstDayOfMonth(currentDate) },
    (_, i) => i
  )

  const timeSlots = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, '0')}:00`
  )

  if (loading) {
    return (
      <DashboardLayout>
        <CalendarSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className='w-full h-full max-w-8xl mx-auto flex flex-col px-4 md:px-8 py-6 gap-6 bg-stone-50'>

        {/* Header */}
        <motion.div
          className='flex items-center justify-between'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className='flex items-center gap-3'>
            <motion.button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className='md:hidden p-2 hover:bg-gray-200 rounded-lg'
              whileHover={{ scale: 1.1 }}
            >
              <Menu size={24} />
            </motion.button>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-[#163146]'>
                {localStorage.getItem('userName') || 'User'}'s Calendar
              </h1>
              <p className='text-stone-500 text-xs md:text-sm mt-1'>
                {events.filter(e => e.date.toDateString() === new Date().toDateString()).length > 0 
                  ? `You've got a busy day ahead with ${events.filter(e => e.date.toDateString() === new Date().toDateString()).length} events lined up.` 
                  : "Your calendar's clear! Take the day to prepare or schedule something new."}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 md:gap-3'>
            <div className='hidden md:flex gap-2'>
              {['day', 'week', 'monthly'].map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-[#163146] text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {mode === 'day' ? 'Day' : mode === 'week' ? 'Week' : 'Month'}
                </motion.button>
              ))}
            </div>

            <div className='hidden md:flex items-center gap-2'>
              <span className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider'>
                Time
              </span>
              <motion.button
                onClick={() =>
                  setTimeFormat((prev) => (prev === '12' ? '24' : '12'))
                }
                className='relative w-24 h-9 rounded-full bg-stone-50 border border-stone-200 flex items-center px-1.5 transition-colors hover:bg-white'
                aria-pressed={timeFormat === '24'}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  className={`absolute top-1 left-1 w-11 h-7 rounded-full bg-[#163146] transition-transform ${
                    timeFormat === '24' ? 'translate-x-11' : ''
                  }`}
                />
                <span
                  className={`relative z-10 w-1/2 text-center text-[11px] font-bold transition-colors ${
                    timeFormat === '12' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  12h
                </span>
                <span
                  className={`relative z-10 w-1/2 text-center text-[11px] font-bold transition-colors ${
                    timeFormat === '24' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  24h
                </span>
              </motion.button>
            </div>

            <motion.button
              onClick={() => setIsAddEventOpen(true)}
              className='flex items-center gap-2 px-3 md:px-4 py-2 bg-[#163146] text-white rounded-lg font-medium hover:bg-[#0f2a36] transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              <span className='hidden md:inline'>Add Event</span>
            </motion.button>
          </div>
        </motion.div>

        <div className='flex gap-4 md:gap-6 flex-1 overflow-hidden'>
          {/* Left Sidebar - Hidden on mobile unless opened */}
          <AnimatePresence>
            {(isMobile ? isSidebarOpen : true) && (
              <div
                className='fixed md:relative inset-0 md:inset-auto bg-black/50 md:bg-transparent z-30 md:z-0 flex'
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <div
                  className='w-72 md:w-72 bg-white flex flex-col gap-4 overflow-y-auto'
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMobile && (
                    <div className='flex justify-between items-center p-4 border-b border-gray-200'>
                      <h2 className='font-semibold text-gray-900'>Menu</h2>
                      <motion.button
                        onClick={() => setIsSidebarOpen(false)}
                        className='p-1 hover:bg-gray-100 rounded-lg'
                      >
                        <X size={20} />
                      </motion.button>
                    </div>
                  )}

                  {/* Mini Calendar */}
                  <div className='md:rounded-xl md:border md:border-gray-200 md:shadow-sm bg-white p-4 md:p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {currentDate.toLocaleDateString('en-US', {
                            month: 'long',
                          })}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {currentDate.getFullYear()}
                        </p>
                      </div>
                      <div className='flex gap-1'>
                        <motion.button
                          onClick={() =>
                            setCurrentDate(
                              new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth() - 1
                              )
                            )
                          }
                          className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                          whileHover={{ scale: 1.1 }}
                        >
                          <ChevronLeft size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            setCurrentDate(
                              new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth() + 1
                              )
                            )
                          }
                          className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                          whileHover={{ scale: 1.1 }}
                        >
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>

                    <div className='grid grid-cols-7 gap-2 mb-3'>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                        (day) => (
                          <div
                            key={day}
                            className='text-center text-xs font-semibold text-gray-500 py-2'
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    <div className='grid grid-cols-7 gap-2'>
                      {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {monthDays.map((day) => {
                        const dateStr = new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day
                        ).toDateString()
                        const dayEvents = filteredEvents.filter(
                          (e) => e.date.toDateString() === dateStr
                        )
                        const isSelected = day === currentDate.getDate()

                        return (
                          <motion.button
                            key={day}
                            onClick={() => {
                              setCurrentDate(
                                new Date(
                                  currentDate.getFullYear(),
                                  currentDate.getMonth(),
                                  day
                                )
                              )
                              if (isMobile) setIsSidebarOpen(false)
                            }}
                            className={`relative p-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#163146] text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {day}
                            {dayEvents.length > 0 && (
                              <div className='absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5'>
                                {dayEvents.slice(0, 3).map((e, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1 h-1 rounded-full ${
                                      e.locationType === 'Video Call'
                                        ? 'bg-blue-500'
                                        : e.locationType === 'In-Person'
                                        ? 'bg-green-500'
                                        : 'bg-yellow-500'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sync Settings Widget - Enhanced & Promoted */}
                  <div className="md:rounded-xl md:border md:border-stone-100 bg-stone-50/50 p-4 md:p-4 border-l-4 border-l-[#986a41]">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 bg-[#986a41]/10 rounded-lg text-[#986a41]">
                          <Smartphone size={16} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-[#163146] uppercase tracking-wider">System Sync</p>
                          <p className="text-[9px] text-stone-400 font-medium">Sync with your device calendar</p>
                       </div>
                    </div>
                    {syncInfo ? (
                      <div className="space-y-3">
                         <a 
                           href={syncInfo.syncUrl}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#986a41] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#855a36] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                         >
                           <Share size={14} />
                           Sync My Schedule
                         </a>
                         <a
                           href={syncInfo.downloadUrl}
                           download="calendar.ics"
                           className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#986a41] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all border border-[#986a41]/30"
                         >
                           <Download size={14} />
                           Download .ics
                         </a>
                         <p className="text-[8px] text-stone-400 text-center leading-relaxed px-1">
                           One-click sync to your native system calendar.
                         </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                         <Loader2 size={20} className="animate-spin text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Event Type Filter */}
                  <div className='md:rounded-xl md:border md:border-gray-200 md:shadow-sm bg-white p-4 md:p-4'>
                    <h3 className='font-semibold text-gray-900 mb-3 text-sm'>
                      Event Type
                    </h3>
                    <div className='space-y-2'>
                      {[
                        {
                          id: 'all',
                          value: 'All Events',
                          label: 'All Events',
                          color: 'bg-gray-500',
                        },
                        {
                          id: 'video',
                          value: 'Video Call',
                          label: 'Video Call',
                          color: 'bg-blue-500',
                        },
                        {
                          id: 'in-person',
                          value: 'In-Person',
                          label: 'In-Person',
                          color: 'bg-green-500',
                        },
                        {
                          id: 'phone',
                          value: 'Phone Call',
                          label: 'Phone Call',
                          color: 'bg-yellow-500',
                        },
                      ].map((filter) => (
                        <label
                          key={filter.id}
                          className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors'
                        >
                          <input
                            type='radio'
                            name='filter'
                            value={filter.value}
                            checked={selectedFilter === filter.value}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className='w-4 h-4'
                          />
                          <div
                            className={`w-3 h-3 rounded-full ${filter.color}`}
                          />
                          <span className='text-sm text-gray-700'>
                            {filter.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Events Widget */}
                  <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex-1 overflow-y-auto flex flex-col min-h-[200px]'>
                    <h3 className='font-semibold text-[#163146] mb-3 text-sm'>
                      Upcoming Events
                    </h3>
                    <div className='space-y-3'>
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event) => (
                          <motion.button
                            key={event._id}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventDetails(true)
                            }}
                            className={`w-full p-3 rounded-lg text-left border-l-4 ${getEventColor(
                              event.locationType
                            )} hover:shadow-md transition-all flex gap-3 items-center bg-stone-50/50`}
                            whileHover={{ x: 4 }}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 bg-gradient-to-br ${getAvatarColor(event.creator)}`}>
                              {event.creator?.profileImage ? (
                                <img 
                                  src={getImageUrl(event.creator.profileImage)} 
                                  alt={event.creator.name} 
                                  className="w-full h-full rounded-full object-cover border border-white/20"
                                />
                              ) : (
                                <span>{getInitials(event.creator?.name || 'User')}</span>
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <p className='font-semibold text-xs text-[#163146] truncate w-full'>{event.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="w-0.5 h-0.5 bg-stone-300 rounded-full"></span>
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {formatTime(event.startDate)}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <p className="text-xs text-stone-400 text-center py-4">No upcoming events</p>
                      )}
                    </div>
                  </div>

                  {/* Invites Widget */}
                  <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col'>
                    <h3 className='font-semibold text-[#163146] mb-3 text-sm'>
                      Invites
                    </h3>
                    <div className='space-y-3'>
                      {invites.filter(inv => inv.event?.creator?._id !== currentUser?._id).length > 0 ? (
                        invites
                          .filter(inv => inv.event?.creator?._id !== currentUser?._id)
                          .map((invite) => (
                          <div key={invite._id} className="p-3 rounded-lg border border-stone-100 flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                               <img 
                                 src={getImageUrl(invite.event?.creator?.profileImage) || '/default-avatar.png'} 
                                 alt="" 
                                 className="w-8 h-8 rounded-full border border-stone-200"
                               />
                               <div className="overflow-hidden">
                                 <p className="text-xs font-semibold text-[#163146] truncate">{invite.event?.title}</p>
                                 <p className="text-[10px] text-stone-500 truncate">From: {invite.event?.creator?.name}</p>
                               </div>
                             </div>
                             <div className="flex gap-1">
                               <button 
                                 disabled={processingInviteId === invite.event?._id}
                                 onClick={() => handleRespond(invite.event?._id, 'accepted')}
                                 className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
                               >
                                 {processingInviteId === invite.event?._id ? (
                                   <Loader2 size={14} className="animate-spin" />
                                 ) : (
                                   <Check size={14} />
                                 )}
                               </button>
                               <button 
                                 disabled={processingInviteId === invite.event?._id}
                                 onClick={() => handleRespond(invite.event?._id, 'declined')}
                                 className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                                >
                                 {processingInviteId === invite.event?._id ? (
                                   <Loader2 size={14} className="animate-spin" />
                                 ) : (
                                   <Trash2 size={14} />
                                 )}
                               </button>
                             </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-400 text-center py-2">No pending invites</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Main Calendar - Week View */}
          {viewMode === 'week' && (
            <motion.div
              className='flex-1 bg-white rounded-xl border border-gray-200 p-3 md:p-6 shadow-sm flex flex-col overflow-hidden'
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Week Header */}
              <div className='mb-2 md:mb-4 flex items-center justify-between'>
                <h2 className='text-lg md:text-2xl font-bold text-gray-900'>
                  {weekDates[0].toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {weekDates[6].toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                <div className='flex gap-1'>
                  <motion.button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    whileHover={{ scale: 1.1 }}
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <motion.button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
                        )
                      )
                    }
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    whileHover={{ scale: 1.1 }}
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Days Header - Hidden on mobile */}
              <div className='hidden md:grid grid-cols-8 gap-1 mb-4 pb-4 border-b border-gray-200'>
                <div className='text-sm font-semibold text-gray-500'>Time</div>
                {weekDates.map((date) => (
                  <div key={date.toDateString()} className='text-center'>
                    <p className='text-sm font-semibold text-gray-900'>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {date.getDate().toString().padStart(2, '0')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mobile Week View - Stacked vertical */}
              {isMobile && (
                <div className='flex-1 overflow-y-auto'>
                  {weekDates.map((date) => (
                    <div key={date.toDateString()} className='mb-4'>
                      <h3 className='font-semibold text-gray-900 mb-2 text-sm'>
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className='space-y-2'>
                        {getEventsForDate(date).length > 0 ? (
                          getEventsForDate(date).map((event) => (
                            <motion.button
                              key={event.id}
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowEventDetails(true)
                              }}
                              className={`w-full p-3 rounded-lg text-left text-xs border-l-4 ${getEventColor(
                                event.locationType
                              )}`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <p className='font-semibold'>{event.title}</p>
                              <p className='text-xs opacity-75 mt-1'>
                                {formatTime(event.startDate)} — {formatTime(event.endDate)}
                              </p>
                              <p className='text-xs opacity-75'>
                                {event.creator?.name || 'Unknown'}
                              </p>
                            </motion.button>
                          ))
                        ) : (
                          <p className='text-xs text-gray-400 text-center py-3'>
                            No events
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Desktop Week Grid */}
              <div className='hidden md:flex flex-1 overflow-y-auto relative'>
                <div className='grid grid-cols-8 gap-1 relative w-full'>
                  {/* Time Column */}
                  <div className='sticky left-0 bg-white z-10'>
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className='h-16 text-xs text-gray-500 font-semibold border-b border-gray-100 flex items-start pt-1'
                          >
                            {formatTimeSlotLabel(time)}
                          </div>
                        ))}
                  </div>

                  {/* Days Grid */}
                  {weekDates.map((date) => (
                    <div key={date.toDateString()} className='relative'>
                      {/* Hour slots background */}
                      {timeSlots.map((time) => (
                        <div
                          key={time}
                          className='h-16 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer'
                        />
                      ))}

                      {/* Events */}
                      <div className='absolute inset-0 pointer-events-none'>
                        {getEventsForDate(date).map((event) => {
                          const { topPercent, heightPercent } =
                            getEventPosition(event)
                          return (
                            <motion.button
                              key={event.id}
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowEventDetails(true)
                              }}
                              className={`absolute left-0.5 right-0.5 p-2 rounded-lg text-left text-xs pointer-events-auto cursor-pointer ${getEventColor(
                                event.locationType
                              )}`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${Math.max(heightPercent, 8)}%`,
                              }}
                              whileHover={{ scale: 1.05, zIndex: 10 }}
                            >
                              <p className='font-semibold truncate'>
                                {formatTime(event.startDate)}
                              </p>
                              <p className='font-medium truncate'>
                                {event.title}
                              </p>
                              <p className='text-xs opacity-75 truncate'>
                                {event.creator?.name || 'Unknown'}
                              </p>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <motion.div
              className='flex-1 bg-white rounded-xl border border-gray-200 p-3 md:p-6 shadow-sm overflow-y-auto'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className='text-lg md:text-2xl font-bold text-gray-900 mb-4'>
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <div className='space-y-3'>
                {filteredEvents
                  .filter(
                    (e) => e.date.toDateString() === currentDate.toDateString()
                  )
                  .map((event) => (
                    <motion.button
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventDetails(true)
                      }}
                      className={`w-full p-4 rounded-lg border-l-4 text-left ${getEventColor(
                        event.locationType
                      )}`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='font-semibold text-base md:text-lg flex items-center gap-2'>
                            {getEventTypeIcon(event.locationType)}
                            {event.title}
                          </p>
                          <p className='text-sm opacity-75 mt-1'>
                            {formatTime(event.startDate)} — {formatTime(event.endDate)}
                          </p>
                          <p className='text-sm opacity-75'>
                            {event.creator?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Monthly View */}
          {viewMode === 'monthly' && (
            <motion.div
              className='flex-1 bg-white rounded-xl border border-gray-200 p-3 md:p-6 shadow-sm flex flex-col overflow-hidden'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg md:text-2xl font-bold text-[#163146]'>
                  {currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <div className='flex gap-1'>
                  <motion.button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className='p-2 hover:bg-stone-50 rounded-lg transition-colors'
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <motion.button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className='p-2 hover:bg-stone-50 rounded-lg transition-colors'
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              </div>

              <div className='grid grid-cols-7 gap-px bg-stone-100 flex-1 border border-stone-100 rounded-lg overflow-hidden'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className='bg-stone-50 p-2 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest'>
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => (
                  <div key={`empty-${i}`} className='bg-white h-full border-t border-stone-50' />
                ))}

                {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div 
                      key={day} 
                      className={`bg-white min-h-[80px] md:min-h-[120px] p-2 border-t border-l border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer group`}
                      onClick={() => {
                        setCurrentDate(date);
                        setViewMode('day');
                      }}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'bg-[#163146] text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-stone-400 group-hover:text-[#163146]'}`}>
                        {day}
                      </span>
                      <div className='mt-2 space-y-1'>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div 
                            key={event._id}
                            className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded truncate ${getEventColor(event.locationType)}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[8px] text-stone-400 font-medium pl-1">+{dayEvents.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAddEventOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/20 backdrop-blur-md flex items-end md:items-center justify-center z-50 md:p-4'
            onClick={() => setIsAddEventOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'
            >
              <div className="bg-[#163146] p-6 text-white flex justify-between items-center rounded-t-2xl">
                 <div>
                    <h2 className='text-lg font-bold'>Create Event</h2>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">New Schedule Entry</p>
                 </div>
                 <motion.button
                  onClick={() => setIsAddEventOpen(false)}
                  className='p-2 hover:bg-white/10 rounded-full transition-colors'
                  whileHover={{ rotate: 90 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <form className='p-6 space-y-5' onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                  // Reconstruct dates from split fields
                  const startDateTime = `${data.startDate}T${formStartTime}`;
                  const endDateTime = formEndTime ? `${data.startDate}T${formEndTime}` : startDateTime;

                  // Validation: Start time must be before End time
                  if (formStartTime >= formEndTime) {
                    toast.error('End time must be after start time');
                    return;
                  }

                  // Conflict Detection
                  const newStart = new Date(startDateTime).getTime();
                  const newEnd = new Date(endDateTime).getTime();

                  const hasConflict = events.some(existingEvent => {
                    // Skip if event is declined (optional, but good UX)
                    // if (existingEvent.invitationStatus === 'declined') return false; 

                    const existingStart = new Date(existingEvent.startDate).getTime();
                    const existingEnd = new Date(existingEvent.endDate || existingEvent.startDate).getTime();

                    // Check for overlap: (StartA < EndB) && (EndA > StartB)
                    return (newStart < existingEnd && newEnd > existingStart);
                  });

                  if (hasConflict) {
                    toast.error('Time slot conflict! You already have an event scheduled for this time.');
                    return;
                  }

                  setIsCreatingEvent(true);
                  const inviteCount = selectedInvitees.length;

                  toast.promise(api.post('/events', {
                    title: data.title,
                    description: data.description,
                    eventType: data.eventType || 'meeting',
                    locationType: data.locationType,
                    location: data.locationType === 'In-Person' ? { address: data.location } : undefined,
                    virtualLocation: data.locationType !== 'In-Person' ? { link: data.location } : undefined,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    inviteeIds: selectedInvitees.map(i => i._id),
                  }), {
                    loading: 'Creating event...',
                    success: () => {
                      setIsAddEventOpen(false);
                      setSelectedInvitees([]);
                      setSearchTerm('');
                      setFormStartTime('09:00');
                      setFormEndTime('10:00');
                      fetchData();
                      setShowSuccessModal(true); // Show the beautiful success modal
                      return inviteCount > 0 
                        ? `Event created! Invitations sent to ${inviteCount} ${inviteCount === 1 ? 'person' : 'people'}.`
                        : 'Event created successfully';
                    },
                    error: (err) => {
                      console.error('Error creating event:', err);
                      return 'Failed to create event';
                    },
                    finally: () => setIsCreatingEvent(false)
                  });
                } catch (error) {
                  console.error('Error in form submission:', error);
                  setIsCreatingEvent(false);
                }
              }}>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Event Name</label>
                  <input
                    name='title'
                    required
                    type='text'
                    placeholder='What are we doing?'
                    className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Category</label>
                    <div className="relative">
                      <select 
                        name='eventType'
                        className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm appearance-none'
                      >
                        <option value="meeting">Meeting</option>
                        <option value="networking">Networking</option>
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="meetup">Meetup</option>
                        <option value="conference">Conference</option>
                      </select>
                    </div>
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Venue</label>
                    <select 
                      name='locationType'
                      className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm appearance-none'
                    >
                      <option>Video Call</option>
                      <option>In-Person</option>
                      <option>Phone Call</option>
                    </select>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Date</label>
                  <div className="relative flex items-center">
                    <CalendarIcon className="absolute left-4 text-[#986a41]" size={14} />
                    <input
                      name='startDate'
                      required
                      type='date'
                      className='w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                   <div className='space-y-1.5'>
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Starts</label>
                    <div className="relative flex items-center">
                      <Clock className="absolute left-4 text-[#986a41]" size={14} />
                      <select
                        name='startTime'
                        required
                        value={formStartTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setFormStartTime(newStart);
                          // Automatically adjust end time if it's now before start
                          if (newStart >= formEndTime) {
                            const [h, m] = newStart.split(':').map(Number);
                            let endH = h;
                            let endM = m + 30;
                            if (endM >= 60) {
                              endH += 1;
                              endM -= 60;
                            }
                            if (endH < 24) {
                              setFormEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
                            }
                          }
                        }}
                        className='w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm appearance-none'
                      >
                        {Array.from({ length: 48 }).map((_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          return <option key={time} value={time}>{time}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Ends</label>
                    <div className="relative flex items-center">
                      <Clock className="absolute left-4 text-[#986a41]" size={14} />
                      <select
                        name='endTime'
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className='w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm appearance-none'
                      >
                        {Array.from({ length: 48 }).map((_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          return (
                            <option 
                              key={time} 
                              value={time}
                              disabled={time <= formStartTime}
                              className={time <= formStartTime ? 'text-stone-300' : ''}
                            >
                              {time}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Where</label>
                  <input
                    name='location'
                    type='text'
                    placeholder='Zoom link, address or phone...'
                    className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Guests</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {selectedInvitees.map(user => (
                        <div key={user._id} className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-full text-[11px] font-bold text-[#163146] border border-stone-200">
                          <img src={getImageUrl(user.profileImage) || '/default-avatar.png'} className="w-4 h-4 rounded-full" alt="" />
                          {user.name}
                          <button 
                            type="button"
                            onClick={() => setSelectedInvitees(prev => prev.filter(i => i._id !== user._id))}
                            className="hover:text-red-500"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="relative group/search z-[20]">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/search:text-[#986a41] transition-colors" />
                      <input
                        type="text"
                        placeholder="Search connections..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsSearchingConnections(true);
                        }}
                        onBlur={() => setTimeout(() => setIsSearchingConnections(false), 200)}
                        onFocus={() => setIsSearchingConnections(true)}
                        className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm"
                      />
                      {isSearchingConnections && (searchTerm.length > 0 || network.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-xl shadow-xl z-[60] py-2 max-h-48 overflow-y-auto">
                          {network
                            .filter(item => {
                              const name = item.connectedUser?.name || '';
                              const id = item.connectedUser?.userId;
                              return name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedInvitees.find(i => i._id === id);
                            })
                            .map(item => {
                              const user = item.connectedUser;
                              return (
                                <button
                                  key={user.userId}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInvitees(prev => [...prev, { _id: user.userId, name: user.name, profileImage: user.profileImage }]);
                                    setSearchTerm('');
                                  }}
                                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-stone-50 text-left transition-colors"
                                >
                                  <img src={getImageUrl(user.profileImage) || '/default-avatar.png'} className="w-8 h-8 rounded-full shadow-sm" alt="" />
                                  <div>
                                    <p className="text-xs font-bold text-[#163146]">{user.name}</p>
                                    <p className="text-[10px] text-stone-400 font-medium">{user.title || user.userType || 'Member'}</p>
                                  </div>
                                </button>
                              );
                            })
                          }
                          {network.filter(item => {
                            const name = item.connectedUser?.name || '';
                            const id = item.connectedUser?.userId;
                            return name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedInvitees.find(i => i._id === id);
                          }).length === 0 && (
                            <p className="px-4 py-2 text-[10px] text-stone-400 font-bold uppercase text-center">No connections found</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                <div className='flex gap-3 pt-2'>
                  <button 
                    type='button'
                    onClick={() => setIsAddEventOpen(false)}
                    className='flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-stone-600 text-sm font-bold hover:bg-stone-50 transition-colors'
                  >
                    Cancel
                  </button>
                  <button 
                    type='submit'
                    disabled={isCreatingEvent}
                    className='flex-2 px-4 py-2.5 bg-[#163146] text-white rounded-xl text-sm font-bold hover:bg-[#0f2a36] shadow-lg shadow-[#163146]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                  >
                    {isCreatingEvent ? (
                      <>
                        <Loader2 size={16} className='animate-spin' />
                        Creating...
                      </>
                    ) : (
                      'Create Event'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventDetails && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/20 backdrop-blur-md flex items-end md:items-center justify-center z-50 md:p-4'
            onClick={() => setShowEventDetails(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden'
            >
              <div className="relative h-32 bg-[#163146] p-8">
                 <motion.button
                  onClick={() => setShowEventDetails(false)}
                  className='absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors'
                  whileHover={{ rotate: 90 }}
                >
                  <X size={20} />
                </motion.button>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                      {getEventTypeIcon(selectedEvent.locationType)}
                   </div>
                   <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
                </div>
              </div>

              <div className='p-8 space-y-6'>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       {selectedEvent.creator?.profileImage ? (
                         <img 
                           src={getImageUrl(selectedEvent.creator?.profileImage)} 
                           alt="" 
                           className="w-12 h-12 rounded-full border-2 border-stone-100 object-cover"
                         />
                       ) : (
                         <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(selectedEvent.creator)} flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-sm`}>
                            {getInitials(selectedEvent.creator?.name)}
                         </div>
                       )}
                      <div>
                         <p className="text-sm font-bold text-[#163146]">{selectedEvent.creator?.name}</p>
                         <p className="text-xs text-stone-500">Host</p>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                         {selectedEvent.locationType}
                      </div>
                      {selectedEvent.creator?._id === currentUser?._id && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(selectedEvent._id);
                          }}
                          className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                        >
                          Delete Event
                        </button>
                      )}
                   </div>
                </div>

                <div className='grid grid-cols-2 gap-6 py-4 border-y border-stone-100'>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-400 font-bold uppercase overflow-hidden whitespace-nowrap">Date & Time</p>
                    <div className="flex items-center gap-2 text-sm text-[#163146] font-medium">
                       <CalendarIcon size={14} className="text-[#986a41]" />
                       {new Date(selectedEvent.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#163146] font-medium">
                       <Clock size={14} className="text-[#986a41]" />
                       {new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Location</p>
                    <div className="flex items-center gap-2 text-sm text-[#163146] font-medium">
                       <MapPin size={14} className="text-[#986a41]" />
                       <span className="truncate">{selectedEvent.location?.address || selectedEvent.virtualLocation?.link || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] text-stone-400 font-bold uppercase">Description</p>
                   <p className="text-sm text-stone-600 leading-relaxed">
                      {selectedEvent.description || "No description provided for this event."}
                   </p>
                </div>

                {/* RSVP Attendee List (Host Only) */}
                {selectedEvent.creator?._id === currentUser?._id && selectedEvent.attendees?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-stone-400 font-bold uppercase">Attendees ({selectedEvent.attendees.length})</p>
                       <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                             <span className="text-[9px] text-stone-400 font-bold">{selectedEvent.attendees.filter(a => a.status === 'accepted').length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                             <span className="text-[9px] text-stone-400 font-bold">{selectedEvent.attendees.filter(a => a.status === 'pending').length}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden items-center">
                       {selectedEvent.attendees.slice(0, 5).map((att, i) => (
                         <div key={i} className="relative group">
                           {att.invitee?.profileImage ? (
                             <img 
                               src={getImageUrl(att.invitee.profileImage)} 
                               className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm hover:scale-110 transition-transform" 
                               title={`${att.invitee.name} (${att.status})`}
                             />
                           ) : (
                             <div 
                               className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${getAvatarColor(att.invitee)} flex items-center justify-center text-[10px] text-white font-black hover:scale-110 transition-transform`}
                               title={`${att.invitee?.name} (${att.status})`}
                             >
                                {getInitials(att.invitee?.name)}
                             </div>
                           )}
                           <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                             att.status === 'accepted' ? 'bg-green-500' : 
                             att.status === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                           }`} />
                         </div>
                       ))}
                       {selectedEvent.attendees.length > 5 && (
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
                           +{selectedEvent.attendees.length - 5}
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* Add to External Calendars */}
                <div className="flex items-center gap-3 pt-2">
                   <a 
                     href={generateCalendarLink(selectedEvent, 'google')} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-colors"
                   >
                     <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale group-hover:grayscale-0" alt="" />
                     Google
                   </a>
                   <a 
                     href={generateCalendarLink(selectedEvent, 'outlook')} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-colors"
                   >
                     <img src="https://outlook.live.com/favicon.ico" className="w-3 h-3 grayscale group-hover:grayscale-0" alt="" />
                     Outlook
                   </a>
                   <button
                     onClick={() => downloadEventIcs(selectedEvent)}
                     className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#163146] hover:bg-[#0f2a36] border border-[#163146] rounded-xl text-[10px] font-bold text-white transition-colors"
                     title="Save to Calendar"
                   >
                     <Smartphone size={12} />
                     Save to Calendar
                   </button>
                </div>

                {selectedEvent.attachments?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                       {selectedEvent.attachments.map((file, idx) => (
                         <div key={idx} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-100">
                            <File size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-600">Document_{idx + 1}.pdf</span>
                            <LinkIcon size={12} className="text-[#986a41] cursor-pointer" />
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Actions - Only show if current user is an invitee and hasn't responded yet, or show status */}
                {selectedEvent.creator?._id !== currentUser?._id && invites.some(inv => inv.event?._id === selectedEvent._id) ? (
                  <div className='flex gap-4 pt-4'>
                    <button 
                      disabled={processingInviteId === selectedEvent._id}
                      onClick={() => handleRespond(selectedEvent._id, 'declined')}
                      className='flex-1 px-6 py-3 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50 transition-colors disabled:opacity-50 flex items-center justify-center'
                    >
                      {processingInviteId === selectedEvent._id ? <Loader2 size={18} className="animate-spin" /> : 'Decline'}
                    </button>
                    <button 
                      disabled={processingInviteId === selectedEvent._id}
                      onClick={() => handleRespond(selectedEvent._id, 'accepted')}
                      className='flex-1 px-6 py-3 bg-[#163146] text-white rounded-xl font-semibold hover:bg-[#0f2a36] shadow-lg shadow-[#163146]/20 transition-all disabled:opacity-50 flex items-center justify-center'
                    >
                      {processingInviteId === selectedEvent._id ? <Loader2 size={18} className="animate-spin" /> : 'Accept'}
                    </button>
                  </div>
                ) : selectedEvent.creator?._id === currentUser?._id ? (
                  <div className='pt-4'>
                    <div className='w-full py-3 bg-stone-50 border border-stone-100 rounded-xl text-stone-500 font-bold text-[10px] uppercase tracking-widest text-center'>
                      You are the host
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal (Invitation Sent) */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-[#163146]/60 backdrop-blur-xl flex items-end md:items-center justify-center z-[100] md:p-4'
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center space-y-6 relative'
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#163146] via-[#163146] to-[#986a41]" />
                
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                  className="w-20 h-20 bg-[#986a41]/10 rounded-full flex items-center justify-center mx-auto text-[#163146]"
                >
                  <PartyPopper size={40} />
                </motion.div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#163146]">Invitation Sent!</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Your event has been successfully scheduled and invitations have been sent to all participants.
                </p>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-[#163146] text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 transition-all"
                >
                  Awesome!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

export default CalendarPage
