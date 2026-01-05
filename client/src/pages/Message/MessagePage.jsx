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
import {
    Ban,
    Check,
    Download,
    FileText,
    Image as ImageIcon,
    Menu,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Paperclip as PaperclipIcon,
    Search,
    Send,
    Settings,
    Smile,
    Trash2,
    X,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { selectCurrentUser, setUser } from '../../redux/userSlice'
import { authService } from '../../services/authService'
import { connectionService } from '../../services/connectionService'
import { messageService } from '../../services/messageService'
import { profileService } from '../../services/profileService'
import { socketService } from '../../services/socketService'
import DashboardLayout from '../Layout/DashboardLayout'

// Presence Indicator Component
const PresenceIndicator = ({ status }) => {
  const colors = {
    online: 'bg-green-500',
    away: 'bg-orange-500',
    offline: 'bg-gray-400',
  }
  return (
    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${colors[status] || colors.offline}`} />
  )
}

// Avatar initials helper
const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// Avatar color helper
const getAvatarColor = (id) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-amber-400 to-amber-600',
  ]
  return colors[id % colors.length]
}

// Get image URL helper
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
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
            {/* Banner - simple background color based on user ID */}
            <div className='relative'>
              <div
                className='h-24 rounded-lg'
                style={{
                  backgroundColor: [
                    '#E3F2FD',
                    '#F3E5F5',
                    '#FCE4EC',
                    '#E8F5E9',
                    '#FFF3E0',
                  ][user?.id % 5],
                }}
              />
            </div>

            {/* Profile Info */}
            <div className='flex flex-col items-center -mt-14 relative z-10'>
              <motion.div
                className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${getAvatarColor(
                  user?.id || user?._id
                )} flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg overflow-hidden`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {user?.profileImage ? (
                  <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name || '')
                )}
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

// Main Component

function MessagePage() {
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
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const messageEndRef = useRef(null)
  const [dragStart, setDragStart] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [userSettings, setUserSettings] = useState(currentLoggedInUser?.settings || { showLastSeen: true })
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const chatMenuRef = useRef(null)
  const settingsMenuRef = useRef(null)
  
  const dispatch = useDispatch()

  // Current conversation details
  const currentConversation = conversations.find(
    (c) => c._id === selectedConversationId
  )
  const selectedUser = currentConversation?.otherUser
  // Socket connection and events
  useEffect(() => {
    if (currentLoggedInUser) {
      const socket = socketService.connect(localStorage.getItem('token'))

      socket.on('new_message', ({ message, conversationId }) => {
        if (selectedConversationId === conversationId) {
          setMessages((prev) => [...prev, message])
        }
        
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversationId ? { ...c, lastMessage: message, unreadCount: selectedConversationId === conversationId ? c.unreadCount : (c.unreadCount + 1), showUnreadDot: selectedConversationId !== conversationId } : c
          ).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt))
        )
      })

      socket.on('typing_update', ({ userId, isTyping }) => {
        if (selectedUser?._id === userId) {
          setOtherUserTyping(isTyping)
        }
      })

      socket.on('presence_update', ({ userId, status, lastSeen }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.otherUser._id === userId) {
              return {
                ...c,
                otherUser: { ...c.otherUser, status, lastSeen: lastSeen || null },
              }
            }
            return c
          })
        )
      })

      return () => {
        socketService.disconnect()
      }
    }
  }, [currentLoggedInUser, selectedConversationId])

  // Join conversation room
  useEffect(() => {
    if (selectedConversationId) {
      socketService.joinConversation(selectedConversationId)
      return () => socketService.leaveConversation(selectedConversationId)
    }
  }, [selectedConversationId])

  // Fetch conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true)
        const response = await messageService.getConversations()
        if (response.data.status === 'success') {
          const convs = response.data.data.conversations
          setConversations(convs)
          
          // Handle navigation from profile "Message" button
          if (location.state?.recipientId) {
            const existing = convs.find(
              c => c.otherUser._id === location.state.recipientId
            )
            if (existing) {
              setSelectedConversationId(existing._id)
            } else {
              // Start new conversation if they are connected
              try {
                const startRes = await messageService.startConversation(location.state.recipientId)
                if (startRes.data.status === 'success') {
                  const newConv = startRes.data.data.conversation
                  // Refresh conversations to get enriched data
                  const refreshed = await messageService.getConversations()
                  setConversations(refreshed.data.data.conversations)
                  setSelectedConversationId(newConv._id)
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Could not start conversation')
              }
            }
          } else if (convs.length > 0 && !selectedConversationId) {
            setSelectedConversationId(convs[0]._id)
          } else if (convs.length === 0) {
            setActiveTab('requests')
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
        toast.error('Failed to load conversations')
      } finally {
        setIsLoading(false)
      }
    }

    if (currentLoggedInUser) {
      loadConversations()
    }
  }, [currentLoggedInUser, location.state])

  // Fetch messages when selectedConversationId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) return
      try {
        const response = await messageService.getMessages(selectedConversationId)
        if (response.data.status === 'success') {
          setMessages(response.data.data.messages)
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
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
            id: req._id,
            userId: req.from._id,
            name: req.from.name,
            message: req.message,
            timestamp: new Date(req.createdAt).toLocaleDateString(),
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
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversationId || isUploading) return

    setIsUploading(true)
    try {
      let fileToUpload = selectedFile

      // Compress if it's an image
      if (selectedFile.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        try {
          fileToUpload = await imageCompression(selectedFile, options)
        } catch (error) {
          console.error('Compression failed:', error)
          // Fallback to original file
        }
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const response = await messageService.uploadFile(formData)
      if (response.data.status === 'success') {
        const fileUrl = response.data.url
        
        // Send as a message with attachment
        const messageResponse = await messageService.sendMessage(selectedConversationId, '', {
            type: selectedFile.type.startsWith('image/') ? 'image' : 'document',
            attachments: [{
                url: fileUrl,
                name: selectedFile.name,
                mimeType: selectedFile.type,
                size: selectedFile.size
            }]
        })

        if (messageResponse.data.status === 'success') {
          const sentMsg = messageResponse.data.data.message
          setMessages(prev => [...prev, sentMsg])
          setConversations(prev => prev.map(c => 
            c._id === selectedConversationId ? { ...c, lastMessage: sentMsg } : c
          ))
          
          setSelectedFile(null)
          setPreviewUrl(null)
          toast.success('File sent successfully')
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggleLastSeen = async () => {
    try {
        const updatedSettings = { ...userSettings, showLastSeen: !userSettings.showLastSeen }
        // Optimistic update
        setUserSettings(updatedSettings)
        
        const res = await profileService.updateSettings(updatedSettings)
        if (res.data.status === 'success') {
            // Sync with Redux to ensure persistence
            dispatch(setUser({ ...currentLoggedInUser, settings: updatedSettings }))
            toast.success('Visibility settings updated')
        }
    } catch (err) {
        // Revert on failure
        setUserSettings(currentLoggedInUser?.settings || { showLastSeen: true })
        toast.error('Failed to update settings')
    }
  }

  const handleBlockUser = async () => {
    if (!selectedConversationId) return
    if (!window.confirm('Are you sure you want to block this user? They will not be able to message you.')) return

    try {
        await messageService.blockUser(selectedConversationId)
        toast.success('User blocked')
        setShowChatMenu(false)
        // Optionally refresh conversation or redirect
    } catch (error) {
        toast.error('Failed to block user')
    }
  }

  const handleArchiveConversation = async () => {
    if (!selectedConversationId) return
    if (!window.confirm('Are you sure you want to delete this conversation?')) return

    try {
        await messageService.archiveConversation(selectedConversationId)
        toast.success('Conversation deleted')
        setShowChatMenu(false)
        setConversations(prev => prev.filter(c => c._id !== selectedConversationId))
        setSelectedConversationId(null)
    } catch (error) {
        toast.error('Failed to delete conversation')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || isSending) return
    
    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    
    try {
      const response = await messageService.sendMessage(selectedConversationId, messageContent)
      if (response.data.status === 'success') {
        const sentMsg = response.data.data.message
        setMessages(prev => [...prev, sentMsg])
        
        // Update last message in conversations list
        setConversations(prev => prev.map(c => 
          c._id === selectedConversationId ? { ...c, lastMessage: sentMsg } : c
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(error.response?.data?.message || 'Failed to send message')
      // If it failed, we could put the message back, but clearing is often preferred 
      // to avoid double-sends. Let's at least not overwrite if they started typing again.
    } finally {
      setIsSending(false)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await connectionService.acceptRequest(currentLoggedInUser._id, requestId)
      if (response.data.status === 'success') {
        toast.success('Connection request accepted!')
        setRequests(prev => prev.filter(r => r.id !== requestId))
        setExpandedProfile(null)
        
        // Refresh conversations to show the new connection
        const convs = await messageService.getConversations()
        setConversations(convs.data.data.conversations)
        
        // Find the new conversation and select it
        const newConv = convs.data.data.conversations.find(c => 
          c.participant1._id === requestId || c.participant2._id === requestId
        )
        if (newConv) setSelectedConversationId(newConv._id)
        
        setActiveTab('network')
      }
    } catch (error) {
      console.error('Failed to accept request:', error)
      toast.error('Failed to accept request')
    }
  }

  const handleDeclineRequest = async (requestId) => {
    try {
      await connectionService.declineRequest(currentLoggedInUser._id, requestId)
      setRequests(prev => prev.filter(r => r.id !== requestId))
      setExpandedProfile(null)
      toast.success('Connection request declined')
    } catch (error) {
      console.error('Failed to decline request:', error)
      toast.error('Failed to decline request')
    }
  }

  const filteredItems =
    activeTab === 'network'
      ? conversations.filter((conv) => {
          const user = conv.otherUser
          const searchLower = searchQuery.toLowerCase()
          return (
            user?.name.toLowerCase().includes(searchLower) ||
            conv.lastMessage?.content.toLowerCase().includes(searchLower)
          )
        })
      : requests.filter(
          (req) =>
            req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.message?.toLowerCase().includes(searchQuery.toLowerCase())
        )

  return (
    <DashboardLayout>
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
        @media (min-width: 1024px) {
          .message-page-container {
            height: calc(100vh - 80px);
          }
        }
        .bg-brand-primary { background-color: #163146; }
        .text-brand-primary { color: #163146; }
        .bg-brand-accent { background-color: #986a41; }
        .text-brand-accent { color: #986a41; }
        .message-sent { background-color: #163146; color: white; }
        .message-received { background-color: #f3f4f6; color: #1f2937; }
        .emoji-picker-container {
            position: absolute;
            bottom: 100%;
            left: 0;
            z-index: 50;
            margin-bottom: 10px;
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
            <div className='flex justify-between items-center p-3 border-b border-gray-100'>
              <h2 className='font-bold text-base'>Messages</h2>
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
            <div className='p-3 border-b border-gray-100'>
              <div className='flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5'>
                <Search size={16} className='text-gray-400 flex-shrink-0' />
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='flex-1 bg-transparent text-xs focus:outline-none'
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
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                                user?._id
                              )} flex items-center justify-center text-white font-semibold text-xs`}
                            >
                              {user?.profileImage ? (
                                <img src={getImageUrl(user.profileImage)} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                getInitials(user?.name || '')
                              )}
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
                               {conv.lastMessageSnippet || 'No messages yet'}
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
                            req.userId
                          )} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}
                        >
                          {getInitials(req.name)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-gray-900 text-xs'>
                            {req.name}
                          </h3>
                          <p className='text-xs text-gray-500 truncate'>
                            {req.message}
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {req.timestamp}
                          </p>
                          <div
                            className='flex gap-2 mt-2'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleAcceptRequest(req.id)
                                setIsMobileOpen(false)
                              }}
                              className='flex-1 py-1 rounded text-xs font-medium text-white transition-all flex items-center justify-center gap-0.5 bg-[#163146]'
                            >
                              <Check size={12} /> Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              className='flex-1 py-1 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all'
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
          </div>
        </motion.div>

        {/* Left Panel - Desktop */}
        <div className='hidden lg:flex flex-col w-80 rounded-2xl overflow-hidden bg-white border border-gray-200 h-full shadow-lg shadow-gray-200/50 transition-all hover:shadow-xl'>
          <div className='p-4 border-b border-gray-100 bg-gray-50/50'>
            <h2 className='text-lg font-bold text-[#163146] mb-3'>Messaging</h2>
            {/* Search */}
            <div className='flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all'>
              <Search size={18} className='text-gray-400 flex-shrink-0' />
              <input
                type='text'
                placeholder='Search messages...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='flex-1 bg-transparent text-sm focus:outline-none'
              />
            </div>
          </div>

          {/* Tabs */}
          <div className='flex gap-1 p-2 bg-gray-50/80 m-2 rounded-xl'>
            {['network', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'text-white bg-[#163146] shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab === 'network' ? 'Network' : `Requests ${requests.length > 0 ? `(${requests.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* Conversation List */}
          <div className='flex-1 overflow-y-auto'>
            {filteredItems.length === 0 ? (
              <div className='p-4 text-center text-gray-400 text-sm'>
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
                        onClick={() => setSelectedConversationId(conv._id)}
                        className={`w-full p-3 border-b border-gray-100 text-left transition-all hover:bg-gray-50 cursor-pointer relative ${
                          selectedConversationId === conv._id
                            ? 'bg-amber-50/50'
                            : ''
                        }`}
                      >
                        {conv.showUnreadDot && (
                          <div className='absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#986a41] rounded-full shadow-sm' />
                        )}
                        <div className='flex items-start gap-3'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProfile(user)
                              setExpandedProfileType('user')
                            }}
                            className='relative flex-shrink-0 hover:opacity-75 transition-opacity'
                          >
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                                user?._id
                              )} flex items-center justify-center text-white font-semibold text-base shadow-sm`}
                            >
                              {user?.profileImage ? (
                                <img src={getImageUrl(user.profileImage)} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                  getInitials(user?.name || '')
                              )}
                            </div>
                            <div className='absolute bottom-0 right-0'>
                              <PresenceIndicator status={user?.status} />
                            </div>
                          </button>
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-start gap-2'>
                              <h3 className={`font-semibold text-gray-900 text-sm truncate ${conv.showUnreadDot ? 'font-bold' : ''}`}>
                                {user?.name}
                              </h3>
                              <div className='flex items-center gap-1.5 flex-shrink-0'>
                                <span className='text-[10px] text-gray-500'>
                                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                {conv.showUnreadDot && (
                                  <div className='w-2.5 h-2.5 bg-[#986a41] rounded-full shadow-sm' />
                                )}
                              </div>
                            </div>
                            <p className={`text-xs text-gray-500 truncate mt-0.5 ${conv.showUnreadDot ? 'font-semibold text-gray-700' : ''}`}>
                              {conv.lastMessageSnippet || 'No messages yet'}
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
                    className='p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                          req.userId
                        )} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                      >
                        {getInitials(req.name)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-900 text-sm'>
                          {req.name}
                        </h3>
                        <p className='text-xs text-gray-500 truncate'>
                          {req.message}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {req.timestamp}
                        </p>
                        <div
                          className='flex gap-2 mt-3'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className='flex-1 py-1.5 rounded-lg text-xs font-medium text-white transition-all flex items-center justify-center gap-1 hover:opacity-90 bg-[#163146]'
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            className='flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all'
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
        </div>

        {/* Right Panel - Chat */}
        {currentConversation && selectedUser ? (
          <div className='flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden bg-white border border-gray-200 h-full chat-panel'>
            {/* Chat Header */}
            <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white shadow-sm z-10'>
              <div className='flex items-center gap-3 flex-1 min-w-0'>
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className='lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <Menu size={20} className='text-gray-600' />
                </button>
                <div
                  className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer group'
                  onClick={() => {
                    setExpandedProfile(selectedUser)
                    setExpandedProfileType('user')
                  }}
                >
                  <div className='relative flex-shrink-0'>
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                        selectedUser?._id
                      )} flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:ring-2 group-hover:ring-[#986a41] transition-all`}
                    >
                      {selectedUser?.profileImage ? (
                        <img src={getImageUrl(selectedUser.profileImage)} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(selectedUser?.name || '')
                      )}
                    </div>
                    <div className='absolute bottom-0 right-0 border-2 border-white rounded-full'>
                      <PresenceIndicator status={selectedUser?.status} />
                    </div>
                  </div>
                  <div className='min-w-0'>
                    <h2 className='font-bold text-gray-900 text-sm sm:text-base truncate group-hover:text-[#986a41] transition-colors'>
                      {selectedUser.name}
                    </h2>
                    <p className='text-[10px] sm:text-xs text-gray-500 flex items-center gap-1'>
                      {selectedUser?.status === 'online' ? (
                        <span className='text-green-600 font-medium'>Online</span>
                      ) : (
                        <span>
                          {selectedUser?.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                        </span>
                      )}
                      {otherUserTyping && (
                        <span className='ml-2 text-[#986a41] font-medium animate-pulse'>typing...</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className='flex items-center gap-1'>
                 <div className='relative' ref={settingsMenuRef}>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSettings(!showSettings)}
                        className='p-2 hover:bg-gray-100 rounded-full text-gray-400'
                    >
                        <Settings size={18} />
                    </motion.button>
                    
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50'
                            >
                                <div className='px-4 py-2 border-b border-gray-50 mb-1'>
                                    <h3 className='text-xs font-bold text-gray-900 uppercase tracking-wider'>Privacy Settings</h3>
                                </div>
                                <label className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'>
                                    <div>
                                        <span className='text-sm text-gray-700 font-medium block'>Show Last Seen</span>
                                        <span className='text-[10px] text-gray-400 block'>Allow others to see when you're online</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={userSettings.showLastSeen}
                                        onChange={handleToggleLastSeen}
                                        className='w-4 h-4 rounded text-[#163146] focus:ring-[#163146]'
                                    />
                                </label>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>

                 <div className='relative' ref={chatMenuRef}>
                    <button
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className='p-2 hover:bg-gray-100 rounded-full text-gray-400'
                    >
                        <MoreVertical size={20} />
                    </button>
                    <AnimatePresence>
                        {showChatMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className='absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50'
                            >
                                <button
                                    onClick={handleBlockUser}
                                    className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                                >
                                    <Ban size={16} />
                                    Block User
                                </button>
                                <button
                                    onClick={handleArchiveConversation}
                                    className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
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

            {/* Messages - Scrollable container */}
            <div className='flex-1 overflow-y-auto p-2 space-y-2 min-h-0 chat-messages-area'>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.sender === currentLoggedInUser._id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender === currentLoggedInUser._id
                        ? 'text-white bg-[#163146] rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {msg.type === 'image' && msg.attachments?.[0] && (
                        <div className='mb-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50'>
                            <img 
                                src={getImageUrl(msg.attachments[0].url)} 
                                alt="Attachment" 
                                className='max-h-60 w-full object-cover'
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
                    {msg.content && <p className='text-sm sm:text-base break-words leading-relaxed'>{msg.content}</p>}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.sender === currentLoggedInUser._id
                          ? 'text-gray-300'
                          : 'text-gray-400'
                      }`}
                    >
                      <span className='text-[9px]'>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === currentLoggedInUser._id && (
                        <Check size={10} className={msg.isRead ? 'text-[#986a41]' : 'text-gray-400'} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {otherUserTyping && (
                <div className="flex justify-start animate-fade-in">
                    <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Message Input */}
            <div className='px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white chat-input-area'>
              {/* File Preview */}
              <AnimatePresence>
                {selectedFile && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className='mb-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between max-w-4xl mx-auto shadow-sm select-none'
                    >
                        <div className='flex items-center gap-3 overflow-hidden'>
                            {previewUrl ? (
                                <div className='w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200'>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className='w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-gray-200'>
                                    <FileText size={24} className='text-[#163146]' />
                                </div>
                            )}
                            <div className='min-w-0'>
                                <p className='text-xs font-bold text-gray-900 truncate'>{selectedFile.name}</p>
                                <p className='text-[10px] text-gray-500'>{(selectedFile.size / 1024).toFixed(1)} KB • Ready to send</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleFileUpload}
                                disabled={isUploading}
                                className='px-3 py-1.5 bg-[#163146] text-white text-[10px] font-bold rounded-lg shadow-sm disabled:opacity-50'
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </motion.button>
                            <button 
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                className='p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors'
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <div className='flex gap-2 items-center max-w-4xl mx-auto relative'>
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

                <div className='flex gap-1 pb-1'>
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-[#986a41] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="Add Emoji"
                  >
                    <Smile size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className='p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500'
                    title="Attach file"
                  >
                    <PaperclipIcon size={20} />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className='hidden'
                  />
                </div>
                <div className='flex-1 relative'>
                  <textarea
                    rows={1}
                    placeholder='Type a message...'
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      socketService.sendTyping(selectedConversationId, e.target.value.length > 0)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#986a41]/20 focus:border-[#986a41] transition-all resize-none max-h-32 shadow-inner'
                    style={{ height: 'auto' }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className={`p-3 rounded-full transition-all flex-shrink-0 flex items-center justify-center shadow-md ${
                    newMessage.trim() && !isSending 
                      ? 'bg-[#163146] text-white hover:shadow-lg hover:-translate-y-0.5' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                </motion.button>
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

      {/* Expanded Profile View */}
      <AnimatePresence>
        {expandedProfile && expandedProfileType === 'user' && (
          <ExpandedProfileView
            user={expandedProfile}
            onClose={() => setExpandedProfile(null)}
            isRequest={false}
          />
        )}
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
    </DashboardLayout>
  )
}

export default MessagePage
