// File: client/src/pages/Calendar/CalendarPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Menu,
  Phone,
  Plus,
  Users,
  Video,
  X,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import DashboardLayout from '../Layout/DashboardLayout'

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 5))
  const [viewMode, setViewMode] = useState('week')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Team Sync',
      type: 'video',
      date: new Date(2024, 0, 5),
      startTime: '10:00',
      endTime: '11:00',
      participant: 'Alex Rivera',
      description: 'Weekly team synchronization',
      location: 'Google Meet',
    },
    {
      id: 2,
      title: 'Client Call',
      type: 'call',
      date: new Date(2024, 0, 5),
      startTime: '14:00',
      endTime: '14:30',
      participant: 'Casey Johnson',
      description: 'Quarterly results discussion',
      location: '+1 555-0123',
    },
    {
      id: 3,
      title: 'Meeting',
      type: 'in-person',
      date: new Date(2024, 0, 8),
      startTime: '09:00',
      endTime: '10:00',
      participant: 'Morgan Davis',
      description: 'Discuss next steps',
      location: '123 Main St, NYC',
    },
    {
      id: 4,
      title: 'Strategy Session',
      type: 'video',
      date: new Date(2024, 0, 10),
      startTime: '13:00',
      endTime: '14:30',
      participant: 'Taylor White',
      description: 'Annual strategy planning',
      location: 'Zoom',
    },
    {
      id: 5,
      title: 'Interview',
      type: 'video',
      date: new Date(2024, 0, 6),
      startTime: '11:00',
      endTime: '11:30',
      participant: 'Jordan Smith',
      description: 'Candidate interview',
      location: 'Google Meet',
    },
    {
      id: 6,
      title: 'Follow-up',
      type: 'call',
      date: new Date(2024, 0, 9),
      startTime: '10:00',
      endTime: '10:30',
      participant: 'Alex Rivera',
      description: 'Project discussion',
      location: '+1 555-0456',
    },
  ])

  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getEventColor = (type) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 border-l-4 border-blue-500 text-blue-900'
      case 'in-person':
        return 'bg-green-100 border-l-4 border-green-500 text-green-900'
      case 'call':
        return 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900'
      default:
        return 'bg-gray-100 border-l-4 border-gray-500 text-gray-900'
    }
  }

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={16} />
      case 'in-person':
        return <MapPin size={16} />
      case 'call':
        return <Phone size={16} />
      default:
        return null
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
    selectedFilter === 'all'
      ? events
      : events.filter((e) => e.type === selectedFilter)

  const getEventPosition = (event) => {
    const [hours, minutes] = event.startTime.split(':').map(Number)
    const topPercent = ((hours * 60 + minutes) / (24 * 60)) * 100
    const [endHours, endMinutes] = event.endTime.split(':').map(Number)
    const heightPercent =
      ((endHours * 60 + endMinutes - (hours * 60 + minutes)) / (24 * 60)) * 100
    return { topPercent, heightPercent }
  }

  const getEventsForDate = (date) => {
    return filteredEvents.filter(
      (e) => e.date.toDateString() === date.toDateString()
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
              <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
                My Calendar
              </h1>
              <p className='text-gray-600 text-xs md:text-sm mt-1'>
                Manage your schedule and events
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
                                {dayEvents.slice(0, 3).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1 h-1 rounded-full ${
                                      dayEvents[idx].type === 'video'
                                        ? 'bg-blue-500'
                                        : dayEvents[idx].type === 'in-person'
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

                  {/* Upcoming Events Summary - Hide on mobile */}
                  <div className='hidden md:flex md:rounded-xl md:border md:border-gray-200 md:shadow-sm bg-white p-4 flex-1 overflow-y-auto flex-col'>
                    <h3 className='font-semibold text-gray-900 mb-3 text-sm'>
                      This Week
                    </h3>
                    <div className='space-y-2'>
                      {filteredEvents.slice(0, 4).map((event) => (
                        <motion.button
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowEventDetails(true)
                          }}
                          className={`w-full p-3 rounded-lg text-left text-xs border-l-2 ${getEventColor(
                            event.type
                          )} hover:shadow-md transition-all`}
                          whileHover={{ x: 4 }}
                        >
                          <p className='font-medium'>{event.title}</p>
                          <p className='text-xs opacity-75 mt-1'>
                            {event.startTime}
                          </p>
                          <p className='text-xs opacity-75'>
                            {event.participant}
                          </p>
                        </motion.button>
                      ))}
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
                                {event.startTime} — {event.endTime}
                              </p>
                              <p className='text-xs opacity-75'>
                                {event.participant}
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
                                {event.startTime}
                              </p>
                              <p className='font-medium truncate'>
                                {event.title}
                              </p>
                              <p className='text-xs opacity-75 truncate'>
                                {event.participant}
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
                            {getEventTypeIcon(event.type)}
                            {event.title}
                          </p>
                          <p className='text-sm opacity-75 mt-1'>
                            {event.startTime} — {event.endTime}
                          </p>
                          <p className='text-sm opacity-75'>
                            {event.participant}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Monthly View Placeholder */}
          {viewMode === 'monthly' && (
            <motion.div
              className='flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-y-auto'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <p className='text-gray-500'>Monthly view coming soon</p>
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
            className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4'
            onClick={() => setIsAddEventOpen(false)}
          >
            <motion.div
              initial={{ y: 500, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 500, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-3xl md:rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto'
            >
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-bold text-gray-900'>Add Event</h2>
                <motion.button
                  onClick={() => setIsAddEventOpen(false)}
                  className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                  whileHover={{ scale: 1.1 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              <div className='space-y-4'>
                <input
                  type='text'
                  placeholder='Event Title'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163146]'
                />
                <select className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163146]'>
                  <option>Video Call</option>
                  <option>In-Person</option>
                  <option>Phone Call</option>
                </select>
                <input
                  type='datetime-local'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163146]'
                />
                <input
                  type='text'
                  placeholder='Participant'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163146]'
                />
                <textarea
                  placeholder='Description'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163146] resize-none'
                  rows='3'
                />
                <div className='flex gap-2'>
                  <button className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                    Cancel
                  </button>
                  <button className='flex-1 px-4 py-2 bg-[#163146] text-white rounded-lg hover:bg-[#0f2a36] transition-colors'>
                    Create
                  </button>
                </div>
              </div>
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
            className='fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4'
            onClick={() => setShowEventDetails(false)}
          >
            <motion.div
              initial={{ y: 500, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 500, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-3xl md:rounded-xl max-w-md w-full p-6'
            >
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    {getEventTypeIcon(selectedEvent.type)}
                    <h2 className='text-xl font-bold text-gray-900'>
                      {selectedEvent.title}
                    </h2>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowEventDetails(false)}
                  className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                  whileHover={{ scale: 1.1 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className='space-y-4 text-sm text-gray-600'>
                <div className='flex items-center gap-2'>
                  <Clock size={18} />
                  <div>
                    <p className='font-medium text-gray-900'>
                      {selectedEvent.date.toLocaleDateString()}{' '}
                      {selectedEvent.startTime} — {selectedEvent.endTime}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <MapPin size={18} />
                  <p>{selectedEvent.location}</p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className='font-medium text-gray-900 mb-1'>
                      Description
                    </p>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.participant && (
                  <div>
                    <p className='font-medium text-gray-900 mb-2 flex items-center gap-2'>
                      <Users size={18} />
                      Participant
                    </p>
                    <p>{selectedEvent.participant}</p>
                  </div>
                )}
              </div>

              <div className='mt-6 flex gap-2'>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Close
                </button>
                <button className='flex-1 px-4 py-2 bg-[#163146] text-white rounded-lg hover:bg-[#0f2a36] transition-colors'>
                  Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

export default CalendarPage
