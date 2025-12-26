// File: client/src/pages/Message/MessagePage.jsx
//
// MOBILE GESTURES:
// - Swipe Right: Open conversation drawer (when closed)
// - Swipe Left: Close conversation drawer (when open)
// - Desktop: Use menu button or navigation as normal
//
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Menu,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import DashboardLayout from '../Layout/DashboardLayout'

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
                  user?.id
                )} flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {getInitials(user?.name)}
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

// Sample data with expanded user profiles
const MOCK_USERS = [
  {
    id: 1,
    name: 'Alex Rivera',
    online: true,
    lastSeen: null,
    title: 'Brand Manager & NIL Strategist',
    bio: 'Helping athletes navigate the NIL ecosystem and build meaningful brand partnerships.',
    about:
      'Experienced brand manager with 7+ years of expertise in NIL deals and athlete partnerships. Specializing in connecting athletes with brands that align with their values and maximizing their earning potential.',
    email: 'alex.rivera@example.com',
    location: 'Los Angeles, CA',
    followers: 2543,
    banner: '#E3F2FD',
    certifications: ['NIL Certification', 'Brand Strategy Expert'],
    expertise: [
      'NIL Deals',
      'Brand Partnerships',
      'Contract Negotiation',
      'Marketing Strategy',
    ],
    rating: 4.9,
    reviewCount: 32,
    specialty: 'Branding',
    experience: 7,
    connections: 245,
    verified: true,
  },
  {
    id: 2,
    name: 'Jordan Smith',
    online: false,
    lastSeen: '2 hours ago',
    title: 'Sports Marketing Executive',
    bio: 'Passionate about connecting athletes with brands that align with their values.',
    about:
      'Sports marketing professional with 6+ years of experience in athlete endorsements and brand collaborations. Expert in identifying and nurturing long-term partnerships.',
    email: 'jordan.smith@example.com',
    location: 'New York, NY',
    followers: 1842,
    banner: '#F3E5F5',
    certifications: [
      'Sports Marketing Certificate',
      'Athlete Representation License',
    ],
    expertise: [
      'Endorsements',
      'Brand Positioning',
      'Event Marketing',
      'Social Media Strategy',
    ],
    rating: 4.7,
    reviewCount: 28,
    specialty: 'Marketing',
    experience: 6,
    connections: 189,
    verified: true,
  },
  {
    id: 3,
    name: 'Casey Johnson',
    online: true,
    lastSeen: null,
    title: 'NIL Deal Facilitator',
    bio: 'Expert in matching athletes with sponsorship opportunities.',
    about:
      'Specialized facilitator with 9+ years in NIL negotiations and deal structures. Known for securing premium deals and building lasting athlete-brand relationships.',
    email: 'casey.johnson@example.com',
    location: 'Chicago, IL',
    followers: 3120,
    banner: '#FCE4EC',
    certifications: ['NIL Deal Specialist', 'Contract Negotiation Expert'],
    expertise: [
      'Deal Structuring',
      'Negotiations',
      'NIL Strategy',
      'Legal Review',
    ],
    rating: 4.8,
    reviewCount: 41,
    specialty: 'Deals',
    experience: 9,
    connections: 312,
    verified: true,
  },
  {
    id: 4,
    name: 'Morgan Davis',
    online: true,
    lastSeen: null,
    title: 'Sports PR Specialist',
    bio: 'Specializing in athlete brand positioning and media relations.',
    about:
      'Public relations expert with 8+ years in athlete representation and media management. Focused on building authentic brand narratives and managing athlete visibility.',
    email: 'morgan.davis@example.com',
    location: 'Miami, FL',
    followers: 1956,
    banner: '#E8F5E9',
    certifications: [
      'PR Certification',
      'Media Relations Expert',
      'Crisis Management',
    ],
    expertise: [
      'Media Relations',
      'Brand Positioning',
      'Crisis Management',
      'Content Strategy',
    ],
    rating: 4.8,
    reviewCount: 24,
    specialty: 'Relations',
    experience: 8,
    connections: 156,
    verified: true,
  },
  {
    id: 5,
    name: 'Taylor White',
    online: false,
    lastSeen: '1 hour ago',
    title: 'Content Creator & Brand Consultant',
    bio: 'Creating authentic connections between athletes and sponsors.',
    about:
      'Creative strategist with 5+ years in content creation and brand consulting. Specializing in authentic storytelling and building engaged audiences.',
    email: 'taylor.white@example.com',
    location: 'Austin, TX',
    followers: 2784,
    banner: '#FFF3E0',
    certifications: [
      'Content Strategy Certification',
      'Digital Marketing Expert',
    ],
    expertise: [
      'Content Creation',
      'Social Media',
      'Brand Strategy',
      'Audience Engagement',
    ],
    rating: 4.6,
    reviewCount: 19,
    specialty: 'Content',
    experience: 5,
    connections: 198,
    verified: false,
  },
]

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    userId: 1,
    messages: [
      {
        id: 1,
        sender: 'other',
        text: 'Hey, interested in discussing that NIL deal',
        timestamp: '10:30 AM',
      },
      {
        id: 2,
        sender: 'self',
        text: 'Absolutely! When can we chat?',
        timestamp: '10:32 AM',
      },
      {
        id: 3,
        sender: 'other',
        text: 'How about tomorrow at 2 PM?',
        timestamp: '10:35 AM',
      },
      {
        id: 4,
        sender: 'self',
        text: 'Perfect, see you then!',
        timestamp: '10:36 AM',
      },
    ],
    unread: 0,
  },
  {
    id: 2,
    userId: 2,
    messages: [
      {
        id: 1,
        sender: 'other',
        text: 'Check out this opportunity',
        timestamp: '9:15 AM',
      },
    ],
    unread: 1,
  },
  {
    id: 3,
    userId: 3,
    messages: [
      {
        id: 1,
        sender: 'self',
        text: 'Thanks for the intro!',
        timestamp: '8:00 AM',
      },
      { id: 2, sender: 'other', text: "You're welcome!", timestamp: '8:05 AM' },
    ],
    unread: 0,
  },
]

const MOCK_REQUESTS = [
  {
    id: 1,
    userId: 4,
    name: 'Morgan Davis',
    title: 'Sports PR Specialist',
    bio: 'Specializing in athlete brand positioning and media relations.',
    about:
      'Public relations expert with 8+ years in athlete representation and media management. Focused on building authentic brand narratives and managing athlete visibility.',
    email: 'morgan.davis@example.com',
    location: 'Miami, FL',
    followers: 1956,
    banner: '#E8F5E9',
    certifications: [
      'PR Certification',
      'Media Relations Expert',
      'Crisis Management',
    ],
    expertise: [
      'Media Relations',
      'Brand Positioning',
      'Crisis Management',
      'Content Strategy',
    ],
    rating: 4.8,
    reviewCount: 24,
    specialty: 'Relations',
    experience: 8,
    connections: 156,
    verified: true,
    online: true,
    lastSeen: null,
    message: "Hey! I'd love to discuss brand partnerships with you.",
    timestamp: '30 min ago',
  },
  {
    id: 2,
    userId: 5,
    name: 'Taylor White',
    title: 'Content Creator & Brand Consultant',
    bio: 'Creating authentic connections between athletes and sponsors.',
    about:
      'Creative strategist with 5+ years in content creation and brand consulting. Specializing in authentic storytelling and building engaged audiences.',
    email: 'taylor.white@example.com',
    location: 'Austin, TX',
    followers: 2784,
    banner: '#FFF3E0',
    certifications: [
      'Content Strategy Certification',
      'Digital Marketing Expert',
    ],
    expertise: [
      'Content Creation',
      'Social Media',
      'Brand Strategy',
      'Audience Engagement',
    ],
    rating: 4.6,
    reviewCount: 19,
    specialty: 'Content',
    experience: 5,
    connections: 198,
    verified: false,
    online: false,
    lastSeen: '1 hour ago',
    message: 'Interested in collaborating',
    timestamp: '2 hours ago',
  },
]

// Expanded Profile View Component

function MessagePage() {
  const [activeTab, setActiveTab] = useState('network')
  const [selectedConversationId, setSelectedConversationId] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProfile, setExpandedProfile] = useState(null)
  const [expandedProfileType, setExpandedProfileType] = useState(null) // 'user' or 'request'
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const messageEndRef = useRef(null)
  const [dragStart, setDragStart] = useState(0)

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversationId
  )
  const currentUser = currentConversation
    ? MOCK_USERS.find((u) => u.id === currentConversation.userId)
    : null

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentConversation) return
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: conv.messages.length + 1,
                  sender: 'self',
                  text: newMessage,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
              ],
            }
          : conv
      )
    )
    setNewMessage('')
  }

  const handleAcceptRequest = (requestId) => {
    const request = requests.find((r) => r.id === requestId)
    if (request) {
      const newConversation = {
        id: Math.max(...conversations.map((c) => c.id)) + 1,
        userId: request.userId,
        messages: [
          {
            id: 1,
            sender: 'other',
            text: request.message,
            timestamp: request.timestamp,
          },
        ],
        unread: 1,
      }
      setConversations([newConversation, ...conversations])
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      setSelectedConversationId(newConversation.id)
      setActiveTab('network')
      setExpandedProfile(null)
    }
  }

  const handleDeclineRequest = (requestId) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId))
    setExpandedProfile(null)
  }

  const filteredItems =
    activeTab === 'network'
      ? conversations.filter((conv) => {
          const user = MOCK_USERS.find((u) => u.id === conv.userId)
          const searchLower = searchQuery.toLowerCase()
          return (
            user?.name.toLowerCase().includes(searchLower) ||
            conv.messages.some((m) =>
              m.text.toLowerCase().includes(searchLower)
            )
          )
        })
      : requests.filter(
          (req) =>
            req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.message.toLowerCase().includes(searchQuery.toLowerCase())
        )

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 1023px) {
          .message-page-container {
            height: calc(100dvh - 70px - 70px);
            padding-bottom: 0;
          }
          .chat-panel {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .chat-messages-area {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
          }
          .chat-input-area {
            flex-shrink: 0;
            padding-bottom: max(env(safe-area-inset-bottom), 8px);
          }
        }
        @media (min-width: 1024px) {
          .message-page-container {
            height: calc(100vh - 70px);
          }
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
                    const user = MOCK_USERS.find((u) => u.id === conv.userId)
                    const lastMsg = conv.messages[conv.messages.length - 1]
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversationId(conv.id)
                          setIsMobileOpen(false)
                        }}
                        className={`w-full p-3 border-b border-gray-100 text-left transition-all hover:bg-gray-50 ${
                          selectedConversationId === conv.id
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
                                user?.id
                              )} flex items-center justify-center text-white font-semibold text-xs`}
                            >
                              {getInitials(user?.name)}
                            </div>
                            {user?.online && (
                              <div className='absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white' />
                            )}
                          </button>
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-start gap-1'>
                              <h3 className='font-semibold text-gray-900 text-xs truncate'>
                                {user?.name}
                              </h3>
                              <span className='text-xs text-gray-500 flex-shrink-0'>
                                {lastMsg?.timestamp}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500 truncate'>
                              {lastMsg?.text}
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
        <div className='hidden lg:flex flex-col w-64 rounded-xl overflow-hidden bg-white border border-gray-200 h-full'>
          {/* Search */}
          <div className='p-3 border-b border-gray-100'>
            <div className='flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5'>
              <Search size={16} className='text-gray-400 flex-shrink-0' />
              <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='flex-1 bg-transparent text-sm focus:outline-none'
              />
            </div>
          </div>

          {/* Tabs */}
          <div className='flex gap-2 p-3 border-b border-gray-100'>
            {['network', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
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
              <div className='p-4 text-center text-gray-400 text-sm'>
                {activeTab === 'network' ? 'No conversations' : 'No requests'}
              </div>
            ) : activeTab === 'network' ? (
              <div>
                {filteredItems.map((conv) => {
                  const user = MOCK_USERS.find((u) => u.id === conv.userId)
                  const lastMsg = conv.messages[conv.messages.length - 1]
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full p-3 border-b border-gray-100 text-left transition-all hover:bg-gray-50 ${
                        selectedConversationId === conv.id
                          ? 'bg-[#163146]/5'
                          : ''
                      }`}
                    >
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
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                              user?.id
                            )} flex items-center justify-center text-white font-semibold text-sm`}
                          >
                            {getInitials(user?.name)}
                          </div>
                          {user?.online && (
                            <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white' />
                          )}
                        </button>
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between items-start gap-2'>
                            <h3 className='font-semibold text-gray-900 text-sm'>
                              {user?.name}
                            </h3>
                            <span className='text-xs text-gray-500 flex-shrink-0'>
                              {lastMsg?.timestamp}
                            </span>
                          </div>
                          <p className='text-xs text-gray-500 truncate'>
                            {lastMsg?.text}
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
        {currentConversation && currentUser && (
          <div className='flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden bg-white border border-gray-200 h-full chat-panel'>
            {/* Chat Header - Optimized for mobile */}
            <div className='px-2 sm:px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className='lg:hidden p-1 hover:bg-gray-100 rounded transition-colors'
                  title='Swipe right to open menu'
                >
                  <Menu size={18} className='text-gray-600' />
                </button>
                <div
                  className='flex items-center gap-2 flex-1 min-w-0 cursor-pointer'
                  onClick={() => {
                    setExpandedProfile(currentUser)
                    setExpandedProfileType('user')
                  }}
                >
                  <div className='relative flex-shrink-0'>
                    <div
                      className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                        currentUser?.id
                      )} flex items-center justify-center text-white font-semibold text-xs`}
                    >
                      {getInitials(currentUser.name)}
                    </div>
                    {currentUser.online && (
                      <div className='absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white' />
                    )}
                    {!currentUser.online && (
                      <div className='absolute bottom-0 right-0 w-2 h-2 bg-orange-400 rounded-full border border-white' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <h2 className='font-bold text-gray-900 text-xs sm:text-sm truncate'>
                      {currentUser.name}
                    </h2>
                    <p className='text-xs text-gray-500'>
                      {currentUser.online
                        ? 'Online'
                        : `Away - ${currentUser.lastSeen}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages - Scrollable container */}
            <div className='flex-1 overflow-y-auto p-2 space-y-2 min-h-0 chat-messages-area'>
              {currentConversation.messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'self' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl text-xs ${
                      msg.sender === 'self'
                        ? 'text-white bg-[#163146]'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className='break-words'>{msg.text}</p>
                    <p
                      className={`text-xs mt-0.5 ${
                        msg.sender === 'self'
                          ? 'text-amber-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            {/* Message Input */}
            <div className='px-2 py-2 border-t border-gray-100 flex-shrink-0 bg-white chat-input-area'>
              <div className='lg:hidden text-xs text-gray-400 text-center mb-1.5'>
                Swipe right to open menu
              </div>
              <div className='flex gap-1 items-end'>
                <button className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0'>
                  <Paperclip size={16} />
                </button>
                <input
                  type='text'
                  placeholder='Message...'
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className='flex-1 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all min-w-0'
                />
                <button
                  onClick={handleSendMessage}
                  className='p-1.5 rounded-lg text-white transition-all flex-shrink-0 flex items-center justify-center bg-[#163146]'
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
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
