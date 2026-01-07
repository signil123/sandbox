// File: client/src/pages/Calendar/CalendarPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Calendar as CalendarIcon,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    File,
    Filter,
    Info,
    Link as LinkIcon,
    MapPin,
    Menu,
    Phone,
    Plus,
    Search,
    Settings,
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

const CalendarPage = () => {
  const currentUser = useSelector(selectCurrentUser)
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvitees, setSelectedInvitees] = useState([])
  const [isSearchingConnections, setIsSearchingConnections] = useState(false)

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

  const handleRespond = async (eventId, status) => {
    const action = status === 'accepted' ? 'accept' : 'decline'
    if (!window.confirm(`Are you sure you want to ${action} this event?`)) return

    try {
      await api.patch(`/events/${eventId}/respond`, { status })
      toast.success(`Successfully ${status} the invitation`)
      fetchData()
    } catch (error) {
      console.error('Error responding to invite:', error)
      toast.error('Failed to respond to invitation')
    }
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

  return (
    <DashboardLayout>
      <div className='w-full h-full max-w-8xl mx-auto flex flex-col px-4 md:px-8 py-6 gap-6 bg-stone-50'>
        {loading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-[#163146] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

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
                        const dayEvents = events.filter(
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

                  {/* Event Type Filter */}
                  <div className='md:rounded-xl md:border md:border-gray-200 md:shadow-sm bg-white p-4 md:p-4'>
                    <h3 className='font-semibold text-gray-900 mb-3 text-sm'>
                      Event Type
                    </h3>
                    <div className='space-y-2'>
                      {[
                        {
                          id: 'all',
                          label: 'All Events',
                          color: 'bg-gray-500',
                        },
                        {
                          id: 'video',
                          label: 'Video Call',
                          color: 'bg-blue-500',
                        },
                        {
                          id: 'in-person',
                          label: 'In-Person',
                          color: 'bg-green-500',
                        },
                        { id: 'call', label: 'Call', color: 'bg-yellow-500' },
                      ].map((filter) => (
                        <label
                          key={filter.id}
                          className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors'
                        >
                          <input
                            type='radio'
                            name='filter'
                            value={filter.id}
                            checked={selectedFilter === filter.id}
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
                            )} hover:shadow-md transition-all flex gap-3`}
                            whileHover={{ x: 4 }}
                          >
                            <img 
                              src={getImageUrl(event.creator?.profileImage) || '/default-avatar.png'} 
                              alt="" 
                              className="w-8 h-8 rounded-full border border-stone-200 object-cover"
                            />
                            <div>
                              <p className='font-semibold text-xs text-[#163146]'>{event.title}</p>
                              <p className='text-[10px] text-stone-500 mt-0.5'>
                                {new Date(event.startDate).toLocaleDateString()} • {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
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
                      {invites.length > 0 ? (
                        invites.map((invite) => (
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
                                 onClick={() => handleRespond(invite.event?._id, 'accepted')}
                                 className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                               >
                                 <Check size={14} />
                               </button>
                               <button 
                                 onClick={() => handleRespond(invite.event?._id, 'declined')}
                                 className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                               >
                                 <Trash2 size={14} />
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
                                event.type
                              )}`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <p className='font-semibold'>{event.title}</p>
                              <p className='text-xs opacity-75 mt-1'>
                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        className='h-16 text-xs text-gray-500 font-semibold pt-1 pb-16 border-b border-gray-100'
                      >
                        {time}
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
                                event.type
                              )}`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${Math.max(heightPercent, 8)}%`,
                              }}
                              whileHover={{ scale: 1.05, zIndex: 10 }}
                            >
                              <p className='font-semibold truncate'>
                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        event.type
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
                            {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            className='fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4'
            onClick={() => setIsAddEventOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-2xl max-w-md w-full'
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
                  const startDateTime = `${data.startDate}T${data.startTime}`;
                  const endDateTime = data.endTime ? `${data.startDate}T${data.endTime}` : startDateTime;

                  await api.post('/events', {
                    title: data.title,
                    description: data.description,
                    eventType: data.eventType || 'meeting',
                    locationType: data.locationType,
                    location: data.locationType === 'In-Person' ? { address: data.location } : undefined,
                    virtualLocation: data.locationType !== 'In-Person' ? { link: data.location } : undefined,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    inviteeIds: selectedInvitees.map(i => i._id),
                  });
                  toast.success('Event created successfully');
                  setIsAddEventOpen(false);
                  setSelectedInvitees([]);
                  setSearchTerm('');
                  fetchData();
                } catch (error) {
                  console.error('Error creating event:', error);
                  toast.error('Failed to create event');
                }
              }}>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Title</label>
                  <input
                    name='title'
                    required
                    type='text'
                    placeholder='Event title...'
                    className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Type</label>
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
                    <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Location Type</label>
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
                </div>

                <div className='space-y-1.5'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Location details</label>
                  <input
                    name='location'
                    type='text'
                    placeholder='Zoom link, address or phone...'
                    className='w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all text-sm'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-[10px] font-bold text-stone-400 uppercase tracking-widest'>Invite Connections</label>
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
                    className='flex-2 px-4 py-2.5 bg-[#163146] text-white rounded-xl text-sm font-bold hover:bg-[#0f2a36] shadow-lg shadow-[#163146]/20 transition-all'
                  >
                    Create Event
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
            className='fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4'
            onClick={() => setShowEventDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden'
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
                      <img 
                        src={getImageUrl(selectedEvent.creator?.profileImage) || '/default-avatar.png'} 
                        alt="" 
                        className="w-12 h-12 rounded-full border-2 border-stone-100"
                      />
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

                <div className='flex gap-4 pt-4'>
                  <button 
                    onClick={() => handleRespond(selectedEvent._id, 'declined')}
                    className='flex-1 px-6 py-3 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50 transition-colors'
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleRespond(selectedEvent._id, 'accepted')}
                    className='flex-1 px-6 py-3 bg-[#163146] text-white rounded-xl font-semibold hover:bg-[#0f2a36] shadow-lg shadow-[#163146]/20 transition-all'
                  >
                    Accept
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

export default CalendarPage
