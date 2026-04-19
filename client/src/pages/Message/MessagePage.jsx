// File: client/src/pages/Message/MessagePage.jsx
//
// MOBILE GESTURES:
// - Swipe Right: Open conversation drawer (when closed)
// - Swipe Left: Close conversation drawer (when open)
// - Desktop: Use menu button or navigation as normal
//
import imageCompression from 'browser-image-compression'
import EmojiPicker from 'emoji-picker-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Ban, Bell, BellOff, Calendar, Check, Clock, Download, FileText, Image as ImageIcon, LayoutGrid, Loader2, MapPin, Menu, MessageSquare, MoreVertical, Paperclip, Paperclip as PaperclipIcon, PenLine, Search, Send, Smile, Trash2, X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import ProfilePopup from '../../components/Dashboard/ProfilePopup'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { getThemeById } from '../../constants/themes'
import { fetchUnreadMessages, selectCurrentUser, setActiveConversationId, setUser } from '../../redux/userSlice'
import { authService } from '../../services/authService'
import { connectionService } from '../../services/connectionService'
import { eventService } from '../../services/eventService'
import { messageService } from '../../services/messageService'
import { profileService } from '../../services/profileService'
import { pushService } from '../../services/pushService'
import { socketService } from '../../services/socketService'
import DashboardLayout from '../Layout/DashboardLayout'

// Presence Indicator Component
const PresenceIndicator = ({ status }) => {
  const colors = {
    online: 'bg-emerald-500',
    away: 'bg-[#926435]',
    idle: 'bg-[#926435]/60',
    offline: 'bg-slate-300',
  }
  return (
    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${colors[status] || colors.offline}`} />
  )
}

const ConversationSkeleton = () => (
  <div className='p-4 border-b border-slate-50 flex items-center gap-4 animate-pulse'>
    <div className='w-14 h-14 rounded-full bg-slate-100 shadow-sm' />
    <div className='flex-1'>
      <div className='flex justify-between mb-2.5'>
        <div className='h-4 w-32 bg-slate-100 rounded-md' />
        <div className='h-3 w-14 bg-slate-50 rounded-md' />
      </div>
      <div className='h-3 w-5/6 bg-slate-50 rounded-md' />
    </div>
  </div>
)

const MessageSkeleton = () => (
  <div className='flex flex-col gap-8 p-8 overflow-hidden'>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`h-20 w-3/4 max-w-[340px] rounded-[24px] ${i % 2 === 0 ? 'bg-[#926435]/5' : 'bg-slate-50'} animate-pulse`} />
      </div>
    ))}
  </div>
)

// Avatar initials helper
const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// Helper to get consistent user ID from various object formats
const getUserId = (user) => {
  if (!user) return null
  // Prioritize userId (used in requests) then _id (standard) then id (fallback)
  return user.userId || user._id || user.id
}

// Get deterministic color based on name or ID
const getAvatarColor = (user) => {
  const colors = [
    'from-slate-400 to-slate-600',
    'from-[#163146] to-[#0f1f27]',
    'from-[#926435] to-[#7e5c3e]',
    'from-emerald-400 to-emerald-600',
    'from-indigo-400 to-indigo-600',
  ]
  
  // Use name for consistency across different ID formats, fallback to any available ID
  const name = user?.name && user.name !== 'User' ? user.name : null
  const id = user?._id || user?.id || user?.userId
  const seed = name || (id ? String(id) : 'User')
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Get image URL helper
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const getProfileImage = (user) => {
  if (!user) return null
  const path = user.profileImage || user.photo || user.profileImg
  if (path) return getImageUrl(path)
  const name = user.name && user.name !== 'User' ? user.name : (user.email ? user.email.split('@')[0] : 'User')
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
}

// Helper to get message snippet
const getMessageSnippet = (conv) => {
  if (conv.lastMessageSnippet) return conv.lastMessageSnippet
  if (!conv.lastMessage) return 'No messages yet'
  
  const msg = conv.lastMessage
  if (msg.content) {
    return msg.content.substring(0, 40) + (msg.content.length > 40 ? '...' : '')
  }
  
  if (msg.attachments && msg.attachments.length > 0) {
    const type = msg.type === 'image' ? 'image' : 'file'
    return `Sent a ${type}`
  }
  
  if (msg.type === 'event_invitation') return 'Sent an event invitation'
  if (msg.type === 'event') return 'Sent an event'
  
  return 'No messages yet'
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatLastSeen = (value) => {
  if (!value) return 'Last seen hidden'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Last seen hidden'
  return `Last seen ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

const MAX_CACHED_CONVERSATIONS = 60
const MAX_MESSAGES_PER_CONVERSATION = 120

const moveConversationToTop = (list, index, updatedConversation) => {
  if (index <= 0) {
    const next = [...list]
    next[0] = updatedConversation
    return next
  }
  return [updatedConversation, ...list.slice(0, index), ...list.slice(index + 1)]
}

const trimConversationMessages = (messages = []) => {
  if (messages.length <= MAX_MESSAGES_PER_CONVERSATION) return messages
  return messages.slice(messages.length - MAX_MESSAGES_PER_CONVERSATION)
}

const trimMessageCacheByConversations = (cache, orderedConversationIds, preferredConversationId) => {
  const keys = Object.keys(cache)
  if (keys.length <= MAX_CACHED_CONVERSATIONS) return cache

  const keysToKeep = new Set((orderedConversationIds || []).filter(Boolean).slice(0, MAX_CACHED_CONVERSATIONS))
  if (preferredConversationId) keysToKeep.add(preferredConversationId)

  const next = { ...cache }
  keys.forEach((key) => {
    if (!keysToKeep.has(key)) {
      delete next[key]
    }
  })
  return next
}

const updateConversationById = (list, conversationId, updater, moveToTop = false) => {
  const index = list.findIndex((conversation) => conversation._id === conversationId)
  if (index === -1) return list

  const current = list[index]
  const updated = updater(current)
  if (!updated || updated === current) return list

  if (moveToTop) {
    return moveConversationToTop(list, index, updated)
  }
  const next = [...list]
  next[index] = updated
  return next
}

// Expanded Profile View Component - Matches ProfilePopup styling
function ExpandedProfileView({
  user,
  onClose,
  onAccept,
  onDecline,
  isRequest = false,
  requestId = null,
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className='fixed top-0 left-0 right-0 bottom-0 h-screen w-screen backdrop-blur-md bg-black/20 z-40'
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] md:w-full max-w-xl bg-white rounded-[24px] shadow-2xl z-50 flex flex-col max-h-[75vh] md:max-h-[85vh] overflow-hidden'
      >
        {/* Header - sticky */}
        <div className='sticky top-0 flex items-center justify-between p-3 md:p-4 bg-white border-b border-gray-200 flex-shrink-0'>
          <h3 className='text-sm md:text-base font-bold text-gray-900'>
            Profile
          </h3>
          <motion.button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} className='text-gray-500' />
          </motion.button>
        </div>

        {/* Content - scrollable */}
        <div className='flex-1 overflow-y-auto'>
          <div className='p-3 md:p-4 space-y-2 md:space-y-3'>
            {/* Banner - uses bannerImage or themeId consistent with PublicProfilePage */}
            <div className='relative'>
              <div
                className='h-24 rounded-lg bg-cover bg-center'
                style={user?.bannerImage 
                    ? { backgroundImage: `url(${getImageUrl(user.bannerImage)})` } 
                    : getThemeById(user?.themeId || 'ocean').style
                }
              />
            </div>

            {/* Profile Info */}
            <div className='flex flex-col items-center -mt-14 relative z-10'>
                <motion.div
                className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${getAvatarColor(
                  user
                )} flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg overflow-hidden`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                <img 
                  src={getProfileImage(user)} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <span style={{ display: 'none' }}>{getInitials(user?.name || '')}</span>
              </motion.div>
              <h2 className='mt-3 md:mt-4 text-base md:text-lg font-bold text-gray-900 text-center truncate max-w-xs'>
                {user?.name}
              </h2>
              <p className='text-xs text-gray-600 mt-0.5 text-center'>
                {user?.title}
              </p>
              <p className='text-xs text-gray-500 mt-0.5 text-center'>
                📍 {user?.location}
              </p>
            </div>

            {/* About Section */}
            {user?.about && (
              <div className='text-left'>
                <h3 className='font-semibold text-gray-900 text-xs md:text-sm mb-1'>
                  About
                </h3>
                <p className='text-xs text-gray-600 line-clamp-3'>
                  {user?.about}
                </p>
              </div>
            )}

            {/* Request Message */}
            {isRequest && user?.message && (
              <div className='text-left'>
                <h3 className='font-semibold text-gray-900 text-xs md:text-sm mb-1'>
                  Request Message
                </h3>
                <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                  {user.message}
                </p>
              </div>
            )}

            {/* Certifications */}
            {user?.certifications && user?.certifications.length > 0 && (
              <div className='text-left'>
                <h3 className='font-semibold text-gray-900 text-xs md:text-sm mb-1.5'>
                  Certifications & Licenses
                </h3>
                <div className='flex flex-wrap gap-1.5'>
                  {user?.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className='px-2.5 py-1 bg-[#163146] text-white text-xs font-medium rounded-full'
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise */}
            {user?.expertise && user?.expertise.length > 0 && (
              <div className='text-left'>
                <h3 className='font-semibold text-gray-900 text-xs md:text-sm mb-1.5'>
                  Expertise
                </h3>
                <div className='flex flex-wrap gap-1.5'>
                  {user?.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className='px-2.5 py-1 bg-[#163146] text-white text-xs font-medium rounded-lg'
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info Squares - Rating, Specialty, Experience, Connections */}
            {(user?.rating ||
              user?.specialty ||
              user?.experience ||
              user?.connections) && (
              <div className='grid grid-cols-4 gap-2'>
                {/* Rating */}
                {user?.rating && (
                  <motion.div
                    className='p-2 md:p-3 bg-gray-50 rounded-lg text-center border border-gray-200'
                    whileHover={{ scale: 1.02 }}
                  >
                    {user?.reviewCount >= 5 ? (
                      <>
                        <div className='flex items-center justify-center gap-0.5 mb-1'>
                          <svg
                            className='w-3 h-3 fill-amber-400'
                            viewBox='0 0 20 20'
                          >
                            <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                          </svg>
                          <span className='font-bold text-[10px] md:text-xs text-gray-900'>
                            {user?.rating}
                          </span>
                        </div>
                        <p className='text-[8px] md:text-[10px] text-gray-500 font-medium'>
                          ({user?.reviewCount})
                        </p>
                      </>
                    ) : (
                      <p className='text-[8px] md:text-[10px] font-semibold text-gray-500 leading-tight'>
                        Rating N/A
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Specialty */}
                {user?.specialty && (
                  <motion.div
                    className='p-2 md:p-3 bg-gray-50 rounded-lg text-center border border-gray-200'
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className='text-[8px] md:text-[10px] text-gray-500 font-medium mb-0.5'>
                      Specialty
                    </p>
                    <p className='font-bold text-[9px] md:text-xs text-gray-900 leading-tight'>
                      {user?.specialty}
                    </p>
                  </motion.div>
                )}

                {/* Experience */}
                {user?.experience && (
                  <motion.div
                    className='p-2 md:p-3 bg-gray-50 rounded-lg text-center border border-gray-200'
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className='text-[8px] md:text-[10px] text-gray-500 font-medium mb-0.5'>
                      Experience
                    </p>
                    <p className='font-bold text-[9px] md:text-xs text-gray-900'>
                      {user?.experience}y
                    </p>
                  </motion.div>
                )}

                {/* Connections */}
                {user?.connections && (
                  <motion.div
                    className='p-2 md:p-3 bg-gray-50 rounded-lg text-center border border-gray-200'
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className='text-[8px] md:text-[10px] text-gray-500 font-medium mb-0.5'>
                      Connections
                    </p>
                    <p className='font-bold text-[9px] md:text-xs text-gray-900 line-clamp-1'>
                      {user?.connections}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - sticky bottom */}
        <div className='flex gap-2 p-3 md:p-4 border-t border-gray-200 bg-white flex-shrink-0'>
          {isRequest ? (
            <>
              <motion.button
                onClick={() => onAccept(requestId)}
                className='flex-1 py-1.5 md:py-2 px-2 md:px-3 bg-[#163146] text-white font-semibold text-xs rounded-lg hover:bg-[#0f1f27] transition-colors flex items-center justify-center gap-1'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check size={14} />
                Accept
              </motion.button>
              <motion.button
                onClick={() => onDecline(requestId)}
                className='flex-1 py-1.5 md:py-2 px-2 md:px-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-100 transition-colors'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Decline
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={onClose}
              className='flex-1 py-1.5 md:py-2 px-2 md:px-3 bg-[#163146] text-white font-semibold text-xs rounded-lg hover:bg-[#0f1f27] transition-colors flex items-center justify-center gap-1'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}


const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#163146]/20 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100"
        >
          <div className="p-8">
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-bold">{message}</p>
          </div>
          <div className="flex gap-3 p-6 bg-slate-50/50 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
            >
              {cancelText || 'Cancel'}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-xl ${
                type === 'danger' 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-[#163146] hover:bg-[#0f1f27] shadow-blue-900/20'
              }`}
            >
              {confirmText || 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


// Main Component

function MessagePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLoggedInUser = useSelector(selectCurrentUser)
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'network')
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProfile, setExpandedProfile] = useState(null)
  const [expandedProfileType, setExpandedProfileType] = useState(null) // 'user' or 'request'
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesTotalPages, setMessagesTotalPages] = useState(1)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [messageCache, setMessageCache] = useState({})
  const messageEndRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const skipAutoScrollRef = useRef(false)
  const shouldAutoScrollRef = useRef(true)
  const forceScrollRef = useRef(false)
  const [dragStart, setDragStart] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadedFileData, setUploadedFileData] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [respondingMessageId, setRespondingMessageId] = useState(null)
  const [processingRequestId, setProcessingRequestId] = useState(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [addNoteMode, setAddNoteMode] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [notificationsSupported, setNotificationsSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isUpdatingMessageNotifications, setIsUpdatingMessageNotifications] = useState(false)
  const [showLastSeen, setShowLastSeen] = useState(true)
  const [isUpdatingLastSeen, setIsUpdatingLastSeen] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: '',
    type: 'danger'
  })
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const chatMenuRef = useRef(null)
  // Current conversation details
  const currentConversation = conversations.find(
    (c) => c._id === selectedConversationId
  )
  const selectedUser = currentConversation?.otherUser
  const isConnected = currentConversation?.connectionStatus === 'connected'

  const typingTimeoutRef = useRef(null)
  const lastTypingEmitRef = useRef(0)
  const selectedIdRef = useRef(selectedConversationId)
  const selectedUserRef = useRef(selectedUser)
  const conversationsRef = useRef(conversations)
  const loadConversationsRef = useRef(null)
  const notificationsSupportedRef = useRef(false)
  const notificationsEnabledRef = useRef(false)
  
  const dispatch = useDispatch()

  const updateConversation = useCallback((conversationId, updater, moveToTop = false) => {
    if (!conversationId) return
    setConversations((prev) => updateConversationById(prev, conversationId, updater, moveToTop))
  }, [])

  const appendMessageToConversationCache = useCallback((conversationId, message) => {
    if (!conversationId || !message?._id) return
    setMessageCache((prev) => {
      const current = prev[conversationId] || []
      if (current.some((msg) => msg._id === message._id)) return prev

      const trimmedMessages = trimConversationMessages([...current, message])

      const next = {
        ...prev,
        [conversationId]: trimmedMessages,
      }
      return trimMessageCacheByConversations(
        next,
        conversationsRef.current.map((conv) => conv._id),
        conversationId
      )
    })
  }, [])

  const applyIncomingMessageToConversations = useCallback((conversationId, message) => {
    updateConversation(
      conversationId,
      (currentConversation) => {
        if (currentConversation.lastMessage?._id === message._id) return currentConversation

        const isActive = selectedIdRef.current === conversationId
        const unreadCount = isActive
          ? currentConversation.unreadCount || 0
          : (currentConversation.unreadCount || 0) + 1

        return {
          ...currentConversation,
          lastMessage: message,
          lastMessageAt: message.createdAt || new Date(),
          unreadCount,
          showUnreadDot: !isActive && unreadCount > 0,
        }
      },
      true
    )
  }, [updateConversation])

  // Sync refs
  useEffect(() => {
    selectedIdRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    forceScrollRef.current = true
  }, [selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return
    updateConversation(
      selectedConversationId,
      (conversation) => {
        if (!conversation.unreadCount && !conversation.showUnreadDot) return conversation
        return { ...conversation, unreadCount: 0, showUnreadDot: false }
      }
    )
  }, [selectedConversationId, updateConversation])

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    const enabled = currentLoggedInUser?.settings?.showLastSeen
    setShowLastSeen(enabled === undefined ? true : Boolean(enabled))
  }, [currentLoggedInUser?.settings?.showLastSeen])

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

      if (result.ok) {
        toast.success('Message notifications turned on.')
        return
      }

      if (result.reason === 'denied') {
        toast.error(pushService.getFailureMessage(result.reason))
        return
      }
      if (!result.ok) {
        toast.error(pushService.getFailureMessage(result.reason))
      }
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
    if (!currentLoggedInUser?._id) return
    if (!notificationsSupportedRef.current) return
    if (!pushService.getMessageNotificationsEnabled()) return
    if (pushService.getPermission() !== 'granted') return

    pushService.syncEnabledSubscription().catch(() => {
      // Silent recovery attempt only. User can retry from toggle if needed.
    })
  }, [currentLoggedInUser?._id])

  const toggleLastSeen = async () => {
    if (isUpdatingLastSeen) return
    setIsUpdatingLastSeen(true)
    const next = !showLastSeen

    try {
      const response = await profileService.updateSettings({ showLastSeen: next })
      setShowLastSeen(next)

      const updatedUser = response?.data?.user
      if (updatedUser && currentLoggedInUser) {
        dispatch(
          setUser({
            ...currentLoggedInUser,
            ...updatedUser,
            settings: {
              ...(currentLoggedInUser.settings || {}),
              ...(updatedUser.settings || {}),
            },
          })
        )
      } else if (currentLoggedInUser) {
        dispatch(
          setUser({
            ...currentLoggedInUser,
            settings: {
              ...(currentLoggedInUser.settings || {}),
              showLastSeen: next,
            },
          })
        )
      }

      toast.success(next ? 'Last seen turned on.' : 'Last seen turned off.')
    } catch (error) {
      toast.error(error || 'Failed to update last seen setting.')
    } finally {
      setIsUpdatingLastSeen(false)
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

  
  // Socket connection and events - persistent lifecycle
  useEffect(() => {
    if (currentLoggedInUser) {
      const socket = socketService.connect(localStorage.getItem('token'))

      // Handle new message - prevent duplicates
      const handleNewMessage = ({ message, conversationId }) => {
        // Update messages if this is the active conversation
        if (selectedIdRef.current === conversationId) {
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some(m => m._id === message._id)) {
              return prev
            }
            return [...prev, message]
          })

          appendMessageToConversationCache(conversationId, message)
        }
        
        applyIncomingMessageToConversations(conversationId, message)

        const shouldNotify = notificationsSupportedRef.current
          && notificationsEnabledRef.current
          && Notification.permission === 'granted'
          && message.sender !== currentLoggedInUser?._id
          && (document.hidden || selectedIdRef.current !== conversationId)

        if (shouldNotify) {
          // If push notifications are enabled, service worker handles browser alerts.
          // Avoid duplicate notifications from both socket + push.
          return
        }
      }
      socket.on('new_message', handleNewMessage)

      // Handle typing indicator with auto-timeout
      const handleTypingUpdate = ({ userId, isTyping }) => {
        if (selectedUserRef.current?._id === userId) {
          setOtherUserTyping(isTyping)
          
          // Auto-clear typing indicator after 3 seconds if user stops
          if (isTyping) {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false)
            }, 3000)
          } else {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
          }
        }
      }
      socket.on('typing_update', handleTypingUpdate)

      // Handle presence updates
      const handlePresenceUpdate = ({ userId, status, lastSeen }) => {
        if (!userId) return
        setConversations((prev) => {
          const index = prev.findIndex((conversation) => conversation.otherUser?._id === userId)
          if (index === -1) return prev

          const current = prev[index]
          const prevUser = current.otherUser || {}
          if (
            prevUser.status === status &&
            (prevUser.lastSeen ?? null) === (lastSeen ?? null)
          ) {
            return prev
          }

          const next = [...prev]
          next[index] = {
            ...current,
            otherUser: { ...prevUser, status, lastSeen: lastSeen ?? null },
          }
          return next
        })
      }
      socket.on('presence_update', handlePresenceUpdate)

      const handleConversationRead = ({ conversationId, readerId, readAt }) => {
        if (!conversationId || !readerId) return
        if (readerId === currentLoggedInUser?._id) return
        const resolvedReadAt = readAt || new Date().toISOString()

        setMessages((prev) => {
          let changed = false
          const next = prev.map((msg) => {
            if (msg.sender === currentLoggedInUser?._id && !msg.isRead) {
              changed = true
              return { ...msg, isRead: true, readAt: resolvedReadAt }
            }
            return msg
          })
          return changed ? next : prev
        })

        setMessageCache((prev) => {
          const convoMessages = prev[conversationId]
          if (!convoMessages?.length) return prev

          let changed = false
          const updatedMessages = convoMessages.map((msg) => {
            if (msg.sender === currentLoggedInUser?._id && !msg.isRead) {
              changed = true
              return { ...msg, isRead: true, readAt: resolvedReadAt }
            }
            return msg
          })
          if (!changed) return prev

          return { ...prev, [conversationId]: updatedMessages }
        })
      }
      socket.on('conversation_read', handleConversationRead)

      const handleConversationBlockStatus = ({ conversationId, isBlocked, blockedBy }) => {
        if (!conversationId) return
        updateConversation(
          conversationId,
          (conversation) => {
            if (
              conversation.isBlocked === isBlocked &&
              conversation.blockedBy?.toString() === blockedBy?.toString()
            ) {
              return conversation
            }
            return { ...conversation, isBlocked, blockedBy }
          }
        )
      }
      socket.on('conversation_block_status', handleConversationBlockStatus)

      // Handle message deletion
      const handleMessageDeleted = ({ messageId, conversationId }) => {
        setMessages((prev) => {
          let changed = false
          const next = prev.map((msg) => {
            if (msg._id !== messageId || msg.isDeleted) return msg
            changed = true
            return { ...msg, isDeleted: true }
          })
          return changed ? next : prev
        })
        
        // Update cache
        setMessageCache((prev) => {
          const list = prev[conversationId] || []
          if (!list.length) return prev

          let changed = false
          const updatedList = list.map((msg) => {
            if (msg._id !== messageId || msg.isDeleted) return msg
            changed = true
            return { ...msg, isDeleted: true }
          })
          if (!changed) return prev

          return { ...prev, [conversationId]: updatedList }
        })
      }
      socket.on('message_deleted', handleMessageDeleted)

      // Handle conversation deletion
      const handleConversationDeleted = ({ conversationId }) => {
        setConversations((prev) => prev.filter(c => c._id !== conversationId))
        if (selectedIdRef.current === conversationId) {
          setSelectedConversationId(null)
          setMessages([])
          toast.info('This conversation has been deleted')
        }
        
        // Clear cache
        setMessageCache(prev => {
          const newCache = { ...prev }
          delete newCache[conversationId]
          return newCache
        })
      }
      socket.on('conversation_deleted', handleConversationDeleted)

      // Handle new event invitation
      const handleEventInvitation = ({ message }) => {
        loadConversationsRef.current?.()
        toast.info(`New event invitation: ${message.eventInfo?.title || 'Event'}`)
      }
      socket.on('event_invitation', handleEventInvitation)

      // Handle event invitation response updates
      const handleEventInvitationResponse = ({ messageId, status }) => {
        setMessages((prev) => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, eventInfo: { ...msg.eventInfo, invitationStatus: status } }
            : msg
        ))
      }
      socket.on('event_invitation_response', handleEventInvitationResponse)

      return () => {
        // Cleanup listeners
        socket.off('new_message', handleNewMessage)
        socket.off('typing_update', handleTypingUpdate)
        socket.off('presence_update', handlePresenceUpdate)
        socket.off('conversation_read', handleConversationRead)
        socket.off('conversation_block_status', handleConversationBlockStatus)
        socket.off('message_deleted', handleMessageDeleted)
        socket.off('conversation_deleted', handleConversationDeleted)
        socket.off('event_invitation', handleEventInvitation)
        socket.off('event_invitation_response', handleEventInvitationResponse)
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }
  }, [applyIncomingMessageToConversations, appendMessageToConversationCache, currentLoggedInUser])

  // Join conversation room and sync active ID
  useEffect(() => {
    if (selectedConversationId) {
      socketService.joinConversation(selectedConversationId)
      dispatch(setActiveConversationId(selectedConversationId))
      
      return () => {
        socketService.leaveConversation(selectedConversationId)
        dispatch(setActiveConversationId(null))
      }
    }
  }, [selectedConversationId, dispatch])

  const loadConversations = React.useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true)
      const response = await messageService.getConversations()
      if (response.data.status === 'success') {
        const convs = response.data.data.conversations
        setConversations(convs)
        
        // Handle navigation from profile "Message" button or Dashboard
        const recipientId = location.state?.recipientId
        if (isInitial && recipientId) {
          const existing = convs.find(
            c => c.otherUser._id === recipientId || c.otherUser.userId === recipientId
          )
          if (existing) {
            setSelectedConversationId(existing._id)
          } else {
            // Start new conversation if they are connected
            try {
              const startRes = await messageService.startConversation(recipientId)
              if (startRes.data.status === 'success') {
                const newConv = startRes.data.data.conversation
                // Refresh conversations to get enriched data
                const refreshed = await messageService.getConversations()
                const refreshedConvs = refreshed.data.data.conversations
                
                const inList = refreshedConvs.find(c => c._id === newConv._id)
                if (!inList) {
                  if (!newConv.otherUser || !newConv.otherUser.name) {
                      const p1 = newConv.participant1
                      const p2 = newConv.participant2
                      let other = (p1?._id || p1) === currentLoggedInUser._id ? p2 : p1
                      
                      if (typeof other === 'string' || (other._id && !other.name)) {
                          const otherId = typeof other === 'string' ? other : other._id
                          try {
                              const userRes = await profileService.getProfileByUserId(otherId)
                              if (userRes.data.status === 'success') {
                                  other = userRes.data.data.user
                              }
                          } catch (e) {
                              console.error('Failed to fetch missing profile for chat', e)
                              other = { _id: otherId, name: 'User', profileImage: null } 
                          }
                      }
                      newConv.otherUser = other
                  }
                  refreshedConvs.unshift(newConv)
                }

                setConversations(refreshedConvs)
                setSelectedConversationId(newConv._id)
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Could not start conversation')
            }
          }
        } else if (isInitial && convs.length > 0 && !selectedConversationId) {
          setSelectedConversationId(convs[0]._id)
        } else if (isInitial && convs.length === 0) {
          setActiveTab('requests')
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      if (isInitial) setIsLoading(false)
    }
  }, [currentLoggedInUser, location.state?.recipientId, selectedConversationId, dispatch])

  loadConversationsRef.current = loadConversations

  // Fetch conversations on mount
  useEffect(() => {
    if (currentLoggedInUser) {
      loadConversations(true)
    }
  }, [currentLoggedInUser])

  // Fetch messages when selectedConversationId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) return

      setMessagesPage(1)
      setMessagesTotalPages(1)

      // Use cache if available for instant UI update
      if (messageCache[selectedConversationId]) {
        setMessages(messageCache[selectedConversationId])
        forceScrollRef.current = true
      } else {
        setIsMessagesLoading(true)
      }

      try {
        const response = await messageService.getMessages(selectedConversationId, 1, 30)
        if (response.data.status === 'success') {
          const newMessages = trimConversationMessages(response.data.data.messages || [])
          setMessages(newMessages)
          forceScrollRef.current = true
          setMessagesPage(response.data.currentPage || 1)
          setMessagesTotalPages(response.data.totalPages || 1)

          // Update cache
          setMessageCache((prev) =>
            trimMessageCacheByConversations(
              { ...prev, [selectedConversationId]: newMessages },
              conversationsRef.current.map((conv) => conv._id),
              selectedConversationId
            )
          )

          // Mark conversation read on server and refresh unread count
          await messageService.markConversationRead(selectedConversationId)
          dispatch(fetchUnreadMessages())
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setIsMessagesLoading(false)
      }
    }
    loadMessages()
  }, [selectedConversationId])

  // Fetch requests when tab changes to 'requests'
  useEffect(() => {
    const loadRequests = async () => {
      if (activeTab !== 'requests' || !currentLoggedInUser) return
      try {
        const response = await connectionService.getPendingRequests(currentLoggedInUser._id)
        if (response.data.status === 'success') {
          // Format requests to match expected UI
          const formatted = response.data.data.requests.map(req => ({
            id: req.requestId,
            userId: req.sender.userId,
            name: req.sender.name,
            profileImage: req.from?.profileImage,
            title: req.from?.title,
            location: req.from?.location,
            about: req.from?.about,
            certifications: req.from?.certifications,
            expertise: req.from?.expertise,
            bannerImage: req.from?.bannerImage,
            themeId: req.from?.themeId,
            rating: req.from?.rating,
            reviewCount: req.from?.reviewCount,
            experience: req.from?.experience,
            message: req.message,
            timestamp: formatDate(req.sentAt),
            from: req.from
          }))
          setRequests(formatted)
        }
      } catch (error) {
        console.error('Failed to load requests:', error)
      }
    }
    loadRequests()
  }, [activeTab, currentLoggedInUser])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const res = await messageService.searchMessages(searchQuery)
          if (res.data.status === 'success') {
            setSearchResults(res.data.data.messages)
          }
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    const container = chatMessagesRef.current
    if (!container) return

    const handleScroll = () => {
      const threshold = 120
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      shouldAutoScrollRef.current = distanceFromBottom <= threshold
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [chatMessagesRef.current])

  const scrollToBottomImmediate = () => {
    const container = chatMessagesRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }

  // Auto scroll to bottom (no animation), but don't fight user scrolling
  useEffect(() => {
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false
      return
    }

    if (forceScrollRef.current) {
      requestAnimationFrame(() => {
        scrollToBottomImmediate()
        forceScrollRef.current = false
      })
      return
    }

    if (shouldAutoScrollRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [messages])

  // Handle swipe gestures for mobile
  const handleDragStart = (e) => {
    setDragStart(e.clientX || e.touches?.[0]?.clientX || 0)
  }

  const handleDragEnd = (e) => {
    const dragEnd = e.clientX || e.changedTouches?.[0]?.clientX || 0
    const dragDistance = dragStart - dragEnd
    const minSwipeDistance = 50

    // Swipe right (open drawer)
    if (dragDistance < -minSwipeDistance && !isMobileOpen) {
      setIsMobileOpen(true)
    }
    // Swipe left (close drawer)
    else if (dragDistance > minSwipeDistance && isMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Max 10MB.')
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }

    // Auto-upload
    handleFileUpload(file)
  }

  const handleFileUpload = async (fileToProcess) => {
    const file = fileToProcess || selectedFile
    if (!file || !selectedConversationId || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)
    try {
      let fileToUpload = file

      // Compress if it's an image
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        try {
          fileToUpload = await imageCompression(file, options)
        } catch (error) {
          console.error('Compression failed:', error)
        }
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const response = await messageService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percentCompleted)
      })

      if (response.data.status === 'success') {
        const fileUrl = response.data.url
        setUploadedFileData({
          url: fileUrl,
          name: file.name,
          mimeType: file.type,
          size: file.size
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload file')
      setSelectedFile(null)
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }



  const handleBlockUser = async () => {
    if (!selectedConversationId) return

    setConfirmationModal({
      isOpen: true,
      title: 'Block User',
      message: 'Are you sure you want to block this user? They will not be able to message you or see your profile details.',
      confirmText: 'Block User',
      type: 'danger',
      onConfirm: async () => {
        try {
            await messageService.blockUser(selectedConversationId)
            toast.success('User blocked')
            setShowChatMenu(false)
            await loadConversations()
        } catch (error) {
            toast.error('Failed to block user')
        }
      }
    })
  }

  const handleUnblockUser = async () => {
    if (!selectedConversationId) return
    
    setConfirmationModal({
      isOpen: true,
      title: 'Unblock User',
      message: 'Are you sure you want to unblock this user? This will allow them to message you again.',
      confirmText: 'Unblock',
      type: 'primary',
      onConfirm: async () => {
        try {
            await messageService.unblockUser(selectedConversationId)
            toast.success('User unblocked')
            setShowChatMenu(false)
            await loadConversations()
        } catch (error) {
            toast.error('Failed to unblock user')
        }
      }
    })
  }

  const handleArchiveConversation = async () => {
    if (!selectedConversationId) return
    
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone and you will lose all message history.',
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: async () => {
        try {
            await messageService.archiveConversation(selectedConversationId)
            toast.success('Conversation and all its data deleted from DB')
            setShowChatMenu(false)
            setConversations(prev => prev.filter(c => c._id !== selectedConversationId))
            setSelectedConversationId(null)
            // Clear cache for this conversation
            setMessageCache(prev => {
              const newCache = { ...prev }
              delete newCache[selectedConversationId]
              return newCache
            })
        } catch (error) {
            toast.error('Failed to delete conversation')
        }
      }
    })
  }

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim()
    if ((!messageContent && !uploadedFileData) || !selectedConversationId || isSending || !isConnected) return
    
    // Safety check for blocked
    if (currentConversation?.isBlocked) {
        toast.error('You cannot send messages in a blocked conversation')
        return
    }

    if (isUploading) {
        toast.error('Please wait for file to finish uploading')
        return
    }
    
    setNewMessage('')
    setIsSending(true)
    
    const options = {}
    if (uploadedFileData) {
        options.type = uploadedFileData.mimeType.startsWith('image/') ? 'image' : 'document'
        options.attachments = [uploadedFileData]
    }
    
    try {
      const response = await messageService.sendMessage(selectedConversationId, messageContent, options)
      if (response.data.status === 'success') {
        const sentMsg = response.data.data.message
        
        setMessages(prev => {
          if (prev.some(m => m._id === sentMsg._id)) return prev
          return [...prev, sentMsg]
        })
        
        // Update cache for persistence between switches
        setMessageCache((prev) => {
          const current = prev[selectedConversationId] || []
          const updatedMessages = current.some((m) => m._id === sentMsg._id)
            ? current
            : trimConversationMessages([...current, sentMsg])

          return trimMessageCacheByConversations(
            { ...prev, [selectedConversationId]: updatedMessages },
            conversationsRef.current.map((conv) => conv._id),
            selectedConversationId
          )
        })
        
        // Update last message in conversations list
        updateConversation(
          selectedConversationId,
          (conversation) => ({
            ...conversation,
            lastMessage: sentMsg,
            lastMessageAt: sentMsg.createdAt || new Date(),
          }),
          true
        )

        // Reset file state
        setUploadedFileData(null)
        setSelectedFile(null)
        setPreviewUrl(null)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(error.response?.data?.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleConnect = (user) => {
    setExpandedProfile(user)
    setAddNoteMode(false)
    setConnectionMessage('')
    setShowConnectionModal(true)
  }

  const handleSendConnection = async () => {
    if (!expandedProfile || !currentLoggedInUser) return
    try {
      setIsSending(true)
      const response = await connectionService.sendRequest(
        currentLoggedInUser._id,
        expandedProfile.id || expandedProfile._id,
        connectionMessage
      )
      if (response.data.status === 'success') {
        toast.success(`Connection request sent to ${expandedProfile.name}`)
        setShowConnectionModal(false)
        setConnectionMessage('')
        setExpandedProfile(null)
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error(error.response?.data?.message || 'Failed to send connection request')
    } finally {
      setIsSending(false)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    
    toast.promise(connectionService.acceptRequest(currentLoggedInUser._id, requestId), {
      loading: 'Accepting connection request...',
      success: (response) => {
        if (response.data.status === 'success') {
          setRequests(prev => prev.filter(r => r.id !== requestId))
          setExpandedProfile(null)
          setConversations(prev => prev.map(c => {
            if (c.connectionRequestId === requestId || c._id === selectedConversationId) {
              return { ...c, connectionStatus: 'connected' }
            }
            return c
          }))
          loadConversations() // Reload conversations to show the new connection
          return 'Connection request accepted!'
        }
        throw new Error(response.data.message || 'Failed to accept request')
      },
      error: (err) => {
        console.error('Failed to accept request:', err)
        return err.response?.data?.message || err.message || 'Failed to accept request'
      },
      finally: () => setProcessingRequestId(null)
    })
  }

  const handleDeclineRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    
    toast.promise(connectionService.declineRequest(currentLoggedInUser._id, requestId), {
      loading: 'Declining connection request...',
      success: (response) => {
        if (response.data.status === 'success') {
          setRequests(prev => prev.filter(r => r.id !== requestId))
          setExpandedProfile(null)
          setConversations(prev => prev.map(c => {
            if (c.connectionRequestId === requestId || c._id === selectedConversationId) {
              return { ...c, connectionStatus: 'not_connected' }
            }
            return c
          }))
          return 'Connection request declined'
        }
        throw new Error(response.data.message || 'Failed to decline request')
      },
      error: (err) => {
        console.error('Failed to decline request:', err)
        return err.response?.data?.message || err.message || 'Failed to decline request'
      },
      finally: () => setProcessingRequestId(null)
    })
  }

  const handleEventResponse = async (eventId, status) => {
    toast.promise(api.patch(`/events/${eventId}/respond`, { status }), {
      loading: `Updating event: ${status}...`,
      success: (response) => {
        if (response.data.status === 'success') {
          // Refresh messages to show updated status
          messageService.getMessages(selectedConversationId, 1, 30).then(msgRes => {
            if (msgRes.data.status === 'success') {
              const refreshedMessages = trimConversationMessages(msgRes.data.data.messages || [])
              setMessages(refreshedMessages);
              setMessagesPage(msgRes.data.currentPage || 1);
              setMessagesTotalPages(msgRes.data.totalPages || 1);
              setMessageCache((prev) =>
                trimMessageCacheByConversations(
                  { ...prev, [selectedConversationId]: refreshedMessages },
                  conversationsRef.current.map((conv) => conv._id),
                  selectedConversationId
                )
              )
            }
          });
          return `Event ${status}`;
        }
        throw new Error(response.data.message || 'Failed to update event');
      },
      error: 'Failed to respond to event'
    });
  }

  const handleLoadOlderMessages = async () => {
    if (!selectedConversationId || isLoadingOlder || messagesPage >= messagesTotalPages) return
    const container = chatMessagesRef.current
    if (!container) return

    const prevScrollHeight = container.scrollHeight
    const prevScrollTop = container.scrollTop
    const nextPage = messagesPage + 1

    try {
      setIsLoadingOlder(true)
      const response = await messageService.getMessages(selectedConversationId, nextPage, 30)
      if (response.data.status === 'success') {
        const olderMessages = response.data.data.messages || []
        skipAutoScrollRef.current = true
        setMessages((prev) => trimConversationMessages([...olderMessages, ...prev]))
        setMessagesPage(response.data.currentPage || nextPage)
        setMessagesTotalPages(response.data.totalPages || messagesTotalPages)
        setMessageCache((prev) => {
          const updatedMessages = trimConversationMessages([
            ...olderMessages,
            ...(prev[selectedConversationId] || []),
          ])
          return trimMessageCacheByConversations(
            { ...prev, [selectedConversationId]: updatedMessages },
            conversationsRef.current.map((conv) => conv._id),
            selectedConversationId
          )
        })

        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop
        })
      }
    } catch (error) {
      console.error('Failed to load older messages:', error)
    } finally {
      setIsLoadingOlder(false)
    }
  }

  // Handle event invitation response from message (new flow)
  const handleEventInvitationResponse = async (messageId, status) => {
    setRespondingMessageId(messageId);
    
    toast.promise(eventService.respondToEventInviteFromMessage(messageId, status), {
      loading: `Updating invitation status...`,
      success: (response) => {
        if (response.data.status === 'success') {
          // Update the message locally to reflect the new status
          setMessages(prev => prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, eventInfo: { ...msg.eventInfo, invitationStatus: status } }
              : msg
          ));
          // Refresh conversations to update any connection status changes
          loadConversations();
          return `Invitation ${status}!`;
        }
        throw new Error(response.data.message || 'Failed to update invitation');
      },
      error: (err) => {
        console.error('Error responding to event invitation:', err);
        return err.response?.data?.message || err.message || 'Failed to respond to event invitation';
      },
      finally: () => setRespondingMessageId(null)
    });
  }

  const handleDeleteMessage = async (messageId) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Message',
      message: 'Delete this message? This action is permanent and cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        setDeletingMessageId(messageId)
        try {
          await messageService.deleteMessage(messageId)
          toast.success('Message deleted')
        } catch (error) {
          console.error('Failed to delete message:', error)
          toast.error('Failed to delete message')
        } finally {
          setDeletingMessageId(null)
        }
      }
    })
  }

  const handleMessageInputChange = (e) => {
    const value = e.target.value
    setNewMessage(value)
    
    // Debounce typing indicator (emit max once every 2 seconds)
    const now = Date.now()
    if (selectedConversationId && value.trim() && now - lastTypingEmitRef.current > 2000) {
      socketService.sendTyping(selectedConversationId, true)
      lastTypingEmitRef.current = now
    }
  }

  const filteredItems = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    if (activeTab === 'network') {
      return conversations.filter((conv) => {
        const user = conv.otherUser
        return (
          user?.name?.toLowerCase().includes(searchLower) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchLower)
        )
      })
    }
    return requests.filter(
      (req) =>
        req.name.toLowerCase().includes(searchLower) ||
        req.message?.toLowerCase().includes(searchLower)
    )
  }, [activeTab, conversations, requests, searchQuery])

  return (
    <DashboardLayout>
      <>
      <style>{`
        @media (max-width: 1023px) {
          .message-page-container {
            height: calc(100dvh - 70px - 70px);
            padding-bottom: 0;
            margin-top: 0;
          }
          .chat-panel {
            height: 100%;
            display: flex;
            flex-direction: column;
            border-radius: 0;
            border: none;
          }
          .chat-messages-area {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
          }
          .chat-input-area {
            flex-shrink: 0;
            padding-bottom: max(env(safe-area-inset-bottom), 12px);
          }
        }
        @media (min-width: 768px) {
          .message-page-container {
            position: fixed;
            left: 260px;
            right: 16px;
            top: 16px;
            bottom: 16px;
            height: auto;
            overflow: hidden;
          }
        }
        .bg-brand-primary { background-color: #163146; }
        .text-brand-primary { color: #163146; }
        .bg-brand-accent { background-color: #926435; }
        .text-brand-accent { color: #926435; }
        .message-sent { background-color: #163146; color: white; border-radius: 20px 20px 4px 20px; }
        .message-received { background-color: white; color: #163146; border-radius: 20px 20px 20px 4px; border: 1px solid #f1f5f9; }
        .emoji-picker-container {
            position: absolute;
            bottom: 100%;
            left: 0;
            z-index: 50;
            margin-bottom: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            border-radius: 20px;
            overflow: hidden;
        }
      `}</style>
      <div
        className='message-page-container w-full mx-auto max-w-8xl flex flex-col lg:flex-row gap-2 md:gap-4 px-4 md:px-8 py-6 overflow-hidden bg-stone-50'
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchEnd={handleDragEnd}
              className='lg:hidden fixed inset-0 bg-black/20 z-40'
            />
          )}
        </AnimatePresence>

        {/* Left Panel - Mobile Drawer */}
        <motion.div
          animate={{
            x: isMobileOpen ? 0 : -400,
            opacity: isMobileOpen ? 1 : 0,
            pointerEvents: isMobileOpen ? 'auto' : 'none',
          }}
          transition={{ duration: 0.3 }}
          className='lg:hidden fixed left-0 top-0 h-screen w-72 z-50 mt-0'
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          <div className='rounded-none shadow-lg overflow-hidden flex flex-col h-full border-r border-gray-200 bg-white'>
            {/* Close Button with Swipe Hint */}
            <div className='flex flex-col p-3 border-b border-gray-100 gap-3'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-3'>
                  <h2 className='font-bold text-base text-[#163146]'>Messages</h2>
                  {notificationsSupported && (
                     <button
                       onClick={toggleMessageNotifications}
                       className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all font-bold tracking-wide text-[10px] uppercase ${
                         notificationsEnabled && notificationPermission === 'granted'
                           ? 'bg-slate-100 text-[#163146]'
                           : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                       }`}
                     >
                       {notificationsEnabled && notificationPermission === 'granted' ? <Bell size={14} className="fill-[#163146]" /> : <BellOff size={14} />}
                       <span className="pr-0.5">
                         {notificationsEnabled && notificationPermission === 'granted' ? 'Alerts On' : 'Alerts Off'}
                       </span>
                     </button>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-gray-500 hidden xs:inline'>
                    Swipe left to close
                  </span>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* Search */}
              <div className='flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2'>
                <Search size={16} className='text-gray-400 flex-shrink-0' />
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='flex-1 bg-transparent text-sm font-medium focus:outline-none'
                />
              </div>
            </div>

            {/* Tabs */}
            <div className='flex gap-2 p-3 border-b border-gray-100'>
              {['network', 'requests'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab
                      ? 'text-white bg-[#163146]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'network' ? 'Network' : 'Requests'}
                </button>
              ))}
            </div>

            {/* Conversation List */}
            {searchQuery.length >= 2 ? (
              <div className='flex-1 overflow-y-auto'>
                <div className='p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Search Results</div>
                {isSearching ? (
                  <div className='p-4 text-center text-xs text-gray-400'>Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className='p-4 text-center text-xs text-gray-400'>No messages found</div>
                ) : (
                  searchResults.map((msg) => (
                    <div 
                      key={msg._id} 
                      onClick={() => {
                        setSelectedConversationId(msg.conversationInfo._id)
                        setSearchQuery('')
                        setIsMobileOpen(false)
                      }}
                      className='p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer'
                    >
                      <div className='flex items-center gap-2 mb-1'>
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(msg.conversationInfo.otherUser)} flex items-center justify-center text-[10px] text-white font-bold`}>
                          {msg.conversationInfo.otherUser.profileImage ? <img src={getImageUrl(msg.conversationInfo.otherUser.profileImage)} className='w-full h-full rounded-full object-cover' /> : getInitials(msg.conversationInfo.otherUser.name)}
                        </div>
                        <span className='text-[10px] font-bold text-gray-700'>{msg.conversationInfo.otherUser.name}</span>
                        <span className='text-[8px] text-gray-400 ml-auto'>{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className='text-xs text-gray-600 line-clamp-2 italic'>
                        {msg.content ? `"${msg.content}"` : (msg.attachments?.length > 0 ? `[${msg.type === 'image' ? 'Image' : 'File'}]` : '')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
            <div className='flex-1 overflow-y-auto'>
              {filteredItems.length === 0 ? (
                <div className='p-3 text-center text-gray-400 text-xs'>
                  {activeTab === 'network' ? 'No conversations' : 'No requests'}
                </div>
              ) : activeTab === 'network' ? (
                <div>
                  {filteredItems.map((conv) => {
                    const user = conv.otherUser
                    const lastMsg = conv.lastMessage
                    return (
                      <div
                        key={conv._id}
                        onClick={() => {
                          setSelectedConversationId(conv._id)
                          setIsMobileOpen(false)
                        }}
                        className={`w-full p-3 border-b border-gray-100 text-left transition-all hover:bg-gray-50 ${
                          selectedConversationId === conv._id
                            ? 'bg-[#163146]/5'
                            : ''
                        }`}
                      >
                        <div className='flex items-start gap-2'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProfile(user)
                              setExpandedProfileType('user')
                            }}
                            className='relative flex-shrink-0 hover:opacity-75 transition-opacity'
                          >
                            <div
                              data-location="mobile-network-list"
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                                user
                              )} flex items-center justify-center text-white font-semibold text-xs overflow-hidden`}
                            >
                              <img 
                                src={getProfileImage(user)} 
                                alt="" 
                                className="w-full h-full rounded-full object-cover" 
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                              <span style={{ display: 'none' }}>{getInitials(user?.name || '')}</span>
                            </div>
                            {user?.status === 'online' && (
                              <div className='absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white' />
                            )}
                          </button>
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-start gap-1'>
                              <h3 className='font-semibold text-gray-900 text-xs truncate'>
                                {user?.name}
                              </h3>
                              <span className='text-xs text-gray-500 flex-shrink-0'>
                                 {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500 truncate'>
                               {getMessageSnippet(conv)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>
                  {filteredItems.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        setExpandedProfile(req)
                        setExpandedProfileType('request')
                      }}
                      className='p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-start gap-2'>
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                            req
                          )} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden`}
                        >
                          <img 
                            src={getProfileImage(req)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <span style={{ display: 'none' }}>{getInitials(req.name)}</span>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-gray-900 text-xs'>
                            {req.name}
                          </h3>
                          <p className='text-xs text-gray-500 truncate'>
                            {req.message || 'No message'}
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {req.timestamp}
                          </p>
                          <div
                            className='flex gap-2 mt-2 flex-wrap'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleAcceptRequest(req.id)
                                setIsMobileOpen(false)
                              }}
                              className='flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all bg-[#163146] hover:opacity-90'
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              className='flex-1 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all'
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Left Panel - Desktop */}
        <div className='hidden lg:flex flex-col w-80 rounded-2xl overflow-hidden bg-white border border-gray-200 h-full shadow-lg shadow-gray-200/50 transition-all hover:shadow-xl'>
          <div className='p-4 border-b border-slate-50 space-y-3 relative'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl flex-1 font-black text-[#163146] tracking-tight'>Messages</h2>
              {notificationsSupported && (
                 <button
                   type="button"
                   onClick={toggleMessageNotifications}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold tracking-wide text-[11px] uppercase ${
                     notificationsEnabled && notificationPermission === 'granted'
                       ? 'bg-slate-100 text-[#163146]'
                       : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                   }`}
                   title={notificationsEnabled && notificationPermission === 'granted' ? 'Alerts Enabled: Notify on new messages' : 'Enable Alerts'}
                 >
                   {notificationsEnabled && notificationPermission === 'granted' ? <Bell size={16} className="fill-[#163146]" /> : <BellOff size={16} />}
                   <span className="hidden sm:inline-block pr-1">
                     {notificationsEnabled && notificationPermission === 'granted' ? 'Alerts On' : 'Alerts Off'}
                   </span>
                 </button>
              )}
            </div>
            {/* Search */}
            <div className='flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 focus-within:ring-4 focus-within:ring-[#926435]/5 focus-within:border-[#926435]/30 transition-all'>
              <Search size={18} className='text-slate-400 flex-shrink-0' />
              <input
                type='text'
                placeholder='Search messages...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='flex-1 bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none'
              />
            </div>
          </div>

          {/* Tabs */}
          <div className='p-1 bg-gray-100/80 m-2 rounded-xl flex'>
            {['network', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeTab === tab
                    ? 'text-white bg-[#163146] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {tab === 'network' ? 'Network' : `Requests ${requests.length > 0 ? `(${requests.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* Conversation List */}
          {searchQuery.length >= 2 ? (
            <div className='flex-1 overflow-y-auto'>
               <div className='p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Search Results</div>
               {isSearching ? (
                 <div className='p-4 text-center text-xs text-gray-400'>Searching...</div>
               ) : searchResults.length === 0 ? (
                 <div className='p-4 text-center text-xs text-gray-400'>No messages found</div>
               ) : (
                 searchResults.map((msg) => (
                   <div 
                     key={msg._id} 
                     onClick={() => {
                        setSelectedConversationId(msg.conversationInfo._id)
                        setSearchQuery('')
                     }}
                     className='p-4 border-b border-gray-100 hover:bg-stone-50 cursor-pointer transition-colors group'
                   >
                     <div className='flex items-center gap-3 mb-2'>
                         <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(msg.conversationInfo.otherUser)} flex items-center justify-center text-xs text-white font-bold shadow-sm`}>
                          {msg.conversationInfo.otherUser.profileImage ? <img src={getImageUrl(msg.conversationInfo.otherUser.profileImage)} className='w-full h-full rounded-full object-cover' /> : getInitials(msg.conversationInfo.otherUser.name)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between items-center'>
                            <span className='text-xs font-bold text-gray-900 group-hover:text-[#986a41]'>{msg.conversationInfo.otherUser.name}</span>
                            <span className='text-[10px] text-gray-400'>{formatDate(msg.createdAt)}</span>
                          </div>
                        </div>
                     </div>
                     <p className='text-xs text-gray-600 line-clamp-2 italic pl-11 group-hover:text-gray-900 transition-colors'>"{msg.content}"</p>
                   </div>
                 ))
               )}
            </div>
          ) : (
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => <ConversationSkeleton key={i} />)
            ) : filteredItems.length === 0 ? (
              <div className='p-8 text-center flex flex-col items-center justify-center h-full opacity-50'>
                <LayoutGrid size={40} className='mb-3 text-gray-300' />
                <p className='text-xs text-gray-500 font-medium'>
                  {activeTab === 'network' ? 'No conversations' : 'No requests yet'}
                </p>
              </div>
            ) : activeTab === 'network' ? (
              <div className="flex-1 overflow-y-auto">
                {filteredItems.map((conv) => {
                  const user = conv.otherUser
                  return (
                    <div
                      key={conv._id}
                      onClick={() => {
                        setSelectedConversationId(conv._id)
                        setConversations((prev) =>
                          prev.map((c) =>
                            c._id === conv._id
                              ? { ...c, unreadCount: 0, showUnreadDot: false }
                              : c
                          )
                        )
                        messageService.markConversationRead(conv._id).catch(() => {})
                        dispatch(fetchUnreadMessages())
                      }}
                      className={`w-full p-4 border-b border-slate-50 text-left transition-all duration-300 hover:bg-slate-50/50 cursor-pointer relative group ${
                        selectedConversationId === conv._id
                          ? 'bg-slate-50 shadow-[inset_4px_0_0_0_#926435]'
                          : 'bg-transparent'
                      }`}
                    >
                        <div className='flex items-center gap-4'>
                          <div className='relative flex-shrink-0'>
                            <div
                              data-location="desktop-network-list"
                              className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(
                                user
                              )} flex items-center justify-center text-white font-black text-lg shadow-sm overflow-hidden`}
                            >
                              {user?.profileImage ? (
                                <img src={getProfileImage(user)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                  getInitials(user?.name || '')
                              )}
                            </div>
                            <div className='absolute -bottom-0.5 -right-0.5 translate-x-1/4 translate-y-1/4'>
                              <PresenceIndicator status={user?.status} />
                            </div>
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-center gap-2 mb-1'>
                              <h3 className={`font-black text-slate-900 text-[13px] tracking-tight truncate ${conv.showUnreadDot ? 'font-black' : ''}`}>
                                {user?.name}
                              </h3>
                              <span className='text-[10px] font-bold text-slate-400 flex-shrink-0'>
                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className='flex items-center justify-between gap-2'>
                              <p className={`text-xs truncate ${conv.showUnreadDot ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                                {getMessageSnippet(conv)}
                              </p>
                              {conv.showUnreadDot && (
                                <div className='w-2.5 h-2.5 bg-[#926435] rounded-full shadow-lg shadow-[#926435]/30 flex-shrink-0' />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div>
                {filteredItems.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setExpandedProfile(req)
                      setExpandedProfileType('request')
                    }}
                    className='p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                          req
                        )} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden`}
                      >
                        <img 
                          src={getProfileImage(req)} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <span style={{ display: 'none' }}>{getInitials(req.name)}</span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-900 text-sm'>
                          {req.name}
                        </h3>
                        <p className='text-xs text-gray-500 truncate'>
                          {req.message || 'No message'}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {req.timestamp}
                        </p>
                        <div
                          className='flex gap-2 mt-3 flex-wrap'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            disabled={processingRequestId === req.id}
                            onClick={() => handleAcceptRequest(req.id)}
                            className='flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 bg-[#163146] disabled:opacity-50 flex items-center justify-center'
                          >
                            {processingRequestId === req.id ? (
                              <Loader2 size={14} className='animate-spin' />
                            ) : (
                              'Accept'
                            )}
                          </button>
                          <button
                            disabled={processingRequestId === req.id}
                            onClick={() => handleDeclineRequest(req.id)}
                            className='flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center'
                          >
                            {processingRequestId === req.id ? (
                                <Loader2 size={14} className='animate-spin' />
                            ) : (
                                'Decline'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right Panel - Chat */}
        {currentConversation && selectedUser ? (
          <div className='flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden bg-white border border-gray-200 h-full chat-panel'>
            {/* Chat Header */}
            <div className='px-6 py-4 border-b border-slate-50 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-20'>
              <div className='flex items-center gap-4 flex-1 min-w-0'>
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className='lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors'
                >
                  <Menu size={22} className='text-slate-600' />
                </button>
                <div
                  className='flex items-center gap-4 flex-1 min-w-0 cursor-pointer group'
                  onClick={() => {
                    setExpandedProfile(selectedUser)
                    setExpandedProfileType('user')
                  }}
                >
                  <div className='relative flex-shrink-0'>
                    <div
                      data-location="chat-header"
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                        selectedUser
                      )} flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:ring-4 group-hover:ring-[#926435]/10 transition-all overflow-hidden`}
                    >
                      <img 
                        src={getProfileImage(selectedUser)} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className='absolute -bottom-0.5 -right-0.5 translate-x-1/4 translate-y-1/4'>
                      <PresenceIndicator status={selectedUser?.status} />
                    </div>
                  </div>
                  <div className='min-w-0'>
                    <h2 className='font-black text-slate-900 text-[15px] sm:text-lg tracking-tight truncate group-hover:text-[#926435] transition-colors'>
                      {selectedUser.name}
                    </h2>
                    <div className='flex items-center gap-2'>
                      <p className='text-[10px] sm:text-xs font-bold flex items-center gap-1.5'>
                        {selectedUser?.status === 'online' ? (
                          <span className='text-emerald-600 uppercase tracking-widest'>Online</span>
                        ) : selectedUser?.status === 'away' ? (
                          <span className='text-[#926435] uppercase tracking-widest'>Away</span>
                        ) : (
                          <span className='text-slate-400 font-medium'>{formatLastSeen(selectedUser?.lastSeen)}</span>
                        )}
                      </p>
                      {otherUserTyping && (
                        <span className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#926435]/5 text-[#926435] text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse'>
                          typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Blocked Status Banner */}
                {currentConversation?.isBlocked && (
                  <div className='flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full'>
                    <Ban size={14} className='text-rose-500' />
                    <span className='text-[10px] text-rose-700 font-black uppercase tracking-widest'>
                      {currentConversation.blockedBy?.toString() === currentLoggedInUser._id.toString() 
                        ? 'Blocked' 
                        : 'Conversation Blocked'}
                    </span>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                 <div className='relative' ref={chatMenuRef}>
                    <button
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className='p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors'
                    >
                        <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                        {showChatMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className='absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden'
                            >
                                {currentConversation?.isBlocked ? (
                                    <button
                                        onClick={handleUnblockUser}
                                        className='w-full px-4 py-2.5 text-left text-xs font-medium text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2'
                                    >
                                        <Check size={16} />
                                        Unblock User
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBlockUser}
                                        className='w-full px-4 py-2.5 text-left text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2'
                                    >
                                        <Ban size={16} />
                                        Block User
                                    </button>
                                )}
                                <div className='px-4 py-2.5 flex items-center justify-between border-t border-gray-100'>
                                  <div>
                                    <p className='text-xs font-medium text-gray-700'>Last seen</p>
                                    {isUpdatingLastSeen && (
                                      <p className='text-[10px] text-gray-400'>Updating...</p>
                                    )}
                                  </div>
                                  <button
                                    type='button'
                                    role='switch'
                                    aria-checked={showLastSeen}
                                    aria-label='Toggle last seen visibility'
                                    onClick={toggleLastSeen}
                                    disabled={isUpdatingLastSeen}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                      showLastSeen ? 'bg-emerald-500' : 'bg-gray-300'
                                    } ${isUpdatingLastSeen ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                        showLastSeen ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                                <button
                                    onClick={handleArchiveConversation}
                                    className='w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors'
                                >
                                    <Trash2 size={16} />
                                    Delete Conversation
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
              </div>
            </div>

            <div ref={chatMessagesRef} className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0 chat-messages-area bg-[#faf9f6]/30 ${isMessagesLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
              {isMessagesLoading ? (
                <MessageSkeleton />
              ) : (
                <>
                  {messagesPage < messagesTotalPages && (
                    <div className='flex justify-center'>
                      <button
                        onClick={handleLoadOlderMessages}
                        disabled={isLoadingOlder}
                        className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-50'
                      >
                        {isLoadingOlder ? 'Loading...' : 'Load older messages'}
                      </button>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full opacity-60 px-8 text-center'>
                      <div className='w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4'>
                        <MessageSquare size={32} className='text-gray-300' />
                      </div>
                      <h4 className='text-sm font-bold text-gray-900 mb-1'>No messages yet</h4>
                      <p className='text-xs text-gray-500 max-w-[240px]'>
                        Send a message to start the conversation with {selectedUser?.name}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isEventInvite = msg.type === 'event_invitation' && msg.eventInfo;
                      
                      if (isEventInvite) {
                        return (
                          <div
                            key={msg._id}
                            className={`flex w-full ${
                              msg.sender === currentLoggedInUser._id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className='mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-[420px] w-full overflow-hidden'
                            >
                              <div className='px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <div className='w-8 h-8 rounded-xl bg-[#163146]/10 text-[#163146] flex items-center justify-center'>
                                    <Calendar size={16} />
                                  </div>
                                  <div>
                                    <p className='text-[10px] font-bold uppercase tracking-widest text-slate-500'>Event Invite</p>
                                    <p className='text-sm font-semibold text-slate-900 truncate max-w-[220px]'>
                                      {msg.eventInfo.title}
                                    </p>
                                  </div>
                                </div>
                                {msg.sender === currentLoggedInUser._id && (
                                  <span className='text-[9px] font-bold uppercase tracking-widest text-slate-500'>
                                    Sent
                                  </span>
                                )}
                              </div>

                              <div className='px-4 py-3 grid grid-cols-2 gap-3 text-xs'>
                                <div className='flex items-center gap-2'>
                                  <Clock size={14} className='text-slate-400' />
                                  <div>
                                    <p className='text-[10px] text-slate-400 font-semibold uppercase tracking-widest'>Date</p>
                                    <p className='text-slate-700 font-semibold'>{formatDate(msg.eventInfo.startTime)}</p>
                                  </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <div className='w-2 h-2 rounded-full bg-emerald-500' />
                                  <div>
                                    <p className='text-[10px] text-slate-400 font-semibold uppercase tracking-widest'>Time</p>
                                    <p className='text-slate-700 font-semibold'>
                                      {new Date(msg.eventInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                {msg.eventInfo.location && (
                                  <div className='flex items-center gap-2 col-span-2'>
                                    <MapPin size={14} className='text-slate-400' />
                                    <p className='text-slate-600 font-medium truncate'>{msg.eventInfo.location}</p>
                                  </div>
                                )}
                              </div>

                              <div className='px-4 py-3 border-t border-slate-100 bg-white'>
                                {msg.eventInfo.invitationStatus === 'pending' && msg.sender !== currentLoggedInUser._id ? (
                                  <div className='flex gap-2'>
                                    <motion.button 
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.98 }}
                                      disabled={respondingMessageId === msg._id}
                                      onClick={() => handleEventInvitationResponse(msg._id, 'accepted')}
                                      className='flex-1 py-2 rounded-lg text-xs font-semibold bg-[#163146] text-white hover:bg-[#0f1f27] transition disabled:opacity-50'
                                    >
                                      {respondingMessageId === msg._id ? 'Working...' : 'Accept'}
                                    </motion.button>
                                    <motion.button 
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.98 }}
                                      disabled={respondingMessageId === msg._id}
                                      onClick={() => handleEventInvitationResponse(msg._id, 'declined')}
                                      className='flex-1 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50'
                                    >
                                      Decline
                                    </motion.button>
                                  </div>
                                ) : (
                                  <div className='flex items-center justify-between'>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                      msg.eventInfo.invitationStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                                      msg.eventInfo.invitationStatus === 'declined' ? 'bg-rose-50 text-rose-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {msg.eventInfo.invitationStatus === 'accepted' ? 'Confirmed' :
                                       msg.eventInfo.invitationStatus === 'declined' ? 'Declined' : 'Awaiting Response'}
                                    </div>
                                    <Link 
                                      to={`/calendar?eventId=${msg.eventInfo.eventId}`}
                                      className='text-xs font-semibold text-[#163146] hover:underline'
                                    >
                                      View details
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        );
                      }

                      // Check if message is deleted
                      if (msg.isDeleted) {
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${msg.sender === currentLoggedInUser._id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className='max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl bg-gray-100 border border-gray-200'>
                              <p className='text-sm text-gray-400 italic flex items-center gap-2'>
                                <AlertCircle size={14} className="opacity-60" /> 
                                Message deleted
                              </p>
                              <div className='flex items-center justify-end gap-1 mt-1 text-gray-400'>
                                <span className='text-[9px]'>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={msg._id}
                          className={`flex group ${
                            msg.sender === currentLoggedInUser._id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className='relative'>
                            {msg.sender === currentLoggedInUser._id && (
                              <button
                                onClick={() => handleDeleteMessage(msg._id)}
                                disabled={deletingMessageId === msg._id}
                                className='absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-20 z-10'
                                title='Delete message'
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <div
                              className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                msg.sender === currentLoggedInUser._id
                                  ? 'text-white bg-[#163146] rounded-br-none shadow-blue-900/10'
                                  : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none shadow-slate-200/50'
                              }`}
                            >
                              {msg.type === 'image' && msg.attachments?.[0] && (
                                  <div className='mb-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50'>
                                      <img 
                                          src={getImageUrl(msg.attachments[0].url)} 
                                          alt="Attachment" 
                                          className='max-h-60 w-full object-cover cursor-zoom-in'
                                          onClick={() => window.open(getImageUrl(msg.attachments[0].url), '_blank')}
                                      />
                                  </div>
                              )}
                              {msg.type === 'document' && msg.attachments?.[0] && (
                                  <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 ${msg.sender === currentLoggedInUser._id ? 'bg-white/10' : 'bg-gray-100'}`}>
                                      <FileText size={20} className={msg.sender === currentLoggedInUser._id ? 'text-white' : 'text-gray-500'} />
                                      <div className='flex-1 min-w-0'>
                                          <p className='text-[10px] font-bold truncate'>{msg.attachments[0].name}</p>
                                          <p className='text-[8px] opacity-70'>{(msg.attachments[0].size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <a 
                                          href={getImageUrl(msg.attachments[0].url)} 
                                          download 
                                          target='_blank'
                                          rel='noreferrer'
                                          className={`p-1 rounded-full hover:bg-black/10 transition-colors`}
                                      >
                                          <Download size={14} />
                                      </a>
                                  </div>
                              )}
                              
                              {msg.type === 'event' && msg.eventInfo && (
                                <div className={`mb-3 p-4 rounded-[1.5rem] border flex flex-col gap-4 shadow-sm transition-all hover:shadow-md ${
                                  msg.sender === currentLoggedInUser._id 
                                    ? 'bg-white/10 border-white/20 text-white' 
                                    : 'bg-white border-slate-100 text-slate-900'
                                }`}>
                                    <div className='flex items-start justify-between gap-4'>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl backdrop-blur-md ${
                                                msg.sender === currentLoggedInUser._id ? 'bg-white/20' : 'bg-blue-50'
                                            }`}>
                                                <Calendar size={18} className={msg.sender === currentLoggedInUser._id ? 'text-white' : 'text-blue-600'} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>Calendar Event</span>
                                                <span className='font-black text-sm leading-tight'>{msg.eventInfo.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className='flex flex-col gap-2'>
                                        <div className='flex items-center gap-2'>
                                            <Clock size={12} className={msg.sender === currentLoggedInUser._id ? 'text-white/60' : 'text-blue-500'} />
                                            <span className='text-[10px] font-bold'>
                                                {formatDate(msg.eventInfo.startTime)} • {new Date(msg.eventInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {msg.eventInfo.location && (
                                            <div className='flex items-center gap-2'>
                                                <MapPin size={12} className={msg.sender === currentLoggedInUser._id ? 'text-white/60' : 'text-blue-500'} />
                                                <span className='text-[10px] font-bold truncate max-w-[200px]'>{msg.eventInfo.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => window.open(`/calendar?eventId=${msg.eventInfo.eventId}`, '_blank')}
                                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border ${
                                            msg.sender === currentLoggedInUser._id 
                                              ? 'bg-white/20 hover:bg-white/30 text-white border-white/20' 
                                              : 'bg-slate-900 hover:bg-black text-white border-transparent'
                                        }`}
                                    >
                                        Open in Calendar
                                    </button>
                                </div>
                              )}

                              {msg.content && msg.type !== 'event_invitation' && <p className='text-sm sm:text-base break-words leading-relaxed'>{msg.content}</p>}
                              
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                msg.sender === currentLoggedInUser._id ? 'text-white/50' : 'text-slate-400'
                              }`}>
                                <span className='text-[9px] font-medium'>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.sender === currentLoggedInUser._id && (
                                  <div className="flex -space-x-1">
                                    <Check size={10} strokeWidth={3} className={msg.isRead ? 'text-[#986a41]' : 'opacity-40'} />
                                    {msg.isRead && <Check size={10} strokeWidth={3} className="text-[#986a41]" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {otherUserTyping && (
                    <div className="flex justify-start animate-fade-in pl-1">
                        <div className="bg-white border border-slate-100 rounded-[20px] rounded-bl-none px-5 py-3.5 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-[#926435]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#926435]/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#926435] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </>
              )}
            </div>


            <div className='px-6 py-4 border-t border-slate-50 flex-shrink-0 bg-white/80 backdrop-blur-md chat-input-area relative'>
              {!isConnected && selectedConversationId && currentConversation.connectionStatus !== 'blocked' && (
                <div className='absolute inset-x-0 bottom-full bg-[#926435]/95 backdrop-blur-md border-t border-[#926435]/10 px-6 py-4 flex items-center justify-between z-20 animate-in slide-in-from-bottom-2 duration-300'>
                  <div className='flex items-center gap-3 text-white'>
                    <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center'>
                      <Clock size={16} />
                    </div>
                    <p className='text-xs font-bold uppercase tracking-widest'>
                      {currentConversation.connectionStatus === 'pending' 
                        ? 'Waiting for Connection' 
                        : 'Accept Request to Message'}
                    </p>
                  </div>
                  {currentConversation.connectionStatus === 'received' && (
                    <button 
                      onClick={() => handleAcceptRequest(currentConversation.connectionRequestId)}
                      className='text-[10px] font-black bg-white text-[#926435] px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all uppercase tracking-[0.2em]'
                    >
                      Accept
                    </button>
                  )}
                </div>
              )}

              {/* File Preview */}
              <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className='mb-4 p-4 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center justify-between max-w-4xl mx-auto shadow-sm select-none'
                    >
                        <div className='flex items-center gap-4 overflow-hidden'>
                            {previewUrl ? (
                                <div className='w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm'>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className='w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-sm'>
                                    <FileText size={28} className='text-[#163146]' />
                                </div>
                            )}
                            <div className='min-w-0'>
                                <p className='text-[13px] font-black text-slate-900 tracking-tight truncate'>{selectedFile.name}</p>
                                <p className='text-[10px] text-slate-400 font-bold'>{(selectedFile.size / 1024).toFixed(1)} KB • Ready to send</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-3'>
                            {isUploading ? (
                              <div className="flex flex-col items-end gap-1.5 px-3">
                                <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-[#163146]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-[#163146] tracking-tighter">{uploadProgress}%</span>
                              </div>
                            ) : uploadedFileData ? (
                                <div className="flex items-center gap-2 px-3 text-emerald-600">
                                    <div className='w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center'>
                                      <Check size={12} strokeWidth={4} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ready</span>
                                </div>
                            ) : null}
                            <button 
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setUploadedFileData(null); setUploadProgress(0); }}
                                className='p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors'
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <div className='flex gap-4 items-center max-w-5xl mx-auto relative'>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="emoji-picker-container" ref={emojiPickerRef}>
                        <EmojiPicker 
                            onEmojiClick={handleEmojiClick}
                            width={320}
                            height={400}
                            skinTonesDisabled
                            searchDisabled
                        />
                    </div>
                )}

                <div className='flex gap-1.5'>
                  <button 
                    type='button'
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all ${showEmojiPicker ? 'bg-[#926435] text-white shadow-lg shadow-[#926435]/20' : 'hover:bg-slate-50 text-slate-400'}`}
                    title="Add Emoji"
                  >
                    <Smile size={22} />
                  </button>
                  <button 
                    type='button'
                    onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                    disabled={!isConnected}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all ${!isConnected ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-400'}`}
                    title={isConnected ? "Attach file" : "Connect to send files"}
                  >
                    <PaperclipIcon size={22} />
                  </button>
                  <Link 
                    to={`/calendar?action=create&inviteeId=${selectedUser._id}&name=${encodeURIComponent(selectedUser.name)}&profileImage=${encodeURIComponent(selectedUser.profileImage || '')}`}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all ${!isConnected ? 'text-slate-200 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 text-slate-400'}`}
                    title={isConnected ? "Schedule Event" : "Connect to schedule events"}
                  >
                    <Calendar size={22} />
                  </Link>
                </div>
                <div className='flex-1 relative flex items-end group'>
                  <textarea
                    rows={1}
                    placeholder={
                      currentConversation?.connectionStatus === 'blocked'
                        ? 'Messaging disabled'
                        : isConnected 
                          ? 'Write a message...' 
                          : 'Messaging restricted'
                    }
                    value={newMessage}
                    disabled={!isConnected || currentConversation?.isBlocked}
                    onChange={handleMessageInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        // Clear typing indicator immediately
                        socketService.sendTyping(selectedConversationId, false)
                        handleSendMessage()
                      }
                    }}
                    className={`w-full pl-5 pr-[56px] py-[15px] min-h-[54px] border rounded-[24px] text-sm font-bold tracking-tight transition-all resize-none max-h-40 ${
                      isConnected 
                        ? 'bg-slate-50 border-slate-100 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#926435]/5 focus:border-[#926435]/30' 
                        : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                    style={{ height: 'auto' }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !uploadedFileData) || isSending || isUploading}
                    className={`absolute right-1.5 bottom-1.5 w-[42px] h-[42px] rounded-[20px] transition-all flex items-center justify-center shadow-sm ${
                      (newMessage.trim() || uploadedFileData) && !isSending && !isUploading
                        ? 'bg-[#163146] text-white shadow-[#163146]/20' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Send size={18} strokeWidth={2.5} className={isSending ? 'animate-pulse' : ''} style={{ transform: 'translate(-1px, 1px)' }} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200'>
            <MessageSquare size={48} className='text-gray-300 mb-4' />
            <p className='text-gray-500 font-medium'>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Profile Popup for Users */}
      <ProfilePopup
        profile={expandedProfile ? {
            ...expandedProfile,
            id: expandedProfile._id || expandedProfile.userId || expandedProfile.id,
            profileImg: getProfileImage(expandedProfile),
            type: expandedProfile.userType || 'advisor',
            connections: expandedProfile.connections || 0,
            experience: expandedProfile.experience || 0,
            rating: expandedProfile.rating || 0,
            reviewCount: expandedProfile.reviewCount || 0,
            banner: expandedProfile.bannerImage 
              ? { backgroundImage: `url(${getImageUrl(expandedProfile.bannerImage)})` } 
              : getThemeById(expandedProfile?.themeId || 'ocean').style
        } : null}
        isOpen={!!expandedProfile && expandedProfileType === 'user'}
        onClose={() => setExpandedProfile(null)}
        currentUserType={currentLoggedInUser?.userType || 'athlete'}
        onConnect={handleConnect}
        onMessage={(u) => {
            setExpandedProfile(null)
            const recipientId = u.id || u._id
            if (recipientId) {
                navigate('/inbox', { state: { recipientId } })
            }
        }}
      />

      {/* Expanded Profile View for Requests */}
      <AnimatePresence>
        {expandedProfile && expandedProfileType === 'request' && (
          <ExpandedProfileView
            user={expandedProfile}
            onClose={() => setExpandedProfile(null)}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            isRequest={true}
            requestId={expandedProfile.id}
          />
        )}
      </AnimatePresence>


      {/* Connection Modal */}
      <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
        <DialogContent className='max-w-md rounded-3xl p-0 overflow-hidden border-0'>
          {/* Header */}
          <div className='bg-white p-6 pb-2'>
            <DialogHeader>
              <DialogTitle className='text-2xl font-bold text-slate-900'>Connect with {expandedProfile?.name}</DialogTitle>
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
                      placeholder={`Hi ${expandedProfile?.name?.split(' ')[0]}, I'd like to connect...`}
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
                    {expandedProfile?.name} will receive a notification immediately.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        onClick={(e) => { e.target.value = null }}
        className="w-0 h-0 opacity-0 overflow-hidden absolute pointer-events-none"
        accept="image/*,.pdf,.doc,.docx"
        tabIndex={-1}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      />
      </>
    </DashboardLayout>
  )
}

export default MessagePage
