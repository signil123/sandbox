import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search, UserMinus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ProfilePopup from '../Dashboard/ProfilePopup'
import { profileService } from '../../services/profileService'
import { connectionService } from '../../services/connectionService'
import { getImageUrl } from '../../utils/imageUtils'
import { selectCurrentUser } from '../../redux/userSlice'
import { getThemeById } from '../../constants/themes'

const getBannerStyle = (profile) => {
  if (profile?.bannerImage) {
    if (
      profile.bannerImage.startsWith('linear-gradient') ||
      profile.bannerImage.startsWith('radial-gradient') ||
      profile.bannerImage.startsWith('url')
    ) {
      return { background: profile.bannerImage }
    }

    if (
      profile.bannerImage.startsWith('/') ||
      profile.bannerImage.includes('uploads')
    ) {
      const url = getImageUrl(profile.bannerImage)
      return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }

    const theme = getThemeById(profile.bannerImage)
    if (theme?.style) return theme.style

    return { background: profile.bannerImage }
  }

  if (profile?.themeId) {
    const theme = getThemeById(profile.themeId)
    if (theme?.style) return theme.style
  }

  return { background: 'linear-gradient(135deg, #163146 0%, #986a41 100%)' }
}

const ConnectionsModal = ({
  isOpen,
  onClose,
  currentUserId,
  userId,
  usePublic = false,
  title = 'My Network',
  subtitle = 'Manage the people you are connected with',
  onCountUpdate,
  canManage = true,
}) => {
  const [connections, setConnections] = useState([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [connectionsError, setConnectionsError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const currentUserType = currentUser?.userType || 'athlete'

  useEffect(() => {
    const targetUserId = userId || currentUserId
    if (!isOpen || !targetUserId) return

    const fetchConnections = async () => {
      try {
        setConnectionsLoading(true)
        setConnectionsError(null)
        const response = usePublic
          ? await connectionService.getPublicNetwork(targetUserId)
          : await connectionService.getNetwork(targetUserId)
        if (response.data?.status === 'success') {
          const list = response.data.data?.connections || []
          setConnections(list)
          if (onCountUpdate) onCountUpdate(list.length)
        } else {
          setConnections([])
          if (onCountUpdate) onCountUpdate(0)
        }
      } catch (error) {
        console.error('Error fetching connections:', error)
        setConnectionsError('Failed to load your network')
      } finally {
        setConnectionsLoading(false)
      }
    }

    fetchConnections()
  }, [isOpen, currentUserId, userId, usePublic])

  const mapProfileToPopup = (profile, connectionStatus, totalConnections) => {
    const user = profile?.user || {}
    const name = user.name || profile?.name || 'User'
    const userType = profile?.profileType || user.userType || 'athlete'
    const title =
      profile?.title ||
      (userType
        ? `${userType.charAt(0).toUpperCase() + userType.slice(1)}`
        : 'Member')
    const profileImg = profile?.profileImage
      ? getImageUrl(profile.profileImage)
      : profile?.photo
        ? getImageUrl(profile.photo)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    const banner = getBannerStyle(profile)
    const experienceValue = parseInt(profile?.experience)

    return {
      id: user._id || user.id,
      name,
      title,
      location: profile?.location || 'Remote',
      specialties: profile?.specialization || profile?.specialties || [],
      experience: Number.isFinite(experienceValue) ? experienceValue : 0,
      specialty: profile?.specialization?.[0] || profile?.sport || title,
      connections: totalConnections || 0,
      initials: name.split(' ').map((part) => part[0]).join(''),
      verified: profile?.verified || false,
      bestMatch: false,
      matchPercentage: profile?.matchScore || 0,
      banner,
      profileImg,
      type: userType,
      rating: profile?.ratings?.averageRating || 0,
      reviewCount: profile?.ratings?.totalReviews || 0,
      about: profile?.aboutMe || '',
      connectionStatus: connectionStatus || 'not_connected',
    }
  }

  const handleOpenProfile = async (connection) => {
    const userIdToFetch = connection?.connectedUser?.userId
    if (!userIdToFetch) return
    try {
      setProfileLoading(true)
      const response = await profileService.getProfileByUserId(userIdToFetch)
      if (response?.status === 'success') {
        const { profile, connectionStatus, totalConnections } = response.data || {}
        const mappedProfile = mapProfileToPopup(profile, connectionStatus, totalConnections)
        setSelectedProfile(mappedProfile)
        setProfilePopupOpen(true)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const filteredConnections = useMemo(() => {
    if (!searchTerm.trim()) return connections
    const query = searchTerm.toLowerCase()
    return connections.filter((connection) => {
      const user = connection.connectedUser || {}
      const haystack = [
        user.name,
        user.email,
        user.title,
        user.location,
        user.userType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [connections, searchTerm])

  const handleRemoveConnection = async (connectionId, name) => {
    if (!currentUserId || !canManage) return
    try {
      setRemovingId(connectionId)
      await connectionService.removeConnection(currentUserId, connectionId)
      setConnections((prev) => prev.filter((conn) => conn.connectionId !== connectionId))
      if (onCountUpdate) {
        onCountUpdate((prevCount) => Math.max(0, prevCount - 1))
      }
      toast.success(`${name || 'Connection'} removed from your network`)
    } catch (error) {
      console.error('Error removing connection:', error)
      toast.error('Failed to remove connection')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-slate-900/40 z-[70] flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'tween', duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-t-[28px] md:rounded-[28px] w-full md:max-w-2xl md:w-full p-6 md:p-8 shadow-2xl relative overflow-hidden'
          >
            <div className='absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#163146] via-[#986a41] to-[#163146]' />

            <div className='flex items-start justify-between gap-4 mb-6'>
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg'>
                  <Users size={18} />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-slate-900'>{title}</h2>
                  <p className='text-xs text-slate-500 mt-1'>{subtitle}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className='p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors'
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className='bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm mb-6'>
              <div className='flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3'>
                <Search size={12} />
                <span>Search Connections</span>
              </div>
              <div className='flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-inner'>
                <Search size={16} className='text-slate-400' />
                <input
                  type='text'
                  placeholder='Search by name, role, or location'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none'
                />
              </div>
              <div className='flex items-center justify-between text-[11px] text-slate-500 mt-3'>
                <span>{filteredConnections.length} connections</span>
                <span>Sorted by most recent</span>
              </div>
            </div>

            <div className='space-y-3 max-h-[55vh] overflow-y-auto pr-1'>
              {connectionsLoading && (
                <div className='flex items-center justify-center gap-3 py-12 text-slate-500 text-sm'>
                  <Loader2 size={18} className='animate-spin' />
                  {usePublic || !canManage ? 'Loading connections...' : 'Loading your network...'}
                </div>
              )}

              {!connectionsLoading && connectionsError && (
                <div className='text-center py-10 text-sm text-slate-500'>{connectionsError}</div>
              )}

              {!connectionsLoading && !connectionsError && filteredConnections.length === 0 && (
                <div className='text-center py-10 text-sm text-slate-500'>
                  No connections found. Try a different search.
                </div>
              )}

              {!connectionsLoading &&
                !connectionsError &&
                filteredConnections.map((connection) => {
                  const user = connection.connectedUser || {}
                  const avatar = user.profileImage ? getImageUrl(user.profileImage) : null
                  const userMeta = [user.title || user.userType, user.location]
                    .filter(Boolean)
                    .join(' • ')

                  return (
                    <div
                      key={connection.connectionId}
                      className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:border-slate-300 hover:shadow-md transition'
                      onClick={() => handleOpenProfile(connection)}
                    >
                      <div className='flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenProfile(connection)
                          }}
                          className='w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold hover:ring-2 hover:ring-slate-300 transition'
                        >
                          {avatar ? (
                            <img src={avatar} alt={user.name || 'Connection'} className='w-full h-full object-cover' />
                          ) : (
                            (user.name || 'U')
                              .split(' ')
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()
                          )}
                        </button>
                        <div>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenProfile(connection)
                            }}
                            className='text-sm font-semibold text-slate-900 hover:underline'
                          >
                            {user.name || 'Unknown'}
                          </button>
                          <p className='text-xs text-slate-500'>{userMeta || 'Connected member'}</p>
                          {user.email && (
                            <p className='text-[11px] text-slate-400 mt-1'>{user.email}</p>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveConnection(connection.connectionId, user.name)
                          }}
                          disabled={removingId === connection.connectionId}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${
                            removingId === connection.connectionId
                              ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-wait'
                              : 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100'
                          }`}
                        >
                          <UserMinus size={14} />
                          {removingId === connection.connectionId ? 'Removing...' : 'Unfollow'}
                        </motion.button>
                      )}
                    </div>
                  )
                })}
            </div>
          </motion.div>
        </motion.div>
      )}
      <ProfilePopup
        profile={selectedProfile}
        isOpen={profilePopupOpen}
        onClose={() => setProfilePopupOpen(false)}
        currentUserType={currentUserType}
        zIndexBase={90}
        onConnect={async (profile) => {
          if (!currentUserId || !profile?.id) return
          try {
            await connectionService.sendRequest(currentUserId, profile.id, '')
            toast.success(`Connection request sent to ${profile.name}`)
          } catch (error) {
            console.error('Error sending connection request:', error)
            toast.error(error.response?.data?.message || 'Failed to send connection request')
          }
        }}
        onMessage={(profile) => navigate('/inbox', { state: { recipientId: profile.id || profile._id } })}
      />
    </AnimatePresence>
  )
}

export default ConnectionsModal
