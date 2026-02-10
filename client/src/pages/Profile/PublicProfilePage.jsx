import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { getThemeById } from '../../constants/themes'
import { selectCurrentUser } from '../../redux/userSlice'
import { connectionService } from '../../services/connectionService'
import { profileService } from '../../services/profileService'
import { getImageUrl } from '../../utils/imageUtils'
import ConnectionsModal from '../../components/Connections/ConnectionsModal'
import DashboardLayout from '../Layout/DashboardLayout'

const PublicProfileSkeleton = () => (
  <div className='mx-auto px-4 py-8 max-w-8xl w-full animate-pulse'>
    <div className='mb-8 flex justify-between items-center'>
      <div className='h-10 w-32 bg-slate-200 rounded-full' />
      <div className='h-10 w-10 bg-slate-200 rounded-full' />
    </div>

    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
      <div className='lg:col-span-2 space-y-8'>
        <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
          <div className='h-32 bg-slate-200' />
          <div className='px-6 pb-6'>
            <div className='-mt-16 mb-4 flex flex-col items-center relative z-10'>
              <div className='w-32 h-32 rounded-full border-4 border-white bg-slate-300 mb-4' />
              <div className='h-8 w-48 bg-slate-200 rounded-lg mb-2' />
              <div className='h-4 w-32 bg-slate-200 rounded-lg mb-1' />
              <div className='h-3 w-24 bg-slate-200 rounded-lg' />
            </div>
          </div>
        </div>
        <div className='bg-white rounded-2xl border border-slate-200 p-6 h-48' />
      </div>
      <div className='space-y-4'>
        <div className='bg-white rounded-2xl border border-slate-200 p-6 h-64 shadow-sm' />
        <div className='bg-white rounded-2xl border border-slate-200 p-6 h-48 shadow-sm' />
        <div className='bg-slate-900 rounded-2xl p-6 h-64 shadow-lg' />
      </div>
    </div>
  </div>
)

const PublicProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [connectionsPreview, setConnectionsPreview] = useState([])
  const [showConnectionsList, setShowConnectionsList] = useState(false)
  
  // New state for connection mode (quick vs message)
  const [addNoteMode, setAddNoteMode] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('not_connected')
  const [connectionRequestId, setConnectionRequestId] = useState(null)
  const [connectionRequestMessage, setConnectionRequestMessage] = useState(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileService.getProfileByUserId(id)
      if (response.status === 'success') {
        const { profile, connectionStatus, connectionRequestId, connectionRequestMessage, totalConnections } = response.data
        setProfileData({
          ...profile,
          connectionsCount: totalConnections ?? profile.connectionsCount ?? 0,
        })
        setConnectionStatus(connectionStatus || 'not_connected')
        setConnectionRequestId(connectionRequestId)
        setConnectionRequestMessage(connectionRequestMessage)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchProfile()
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [id])

  useEffect(() => {
    const fetchConnectionsPreview = async () => {
      if (!currentUser?._id || currentUser._id !== id) {
        setConnectionsPreview([])
        return
      }
      try {
        const response = await connectionService.getNetwork(currentUser._id)
        if (response.data?.status === 'success') {
          setConnectionsPreview(response.data.data?.connections || [])
        } else {
          setConnectionsPreview([])
        }
      } catch (error) {
        console.error('Error fetching connections preview:', error)
        setConnectionsPreview([])
      }
    }

    fetchConnectionsPreview()
  }, [currentUser?._id, id])

  const handleConnect = () => {
    if (!currentUser) return
    setAddNoteMode(false) // Reset to default view
    setConnectionMessage('')
    setShowConnectionModal(true)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied to clipboard!')
  }

  const handleSendConnection = async () => {
    if (!currentUser || !profileData) return
    try {
      setIsSending(true)
      const response = await connectionService.sendRequest(
        currentUser._id,
        profileData.user._id,
        connectionMessage
      )
      if (response.data.status === 'success') {
        toast.success(`Connection request sent to ${profileData.user.name}`)
        setShowConnectionModal(false)
        setConnectionMessage('')
        setConnectionStatus('pending')
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error(error.response?.data?.message || 'Failed to send connection request')
    } finally {
      setIsSending(false)
    }
  }

  const handleAcceptRequest = async () => {
    if (!currentUser || !connectionRequestId) return
    try {
      const response = await connectionService.acceptRequest(currentUser._id, connectionRequestId)
      if (response.data.status === 'success') {
        toast.success(`Connected with ${profileData.user.name}`)
        setConnectionStatus('connected')
        // Optimistically update other related connection states
        setConnectionRequestId(null)
        setConnectionRequestMessage(null)
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Failed to accept request')
    }
  }

  const handleDeclineRequest = async () => {
    if (!currentUser || !connectionRequestId) return
    try {
      await connectionService.declineRequest(currentUser._id, connectionRequestId)
      toast.success('Connection request declined')
      setConnectionStatus('not_connected')
      setConnectionRequestId(null)
      setConnectionRequestMessage(null)
    } catch (error) {
      console.error('Error declining request:', error)
      toast.error('Failed to decline request')
    }
  }

  const handleCancelRequest = async () => {
    if (!currentUser || !connectionRequestId) return
    try {
      await connectionService.cancelRequest(currentUser._id, connectionRequestId)
      toast.success('Connection request cancelled')
      setConnectionStatus('not_connected')
      setConnectionRequestId(null)
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Failed to cancel request')
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PublicProfileSkeleton />
      </DashboardLayout>
    )
  }

  if (!profileData) return null

  const user = profileData.user
  const theme = getThemeById(profileData.themeId || 'ocean')
  const isAthlete = profileData.profileType === 'athlete'
  
  const profileImg = (profileData.profileImage && !profileData.profileImage.includes('unsplash.com')) 
    ? getImageUrl(profileData.profileImage) 
    : (profileData.photo && !profileData.photo.includes('unsplash.com'))
      ? getImageUrl(profileData.photo)
      : null

  const activeInterests = Array.isArray(profileData.activeInterests) 
    ? profileData.activeInterests 
    : typeof profileData.interests === 'object' 
      ? Object.entries(profileData.interests)
          .filter(([_, active]) => active)
          .map(([key]) => key)
      : []

  const specialization = profileData.specialization || []

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser && currentUser._id === user._id

  // Determine Connect Button Style
  // Using a distinct Gold/Brown gradient as requested
  const connectButtonStyle = {
    background: 'linear-gradient(135deg, #986938 0%, #78532d 100%)',
    boxShadow: '0 4px 14px 0 rgba(152, 105, 56, 0.3)'
  }

  return (
    <DashboardLayout>
      <Toaster position='bottom-right' theme='dark' />
      
      <div className='w-full h-full max-w-8xl mx-auto flex flex-col bg-slate-50/50 min-h-screen pb-24 lg:pb-0'>
        <motion.div
          className='mx-auto px-4 py-6 max-w-8xl w-full'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Header Actions - Floating on desktop, hidden on mobile logic if needed */}
          <motion.div variants={itemVariants} className='mb-6 flex justify-between items-center sticky top-20 z-30 lg:static'>
            <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className='flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors pl-0 hover:bg-transparent group'
            >
                <div className='p-2.5 rounded-full bg-white border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-slate-300 transition-all'>
                    <ArrowLeft size={18} className="text-slate-700" /> 
                </div>
                <span className='font-bold text-sm hidden sm:inline text-slate-700'>Back to search</span>
            </Button>

            <div className='flex items-center gap-2'>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600"
                >
                    <Share2 size={18} />
                </Button>
            </div>
          </motion.div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Profile Card */}
              <motion.div variants={itemVariants}>
                <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
                  {/* Hero */}
                  <div
                    className='h-32 md:h-40 relative z-0 overflow-hidden'
                    style={profileData.bannerImage 
                      ? { backgroundImage: `url(${getImageUrl(profileData.bannerImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                      : theme.style
                    }
                  >
                    <div className='absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/20' />
                    {profileData.verified && (
                      <div className='absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-emerald-100'>
                        <ShieldCheck size={14} className='text-emerald-500' />
                        <span className='text-[10px] font-bold text-emerald-700 uppercase tracking-wider'>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='px-6 pb-8 relative'>
                    {/* Profile Avatar */}
                    <div className='-mt-16 mb-4 flex justify-center lg:justify-start lg:ml-8 relative z-10'>
                      <motion.div
                        className='w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white flex-shrink-0 shadow-xl overflow-hidden relative bg-white'
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {profileImg ? (
                          <img
                            src={profileImg}
                            alt={user.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div 
                            className='w-full h-full flex items-center justify-center text-white font-bold text-4xl shadow-inner'
                            style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent || theme.primary} 100%)` }}
                          >
                            {getInitials(user.name)}
                          </div>
                        )}
                      </motion.div>
                    </div>

                    <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
                        <div className='text-center lg:text-left lg:ml-8 flex-1'>
                            <h2 className='text-3xl font-bold text-slate-900 tracking-tight mb-1'>
                                {user.name}
                            </h2>
                            <div className='space-y-1 mb-4'>
                                <p className='text-base font-medium text-slate-600 flex items-center justify-center lg:justify-start gap-2'>
                                    {isAthlete ? (
                                        <>
                                            <span className="text-slate-900 font-semibold">{profileData.position || 'Athlete'}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                                            <span>{profileData.sport || 'Sport'}</span>
                                        </>
                                    ) : (
                                        <span>{profileData.title || (profileData.profileType.charAt(0).toUpperCase() + profileData.profileType.slice(1))}</span>
                                    )}
                                </p>
                                <p className='text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-1.5'>
                                    <MapPin size={14} />
                                    {isAthlete 
                                        ? `${profileData.school || 'School'} • ${profileData.classYear || 'Class'}`
                                        : profileData.location || 'Remote'}
                                </p>
                            </div>

                            {/* Bio */}
                            <p className='text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 bg-slate-50 p-4 rounded-xl border border-slate-100'>
                                "{profileData.aboutMe || profileData.bio || 'No bio provided.'}"
                            </p>
                        </div>

                        {/* Desktop Actions */}
                        {!isOwnProfile && (
                            <div className='hidden lg:flex flex-col gap-3 min-w-[200px]'>
                                <Button 
                                    className={`w-full rounded-xl h-12 text-base font-bold transition-all text-white shadow-md ${
                                      connectionStatus !== 'not_connected' ? 'opacity-90' : 'hover:shadow-lg active:scale-95'
                                    }`}
                                    style={connectionStatus === 'connected' 
                                      ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }
                                      : connectionStatus === 'pending'
                                        ? { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }
                                        : connectionStatus === 'received'
                                          ? { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }
                                          : connectButtonStyle}
                                    onClick={connectionStatus === 'received' ? handleAcceptRequest : handleConnect}
                                    disabled={connectionStatus === 'connected' || connectionStatus === 'pending'}
                                >
                                    {connectionStatus === 'connected' ? (
                                      <>
                                        <Users size={18} className="mr-2" />
                                        Connected
                                      </>
                                    ) : connectionStatus === 'pending' ? (
                                      <>
                                        <Clock size={18} className="mr-2" />
                                        Pending
                                      </>
                                    ) : connectionStatus === 'received' ? (
                                       <>
                                        <Check size={18} className="mr-2" />
                                        Accept
                                       </>
                                    ) : (
                                      <>
                                        <UserPlus size={18} className="mr-2" />
                                        Connect
                                      </>
                                    )}
                                </Button>
                                {connectionStatus === 'pending' && (
                                   <Button 
                                      variant="ghost"
                                      className="w-full rounded-xl h-10 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all"
                                      onClick={handleCancelRequest}
                                  >
                                      Withdraw Request
                                  </Button>
                                )}
                                {connectionStatus === 'received' && (
                                   <Button 
                                      variant="outline"
                                      className="w-full rounded-xl h-10 text-xs font-bold border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                                      onClick={handleDeclineRequest}
                                  >
                                      <X size={14} className="mr-2" />
                                      Decline
                                  </Button>
                                )}
                                <Button 
                                    variant="outline"
                                    className="w-full rounded-xl h-12 text-sm font-bold border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
                                    onClick={() => navigate('/inbox', { state: { recipientId: user._id } })}
                                >
                                    <MessageSquare size={16} className="mr-2 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                    Send Message
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className='mt-10 pt-10 border-t border-slate-100'>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                            <div className='flex flex-col items-center p-5 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm group cursor-default'>
                                <div className='p-2.5 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform'>
                                    <Mail size={20} className='text-slate-400 group-hover:text-blue-500 transition-colors' />
                                </div>
                                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5'>Direct Email</p>
                                <p className='text-xs font-bold text-slate-800 truncate w-full text-center px-1'>{user.email || 'Encrypted'}</p>
                            </div>
                            
                            <div className='flex flex-col items-center p-5 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm group cursor-default'>
                                <div className='p-2.5 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform'>
                                    <Globe size={20} className='text-slate-400 group-hover:text-amber-500 transition-colors' />
                                </div>
                                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5'>Presence</p>
                                <div className='flex gap-2.5 justify-center'>
                                     {profileData.socialMedia?.instagram && (
                                        <a href={`https://instagram.com/${profileData.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className='p-1 rounded-lg hover:bg-slate-50 transition-colors'>
                                             <span className='text-xs font-black text-slate-700'>IG</span>
                                        </a>
                                     )}
                                     {profileData.socialMedia?.twitter && (
                                        <a href={`https://twitter.com/${profileData.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className='p-1 rounded-lg hover:bg-slate-50 transition-colors'>
                                            <span className='text-xs font-black text-slate-700'>TW</span>
                                        </a>
                                     )}
                                     {!profileData.socialMedia?.instagram && !profileData.socialMedia?.twitter && <span className='text-xs font-black text-slate-300'>PRIVATE</span>}
                                </div>
                            </div>

                            <div className='flex flex-col items-center p-5 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm group cursor-default'>
                                <div className='p-2.5 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform'>
                                    {isAthlete ? <Users size={20} className='text-slate-400 group-hover:text-indigo-500 transition-colors' /> : <MapPin size={20} className='text-slate-400 group-hover:text-rose-500 transition-colors' />}
                                </div>
                                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5'>{isAthlete ? 'Connections' : 'Location'}</p>
                                <p className='text-xs font-bold text-slate-800 truncate w-full text-center px-1'>
                                    {isAthlete ? (profileData.connectionsCount || 0) : (profileData.location || 'Distributed')}
                                </p>
                            </div>

                            <div className='flex flex-col items-center p-5 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm group cursor-default'>
                                <div className='p-2.5 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform'>
                                    <Trophy size={20} className='text-slate-400 group-hover:text-emerald-500 transition-colors' />
                                </div>
                                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5'>On Signil</p>
                                <p className='text-xs font-bold text-slate-800 truncate w-full text-center px-1'>
                                    Since {new Date(user.createdAt || Date.now()).getFullYear()}
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Interests Section */}
              {(activeInterests.length > 0 || specialization.length > 0) && (
                <motion.div variants={itemVariants}>
                  <div className='bg-white rounded-2xl border border-slate-200 p-6 shadow-sm'>
                    <div className='mb-6 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                          <div className='p-2 rounded-xl bg-slate-100 text-slate-600'>
                              <Briefcase size={18} />
                          </div>
                          <div>
                              <h3 className='text-base font-bold text-slate-900'>
                              {isAthlete ? 'Focus Areas' : 'Core Expertise'}
                              </h3>
                              <p className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                                  Professional Specializations
                              </p>
                          </div>
                      </div>
                    </div>
 
                    <div className='flex flex-wrap gap-2'>
                       {[...activeInterests, ...specialization].map((interest, idx) => (
                            <span
                                key={`${interest}-${idx}`}
                                className='px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 hover:bg-white hover:border-slate-200 transition-all cursor-default group'
                            >
                                <Check size={12} className="text-emerald-500" />
                                {interest.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                       ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar - Desktop */}
            <div className='space-y-4'>
                {/* Verification Widget */}
                <motion.div variants={itemVariants} className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
                  <h3 className='font-bold text-slate-900 text-sm mb-4'>Profile Trust</h3>
                  
                  {profileData.verified ? (
                     <div className='flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-3 border border-emerald-100 transition-colors hover:bg-emerald-100/50 cursor-default'>
                         <div className='w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0'>
                            <ShieldCheck size={20} className='text-emerald-600' />
                         </div>
                         <div>
                            <p className='text-xs font-bold text-emerald-800'>Fully Verified</p>
                            <p className='text-[10px] text-emerald-600'>Official professional profile</p>
                         </div>
                     </div>
                  ) : (
                     <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100 cursor-default'>
                         <div className='w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-400'>
                            <Clock size={20} />
                         </div>
                         <div>
                            <p className='text-xs font-bold text-slate-600 uppercase tracking-tight'>Unverified</p>
                            <p className='text-[10px] text-slate-500'>Profile details pending review</p>
                         </div>
                     </div>
                  )}

                  <button
                      type='button'
                      onClick={() => setShowConnectionsList(true)}
                      className='flex items-center justify-between px-1 mt-4 w-full cursor-pointer'
                  >
                      <div className='flex -space-x-2'>
                          {(connectionsPreview.length > 0 ? connectionsPreview.slice(0, 3) : []).map((connection) => {
                            const user = connection.connectedUser || {}
                            const avatar = user.profileImage ? getImageUrl(user.profileImage) : null
                            const initials = (user.name || 'U')
                              .split(' ')
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()

                            return (
                              <div
                                key={connection.connectionId}
                                className='w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden flex items-center justify-center text-[9px] font-bold text-slate-600'
                              >
                                {avatar ? (
                                  <img src={avatar} alt={user.name || 'Connection'} className='w-full h-full object-cover' />
                                ) : (
                                  initials
                                )}
                              </div>
                            )
                          })}
                      </div>
                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                        {profileData.connectionsCount || 0} Connections
                      </span>
                  </button>
                </motion.div>

                {/* Match Score Card */}
                {profileData.matchScore !== undefined && (
                   <motion.div variants={itemVariants} className='bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group hover:border-slate-300 transition-all'>
                      <div className='flex items-center justify-between mb-4'>
                        <h4 className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>Compatibility</h4>
                        <div className='w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform'>
                            <Zap size={14} className="text-blue-500" />
                        </div>
                      </div>
                      <div className='flex items-end gap-1 mb-2'>
                        <span className='text-4xl font-bold tracking-tighter text-slate-900'>
                            {profileData.matchScore}
                        </span>
                        <span className='text-xl font-black text-slate-200 mb-1'>%</span>
                      </div>
                      <div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4'>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${profileData.matchScore}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className='h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500'
                          />
                      </div>
                      <p className='text-[10px] text-slate-500 font-medium leading-relaxed'>
                          This profile aligns {profileData.matchScore}% with your current professional criteria.
                      </p>
                   </motion.div>
                )}

                {/* Quick Stats Widget */}
                <motion.div variants={itemVariants} className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
                    <h4 className='text-xs font-bold text-slate-900 mb-4'>Quick Insights</h4>
                    <div className='space-y-3 font-medium'>
                        <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all group'>
                            <div className='flex items-center gap-3'>
                                <Users size={16} className='text-indigo-500' />
                                <span className='text-[11px] text-slate-600'>Global Reach</span>
                            </div>
                            <span className='text-xs font-bold text-slate-900'>{profileData.connectionsCount || 0}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all group'>
                            <div className='flex items-center gap-3'>
                                <ShieldCheck size={16} className='text-emerald-500' />
                                <span className='text-[11px] text-slate-600'>Profile Status</span>
                            </div>
                            <span className='text-xs font-bold text-emerald-600'>Vetted</span>
                        </div>
                        <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all group'>
                            <div className='flex items-center gap-3'>
                                <BarChart3 size={16} className='text-rose-500' />
                                <span className='text-[11px] text-slate-600'>Social Density</span>
                            </div>
                            <span className='text-xs font-bold text-slate-900'>High</span>
                        </div>
                    </div>
                </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky Action Bar */}
      {!isOwnProfile && (
        <div className='lg:hidden fixed bottom-6 left-4 right-4 z-50'>
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className='bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 pl-3 flex items-center gap-3 ring-1 ring-black/5'
            >
                <div className='flex-1 min-w-0'>
                    <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5'>Connect with</p>
                    <p className='text-sm font-bold text-slate-900 truncate'>{user.name}</p>
                </div>
                <div className='flex gap-2 shrink-0'>
                    <Button 
                        size="icon"
                        variant="outline"
                        className='rounded-xl h-12 w-12 border-slate-200 bg-white shadow-sm'
                        onClick={() => navigate('/inbox', { state: { recipientId: user._id } })}
                    >
                        <MessageSquare size={20} className='text-slate-600' />
                    </Button>
                    <Button 
                        className='rounded-xl h-12 px-6 shadow-lg text-white'
                        style={connectionStatus === 'connected' 
                          ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }
                          : connectionStatus === 'pending'
                            ? { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }
                            : connectionStatus === 'received'
                              ? { background: 'linear-gradient(135deg, #163146 0%, #0f1f27 100%)' }
                              : connectButtonStyle}
                        onClick={connectionStatus === 'received' ? handleAcceptRequest : handleConnect}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'pending'}
                    >
                        {connectionStatus === 'connected' ? (
                          <>
                            <Users size={20} className="mr-2" />
                            Connected
                          </>
                        ) : connectionStatus === 'pending' ? (
                          <>
                            <Clock size={20} className="mr-2" />
                            Sent
                          </>
                        ) : connectionStatus === 'received' ? (
                          <>
                            <Check size={20} className="mr-2" />
                            Accept Request
                          </>
                        ) : (
                          <>
                            <UserPlus size={20} className="mr-2" />
                            Connect
                          </>
                        )}
                    </Button>
                    {connectionStatus === 'pending' && (
                        <Button 
                            className='rounded-xl h-12 px-6 shadow-lg bg-white text-slate-500 hover:text-rose-600 border border-slate-200'
                            onClick={handleCancelRequest}
                        >
                            <X size={20} />
                        </Button>
                    )}
                    {connectionStatus === 'received' && (
                        <Button 
                            className='rounded-xl h-12 px-6 shadow-lg bg-white text-rose-600 border border-rose-200'
                            onClick={handleDeclineRequest}
                        >
                            <X size={20} />
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
      )}

      {/* Connection Modal */}
      <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
        <DialogContent className='max-w-md rounded-3xl p-0 overflow-hidden border-0'>
          
          {/* Header */}
          <div className='bg-white p-6 pb-2'>
             <DialogHeader>
                <DialogTitle className='text-2xl font-bold text-slate-900'>Connect with {user.name}</DialogTitle>
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
                                placeholder={`Hi ${user.name.split(' ')[0]}, I'd like to connect...`}
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
                                className="flex-1 rounded-xl h-12 text-white shadow-lg shadow-blue-500/20"
                                style={connectButtonStyle}
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
                            className="w-full rounded-xl h-14 text-white shadow-lg shadow-blue-500/20 text-base font-semibold justify-between px-6 group"
                            style={connectButtonStyle}
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
                            {user.name} will receive a notification immediately.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

        </DialogContent>
      </Dialog>

      <ConnectionsModal
        isOpen={showConnectionsList}
        onClose={() => setShowConnectionsList(false)}
        currentUserId={currentUser?._id || currentUser?.id || null}
        userId={id}
        usePublic={currentUser?._id !== id}
        canManage={currentUser?._id === id}
        title={currentUser?._id === id ? 'My Network' : `${user.name}'s Network`}
        subtitle={currentUser?._id === id ? 'Search, manage, and unfollow your connections' : 'Connections in this network'}
      />
    </DashboardLayout>
  )
}

export default PublicProfilePage
