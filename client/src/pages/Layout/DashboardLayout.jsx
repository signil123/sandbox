// File: client/src/pages/Layout/DashboardLayout.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Bell,
    Bot,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Compass,
    Eye,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageCircle,
    MessageSquare,
    Newspaper,
    Search,
    Settings,
    Trash2,
    User,
    UserPlus,
    X,
} from 'lucide-react'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    clearNotifications,
    logoutUser,
    markNotificationRead,
    selectCurrentUser,
    selectNotifications,
    selectUnreadCount,
    setNotifications,
    updateProfileImage,
} from '../../redux/userSlice'
import { notificationService } from '../../services/notificationService'
import { profileService } from '../../services/profileService'

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const notifications = useSelector(selectNotifications) || []
  const unreadCount = useSelector(selectUnreadCount) || 0
  const [isScoutOpen, setIsScoutOpen] = useState(false)
  const [hoveredTooltip, setHoveredTooltip] = useState(null)

  React.useEffect(() => {
    const fetchProfileImage = async () => {
      if (currentUser && !currentUser.profileImage) {
        try {
          let profileImg = null
          if (currentUser.userType === 'athlete') {
            const response = await profileService.getAthleteProfileBundle()
            if (response?.status === 'success' && response.data?.profile) {
              profileImg = response.data.profile.profileImage || response.data.profile.photo
            }
          } else {
            const response = await profileService.getAdvisorProfile(currentUser._id)
            if (response?.status === 'success' && response.data?.advisor?.profile) {
              profileImg = response.data.advisor.profile.profileImage || response.data.advisor.profile.photo
            }
          }
          if (profileImg) {
            dispatch(updateProfileImage(profileImg))
          }
        } catch (error) {
          console.error('Error fetching profile image for topbar:', error)
        }
      }
    }

    fetchProfileImage()
  }, [currentUser, dispatch])

  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser) {
        try {
          const response = await notificationService.getNotifications()
          if (response?.status === 'success') {
            dispatch(setNotifications(response.data.notifications))
          }
        } catch (error) {
          console.error('Error fetching notifications:', error)
        }
      }
    }

    fetchNotifications()
    // Polling frequency increased to 15 seconds
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [currentUser, dispatch])

  /*
    Determine the correct profile path based on user type/role.
    Default to athlete if type is unknown or null (for now), or handle gracefully.
  */
  const userType = currentUser?.userType
  const getProfilePath = () => {
    if (userType === 'advisor') return '/profile/advisor'
    if (userType === 'agent') return '/profile/agent'
    return '/profile/athlete'
  }

  const profilePath = getProfilePath()
  const profileLabel = userType === 'agent' ? 'Agent Profile' : userType === 'advisor' ? 'Advisor Profile' : 'Profile'


  const navItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/',
    },
    {
      id: 'messages',
      icon: MessageCircle,
      label: 'Messages',
      path: '/inbox',
    },
    { id: 'calendar', icon: Calendar, label: 'Calendar', path: '/calendar' },
    { id: 'explore', icon: Compass, label: 'Explore', path: '/explore' },
    { id: 'news', icon: Newspaper, label: 'News', path: '/news' },
    {
      id: 'profile',
      icon: User,
      label: profileLabel,
      path: profilePath,
    },
  ]

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      dispatch(markNotificationRead(id))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        isRead: true,
      }))
      dispatch(setNotifications(updatedNotifications))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      const updatedNotifications = notifications.filter((n) => n._id !== id)
      dispatch(setNotifications(updatedNotifications))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id)
    }
    
    setIsNotificationOpen(false)

    switch (notif.type) {
      case 'connection_request':
        if (notif.sender?._id) {
          navigate(`/profile/public/${notif.sender._id}`)
        } else {
           navigate('/inbox', { state: { tab: 'requests' } })
        }
        break
      case 'connection_accepted':
        if (notif.sender?._id) {
            navigate(`/profile/public/${notif.sender._id}`)
        }
        break
      case 'message':
        if (notif.sender?._id) {
            navigate('/inbox', { state: { recipientId: notif.sender._id } })
        } else {
            navigate('/inbox')
        }
        break
      case 'profile_view':
        if (notif.sender?._id) {
            navigate(`/profile/public/${notif.sender._id}`)
        }
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return { icon: MessageSquare, bgColor: 'bg-[#fdf8f3]', iconColor: 'text-[#986a41]' }
      case 'profile_view':
        return { icon: Eye, bgColor: 'bg-[#eef2f5]', iconColor: 'text-[#163146]' }
      case 'security_update':
        return { icon: Bot, bgColor: 'bg-red-50', iconColor: 'text-red-500' }
      case 'connection_request':
        return { icon: UserPlus, bgColor: 'bg-[#fdf8f3]', iconColor: 'text-[#986a41]' }
      default:
        return { icon: Bell, bgColor: 'bg-gray-50', iconColor: 'text-gray-400' }
    }
  }

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const secs = Math.floor(diff / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (secs < 60) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getActiveNav = () => {
    const active = navItems.find((item) => location.pathname === item.path)
    return active ? active.id : 'dashboard'
  }

  const activeNav = getActiveNav()

  // Handle swipe navigation
  const handleSwipe = (direction) => {
    const navOrder = [
      'dashboard',
      'messages',
      'calendar',
      'explore',
      'news',
      'profile',
    ]
    const currentIndex = navOrder.indexOf(activeNav)

    let nextIndex
    if (direction === 'left') {
      nextIndex = (currentIndex + 1) % navOrder.length
    } else {
      nextIndex = (currentIndex - 1 + navOrder.length) % navOrder.length
    }

    const nextNav = navItems.find((item) => item.id === navOrder[nextIndex])
    if (nextNav) {
      navigate(nextNav.path)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    setIsLogoutModalOpen(false)
    await dispatch(logoutUser())
    navigate('/auth')
  }

  // Tooltip Component
  const Tooltip = ({ text, visible }) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className='absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium z-50 pointer-events-none'
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const userFullName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
    : 'User'

  const userEmail = currentUser?.email || 'user@example.com'

  return (
    <div className='flex min-h-screen bg-gray-50'>
      {/* Desktop Sidebar */}
      <div className='hidden md:flex fixed left-6 top-1/2 transform -translate-y-1/2 z-40'>
        <div className='bg-white rounded-full p-3 border border-gray-200'>
          <div className='flex flex-col gap-2'>
            {/* Logo */}
            <Link to='/'>
              <motion.div
                className='flex items-center justify-center w-11 h-11 bg-gradient-to-br from-[#163146] to-[#0f1f27] rounded-full text-white font-bold text-base cursor-pointer'
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.15 }}
              >
                S
              </motion.div>
            </Link>
            <div className='h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200'></div>
            {/* Navigation Bubbles */}
            <div className='flex flex-col gap-2.5'>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <Link to={item.path} key={item.id}>
                    <div className='relative'>
                      <motion.button
                        className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-[#163146] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ duration: 0.12 }}
                        onMouseEnter={() => setHoveredTooltip(item.id)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                      >
                        <Icon size={20} />
                        {/* Active indicator ring */}
                        {isActive && (
                          <motion.div
                            className='absolute inset-0 rounded-full border-2 border-[#163146]'
                            initial={{ scale: 1.15, opacity: 0 }}
                            animate={{ scale: 1.25, opacity: 0 }}
                            transition={{
                              duration: 0.4,
                              repeat: Infinity,
                              ease: 'easeOut',
                            }}
                          />
                        )}
                      </motion.button>
                      {/* Tooltip */}
                      <Tooltip
                        text={item.label}
                        visible={hoveredTooltip === item.id}
                      />
                    </div>
                  </Link>
                )
              })}
              {/* Divider */}
              <div className='h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200'></div>
              {/* Logout Button */}
              <div className='relative'>
                <motion.button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className='relative w-11 h-11 rounded-full flex items-center justify-center transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600'
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.12 }}
                  onMouseEnter={() => setHoveredTooltip('logout')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <LogOut size={20} />
                </motion.button>
                {/* Tooltip */}
                <Tooltip text='Logout' visible={hoveredTooltip === 'logout'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar - Full Width */}
      <motion.header
        className='fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200'
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className='px-4 md:px-8 py-3'>
          <div className='flex items-center justify-between gap-4'>
            {/* Logo */}
            <img
              src='/logo.png'
              alt='Signil'
              className='h-8 w-auto object-contain'
            />
            {/* Center - Search */}
            <motion.div
              className='flex-1 max-w-sm mx-2 md:mx-4 items-center gap-2.5 bg-gray-100 rounded-lg px-3.5 py-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#163146] focus-within:ring-opacity-50 transition-all hidden sm:flex'
              whileFocus={{ scale: 1.02 }}
            >
              <img
                src='/scout.png'
                alt='Scout'
                className='w-5 h-5 flex-shrink-0'
              />
              <input
                type='text'
                placeholder='Ask Scout a Question…'
                className='bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm flex-1'
              />
              <Search size={18} className='text-gray-400 flex-shrink-0' />
            </motion.div>

            {/* Right Section - Bubble Style */}
            <div className='flex items-center gap-2'>
              {/* Notifications Bubble */}
              <div className='relative'>
                <motion.button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className='relative w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.12 }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <motion.span
                      className='absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#163146] rounded-full text-white text-[10px] font-bold flex items-center justify-center'
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                {/* Notifications Drawer */}
                <AnimatePresence mode='wait'>
                  {isNotificationOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]'
                        onClick={() => setIsNotificationOpen(false)}
                      />

                      {/* Drawer */}
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className='fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden'
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header - Brand Color */}
                        <div className='flex items-center justify-between px-6 py-5 bg-[#163146] text-white shrink-0 relative overflow-hidden'>
                          {/* Background Accent Gradient */}
                          <div className='absolute -top-10 -right-10 w-32 h-32 bg-[#986a41] rounded-full blur-[50px] opacity-20 pointer-events-none' />

                          <div className='flex items-center gap-3 relative z-10'>
                            <div className='relative'>
                              <Bell size={20} className='text-[#986a41]' />
                              {unreadCount > 0 && (
                                <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#986a41] rounded-full ring-2 ring-[#163146]' />
                              )}
                            </div>
                            <div>
                              <h3 className='text-lg font-bold leading-none tracking-tight'>
                                Notifications
                              </h3>
                              <p className='text-[11px] text-gray-300 font-medium mt-1.5 opacity-80'>
                                {unreadCount === 0
                                  ? 'No new messages'
                                  : `${unreadCount} unread message${
                                      unreadCount === 1 ? '' : 's'
                                    }`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className='w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white relative z-10'
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Actions Bar */}
                        {notifications.length > 0 && (
                          <div className='flex items-center justify-between px-6 py-3 bg-gray-50/50 border-b border-gray-100 shrink-0 backdrop-blur-sm'>
                            <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>
                              Recent Updates
                            </p>
                            <button
                              onClick={handleMarkAllAsRead}
                              className='text-xs font-semibold text-[#163146] hover:text-[#986a41] transition-colors hover:underline decoration-[#986a41] underline-offset-4'
                            >
                              Mark all read
                            </button>
                          </div>
                        )}

                        {/* Notifications List */}
                        <div className='flex-1 overflow-y-auto p-4 space-y-6'>
                          {notifications.length === 0 ? (
                            <div className='flex flex-col items-center justify-center h-full text-center p-8'>
                              <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300'>
                                <Bell size={32} />
                              </div>
                              <h4 className='text-gray-900 font-semibold'>
                                No notifications
                              </h4>
                              <p className='text-sm text-gray-500 mt-1 max-w-[200px] leading-relaxed'>
                                We'll notify you when something important arrives.
                              </p>
                            </div>
                          ) : (
                            (() => {
                              // Grouping Logic
                              const groups = notifications.reduce(
                                (acc, notif) => {
                                  const date = new Date(notif.createdAt)
                                  const now = new Date()
                                  const isToday =
                                    date.toDateString() === now.toDateString()
                                  const yesterday = new Date(now)
                                  yesterday.setDate(yesterday.getDate() - 1)
                                  const isYesterday =
                                    date.toDateString() ===
                                    yesterday.toDateString()

                                  const key = isToday
                                    ? 'Today'
                                    : isYesterday
                                    ? 'Yesterday'
                                    : 'Older'
                                  if (!acc[key]) acc[key] = []
                                  acc[key].push(notif)
                                  return acc
                                },
                                {}
                              )

                              const order = ['Today', 'Yesterday', 'Older']

                              return order.map((group) => {
                                const items = groups[group]
                                if (!items || items.length === 0) return null

                                return (
                                  <div
                                    key={group}
                                    className='animate-in fade-in slide-in-from-bottom-2 duration-500'
                                  >
                                    <div className='flex items-center gap-2 mb-3 px-2'>
                                      <div className='w-1 h-1 rounded-full bg-[#986a41]/50' />
                                      <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                                        {group}
                                      </span>
                                    </div>
                                    <div className='space-y-3'>
                                      {items.map((notif, idx) => {
                                        const {
                                          icon: Icon,
                                          bgColor,
                                          iconColor,
                                        } = getNotificationIcon(notif.type)
                                        return (
                                          <motion.div
                                            key={notif._id}
                                            layout
                                            initial={{
                                              opacity: 0,
                                              scale: 0.95,
                                            }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`relative overflow-hidden rounded-xl border p-4 transition-all cursor-pointer group ${
                                              notif.isRead
                                                ? 'bg-white border-gray-100 opacity-70 hover:opacity-100'
                                                : 'bg-white border-[#163146]/10 shadow-sm border-l-4 border-l-[#986a41]'
                                            }`}
                                          >
                                            <div className='flex gap-4'>
                                              {/* Icon */}
                                              <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor} group-hover:scale-110 transition-transform duration-300`}
                                              >
                                                <Icon
                                                  size={18}
                                                  className={iconColor}
                                                />
                                              </div>
                                              {/* Content */}
                                              <div className='flex-1 min-w-0 pt-0.5'>
                                                <div className='flex items-start justify-between gap-3'>
                                                  <h4
                                                    className={`text-sm font-semibold leading-tight ${
                                                      notif.isRead
                                                        ? 'text-gray-700'
                                                        : 'text-[#163146]'
                                                    }`}
                                                  >
                                                    {notif.title}
                                                  </h4>
                                                  <span className='text-[10px] text-gray-400 whitespace-nowrap font-medium'>
                                                    {formatTimestamp(
                                                      notif.createdAt
                                                    )}
                                                  </span>
                                                </div>
                                                <p className='text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed'>
                                                  {notif.description}
                                                </p>
                                              </div>
                                            </div>
                                            {/* Dismiss Action */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteNotification(
                                                  notif._id
                                                )
                                              }}
                                              className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all md:opacity-0 opacity-100'
                                              title='Dismiss'
                                            >
                                              <X size={14} />
                                            </button>
                                          </motion.div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })
                            })()
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className='w-px h-6 bg-gray-200'></div>

              {/* Profile Bubble */}
              <div className='relative'>
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className='flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className='w-8 h-8 bg-gradient-to-br from-[#163146] to-[#0f1f27] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                    {currentUser?.profileImage ? (
                      <img
                        src={currentUser.profileImage.startsWith('http') ? currentUser.profileImage : `${import.meta.env.VITE_API_URL.replace('/api', '')}${currentUser.profileImage}`}
                        alt='Profile'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-white text-xs font-bold'>
                        {userFullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className='absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg overflow-hidden z-50'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User Info */}
                      <div className='px-4 py-3 border-b border-gray-100'>
                        <p className='text-sm font-semibold text-gray-900'>
                          {userFullName}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {userEmail}
                        </p>
                      </div>
                      {/* Menu Items */}
                      <div className='py-2'>
                        <Link to={profilePath}>
                          <motion.div
                            className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.1 }}
                          >
                            <User size={18} className='text-gray-400' />
                            <span className='font-medium'>View Profile</span>
                          </motion.div>
                        </Link>
                        <Link to={profilePath}>
                          <motion.div
                            className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.1 }}
                          >
                            <Settings size={18} className='text-gray-400' />
                            <span className='font-medium'>Settings</span>
                          </motion.div>
                        </Link>
                      </div>
                      {/* Logout */}
                      <div className='border-t border-gray-100 py-2'>
                        <motion.button
                          onClick={() => {
                            setIsProfileOpen(false)
                            setIsLogoutModalOpen(true)
                          }}
                          className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.1 }}
                        >
                          <LogOut size={18} />
                          <span className='font-medium'>Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Wrapper */}
      <motion.div
        className='flex-1 flex flex-col md:pl-20 pt-16'
        onDragEnd={(e, { offset, velocity }) => {
          const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500
          if (swipe) {
            if (offset.x > 0) {
              handleSwipe('right')
            } else {
              handleSwipe('left')
            }
          }
        }}
      >
        {/* Main Content Area */}
        <div className='flex-1 mb-16 md:mb-0'>{children}</div>
      </motion.div>

      {/* Mobile Bottom Navigation - Enhanced Active State */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40'>
        <div className='flex items-center justify-around h-20 px-2 gap-1'>
          {/* Dashboard */}
          <Link to='/' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'dashboard'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <LayoutDashboard size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'dashboard' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                Dashboard
              </span>
            </motion.div>
          </Link>

          {/* Messages */}
          <Link to='/inbox' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'messages'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <MessageCircle size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'messages' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                Messages
              </span>
            </motion.div>
          </Link>

          {/* Calendar */}
          <Link to='/calendar' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'calendar'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <Calendar size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'calendar' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                Calendar
              </span>
            </motion.div>
          </Link>

          {/* Center Signil Button */}
          <motion.button
            onClick={() => setIsScoutOpen(!isScoutOpen)}
            className='relative flex flex-col items-center justify-center h-full flex-shrink-0'
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              className='relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2'
              style={{ borderColor: '#986a41' }}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src='/scout.png'
                alt='Signil'
                className='w-5 h-5 object-contain'
              />
            </motion.div>
          </motion.button>

          {/* Explore */}
          <Link to='/explore' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'explore'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <Compass size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'explore' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                Explore
              </span>
            </motion.div>
          </Link>

          {/* News */}
          <Link to='/news' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'news'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <Newspaper size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'news' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                News
              </span>
            </motion.div>
          </Link>

          {/* Profile */}
          <Link to={profilePath} className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-semibold ${
                  activeNav === 'profile'
                    ? 'bg-[#163146] text-white shadow-md'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <User size={20} />
              </motion.button>
              <span
                className={`text-[9px] mt-1 font-bold transition-all ${
                  activeNav === 'profile' ? 'text-[#163146]' : 'text-gray-600'
                }`}
              >
                Profile
              </span>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Scout Chat Modal (Mobile) */}
      <AnimatePresence>
        {isScoutOpen && (
          <motion.div
            className='md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsScoutOpen(false)}
          >
            <motion.div
              className='w-full bg-white rounded-t-3xl max-h-[90vh] overflow-hidden'
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scout Header */}
              <div className='bg-gradient-to-r from-[#986a41] to-[#7a5633] px-6 py-4 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center'>
                    <Bot size={24} style={{ color: '#986a41' }} />
                  </div>
                  <div>
                    <h3 className='text-white font-bold'>Scout</h3>
                    <p className='text-xs text-amber-100'>AI Assistant</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsScoutOpen(false)}
                  className='text-white hover:text-amber-100 transition-colors'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Chat Area */}
              <div className='p-6 flex flex-col h-full max-h-[calc(90vh-120px)]'>
                <div className='flex-1 overflow-y-auto mb-4 flex flex-col items-center justify-center text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4'>
                    <Bot size={32} style={{ color: '#986a41' }} />
                  </div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-2'>
                    Hey! I'm Scout
                  </h4>
                  <p className='text-sm text-gray-600 mb-6'>
                    Ask me anything about NIL deals, partnerships, or how to
                    make the most of Signil
                  </p>
                </div>

                {/* Input Area */}
                <div className='flex gap-2 items-end'>
                  <input
                    type='text'
                    placeholder='Ask Scout a question...'
                    className='flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2'
                    style={{ '--tw-ring-color': '#986a41' }}
                  />
                  <motion.button
                    className='p-3 rounded-lg text-white flex items-center justify-center flex-shrink-0'
                    style={{ backgroundColor: '#986a41' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            className='fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsLogoutModalOpen(false)}
          >
            <motion.div
              className='bg-white rounded-lg w-96 p-6'
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900'>Logout</h2>
                <motion.button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              {/* Content */}
              <p className='text-gray-600 text-sm mb-6'>
                Are you sure you want to log out? You'll need to sign in again
                to access your account.
              </p>
              {/* Actions */}
              <div className='flex gap-3'>
                <motion.button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className='flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleLogout}
                  className='flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DashboardLayout
