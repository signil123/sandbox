import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    Briefcase,
    Check,
    Clock,
    Edit3,
    Eye,
    FileBadge,
    Globe,
    Linkedin,
    Lock,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Plus,
    ShieldCheck,
    Twitter,
    Upload,
    User,
    Users,
    X,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import ConnectionsModal from '../../components/Connections/ConnectionsModal'
import DocumentManager from '../../components/Profile/DocumentManager'
import UserPreviewCard from '../../components/Profile/UserPreviewCard'
import { getThemeById, themes } from '../../constants/themes'
import { selectCurrentUser, updateProfileImage } from '../../redux/userSlice'
import { connectionService } from '../../services/connectionService'
import { profileService } from '../../services/profileService'
import { getImageUrl } from '../../utils/imageUtils'
import DashboardLayout from '../Layout/DashboardLayout'

// Professional specific options
const experienceOptions = [
  '1-3 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
]

const dealSizeOptions = [
  { value: '50k-100k', label: '$50k - $100k' },
  { value: '100k-250k', label: '$100k - $250k' },
  { value: '250k-500k', label: '$250k - $500k' },
  { value: '500k-1m', label: '$500k - $1M' },
  { value: '5m+', label: '$5M+' },
]

const serviceTypeOptions = [
  { key: 'contractReview', label: 'Contract Review' },
  { key: 'dealNegotiation', label: 'Deal Negotiation' },
  { key: 'brandStrategy', label: 'Brand Strategy' },
  { key: 'complianceAudit', label: 'Compliance Audit' },
  { key: 'taxAdvisory', label: 'Tax Advisory' },
  { key: 'legalRepresentation', label: 'Legal Representation' },
]

const AdvisorProfilePage = ({ type = 'advisor' }) => {
  const currentUser = useSelector(selectCurrentUser)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // State
  const [selectedThemeId, setSelectedThemeId] = useState('ocean')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false)
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false)
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [savingSpecializations, setSavingSpecializations] = useState(false)
  const [specializationsModalOpen, setSpecializationsModalOpen] = useState(false)

  // Mobile & Scroll Lock Logic
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const isAnyModalOpen = editModalOpen || preferencesModalOpen || documentManagerOpen || themeModalOpen || previewModalOpen || completeProfileModalOpen || connectionsModalOpen
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [editModalOpen, preferencesModalOpen, documentManagerOpen, themeModalOpen, previewModalOpen, completeProfileModalOpen, connectionsModalOpen])

  // Profile data
  const [profileData, setProfileData] = useState({
    name: '',
    photo: null,
    organization: '',
    role: '',
    experience: '',
    aboutMe: '',
    email: '',
    phone: '',
    socialMedia: { linkedin: '', twitter: '', website: '' },
    contactVisible: true,
    verified: false,
    verificationStatus: 'not_submitted'
  })

  // Preferences
  const [preferences, setPreferences] = useState({
    preferredDealSize: '100k-250k',
    serviceTypes: {
      contractReview: false,
      dealNegotiation: false,
      brandStrategy: false,
      complianceAudit: false,
      taxAdvisory: false,
      legalRepresentation: false,
    },
  })



  const [editFormData, setEditFormData] = useState(profileData)
  const [completeProfileData, setCompleteProfileData] = useState({
    name: '',
    organization: '',
    role: '',
    experience: '',
    aboutMe: ''
  })

  useEffect(() => {
    if (currentUser) {
       if (currentUser.userType === 'athlete') {
           navigate('/profile/athlete')
           return
       }
    }
  }, [currentUser, navigate])

  const currentTheme = getThemeById(selectedThemeId)

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true)
      if (currentUser?._id) {
        const response = await profileService.getAdvisorProfile(currentUser._id)
        if (response?.status === 'success' && response.data?.advisor) {
          const { profile, nilPreferences, verificationStatus } = response.data.advisor
          
          const mappedProfile = {
            name: profile.user?.name || '',
            photo: (profile.profileImage && !profile.profileImage.includes('unsplash.com')) 
              ? profile.profileImage 
              : (profile.photo && !profile.photo.includes('unsplash.com')) 
                ? profile.photo 
                : null,
            organization: profile.agencyName || '',
            role: profile.title || (type === 'advisor' ? 'NIL Advisor' : 'Sports Agent'),
            experience: profile.experience || '',
            aboutMe: profile.aboutMe || '',
            email: profile.user?.email || '',
            phone: profile.phone || '',
            socialMedia: {
              linkedin: profile.socialLinks?.linkedin || '',
              twitter: profile.socialLinks?.twitter || '',
              website: profile.socialLinks?.website || '',
              ...profile.socialMedia
            },
            contactVisible: profile.contactVisible ?? true,
            verified: profile.verified || false,
            verificationStatus: verificationStatus || 'not_submitted',
            banner: profile.bannerImage || null,
            connections: profile.user?.totalConnections || 0,
          }

          setProfileData(mappedProfile)
          setEditFormData(mappedProfile)
          setSelectedThemeId(profile.themeId || 'ocean')

          try {
            const networkResponse = await connectionService.getNetwork(currentUser._id)
            if (networkResponse.data?.status === 'success') {
              const totalConnections = (networkResponse.data.data?.connections || []).length
              setProfileData((prev) => ({ ...prev, connections: totalConnections }))
            }
          } catch (error) {
            console.warn('Error fetching connections count:', error)
          }

          // Map NIL preferences
          if (nilPreferences) {
            const mappedServiceTypes = {}
            serviceTypeOptions.forEach(opt => {
              mappedServiceTypes[opt.key] = nilPreferences.serviceTypes?.includes(opt.label) || false
            })
            setPreferences({
              preferredDealSize: nilPreferences.dealSize || '100k-250k',
              serviceTypes: mappedServiceTypes
            })
          }

          // Check if profile is complete
          const isComplete = mappedProfile.name && mappedProfile.experience && mappedProfile.aboutMe
          if (!isComplete) {
            setCompleteProfileData({
              name: mappedProfile.name,
              organization: mappedProfile.organization,
              role: mappedProfile.role,
              experience: mappedProfile.experience,
              aboutMe: mappedProfile.aboutMe
            })
            setCompleteProfileModalOpen(true)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile", error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [currentUser?._id, currentUser?.userType, type])

  const handleConnectionsCountUpdate = (valueOrUpdater) => {
    setProfileData((prev) => ({
      ...prev,
      connections:
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(prev.connections || 0)
          : valueOrUpdater,
    }))
  }

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const handleEditProfile = async () => {
    try {
      setSavingProfile(true)
      const advisorId = currentUser._id

      // 1. Update profile-side info
      await profileService.updateAdvisorInfo(advisorId, {
        phone: editFormData.phone,
        aboutMe: editFormData.aboutMe,
        socialLinks: {
          linkedin: editFormData.socialMedia.linkedin,
          twitter: editFormData.socialMedia.twitter,
          website: editFormData.socialMedia.website,
        }
      })

      // 2. Update Professional Info
      await profileService.updateAdvisorProfessionalInfo(advisorId, {
        experience: editFormData.experience,
        agencyName: editFormData.organization,
        title: editFormData.role
      })

      setProfileData(editFormData)
      setEditModalOpen(false)
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCompleteProfile = async () => {
    try {
      setSavingProfile(true)
      const advisorId = currentUser._id

      // Combine both updates
      await profileService.updateAdvisorInfo(advisorId, {
        name: completeProfileData.name,
        aboutMe: completeProfileData.aboutMe,
      })

      await profileService.updateAdvisorProfessionalInfo(advisorId, {
        experience: completeProfileData.experience,
        agencyName: completeProfileData.organization,
        title: completeProfileData.role
      })

      toast.success('Profile completed! Welcome to Signil.')
      setCompleteProfileModalOpen(false)
      fetchProfileData() // Refresh
    } catch {
      toast.error('Failed to complete profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSavingProfile(true)
      const selectedServices = Object.entries(preferences.serviceTypes)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => serviceTypeOptions.find(opt => opt.key === key)?.label)

      await profileService.updateAdvisorNILPreferences(currentUser._id, {
        dealSize: preferences.preferredDealSize,
        serviceTypes: selectedServices
      })

      setPreferencesModalOpen(false)
      toast.success('Preferences updated successfully!')
    } catch {
      toast.error('Failed to update preferences')
    } finally {
      setSavingProfile(false)
    }
  }



  const handleThemeChange = async (themeId) => {
    try {
      setSelectedThemeId(themeId)
      const theme = getThemeById(themeId)

      await profileService.updateBasicProfile({
        themeId: themeId,
        themeColor: theme.label,
      })

      toast.success(`Theme changed to ${theme.label}!`)
    } catch (err) {
      console.error('Error saving theme:', err)
      toast.error('Failed to save theme preference')
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setIsUploadingPhoto(true)
      setSavingProfile(true)
      const uploadResponse = await profileService.uploadFile(file)
      
      if (uploadResponse?.url) {
        const photoUrl = uploadResponse.url
        await profileService.updateBasicProfile({
          profileImage: photoUrl
        })
        
        setProfileData(prev => ({ ...prev, photo: photoUrl }))
        dispatch(updateProfileImage(photoUrl))
        toast.success('Profile photo updated successfully!')
      }
    } catch (error) {
      console.error('Photo upload failed:', error)
      toast.error('Failed to upload profile photo')
    } finally {
      setSavingProfile(false)
      setIsUploadingPhoto(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
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

  const ProfileSkeleton = () => (
    <div className='mx-auto px-4 py-6 max-w-8xl w-full animate-pulse'>
      <div className='h-8 w-40 bg-slate-200 rounded-lg mb-6' />
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2 bg-white rounded-2xl border border-slate-200 h-96' />
        <div className='bg-white rounded-2xl border border-slate-200 h-96' />
      </div>
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster position='bottom-right' theme='dark' />
      <DocumentManager 
        isOpen={documentManagerOpen} 
        onClose={() => setDocumentManagerOpen(false)} 
        currentUser={currentUser}
      />

      <div className='w-full h-full max-w-8xl mx-auto flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen'>
        <motion.div
          className='mx-auto px-4 py-6 max-w-8xl w-full'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Header */}
          <motion.div variants={itemVariants} className='mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
                {type === 'advisor' ? 'Advisor Profile' : 'Agent Profile'}
              </h1>
              <p className='text-xs text-slate-600 mt-1'>
                Manage your professional identity and verification
              </p>
            </div>
            
            <div className='flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreviewModalOpen(true)}
                className='flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap'
              >
                <Eye size={16} />
                <span>View As</span>
              </motion.button>
              
              <button
                onClick={() => setDocumentManagerOpen(true)}
                className='flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap'
              >
                <FileBadge size={16} />
                <span>Document Center</span>
              </button>
            </div>
          </motion.div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Profile Card */}
              <motion.div variants={itemVariants}>
                <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
                  {/* Hero / Banner */}
                  <div
                    className='h-32 relative z-0 group/banner overflow-hidden'
                    style={profileData.banner 
                      ? { backgroundImage: `url(${getImageUrl(profileData.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                      : currentTheme.style
                    }
                  >
                    {/* Banner Edit Button */}
                    <motion.button 
                      onClick={() => setThemeModalOpen(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className='absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white shadow-lg cursor-pointer hover:bg-white/30 transition-all'
                    >
                      <Edit3 size={14} />
                    </motion.button>

                    {profileData.verified && (
                      <div className='absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-emerald-100 z-10'>
                        <ShieldCheck size={14} className='text-emerald-500' />
                        <span className='text-xs font-bold text-emerald-700'>Verified Professional</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='px-6 pb-6'>
                    {/* Profile Header */}
                    <div className='-mt-16 mb-4 flex flex-col items-center text-center relative z-10'>
                      <motion.div
                        className='w-32 h-32 rounded-full border-4 border-white flex-shrink-0 shadow-lg overflow-hidden mb-4 relative group bg-white/10 backdrop-blur-sm'
                        whileHover={{ scale: 1.02 }}
                      >
                        {profileData.photo ? (
                          <img
                            src={getImageUrl(profileData.photo)}
                            alt={profileData.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div 
                            className='w-full h-full flex items-center justify-center text-white font-bold text-3xl shadow-inner'
                            style={{ background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent || currentTheme.primary} 100%)` }}
                          >
                            {getInitials(profileData.name)}
                          </div>
                        )}
                        
                        {/* Upload Overlay */}
                        <label
                          className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity cursor-pointer ${
                            isUploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 size={22} className='text-white animate-spin' />
                              <span className='text-[11px] text-white mt-2 font-semibold'>Uploading...</span>
                            </>
                          ) : (
                            <Upload size={24} className='text-white mb-1' />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={savingProfile || isUploadingPhoto}
                          />
                        </label>
                      </motion.div>

                      <div className='mb-3'>
                        <div className='flex items-center justify-center gap-2'>
                          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
                            {profileData.name || 'Set Your Name'}
                            {profileData.verified && (
                              <div className='bg-blue-500 rounded-full p-0.5'>
                                <Check size={10} className='text-white' strokeWidth={3} />
                              </div>
                            )}
                          </h2>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setEditFormData(profileData)
                              setEditModalOpen(true)
                            }}
                            className='p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                          >
                            <Edit3 size={14} className='text-slate-600' />
                          </motion.button>
                        </div>

                        <div className='mt-2 space-y-1'>
                          <p className='text-sm font-semibold text-slate-700'>
                            {profileData.role} {profileData.organization ? `@ ${profileData.organization}` : ''}
                          </p>
                          <p className='text-xs text-slate-500'>
                            {profileData.experience || 'Experience not set'} Professional Experience
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* About */}
                    <div className='mb-5 pb-5 border-b border-slate-200'>
                      <p className='text-sm text-slate-600 leading-relaxed text-center max-w-2xl mx-auto italic'>
                        "{profileData.aboutMe || 'No bio provided yet.'}"
                      </p>
                    </div>

                    {/* Contact Grid */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-5'>
                      {profileData.email && <ContactItem icon={Mail} label="Email" value={profileData.email} />}
                      {profileData.phone && <ContactItem icon={Phone} label="Phone" value={profileData.phone} />}
                      {profileData.organization && <ContactItem icon={Briefcase} label="Agency/Org" value={profileData.organization} />}
                      {profileData.socialMedia.website && <ContactItem icon={Globe} label="Website" value={profileData.socialMedia.website} />}
                    </div>

                    {/* Visibility Toggle */}
                    <div className='pt-4 border-t border-slate-200 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Lock size={14} className='text-slate-400' />
                        <div>
                          <span className='text-xs font-bold text-slate-700 block'>
                            Contact Visibility
                          </span>
                          <span className='text-[10px] text-slate-500'>
                            Decide if athletes can see your direct contact info
                          </span>
                        </div>
                      </div>
                      <motion.button
                        onClick={async () => {
                           const newStatus = !profileData.contactVisible;
                           setProfileData({ ...profileData, contactVisible: newStatus });
                           try {
                             await profileService.updateBasicProfile({ contactVisible: newStatus });
                           } catch (error) {
                             toast.error("Failed to update visibility")
                           }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profileData.contactVisible ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <motion.span
                          className='inline-block h-4 w-4 transform rounded-full bg-white shadow-sm'
                          animate={{ x: profileData.contactVisible ? 24 : 4 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>


            </div>

            {/* Right Sidebar */}
            <div className='space-y-6'>

               {/* My Network */}
               <motion.div
                 variants={itemVariants}
                 className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'
               >
                 <div className='flex items-center justify-between mb-3'>
                   <h3 className='text-sm font-semibold text-slate-900'>
                     My Network
                   </h3>
                   <div className='w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
                     <Users size={14} />
                   </div>
                 </div>
                 <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3'>
                   <div>
                     <p className='text-xs font-semibold text-slate-700'>
                       {profileData.connections || 0} connections
                     </p>
                     <p className='text-[11px] text-slate-500 mt-1'>
                       View and manage your connections
                     </p>
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setConnectionsModalOpen(true)}
                     className='px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-slate-800 transition-colors'
                   >
                     View
                   </motion.button>
                 </div>
               </motion.div>
               
               {/* CRM / Verification Status Card */}
               <motion.div variants={itemVariants} className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
                 <h3 className='font-bold text-slate-900 mb-4'>Verification Status</h3>
                 
                 {profileData.verified ? (
                    <div className='flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-3 border border-emerald-100'>
                        <div className='w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0'>
                        <ShieldCheck size={20} className='text-emerald-600' />
                        </div>
                        <div>
                        <p className='text-sm font-bold text-emerald-800'>Fully Verified</p>
                        <p className='text-xs text-emerald-600'>You are trusted & visible on Explore.</p>
                        </div>
                    </div>
                 ) : (
                    <div className='flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-3 border border-amber-100'>
                        <div className='w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 text-amber-600'>
                           {['pending', 'pending_review'].includes(profileData.verificationStatus) ? <Clock size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                        <p className='text-sm font-bold text-amber-800 uppercase tracking-tight'>
                           {['pending', 'pending_review'].includes(profileData.verificationStatus) ? 'Under Review' : 'Action Required'}
                        </p>
                        <p className='text-xs text-amber-700'>
                           {['pending', 'pending_review'].includes(profileData.verificationStatus) 
                             ? 'Our team is reviewing your docs.' 
                             : 'Submit documents to unlock features.'}
                        </p>
                        </div>
                    </div>
                 )}

                 <button 
                    onClick={() => setDocumentManagerOpen(true)}
                    className='w-full py-2.5 mt-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2'
                 >
                    <FileBadge size={16} />
                    Document Center
                 </button>
               </motion.div>



              {/* NIL Preferences / Services */}
              <motion.div variants={itemVariants}>
                <div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-sm'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h3 className='font-bold text-slate-900'>
                        Client Preferences
                      </h3>
                      <p className='text-[10px] text-slate-500 font-medium'>What deals you specialize in</p>
                    </div>
                    <motion.button
                      onClick={() => setPreferencesModalOpen(true)}
                      className='p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors'
                    >
                      <Edit3 size={14} className='text-slate-500' />
                    </motion.button>
                  </div>

                  <div className='space-y-5'>
                    <div>
                      <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2'>
                        Min Deal Size
                      </p>
                      <span className='px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 inline-block'>
                        {dealSizeOptions.find(d => d.value === preferences.preferredDealSize)?.label || preferences.preferredDealSize}
                      </span>
                    </div>

                    <div>
                      <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2'>
                        Primary Services
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {Object.entries(preferences.serviceTypes)
                          .filter(([_, enabled]) => enabled)
                          .map(([key, _]) => (
                            <span
                              key={key}
                              className='px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 border border-slate-200'
                            >
                              <Check size={10} className='text-emerald-500' strokeWidth={3} />
                              {serviceTypeOptions.find(t => t.key === key)?.label || key}
                            </span>
                          ))}
                        {Object.values(preferences.serviceTypes).every(v => !v) && (
                          <span className='text-xs text-slate-400 italic'>None selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            
            </div>
          </div>
        </motion.div>
      </div>

      <ConnectionsModal
        isOpen={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        currentUserId={currentUser?._id || currentUser?.id || null}
        title='My Network'
        subtitle='Search, manage, and unfollow your connections'
        onCountUpdate={handleConnectionsCountUpdate}
      />

       {/* Edit Profile Modal */}
       <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm'
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: isMobile ? 'spring' : 'tween', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-t-[32px] md:rounded-2xl w-full md:max-w-sm md:w-full p-6 max-h-[90vh] overflow-y-auto'
            >
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-slate-900'>
                  Edit Profile
                </h2>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setEditModalOpen(false)}
                  className='p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors'
                >
                  <X size={16} className='text-slate-600' />
                </motion.button>
              </div>

              <div className='space-y-3 mb-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Full Name
                  </label>
                  <div
                    onClick={() => navigate('/settings?tab=notifications')}
                    className='cursor-pointer group'
                  >
                    <div className='flex items-center justify-between w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-lg group-hover:border-slate-300 transition'>
                      <span className='text-slate-500'>{editFormData.name || 'No name set'}</span>
                      <Lock size={12} className='text-slate-400' />
                    </div>
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1 pl-1'>Edit account info in Settings</p>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      Professional Role
                    </label>
                    <input
                      type='text'
                      placeholder='e.g. Senior NIL Agent'
                      value={editFormData.role}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          role: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                      Years Experience
                    </label>
                    <select
                      value={editFormData.experience}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          experience: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition bg-white'
                    >
                      <option value="">Select...</option>
                      {experienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Organization / Agency
                  </label>
                  <input
                    type='text'
                    placeholder='Where do you work?'
                    value={editFormData.organization}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        organization: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Email
                  </label>
                  <div
                    onClick={() => navigate('/settings?tab=notifications')}
                    className='cursor-pointer group'
                  >
                    <div className='flex items-center justify-between w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-lg group-hover:border-slate-300 transition'>
                      <span className='text-slate-500'>{editFormData.email || 'No email set'}</span>
                      <Lock size={12} className='text-slate-400' />
                    </div>
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1 pl-1'>Edit account info in Settings</p>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Phone
                  </label>
                  <input
                    type='tel'
                    placeholder='Phone'
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    About Me
                  </label>
                  <textarea
                    placeholder='Tell athletes about your track record...'
                    value={editFormData.aboutMe}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        aboutMe: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 resize-none transition'
                    rows='3'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-900 mb-1.5'>
                    Social Links
                  </label>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='w-20 text-[10px] font-bold text-slate-400 uppercase'>LinkedIn</div>
                      <input
                        type='text'
                        placeholder='LinkedIn URL'
                        value={editFormData.socialMedia?.linkedin || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-20 text-[10px] font-bold text-slate-400 uppercase'>Twitter</div>
                      <input
                        type='text'
                        placeholder='Twitter URL'
                        value={editFormData.socialMedia?.twitter || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              twitter: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-20 text-[10px] font-bold text-slate-400 uppercase'>Website</div>
                      <input
                        type='text'
                        placeholder='Portfolio / Website'
                        value={editFormData.socialMedia?.website || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            socialMedia: {
                              ...editFormData.socialMedia,
                              website: e.target.value,
                            },
                          })
                        }
                        className='flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition'
                      />
                    </div>
                  </div>
                </div>


              </div>

              <div className='flex gap-2 pt-2'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditProfile}
                  disabled={savingProfile}
                  className='flex-1 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 shadow-lg shadow-slate-200'
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditModalOpen(false)}
                  className='flex-1 py-3 rounded-xl font-bold text-sm border border-slate-300 text-slate-900 hover:bg-slate-50 transition'
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

       {/* Complete Profile Modal (First Time / Missing Data) */}
       <AnimatePresence>
         {completeProfileModalOpen && (
           <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm'>
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className='bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]'
             >
                <div className='p-6 md:p-8 text-center overflow-y-auto custom-scrollbar'>
                  <div className='w-14 h-14 bg-[#163146]/5 text-[#163146] rounded-2xl flex items-center justify-center mx-auto mb-4'>
                    <User size={28} strokeWidth={1.5} />
                  </div>
                  <h2 className='text-xl font-bold text-[#163146] leading-tight mb-2'>Complete Your Profile</h2>
                  <p className='text-xs text-slate-500 max-w-sm mx-auto mb-6'>
                    To start connecting with athletes, we need a few details about your professional background.
                  </p>
                  
                  <div className='space-y-4 text-left'>
                    <div>
                      <label className='text-[10px] font-bold uppercase text-slate-500 tracking-wider pl-1'>Full Name</label>
                      <input 
                        type="text"
                        value={completeProfileData.name}
                        onChange={e => setCompleteProfileData({...completeProfileData, name: e.target.value})}
                        className='w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#163146] focus:bg-white focus:outline-none transition-all text-sm'
                        placeholder="e.g. David Richardson"
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                       <div>
                        <label className='text-[10px] font-bold uppercase text-slate-500 tracking-wider pl-1'>Organization</label>
                        <input 
                          type="text"
                          value={completeProfileData.organization}
                          onChange={e => setCompleteProfileData({...completeProfileData, organization: e.target.value})}
                          className='w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#163146] focus:bg-white focus:outline-none transition-all text-sm'
                          placeholder="Agency name"
                        />
                       </div>
                       <div>
                        <label className='text-[10px] font-bold uppercase text-slate-500 tracking-wider pl-1'>Role</label>
                        <input 
                          type="text"
                          value={completeProfileData.role}
                          onChange={e => setCompleteProfileData({...completeProfileData, role: e.target.value})}
                          className='w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#163146] focus:bg-white focus:outline-none transition-all text-sm'
                          placeholder="e.g. Attorney / Agent"
                        />
                       </div>
                    </div>

                    <div>
                      <label className='text-[10px] font-bold uppercase text-slate-500 tracking-wider pl-1'>Years Experience</label>
                      <div className="relative">
                        <select 
                          value={completeProfileData.experience}
                          onChange={e => setCompleteProfileData({...completeProfileData, experience: e.target.value})}
                          className='w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#163146] focus:bg-white focus:outline-none transition-all text-sm appearance-none'
                        >
                           <option value="">Select experience...</option>
                           {experienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>



                    <div>
                      <label className='text-[10px] font-bold uppercase text-slate-500 tracking-wider pl-1'>Bio / About You</label>
                      <textarea 
                        rows={3}
                        value={completeProfileData.aboutMe}
                        onChange={e => setCompleteProfileData({...completeProfileData, aboutMe: e.target.value})}
                        className='w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#163146] focus:bg-white focus:outline-none transition-all text-sm min-h-[80px]'
                        placeholder="Briefly describe your background..."
                      />
                    </div>
                  </div>

                  <div className='flex gap-3 mt-8'>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className='flex-1 py-2.5 px-6 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98]'
                    >
                      Later
                    </button>
                    <button
                      onClick={handleCompleteProfile}
                      disabled={savingProfile || !completeProfileData.name || !completeProfileData.experience || !completeProfileData.aboutMe}
                      className='flex-[2] py-2.5 bg-[#163146] text-white rounded-xl font-bold text-sm hover:bg-[#163146]/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-30'
                    >
                      {savingProfile ? 'Setting up...' : 'Save & Continue'}
                    </button>
                  </div>
                  
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Preferences Modal */}
       <AnimatePresence>
         {preferencesModalOpen && (
           <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm'>
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className='bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]'
             >
                <div className='p-6 border-b border-slate-100'>
                  <h3 className='text-lg font-bold text-slate-900'>Service Preferences</h3>
                  <p className='text-[10px] text-slate-500 uppercase tracking-wider font-medium'>Tailor what kind of leads you receive</p>
                </div>
                
                <div className='p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar'>
                  <div>
                    <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 pl-1'>Minimum Deal Size Engagement</label>
                    <div className='flex flex-wrap gap-2'>
                      {dealSizeOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setPreferences({...preferences, preferredDealSize: opt.value})}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            preferences.preferredDealSize === opt.value
                               ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                               : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 pl-1'>Services You Offer</label>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {serviceTypeOptions.map(type => (
                        <label key={type.key} className='flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group'>
                          <input
                            type='checkbox'
                            checked={preferences.serviceTypes[type.key] || false}
                            onChange={() => {
                              setPreferences({
                                ...preferences,
                                serviceTypes: {
                                  ...preferences.serviceTypes,
                                  [type.key]: !preferences.serviceTypes[type.key]
                                }
                              })
                            }}
                            className='w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer'
                          />
                          <span className='text-xs font-semibold text-slate-700 group-hover:text-slate-900'>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='p-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100'>
                   <button onClick={() => setPreferencesModalOpen(false)} className='px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors'>Cancel</button>
                   <button onClick={handleSavePreferences} className='bg-slate-900 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95'>Save Preferences</button>
                </div>
             </motion.div>
           </div>
          )}
       </AnimatePresence>



      {/* Preview Modal */}
      <AnimatePresence>
        {previewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden'
            >
               {/* Close button */}
               <button
                  onClick={() => setPreviewModalOpen(false)}
                  className='absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors'
               >
                  <X size={20} />
               </button>

               <div className="mb-6 text-center">
                 <h2 className='text-xl font-bold text-gray-900'>Profile Preview</h2>
                 <p className='text-sm text-gray-500'>This is how your card appears to others on the dashboard</p>
               </div>

                <UserPreviewCard 
                 userData={{
                   name: profileData.name,
                   title: profileData.role,
                   location: profileData.organization || 'Remote',
                   experience: parseInt(profileData.experience) || 0,
                   specialty: 'Advisor',
                   connections: 0,
                   banner: profileData.banner 
                     ? { backgroundImage: `url(${getImageUrl(profileData.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
                     : currentTheme.style,
                   profileImg: profileData.photo 
                     ? getImageUrl(profileData.photo)
                     : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=random`,
                   matchPercentage: 95
                 }}
               />

               <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreviewModalOpen(false)}
                className='w-full mt-8 py-3 bg-[#163146] text-white font-bold rounded-xl hover:bg-[#0f2332] transition-all shadow-lg shadow-[#163146]/20'
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {themeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4 backdrop-blur-sm'
            onClick={() => setThemeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-xl font-bold text-slate-900'>Choose Your Theme</h2>
                  <p className='text-xs text-slate-500 mt-1'>Personalize your profile aesthetics</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setThemeModalOpen(false)}
                  className='p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors'
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className='grid grid-cols-4 gap-4 mb-8'>
                {themes.map((theme) => (
                  <div key={theme.id} className='relative group'>
                    <motion.button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full aspect-square rounded-2xl transition-all relative overflow-hidden flex items-center justify-center shadow-sm ${
                        selectedThemeId === theme.id 
                          ? 'ring-4 ring-[#986a41] ring-offset-2' 
                          : 'ring-1 ring-slate-100 hover:ring-slate-300'
                      }`}
                    >
                      <div
                        className='absolute inset-0 w-full h-full'
                        style={{ background: theme.style.background || theme.primary }}
                      />
                      {selectedThemeId === theme.id && (
                        <div className='relative z-10 bg-white p-1 rounded-full shadow-lg'>
                          <Check size={14} className='text-[#986a41]' />
                        </div>
                      )}
                    </motion.button>
                    <p className='text-[10px] text-center mt-2 font-medium text-slate-500 line-clamp-1'>
                      {theme.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className='bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4'>
                <div 
                  className='w-12 h-12 rounded-xl shadow-lg shrink-0'
                  style={{ background: currentTheme.style.background || currentTheme.primary }}
                />
                <div className='flex-1'>
                  <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Current Selection</p>
                  <h4 className='text-sm font-bold text-slate-900'>{currentTheme.label}</h4>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setThemeModalOpen(false)}
                  className='px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors'
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

const ContactItem = ({ icon: Icon, label, value }) => (
  <div className='flex flex-col items-center p-3 bg-slate-50 rounded-xl'>
    <Icon size={16} className='text-slate-400 mb-1.5' />
    <p className='text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1'>
      {label}
    </p>
    <p className='text-xs text-slate-900 font-medium text-center w-full break-all'>
      {value}
    </p>
  </div>
)



export default AdvisorProfilePage
