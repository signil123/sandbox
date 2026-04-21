// File: client/src/pages/Layout/DashboardLayout.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    Bell,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Compass,
    Clock,
    CreditCard,
    Eye,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageCircle,
    MessageSquare,
    Newspaper,
    Send,
    Settings,
    Shield,
    Trash2,
    User,
    UserPlus,
    X,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    clearNotifications,
    fetchUnreadMessages,
    incrementUnreadMessagesCount,
    logoutUser,
    markNotificationRead,
    setActiveConversationId,
    selectActiveConversationId,
    selectCurrentUser,
    selectNotifications,
    selectUnreadCount,
    selectUnreadMessagesCount,
    setNotifications,
    updateProfileImage,
    updateUserStatus,
} from '../../redux/userSlice'
import { messageService } from '../../services/messageService'
import { notificationService } from '../../services/notificationService'
import { profileService } from '../../services/profileService'
import { pushService } from '../../services/pushService'
import { scoutService } from '../../services/scoutService'
import { socketService } from '../../services/socketService'
import { getImageUrl } from '../../utils/imageUtils'

const SCOUT_STORAGE_KEY = 'signil_scout_chat_v1'
const SCOUT_SIDEBAR_STATE_KEY = 'signil_scout_sidebar_open_v1'
const DEFAULT_SCOUT_MESSAGES = [
  {
    id: 'scout-welcome',
    role: 'assistant',
    content:
      'Hi there. I can help you find the right people on Signil. Share the role, sport, or expertise you need.',
    suggestions: [],
  },
]

const DashboardLayout = ({ children, hideSidebar = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [notificationsSupported, setNotificationsSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isUpdatingMessageNotifications, setIsUpdatingMessageNotifications] = useState(false)
  const notifications = useSelector(selectNotifications) || []
  const unreadCount = useSelector(selectUnreadCount) || 0
  const unreadMessagesCount = useSelector(selectUnreadMessagesCount) || 0
  const activeConversationId = useSelector(selectActiveConversationId)
  const [isScoutOpen, setIsScoutOpen] = useState(false)
  const [isScoutSidebarOpen, setIsScoutSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(SCOUT_SIDEBAR_STATE_KEY)
      if (stored === null) return false
      return stored === 'true'
    } catch {
      return false
    }
  })
  const [scoutInput, setScoutInput] = useState('')
  const [isScoutLoading, setIsScoutLoading] = useState(false)
  const [scoutMessages, setScoutMessages] = useState(DEFAULT_SCOUT_MESSAGES)
  const [hoveredTooltip, setHoveredTooltip] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const profileRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const isAutoAwayRef = useRef(false)
  const processedMessageIdsRef = useRef(new Set())
  const notificationsSupportedRef = useRef(false)
  const notificationsEnabledRef = useRef(false)
  const scoutEndRef = useRef(null)

  useEffect(() => {
    // Prevent stale persisted conversation IDs from suppressing unread updates
    // when user is not actively in the inbox page.
    if (!location.pathname.startsWith('/inbox')) {
      dispatch(setActiveConversationId(null))
    }
  }, [location.pathname, dispatch])

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  React.useEffect(() => {
    const fetchProfileImage = async () => {
      if (!currentUser || currentUser.profileImage) return
      if (currentUser.role === 'admin') return

      const userType = currentUser.userType
      if (userType !== 'athlete' && userType !== 'advisor' && userType !== 'agent') {
        return
      }

      try {
        let profileImg = null
        if (userType === 'athlete') {
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

    fetchProfileImage()
  }, [currentUser, dispatch])

  // Disable background scroll when notification drawer is open
  useEffect(() => {
    if (isNotificationOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isNotificationOpen])

  useEffect(() => {
    const isSupported = pushService.isSupported()
    setNotificationsSupported(isSupported)
    notificationsSupportedRef.current = isSupported
    if (!isSupported) return

    pushService.ensureServiceWorker().catch(() => {})

    const permission = pushService.getPermission()
    const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
    setNotificationPermission(permission)
    setNotificationsEnabled(enabled)
    notificationsEnabledRef.current = enabled
  }, [])

  const persistNotificationsEnabled = (enabled) => {
    pushService.setMessageNotificationsEnabled(enabled)
    setNotificationsEnabled(enabled)
    notificationsEnabledRef.current = enabled
  }

  const requestNotificationPermission = async () => {
    if (!notificationsSupportedRef.current) return

    try {
      const result = await pushService.subscribe()
      const permission = pushService.getPermission()
      const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
      setNotificationPermission(permission)
      setNotificationsEnabled(enabled)
      notificationsEnabledRef.current = enabled

      if (!result.ok) {
        persistNotificationsEnabled(false)
        toast.error(pushService.getFailureMessage(result.reason))
        return
      }
      toast.success('Message notifications turned on.')
    } catch {
      persistNotificationsEnabled(false)
      setNotificationPermission(pushService.getPermission())
      toast.error(pushService.getFailureMessage('unknown'))
    }
  }

  const toggleMessageNotifications = async () => {
    if (isUpdatingMessageNotifications) return
    if (!notificationsSupportedRef.current) return
    setIsUpdatingMessageNotifications(true)
    try {
      if (notificationsEnabled && notificationPermission === 'granted') {
        await pushService.unsubscribe()
        persistNotificationsEnabled(false)
        toast.success('Message notifications turned off.')
        return
      }
      await requestNotificationPermission()
    } finally {
      setIsUpdatingMessageNotifications(false)
    }
  }

  const allowMessageNotifications = async () => {
    if (isUpdatingMessageNotifications) return
    if (!notificationsSupportedRef.current) return

    if (notificationPermission === 'denied') {
      toast.error(
        'Notifications are blocked. Open browser site settings, allow notifications for this site, then refresh.'
      )
      return
    }

    setIsUpdatingMessageNotifications(true)
    try {
      await requestNotificationPermission()
    } finally {
      setIsUpdatingMessageNotifications(false)
    }
  }

  useEffect(() => {
    if (!notificationsSupported) return

    const refreshSettings = () => {
      const permission = pushService.getPermission()
      const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
      setNotificationPermission(permission)
      setNotificationsEnabled(enabled)
      notificationsEnabledRef.current = enabled
    }

    const handleStorage = (event) => {
      if (event.key === pushService.keys.MESSAGE_STORAGE_KEY) {
        refreshSettings()
      }
    }

    window.addEventListener(pushService.events.MESSAGE_EVENT_NAME, refreshSettings)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(pushService.events.MESSAGE_EVENT_NAME, refreshSettings)
      window.removeEventListener('storage', handleStorage)
    }
  }, [notificationsSupported])

  useEffect(() => {
    if (!currentUser?._id) return
    if (!notificationsSupportedRef.current) return
    if (!pushService.getMessageNotificationsEnabled()) return
    if (pushService.getPermission() !== 'granted') return

    pushService.syncEnabledSubscription().catch(() => {
      // Silent recovery attempt only. User can retry from toggle if needed.
    })
  }, [currentUser?._id])

  // Fetch unread messages and listen to socket
  React.useEffect(() => {
    if (currentUser) {
        
      // Fetch initial unread count
      dispatch(fetchUnreadMessages())

      const socket = socketService.connect(localStorage.getItem('token'))

      const handleNewMessage = ({ message, conversationId }) => {
        if (message?.sender === currentUser?._id) return

        if (message?._id) {
          if (processedMessageIdsRef.current.has(message._id)) return
          processedMessageIdsRef.current.add(message._id)
          if (processedMessageIdsRef.current.size > 500) {
            const trimmed = Array.from(processedMessageIdsRef.current).slice(-250)
            processedMessageIdsRef.current.clear()
            trimmed.forEach((id) => processedMessageIdsRef.current.add(id))
          }
        }
        // If we are NOT in this conversation, increment the global unread count
        // Note: The activeConversationId should be set by the MessagePage
        if (activeConversationId !== conversationId) {
            dispatch(incrementUnreadMessagesCount())
        }

        // Keep unread badge accurate even if local active conversation state is stale.
        dispatch(fetchUnreadMessages())
      }

      socket.on('new_message', handleNewMessage)

      return () => {
        socket.off('new_message', handleNewMessage)
      }
    }
  }, [currentUser, dispatch, activeConversationId])

  useEffect(() => {
    if (!currentUser) return

    const refreshUnread = () => {
      dispatch(fetchUnreadMessages())
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshUnread()
      }
    }

    window.addEventListener('focus', refreshUnread)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', refreshUnread)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [currentUser, dispatch])

  useEffect(() => {
    if (!currentUser) return

    const interval = setInterval(() => {
      dispatch(fetchUnreadMessages())
    }, 30000)

    return () => clearInterval(interval)
  }, [currentUser, dispatch])

  // Auto-away logic based on user activity
  useEffect(() => {
    if (!currentUser) return

    const IDLE_THRESHOLD = 2 * 60 * 1000 // 2 minutes for quicker feedback during testing

    const handleActivity = () => {
      // If we were auto-away, switch back to online
      if (currentUser.status === 'away' && isAutoAwayRef.current) {
        isAutoAwayRef.current = false
        dispatch(updateUserStatus('online'))
      }

      // Reset the inactivity timer
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      
      inactivityTimerRef.current = setTimeout(() => {
        // Only auto-away if currently online
        if (currentUser.status === 'online') {
          isAutoAwayRef.current = true
          dispatch(updateUserStatus('away'))
        }
      }, IDLE_THRESHOLD)
    }

    // Reset auto-away flag if status is manually changed to something else
    if (currentUser.status !== 'away') {
      isAutoAwayRef.current = false
    }

    // Add event listeners for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, handleActivity))

    // Initial timer setup
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      if (currentUser.status === 'online') {
        isAutoAwayRef.current = true
        dispatch(updateUserStatus('away'))
      }
    }, IDLE_THRESHOLD)

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity))
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, [currentUser?.status, dispatch])

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
      path: '/dashboard',
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
    ...(currentUser?.role === 'admin' ? [{
      id: 'admin',
      icon: Shield,
      label: 'Admin Portal',
      path: '/admin',
    }] : []),
    {
      id: 'profile',
      icon: User,
      label: profileLabel,
      path: profilePath,
    },
  ]

  const handleMarkAsRead = async (id) => {
    const ids = Array.isArray(id) ? id : [id]
    try {
      await Promise.all(ids.map((itemId) => notificationService.markAsRead(itemId)))
      ids.forEach((itemId) => dispatch(markNotificationRead(itemId)))
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
    const ids = Array.isArray(id) ? id : [id]
    try {
      await Promise.all(ids.map((itemId) => notificationService.deleteNotification(itemId)))
      const idSet = new Set(ids)
      const updatedNotifications = notifications.filter((n) => !idSet.has(n._id))
      dispatch(setNotifications(updatedNotifications))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._groupIds || notif._id)
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

  const cleanNotificationText = (value = '') =>
    String(value)
      .replace(/\s+/g, ' ')
      .replace(/^"+|"+$/g, '')
      .trim()

  const toSentenceCase = (value = '') => {
    const text = cleanNotificationText(value)
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const getDocumentNameFromDescription = (description = '') => {
    const text = cleanNotificationText(description)
    if (!text) return null
    const matches = text.match(/^Your\s+(.+?)\s+has\s+/i)
    return matches?.[1] || null
  }

  const getNotificationPresentation = (notif) => {
    const senderName = notif?.sender?.name || 'A user'
    const groupCount = Number(notif?._groupCount || 1)
    const isGrouped = groupCount > 1
    const originalTitle = cleanNotificationText(notif?.title)
    const originalDescription = cleanNotificationText(notif?.description)
    const safeDescription = toSentenceCase(originalDescription)
    const documentName = getDocumentNameFromDescription(originalDescription)
    const hasCustomMessage = !!originalDescription && !/wants to connect/i.test(originalDescription)

    switch (notif?.type) {
      case 'message':
        return {
          title: isGrouped
            ? `${senderName} sent you ${groupCount} messages`
            : `${senderName} sent you a message`,
          description: safeDescription || (isGrouped
            ? 'Open the conversation to see the latest message.'
            : 'Open the conversation to read and reply.'),
          tag: 'Message',
        }
      case 'connection_request':
        return {
          title: `${senderName} wants to connect`,
          description: hasCustomMessage
            ? safeDescription
            : 'Review their profile and respond when you are ready.',
          tag: 'Invitation',
        }
      case 'connection_accepted':
        return {
          title: `${senderName} accepted your request`,
          description: `You are now connected with ${senderName}.`,
          tag: 'Network',
        }
      case 'profile_view':
        return {
          title: isGrouped
            ? `${senderName} viewed your profile ${groupCount} times`
            : `${senderName} viewed your profile`,
          description: 'Open their profile to learn more and start a conversation.',
          tag: 'Activity',
        }
      case 'event_invitation':
        return {
          title: originalTitle || 'Event invitation',
          description: safeDescription || `${senderName} invited you to an event.`,
          tag: 'Invitation',
        }
      case 'document_approved':
        return {
          title: `${documentName || 'Document'} verified`,
          description: 'Your document was reviewed and approved.',
          tag: 'Verification',
        }
      case 'document_declined':
        return {
          title: `${documentName || 'Document'} needs updates`,
          description: safeDescription || 'Please review the feedback and resubmit.',
          tag: 'Verification',
        }
      case 'document_expired':
        return {
          title: `${documentName || 'Document'} expired`,
          description: safeDescription || 'Renew this document to keep your profile current.',
          tag: 'Verification',
        }
      case 'security_update': {
        const combined = `${originalTitle} ${originalDescription}`.toLowerCase()
        if (combined.includes('verified')) {
          return {
            title: `${documentName || 'Document'} verified`,
            description: 'Your document was approved and added to your profile.',
            tag: 'Verification',
          }
        }
        if (combined.includes('requires update') || combined.includes('update')) {
          return {
            title: `${documentName || 'Document'} needs updates`,
            description: safeDescription || 'Please update this document to complete verification.',
            tag: 'Verification',
          }
        }
        if (combined.includes('expired')) {
          return {
            title: `${documentName || 'Document'} expired`,
            description: safeDescription || 'Renew this document to keep your account in good standing.',
            tag: 'Verification',
          }
        }
        return {
          title: originalTitle || 'Security update',
          description: safeDescription || 'Your account security settings were updated.',
          tag: 'Security',
        }
      }
      default:
        return {
          title: originalTitle || 'New update',
          description: safeDescription || 'You have a new notification in Signil.',
          tag: 'Update',
        }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return { icon: MessageSquare, bgColor: 'bg-[#f6efe8]', iconColor: 'text-[#7a532f]' }
      case 'profile_view':
        return { icon: Eye, bgColor: 'bg-[#eaf0f4]', iconColor: 'text-[#163146]' }
      case 'connection_accepted':
        return { icon: CheckCircle2, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-700' }
      case 'security_update':
        return { icon: Shield, bgColor: 'bg-red-50', iconColor: 'text-red-500' }
      case 'connection_request':
        return { icon: UserPlus, bgColor: 'bg-[#f6efe8]', iconColor: 'text-[#7a532f]' }
      case 'event_invitation':
        return { icon: Calendar, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-700' }
      case 'document_approved':
        return { icon: CheckCircle2, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-700' }
      case 'document_declined':
        return { icon: Clock, bgColor: 'bg-amber-50', iconColor: 'text-amber-700' }
      case 'document_expired':
        return { icon: Clock, bgColor: 'bg-amber-50', iconColor: 'text-amber-700' }
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
  const getNotificationEventDate = (notif) =>
    new Date(notif?._eventAt || notif?.updatedAt || notif?.createdAt || Date.now())

  const getNotificationCollapseKey = (notif) => {
    const senderId = String(notif?.sender?._id || notif?.sender || 'system')

    if (notif?.type === 'message') {
      const action = notif?.actionUrl || ''
      const queryMatch = action.match(/conversationId=([^&]+)/i)
      const pathMatch = action.match(/\/messages\/conversations\/([^/?#]+)/i)
      const conversationId =
        queryMatch?.[1] ||
        pathMatch?.[1] ||
        'conversation'
      return `message:${senderId}:${conversationId}`
    }

    if (notif?.type === 'profile_view') {
      return `profile_view:${senderId}`
    }

    const verificationTypes = new Set([
      'security_update',
      'document_submitted',
      'document_resubmitted',
      'document_approved',
      'document_declined',
      'document_expired',
    ])

    if (verificationTypes.has(notif?.type)) {
      const normalizedTitle = cleanNotificationText(notif?.title).toLowerCase()
      const normalizedDescription = cleanNotificationText(notif?.description).toLowerCase()
      const documentId =
        notif?.relatedEntity?.entityId?.toString?.() ||
        notif?.relatedEntity?.entityId ||
        ''
      const semanticKey = documentId || `${normalizedTitle}|${normalizedDescription}`
      return `verification:${notif?.type}:${senderId}:${semanticKey}`
    }

    return `single:${notif?._id}`
  }

  const collapsedNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => getNotificationEventDate(b).getTime() - getNotificationEventDate(a).getTime()
    )
    const grouped = new Map()

    sorted.forEach((notif) => {
      const readBucket = notif?.isRead ? 'read' : 'unread'
      const key = `${getNotificationCollapseKey(notif)}:${readBucket}`
      const existing = grouped.get(key)
      const eventAt = getNotificationEventDate(notif).toISOString()

      if (!existing) {
        grouped.set(key, {
          ...notif,
          _groupIds: [notif._id],
          _groupCount: 1,
          _eventAt: eventAt,
        })
        return
      }

      existing._groupIds.push(notif._id)
      existing._groupCount += 1
      existing.isRead = existing.isRead && notif.isRead

      if (getNotificationEventDate(notif).getTime() > getNotificationEventDate(existing).getTime()) {
        existing._eventAt = eventAt
      }
    })

    return Array.from(grouped.values()).sort(
      (a, b) => getNotificationEventDate(b).getTime() - getNotificationEventDate(a).getTime()
    )
  }, [notifications])

  const effectiveUnreadCount = collapsedNotifications.filter((notif) => !notif.isRead).length

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
    navigate('/')
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCOUT_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        setScoutMessages(parsed)
      }
    } catch {
      // Ignore bad local storage payloads and keep defaults.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SCOUT_STORAGE_KEY, JSON.stringify(scoutMessages))
    } catch {
      // Ignore storage write errors.
    }
  }, [scoutMessages])

  useEffect(() => {
    try {
      localStorage.setItem(SCOUT_SIDEBAR_STATE_KEY, String(isScoutSidebarOpen))
    } catch {
      // Ignore storage write errors.
    }
  }, [isScoutSidebarOpen])

  const scrollScoutToBottom = () => {
    if (scoutEndRef.current) {
      scoutEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollScoutToBottom()
  }, [scoutMessages, isScoutLoading, isScoutOpen])

  const sendScoutMessage = async (overrideText) => {
    const rawText = overrideText ?? scoutInput
    const trimmed = rawText.trim()
    if (!trimmed || isScoutLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      suggestions: [],
      options: [],
    }

    const historyPayload = scoutMessages
      .filter(
        (item) =>
          item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string'
      )
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))

    setScoutMessages((prev) => [...prev, userMessage])
    setScoutInput('')
    setIsScoutLoading(true)

    try {
      const response = await scoutService.chat({
        message: trimmed,
        history: historyPayload,
      })

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          response?.data?.reply ||
          'I can help you discover Signil accounts. Share the role and capabilities you need.',
        suggestions: Array.isArray(response?.data?.suggestions)
          ? response.data.suggestions
          : [],
        options: Array.isArray(response?.data?.options)
          ? response.data.options
          : [],
      }

      setScoutMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const fallbackMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content:
          error?.response?.data?.message ||
          'Scout is unavailable right now. Please try again in a moment.',
        suggestions: [],
        options: [],
      }
      setScoutMessages((prev) => [...prev, fallbackMessage])
    } finally {
      setIsScoutLoading(false)
    }
  }

  const handleScoutKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendScoutMessage()
    }
  }

  const handleScoutOptionClick = (optionValue) => {
    if (!optionValue) return
    sendScoutMessage(optionValue)
  }

  const startNewScoutChat = () => {
    if (isScoutLoading) return
    setScoutInput('')
    setScoutMessages([
      {
        ...DEFAULT_SCOUT_MESSAGES[0],
        id: `scout-welcome-${Date.now()}`,
      },
    ])
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

  const SIDEBAR_W = 228

  return (
    <div className='flex min-h-screen' style={{ background: '#ede9df' }}>
      {/* Desktop Floating Sidebar */}
      {!hideSidebar && (
        <aside
          className='hidden md:flex fixed flex-col z-40'
          style={{
            left: 16,
            top: 16,
            bottom: 16,
            width: SIDEBAR_W,
            background: '#fff',
            borderRadius: 24,
            boxShadow: '0 10px 30px -10px rgba(22,49,70,.08), 0 2px 8px -2px rgba(22,49,70,.05)',
            border: '1px solid rgba(22,49,70,.06)',
            padding: '20px 14px',
            overflow: 'hidden',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 20, marginBottom: 4 }}>
            <img src='/logo.png' alt='Signil' style={{ height: 30, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* MENU section */}
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,49,70,.32)', padding: '0 14px', marginBottom: 6 }}>Menu</p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {navItems.filter((item) => item.id !== 'admin').map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              return (
                <Link to={item.path} key={item.id} style={{ textDecoration: 'none' }}>
                  <motion.button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      justifyContent: 'flex-start',
                      padding: '11px 14px',
                      borderRadius: 12,
                      background: isActive ? '#163146' : 'transparent',
                      color: isActive ? '#fff' : '#163146',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      width: '100%',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    whileHover={{ backgroundColor: isActive ? '#163146' : 'rgba(22,49,70,.05)' }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Icon size={18} strokeWidth={1.7} />
                      {item.id === 'messages' && unreadMessagesCount > 0 && (
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                        </div>
                      )}
                    </div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>
                  </motion.button>
                </Link>
              )
            })}
          </nav>

          {/* GENERAL section */}
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(22,49,70,.32)', padding: '0 14px', margin: '20px 0 6px' }}>General</p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Scout toggle */}
            <motion.button
              onClick={() => setIsScoutSidebarOpen(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 12,
                justifyContent: 'flex-start',
                padding: '11px 14px',
                borderRadius: 12,
                background: isScoutSidebarOpen ? 'rgba(22,49,70,.06)' : 'transparent',
                color: '#163146', fontSize: 13, fontWeight: 500,
                width: '100%', border: 'none', cursor: 'pointer',
              }}
              whileHover={{ backgroundColor: 'rgba(22,49,70,.05)' }}
            >
              <img src='/scout.png' alt='Scout' style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
              <span>Scout</span>
            </motion.button>

            {/* Notifications */}
            <motion.button
              onClick={() => { const newOpen = !isNotificationOpen; setIsNotificationOpen(newOpen); if (newOpen) handleMarkAllAsRead() }}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 12,
                justifyContent: 'flex-start',
                padding: '11px 14px',
                borderRadius: 12,
                background: 'transparent',
                color: '#163146', fontSize: 13, fontWeight: 500,
                width: '100%', border: 'none', cursor: 'pointer',
                position: 'relative',
              }}
              whileHover={{ backgroundColor: 'rgba(22,49,70,.05)' }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Bell size={18} strokeWidth={1.7} />
                {effectiveUnreadCount > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#163146', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{effectiveUnreadCount > 9 ? '9+' : effectiveUnreadCount}</span>
                  </div>
                )}
              </div>
              <span>Notifications</span>
            </motion.button>
          </nav>

          {/* Footer: profile + logout */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(22,49,70,.06)' }}>
            <>
                <div
                  ref={profileRef}
                  style={{ position: 'relative' }}
                >
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    whileHover={{ backgroundColor: 'rgba(22,49,70,.04)' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#986a41,#7a5435)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                      {currentUser?.profileImage ? (
                        <img src={getImageUrl(currentUser.profileImage)} alt='Profile' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        userFullName.split(' ').map(n => n[0]).join('').toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#163146', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userFullName}</div>
                      <div style={{ fontSize: 10, color: 'rgba(22,49,70,.5)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.tier ? `${currentUser.tier} plan` : 'free plan'}</div>
                    </div>
                    <ChevronDown size={14} strokeWidth={2} style={{ color: 'rgba(22,49,70,.4)', flexShrink: 0 }} />
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, background: '#fff', border: '1px solid rgba(22,49,70,.08)', borderRadius: 16, overflow: 'hidden', zIndex: 50, boxShadow: '0 20px 40px -10px rgba(22,49,70,.15)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Status selectors */}
                        {currentUser?.role !== 'admin' && (
                          <div style={{ padding: '12px 12px 8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                              {[
                                { id: 'online', label: 'Online', icon: CheckCircle2 },
                                { id: 'away', label: 'Away', icon: Clock },
                                { id: 'idle', label: 'Idle', icon: Eye }
                              ].map((s) => (
                                <motion.button
                                  key={s.id}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => { e.stopPropagation(); isAutoAwayRef.current = false; dispatch(updateUserStatus(s.id)) }}
                                  style={{
                                    padding: '8px 4px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                                    background: currentUser?.status === s.id ? '#163146' : 'rgba(22,49,70,.04)',
                                    color: currentUser?.status === s.id ? '#fff' : '#163146',
                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                                  }}
                                >
                                  <s.icon size={11} /> {s.label}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid rgba(22,49,70,.06)' }}>
                          {currentUser?.role !== 'admin' && ['advisor', 'agent'].includes(currentUser?.userType) && (
                            <Link to='/settings' style={{ textDecoration: 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#163146', cursor: 'pointer' }} onClick={() => setIsProfileOpen(false)}>
                                <CreditCard size={15} strokeWidth={1.7} style={{ color: '#986a41' }} /> Subscription
                              </div>
                            </Link>
                          )}
                          <Link to='/settings' style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#163146', cursor: 'pointer' }} onClick={() => setIsProfileOpen(false)}>
                              <Settings size={15} strokeWidth={1.7} style={{ color: 'rgba(22,49,70,.5)' }} /> Settings
                            </div>
                          </Link>
                          <button
                            onClick={() => { setIsProfileOpen(false); setIsLogoutModalOpen(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#ef4444', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderTop: '1px solid rgba(22,49,70,.06)' }}
                          >
                            <LogOut size={15} strokeWidth={1.7} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.button
                  onClick={() => setIsLogoutModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, color: '#163146', fontSize: 13, fontWeight: 500, textAlign: 'left', marginTop: 2, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  whileHover={{ backgroundColor: 'rgba(22,49,70,.05)' }}
                >
                  <LogOut size={17} strokeWidth={1.7} />
                  <span>Logout</span>
                </motion.button>
              </>
          </div>
        </aside>
      )}

      {/* Scout Sidebar Panel (floating next to main sidebar) */}
      <AnimatePresence>
        {!hideSidebar && isScoutSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className='hidden lg:flex'
            style={{
              position: 'fixed',
              left: SIDEBAR_W + 32,
              top: 16,
              bottom: 16,
              width: 300,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 10px 30px -10px rgba(22,49,70,.08)',
              border: '1px solid rgba(22,49,70,.06)',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 39,
            }}
          >
            <div style={{ padding: '14px 16px', background: '#163146', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src='/scout.png' alt='' style={{ width: 20, height: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={(e) => { e.target.style.display = 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>Scout AI</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>Signil assistant</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={startNewScoutChat} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', padding: '5px 9px', borderRadius: 6, background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>NEW CHAT</button>
                <button onClick={() => setIsScoutSidebarOpen(false)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto' style={{ padding: '12px', background: '#faf7f2', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scoutMessages.map((message) => (
                <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '92%', background: message.role === 'user' ? '#163146' : '#fff', color: message.role === 'user' ? '#fff' : '#163146', borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 12px', fontSize: 12, lineHeight: 1.55, border: message.role === 'user' ? 'none' : '1px solid rgba(22,49,70,.08)' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                    {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {message.suggestions.map((suggestion) => (
                          <button key={suggestion.userId} onClick={() => navigate(suggestion.profilePath || `/profile/public/${suggestion.userId}`)} style={{ textAlign: 'left', background: '#f7f8fa', border: '1px solid rgba(22,49,70,.1)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#163146' }}>{suggestion.name}</p>
                            <p style={{ margin: 0, fontSize: 10, color: 'rgba(22,49,70,.55)' }}>{suggestion.userType}{suggestion.sport ? ` • ${suggestion.sport}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {Array.isArray(message.options) && message.options.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {message.options.map((option) => (
                          <button key={`${message.id}-${option.value}`} onClick={() => handleScoutOptionClick(option.value)} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: '#fff', color: '#163146', border: '1px solid rgba(22,49,70,.2)', cursor: 'pointer' }}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isScoutLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(22,49,70,.08)', borderRadius: '14px 14px 14px 4px', padding: '10px 12px', fontSize: 12, color: 'rgba(22,49,70,.5)' }}>Scout is finding the best matches...</div>
                </div>
              )}
              <div ref={scoutEndRef} />
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(22,49,70,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type='text' value={scoutInput} onChange={(e) => setScoutInput(e.target.value)} onKeyDown={handleScoutKeyDown} placeholder='Ask for athletes, advisors, or skills...' style={{ flex: 1, background: '#f4f1ea', border: 0, borderRadius: 10, padding: '9px 12px', fontSize: 11, color: '#163146', fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={sendScoutMessage} disabled={isScoutLoading || !scoutInput.trim()} style={{ width: 32, height: 32, borderRadius: 10, background: '#986a41', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isScoutLoading || !scoutInput.trim()) ? 0.5 : 1 }}>
                <Send size={13} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Drawer trigger is now in sidebar; drawer itself lives here */}

      {/* (Top bar removed — greeting is now part of DashboardPage for the new design) */}
      {/* Mobile-only top bar for small screens */}
      <motion.header
        className='md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100'
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className='px-4 py-3 flex items-center justify-between'>
          <img src='/logo.png' alt='Signil' className='h-7 w-auto object-contain' />
          <div className='flex items-center gap-2'>
            <motion.button
              onClick={() => { const newIsOpen = !isNotificationOpen; setIsNotificationOpen(newIsOpen); if (newIsOpen) handleMarkAllAsRead() }}
              className='relative w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center'
              whileTap={{ scale: 0.85 }}
            >
              <Bell size={18} />
              {effectiveUnreadCount > 0 && (
                <span className='absolute -top-1 -right-1 w-4 h-4 bg-[#163146] rounded-full text-white text-[9px] font-bold flex items-center justify-center'>
                  {effectiveUnreadCount > 9 ? '9+' : effectiveUnreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>
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
                                {effectiveUnreadCount === 0
                                  ? "You're all caught up"
                                  : `${effectiveUnreadCount} unread update${
                                      effectiveUnreadCount === 1 ? '' : 's'
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

                        <div className='px-6 pt-4'>
                          {notificationsSupported && (
                            <div className='rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3'>
                              <div className='flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-3 min-w-0'>
                                  <div className='w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0'>
                                    <Bell size={16} />
                                  </div>
                                  <div className='min-w-0'>
                                    <p className='text-xs font-bold text-amber-900 leading-tight'>Browser notifications</p>
                                    <p className='text-[11px] text-amber-700 leading-tight'>
                                      Get message alerts even when this tab is closed
                                    </p>
                                    <p className='text-[11px] text-amber-700/90 leading-tight mt-0.5'>
                                      Permission: {notificationPermission}
                                    </p>
                                    {isUpdatingMessageNotifications && (
                                      <p className='text-[11px] text-amber-700/80 leading-tight mt-0.5'>Updating...</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type='button'
                                  role='switch'
                                  aria-checked={notificationsEnabled && notificationPermission === 'granted'}
                                  aria-label='Toggle message notifications'
                                  onClick={toggleMessageNotifications}
                                  disabled={notificationPermission === 'denied' || isUpdatingMessageNotifications}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                    notificationsEnabled && notificationPermission === 'granted'
                                      ? 'bg-emerald-500'
                                      : 'bg-gray-300'
                                  } ${notificationPermission === 'denied' || isUpdatingMessageNotifications ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                      notificationsEnabled && notificationPermission === 'granted'
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              {notificationPermission !== 'granted' && (
                                <button
                                  type='button'
                                  onClick={allowMessageNotifications}
                                  disabled={isUpdatingMessageNotifications}
                                  className='mt-3 w-full rounded-lg bg-[#163146] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f2229] transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                  {notificationPermission === 'denied' ? 'Enable In Browser Settings' : 'Allow Notifications'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tabs Header */}
                        <div className='px-6 pt-4 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-50/50'>
                            <div className='flex items-center gap-2'>
                                {['all', 'invitations', 'updates'].map((tab) => {
                                    const label = tab.charAt(0).toUpperCase() + tab.slice(1)
                                    const isActive = activeTab === tab
                                    
                                    // Count logic
                                    const invitationTypes = ['connection_request', 'event_invitation']
                                    const count = tab === 'all' 
                                        ? collapsedNotifications.length 
                                        : tab === 'invitations' 
                                            ? collapsedNotifications.filter(n => invitationTypes.includes(n.type)).length
                                            : collapsedNotifications.filter(n => !invitationTypes.includes(n.type)).length

                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-full transition-colors duration-200 ${
                                                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId='activeTab'
                                                    className='absolute inset-0 bg-[#163146] shadow-md shadow-[#163146]/20 rounded-full'
                                                    initial={false}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative z-10">{label}</span>
                                            {count > 0 && (
                                                <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                                    isActive 
                                                    ? 'bg-white/20 text-white' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className='flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30'>
                          {collapsedNotifications.length === 0 ? (
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
                                const invitationTypes = ['connection_request', 'event_invitation']
                                let filtered = collapsedNotifications
                                if (activeTab === 'invitations') {
                                    filtered = collapsedNotifications.filter(n => invitationTypes.includes(n.type))
                                } else if (activeTab === 'updates') {
                                    filtered = collapsedNotifications.filter(n => !invitationTypes.includes(n.type))
                                }

                                if (filtered.length === 0) {
                                    return (
                                        <div className='flex flex-col items-center justify-center py-12 text-center'>
                                            <p className='text-sm text-gray-400'>No notifications in this category</p>
                                        </div>
                                    )
                                }

                                // Group by date
                                const groups = filtered.reduce((acc, notif) => {
                                    const date = getNotificationEventDate(notif)
                                    const now = new Date()
                                    const isToday = date.toDateString() === now.toDateString()
                                    const yesterday = new Date(now)
                                    yesterday.setDate(yesterday.getDate() - 1)
                                    const isYesterday = date.toDateString() === yesterday.toDateString()
                                    const key = isToday ? 'Today' : isYesterday ? 'Yesterday' : 'Older'
                                    if (!acc[key]) acc[key] = []
                                    acc[key].push(notif)
                                    return acc
                                }, {})

                                const order = ['Today', 'Yesterday', 'Older']

                                return (
                                    <div className="space-y-6">
                                        {order.map((group) => {
                                            const items = groups[group]
                                            if (!items || items.length === 0) return null

                                            return (
                                                <div key={group} className='animate-in fade-in slide-in-from-bottom-2 duration-500'>
                                                     <div className='flex items-center gap-2 mb-3 px-2'>
                                                        <div className='w-1 h-1 rounded-full bg-[#986a41]/50' />
                                                        <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                                                            {group}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className='grid gap-3'>
                                                        {items.map((notif) => {
                                                            const isInvitation = invitationTypes.includes(notif.type)
                                                            const { icon: Icon, bgColor, iconColor } = getNotificationIcon(notif.type)
                                                            const presentation = getNotificationPresentation(notif)
                                                            
                                                            return (
                                                                <motion.div
                                                                    key={notif._id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    whileHover={{ scale: 1.01, y: -1 }}
                                                                    whileTap={{ scale: 0.99 }}
                                                                    onClick={() => handleNotificationClick(notif)}
                                                                    className={`relative overflow-hidden rounded-xl transition-all cursor-pointer group ${
                                                                        isInvitation 
                                                                            ? 'bg-white border border-[#986a41]/20 shadow-sm' // Invitation Style
                                                                            : notif.isRead 
                                                                                ? 'bg-white/60 border border-gray-100' // Read Style
                                                                                : 'bg-white border border-[#163146]/10 shadow-sm border-l-4 border-l-[#986a41]' // Unread General Style
                                                                    }`}
                                                                >
                                                                    {/* Special Background for Invites */}
                                                                    {isInvitation && (
                                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#986a41]/5 to-transparent rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                                                                    )}

                                                                    <div className='flex gap-3 p-3.5'>
                                                                        {/* Icon */}
                                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 self-center ${bgColor} ${isInvitation ? 'ring-1 ring-white shadow-sm' : ''}`}>
                                                                            <Icon size={16} className={iconColor} />
                                                                        </div>
                                                                        
                                                                        {/* Content */}
                                                                        <div className='flex-1 min-w-0 relative z-10'>
                                                                            <span className='inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 mb-1 tracking-wide uppercase'>
                                                                              {presentation.tag}
                                                                            </span>

                                                                            <div className='flex items-start justify-between gap-3'>
                                                                                <h4 className={`text-[13px] font-semibold leading-[1.3] ${notif.isRead ? 'text-gray-700' : 'text-[#163146]'}`}>
                                                                                    {presentation.title}
                                                                                </h4>
                                                                                <span className='text-[10px] text-gray-400 whitespace-nowrap font-medium pt-0.5'>
                                                                                    {formatTimestamp(notif._eventAt || notif.updatedAt || notif.createdAt)}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            <p className='text-[12px] text-gray-500 mt-1 line-clamp-2 leading-[1.4]'>
                                                                                {presentation.description}
                                                                            </p>

                                                                            {isInvitation && (
                                                                                <div className='mt-2'>
                                                                                  <span className='text-[11px] font-medium text-[#163146]'>
                                                                                    Review invitation
                                                                                  </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Dismiss Action */}
                                                                     <button
                                                                        onClick={(e) => {
                                                                          e.stopPropagation()
                                                                          handleDeleteNotification(notif._groupIds || notif._id)
                                                                        }}
                                                                        className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all'
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
                                        })}
                                    </div>
                                )
                            })()
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

      {/* Main Content Wrapper */}
      <motion.div
        className='flex-1 flex flex-col pt-14 md:pt-0'
        style={{ marginLeft: 0 }}
        drag='x'
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
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
      {!hideSidebar && (
        <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40'>
          <div className='flex items-center justify-around h-20 px-2 gap-1'>
          {/* Dashboard */}
          <Link to='/dashboard' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'dashboard'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
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
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'messages'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
                    : 'text-gray-600'
                }`}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.12 }}
              >
                <MessageCircle size={20} />
                {/* Unread Message Bubble for Mobile */}
                {unreadMessagesCount > 0 && (
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center border border-white">
                    <span className="text-[8px] font-bold text-white leading-none">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                    </div>
                )}
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
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'calendar'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
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
            <div className='mt-2 w-10 border-t-[4px] border-[#163146] rounded-full' />
          </motion.button>

          {/* Explore */}
          <Link to='/explore' className='flex-1 min-w-0'>
            <motion.div className='relative flex flex-col items-center justify-center h-full'>
              <motion.button
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'explore'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
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
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'news'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
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
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 font-semibold ${
                  activeNav === 'profile'
                    ? 'bg-[#163146] text-white shadow-md scale-110'
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
      )}

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
                    <img
                      src='/scout.png'
                      alt='Scout AI'
                      className='w-6 h-6 object-contain'
                    />
                  </div>
                  <div>
                    <h3 className='text-white font-bold'>Scout AI</h3>
                    <p className='text-xs text-amber-100'>Signil assistant</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={startNewScoutChat}
                    className='px-2.5 py-1.5 rounded-lg bg-white/20 text-[10px] font-bold uppercase tracking-wide text-white'
                  >
                    New chat
                  </button>
                  <motion.button
                    onClick={() => setIsScoutOpen(false)}
                    className='text-white hover:text-amber-100 transition-colors'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              {/* Chat Area */}
              <div className='p-6 flex flex-col h-full max-h-[calc(90vh-120px)]'>
                <div className='flex-1 overflow-y-auto mb-4 space-y-3 pr-1'>
                  {scoutMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[88%] rounded-2xl px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-[#163146] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-700 rounded-bl-md'
                        }`}
                      >
                        <p className='text-sm leading-relaxed whitespace-pre-wrap'>{message.content}</p>
                        {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                          <div className='mt-2.5 space-y-2'>
                            {message.suggestions.map((suggestion) => (
                              <button
                                key={suggestion.userId}
                                onClick={() => {
                                  navigate(suggestion.profilePath || `/profile/public/${suggestion.userId}`)
                                  setIsScoutOpen(false)
                                }}
                                className='w-full text-left bg-white border border-gray-200 rounded-xl p-2.5'
                              >
                                <p className='text-xs font-semibold text-gray-900'>{suggestion.name}</p>
                                <p className='text-[11px] text-gray-600 mt-0.5 capitalize'>
                                  {suggestion.userType}
                                  {suggestion.sport ? ` • ${suggestion.sport}` : ''}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                        {Array.isArray(message.options) && message.options.length > 0 && (
                          <div className='mt-2.5 flex flex-wrap gap-2'>
                            {message.options.map((option) => (
                              <button
                                key={`${message.id}-${option.value}`}
                                onClick={() => handleScoutOptionClick(option.value)}
                                className='px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-white text-[#163146] border border-[#163146]/20'
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isScoutLoading && (
                    <div className='flex justify-start'>
                      <div className='bg-gray-100 text-gray-600 rounded-2xl rounded-bl-md px-3 py-2 text-sm'>
                        Scout is finding the best matches...
                      </div>
                    </div>
                  )}
                  <div ref={scoutEndRef} />
                </div>

                {/* Input Area */}
                <div className='flex gap-2 items-end'>
                  <input
                    type='text'
                    value={scoutInput}
                    onChange={(event) => setScoutInput(event.target.value)}
                    onKeyDown={handleScoutKeyDown}
                    placeholder='Ask for athletes or expertise...'
                    className='flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2'
                    style={{ '--tw-ring-color': '#986a41' }}
                  />
                  <motion.button
                    onClick={sendScoutMessage}
                    disabled={isScoutLoading || !scoutInput.trim()}
                    className='p-3 rounded-lg text-white flex items-center justify-center flex-shrink-0'
                    style={{ backgroundColor: '#986a41' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send size={20} />
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
