import { Button } from '@/components/ui/button'
import { AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Globe,
  ShieldCheck,
  User,
  Zap,
  Lock,
  Mail,
  Phone,
  Shield,
  Key,
  Smartphone,
  Info
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ProBadge from '../../components/Common/ProBadge'
import DocumentManager from '../../components/Profile/DocumentManager'
import UpgradeModal from '../../components/Subscription/UpgradeModal'
import AddCardModal from '../../components/Subscription/AddCardModal'
import { TIERS, TIER_DETAILS, VERIFICATION_STATUS } from '../../constants/tiers'
import {
  selectCanAccessSubscriptionUi,
  selectCurrentUser,
  selectUserTier,
  selectVerificationStatus,
  setUser,
} from '../../redux/userSlice'
import axiosInstance from '../../config'
import { profileService } from '../../services/profileService'
import { subscriptionService } from '../../services/subscriptionService'
import { pushService } from '../../services/pushService'
import { authService } from '../../services/authService'
import DashboardLayout from '../Layout/DashboardLayout'

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'
  const numericValue = Number(dateValue)
  const shouldTreatAsUnixSeconds =
    Number.isFinite(numericValue) &&
    numericValue > 0 &&
    numericValue < 1e12

  const date = new Date(shouldTreatAsUnixSeconds ? numericValue * 1000 : dateValue)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const resolveSubscriptionPeriodEnd = (subscriptionValue) => {
  if (!subscriptionValue) return null
  return (
    subscriptionValue.currentPeriodEnd ||
    subscriptionValue.current_period_end ||
    subscriptionValue.periodEnd ||
    null
  )
}

const SettingsPage = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useSelector(selectCurrentUser)
  const currentTier = useSelector(selectUserTier)
  const verificationStatus = useSelector(selectVerificationStatus)
  const canAccessSubscriptionUi = useSelector(selectCanAccessSubscriptionUi)

  const [activeTab, setActiveTab] = useState('subscription')
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)

  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState({ connectionRequestsSent: 0, connectionsAccepted: 0 })
  const [usageMonthKey, setUsageMonthKey] = useState('')
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState(null)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(null)
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [notificationsSupported, setNotificationsSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true)
  const [showLastSeen, setShowLastSeen] = useState(true)
  const [isUpdatingPanelNotifications, setIsUpdatingPanelNotifications] = useState(false)
  const [isUpdatingMessageNotifications, setIsUpdatingMessageNotifications] = useState(false)
  const [isUpdatingLastSeen, setIsUpdatingLastSeen] = useState(false)
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const currentUserRef = useRef(currentUser)
  const refreshInFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const isVerified = verificationStatus === VERIFICATION_STATUS.APPROVED
  const isSubscriptionEligible = canAccessSubscriptionUi

  const tabs = [
    ...(isSubscriptionEligible ? [{ id: 'subscription', label: 'Subscription', icon: CreditCard }] : []),
    ...(isSubscriptionEligible ? [{ id: 'plans', label: 'Plans', icon: ShieldCheck }] : []),
    { id: 'notifications', label: 'Notifications & Security', icon: Bell },
  ]
  const validTabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs])

  const currentSubscriptionTier = subscription?.plan?.tier || currentTier

  const visiblePlans = useMemo(() => {
    if (plans.length) return plans

    return Object.entries(TIER_DETAILS).map(([tierKey, details]) => ({
      _id: tierKey,
      name: details.name,
      description: details.description,
      tier: tierKey,
      amount: tierKey === 'free' ? 0 : tierKey === 'growth' ? 49 : 99,
      currency: 'usd',
      interval: 'month',
      features: details.features,
      active: true,
    }))
  }, [plans])

  useEffect(() => {
    const isSupported = pushService.isSupported()
    setNotificationsSupported(isSupported)
    if (!isSupported) return

    const permission = pushService.getPermission()
    const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
    setNotificationPermission(permission)
    setNotificationsEnabled(enabled)
  }, [])

  useEffect(() => {
    setInAppNotificationsEnabled(pushService.getPanelNotificationsEnabled())
  }, [])

  useEffect(() => {
    const enabled = currentUser?.settings?.showLastSeen
    setShowLastSeen(enabled === undefined ? true : Boolean(enabled))
  }, [currentUser?.settings?.showLastSeen])

  useEffect(() => {
    setAccountFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
    })
  }, [currentUser?.name, currentUser?.email, currentUser?.phone])

  const persistNotificationsEnabled = (enabled) => {
    pushService.setMessageNotificationsEnabled(enabled)
    setNotificationsEnabled(enabled)
  }

  const persistInAppNotificationsEnabled = (enabled) => {
    pushService.setPanelNotificationsEnabled(enabled)
    setInAppNotificationsEnabled(enabled)
  }

  const requestNotificationPermission = async () => {
    if (!notificationsSupported) return

    const result = await pushService.subscribe()
    const permission = pushService.getPermission()
    const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
    setNotificationPermission(permission)
    setNotificationsEnabled(enabled)

    if (!result.ok) {
      persistNotificationsEnabled(false)
      if (result.reason === 'denied') {
        toast.error('Message notifications are blocked in your browser settings.')
        return
      }
      toast.error('Could not enable message notifications.')
      return
    }

    toast.success('Message notifications turned on.')
  }

  const togglePanelNotifications = () => {
    if (isUpdatingPanelNotifications) return
    setIsUpdatingPanelNotifications(true)
    try {
      const next = !inAppNotificationsEnabled
      persistInAppNotificationsEnabled(next)
      toast.success(next ? 'Notification panel turned on.' : 'Notification panel turned off.')
    } finally {
      setIsUpdatingPanelNotifications(false)
    }
  }

  const toggleMessageNotifications = async () => {
    if (isUpdatingMessageNotifications) return
    if (!notificationsSupported) return

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

  const toggleLastSeen = async () => {
    if (isUpdatingLastSeen) return
    setIsUpdatingLastSeen(true)
    const next = !showLastSeen

    try {
      const response = await profileService.updateSettings({ showLastSeen: next })
      setShowLastSeen(next)

      const updatedUser = response?.data?.user
      if (updatedUser && currentUser) {
        dispatch(
          setUser({
            ...currentUser,
            ...updatedUser,
            settings: {
              ...(currentUser.settings || {}),
              ...(updatedUser.settings || {}),
            },
          })
        )
      } else if (currentUser) {
        dispatch(
          setUser({
            ...currentUser,
            settings: {
              ...(currentUser.settings || {}),
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

  const handleSaveAccount = async () => {
    if (isSavingAccount) return
    setIsSavingAccount(true)
    try {
      const response = await authService.updateAccount({
        name: accountFormData.name,
        email: accountFormData.email,
        phone: accountFormData.phone,
      })
      const updatedUser = response?.data?.user
      if (updatedUser) {
        dispatch(setUser(updatedUser))
      }
      toast.success('Account details updated.')
    } catch (error) {
      toast.error(error || 'Failed to update account details.')
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleChangePassword = async () => {
    if (isChangingPassword) return
    const { currentPassword, newPassword, confirmPassword } = passwordFormData
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill current, new, and confirm password.')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await authService.changePassword(currentPassword, newPassword, confirmPassword)
      const updatedUser = response?.data?.user
      if (updatedUser) {
        dispatch(setUser(updatedUser))
      }
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Password updated successfully.')
    } catch (error) {
      toast.error(error || 'Failed to change password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
    if (!notificationsSupported) return

    const refreshSettings = () => {
      const permission = pushService.getPermission()
      const enabled = pushService.getMessageNotificationsEnabled() && permission === 'granted'
      setNotificationPermission(permission)
      setNotificationsEnabled(enabled)
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
    const refreshSettings = () => {
      setInAppNotificationsEnabled(pushService.getPanelNotificationsEnabled())
    }

    const handleStorage = (event) => {
      if (
        event.key === pushService.keys.PANEL_STORAGE_KEY ||
        event.key === pushService.keys.LEGACY_PANEL_STORAGE_KEY
      ) {
        refreshSettings()
      }
    }

    window.addEventListener(pushService.events.PANEL_EVENT_NAME, refreshSettings)
    window.addEventListener('in-app-notifications-updated', refreshSettings)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(pushService.events.PANEL_EVENT_NAME, refreshSettings)
      window.removeEventListener('in-app-notifications-updated', refreshSettings)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!validTabIds.length) return

    const tabParam = searchParams.get('tab')
    const fallbackTab = validTabIds[0]
    const resolvedTab = tabParam && validTabIds.includes(tabParam) ? tabParam : fallbackTab

    if (activeTab !== resolvedTab) {
      setActiveTab(resolvedTab)
    }

    if (tabParam !== resolvedTab) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', resolvedTab)
      setSearchParams(nextParams, { replace: true })
    }
  }, [activeTab, searchParams, setSearchParams, validTabIds])

  const handleTabChange = (tabId) => {
    if (!validTabIds.includes(tabId)) return
    setActiveTab(tabId)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tabId)
    setSearchParams(nextParams, { replace: true })
  }

  const refreshSubscription = useCallback(async () => {
    if (!isSubscriptionEligible) return
    if (refreshInFlightRef.current) return

    refreshInFlightRef.current = true

    setIsLoadingPlans(true)
    setSubscriptionError('')

    try {
      const plansResponse = await axiosInstance.get('/subscriptions/plans')
      const nextPlans = plansResponse?.data?.data?.plans || plansResponse?.data?.plans || []
      setPlans(nextPlans)
    } catch (error) {
      setSubscriptionError(error?.response?.data?.message || error?.message || 'Failed to load plans')
    }

    try {
      const subscriptionResponse = await axiosInstance.get('/subscriptions/me')
      const responseData = subscriptionResponse?.data?.data || subscriptionResponse?.data || {}
      const nextSubscription = responseData.subscription || null
      const normalizedSubscription = nextSubscription
        ? {
            ...nextSubscription,
            currentPeriodEnd: resolveSubscriptionPeriodEnd(nextSubscription),
          }
        : null
      const nextUser = responseData.user || null

      setSubscription(normalizedSubscription)
      setUsage(responseData.usage || { connectionRequestsSent: 0, connectionsAccepted: 0 })
      setUsageMonthKey(responseData.monthKey || '')

      const localUser = currentUserRef.current
      if (localUser && nextUser) {
        const nextTier = nextUser.tier || localUser.tier
        const nextVerification = nextUser.verificationStatus || localUser.verificationStatus
        if (nextTier !== localUser.tier || nextVerification !== localUser.verificationStatus) {
          dispatch(
            setUser({
              ...localUser,
              tier: nextTier,
              verificationStatus: nextVerification,
            })
          )
        }
      }
    } catch (error) {
      setSubscriptionError(error?.response?.data?.message || error?.message || 'Failed to load subscription data')
    } finally {
      setIsLoadingPlans(false)
      refreshInFlightRef.current = false
    }
  }, [dispatch, isSubscriptionEligible])

  const handleCheckout = async (plan) => {
    try {
      const requiresCard = plan?.tier && plan.tier !== 'free'
      const hasCardOnFile = paymentMethods.length > 0

      if (requiresCard && !hasCardOnFile) {
        setSubscriptionError('Add a card before purchasing a paid plan.')
        setIsAddCardModalOpen(true)
        return
      }

      if (requiresCard && !isVerified) {
        setSubscriptionError('Identity verification is required before purchasing paid plans.')
        setIsDocumentManagerOpen(true)
        return
      }

      setCheckoutPlanId(plan._id)
      setSubscriptionError('')

      const response = await axiosInstance.post('/subscriptions/checkout-session', { planId: plan._id })
      const checkoutUrl = response?.data?.data?.checkoutUrl

      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }

      await refreshSubscription()
      setIsUpgradeModalOpen(false)
    } catch (error) {
      const apiCode = error?.response?.data?.code
      const message = error?.response?.data?.message || error?.message || 'Failed to start checkout'
      setSubscriptionError(message)
      if (apiCode === 'UPGRADE_REQUIRED' || message.toLowerCase().includes('verification')) {
        setIsDocumentManagerOpen(true)
      }
    } finally {
      setCheckoutPlanId(null)
    }
  }

  const handleManageSubscription = async () => {
    if (subscription?.stripeSubscriptionId) {
      try {
        const response = await subscriptionService.createBillingPortalSession()
        const portalUrl = response?.data?.url
        if (portalUrl) {
          window.location.href = portalUrl
          return
        }
      } catch (error) {
        setSubscriptionError(error || 'Failed to open billing portal')
      }
    }

    await refreshSubscription()
    setIsUpgradeModalOpen(true)
  }

  const refreshPaymentMethods = useCallback(async () => {
    if (!isSubscriptionEligible) return

    try {
      setIsLoadingCards(true)
      const response = await subscriptionService.getPaymentMethods()
      const data = response?.data || {}
      setPaymentMethods(data.paymentMethods || [])
      setDefaultPaymentMethodId(data.defaultPaymentMethodId || null)
    } catch (error) {
      setSubscriptionError(error || 'Failed to load payment methods')
    } finally {
      setIsLoadingCards(false)
    }
  }, [isSubscriptionEligible])

  const handleAddCard = () => {
    setSubscriptionError('')
    setIsAddCardModalOpen(true)
  }

  const handleSetDefaultCard = async (paymentMethodId) => {
    try {
      await subscriptionService.setDefaultPaymentMethod(paymentMethodId)
      setDefaultPaymentMethodId(paymentMethodId)
    } catch (error) {
      setSubscriptionError(error || 'Failed to set default card')
    }
  }

  const handleRemoveCard = async (paymentMethodId) => {
    try {
      await subscriptionService.removePaymentMethod(paymentMethodId)
      await refreshPaymentMethods()
    } catch (error) {
      setSubscriptionError(error || 'Failed to remove card')
    }
  }

  useEffect(() => {
    if (!isSubscriptionEligible) return
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    const syncCheckoutIfNeeded = async () => {
      const params = new URLSearchParams(window.location.search)
      const checkout = params.get('checkout')
      const sessionId = params.get('session_id')
      const setup = params.get('setup')

      if (checkout === 'success' && sessionId) {
        try {
          await subscriptionService.syncCheckoutSession(sessionId)
        } catch (error) {
          setSubscriptionError(error || 'Checkout completed but sync failed, please refresh')
        }

        params.delete('checkout')
        params.delete('session_id')
        const nextQuery = params.toString()
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
        window.history.replaceState({}, '', nextUrl)
      }

      await refreshSubscription()
      await refreshPaymentMethods()

      if (setup === 'success') {
        params.delete('setup')
        const nextQuery = params.toString()
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
        window.history.replaceState({}, '', nextUrl)
      }
    }

    syncCheckoutIfNeeded()
  }, [isSubscriptionEligible, refreshPaymentMethods, refreshSubscription])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const renderSubscriptionTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-[#163146] to-[#0f1f27] rounded-[32px] border border-[#163146] shadow-2xl shadow-blue-900/10 overflow-hidden">
        <div className="p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#926435]/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#926435]/5 rounded-full blur-3xl -ml-32 -mb-32" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#926435]/10 text-[#926435] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#926435]/20">
                  Current Status
                </span>
                {currentSubscriptionTier === TIERS.PRO && <ProBadge size="md" />}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {subscription?.plan?.name || TIER_DETAILS[currentSubscriptionTier]?.name || 'Free'} Plan
                </h2>
                <div className="flex items-center gap-2 text-blue-100/60">
                  <Bell size={14} className="shrink-0" />
                  <p className="text-sm font-medium">
                    {subscription?.cancelAtPeriodEnd ? 'Downgrade takes effect:' : 'Next billing cycle:'}{' '}
                    <span className="text-white font-bold">{formatDate(subscription?.currentPeriodEnd)}</span>
                  </p>
                </div>
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#926435]/10 rounded-xl border border-[#926435]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#926435] animate-pulse" />
                  <span className="text-[#926435] text-[10px] font-black uppercase tracking-widest">Scheduled Downgrade</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => handleTabChange('plans')}
              className="group relative h-16 px-10 bg-[#926435] hover:bg-[#7e5c3e] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#926435]/20 transition-all border-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-2">
                Manage Subscription <Zap size={14} fill="currentColor" />
              </span>
            </Button>
          </div>
        </div>

        <div className="p-8 bg-black/20 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: ShieldCheck, 
              label: 'Identity Verification', 
              value: isVerified ? 'Verified' : 'Pending', 
              color: isVerified ? 'text-emerald-400' : 'text-[#926435]',
              bg: isVerified ? 'bg-emerald-400/10' : 'bg-[#926435]/10'
            },
            { 
              icon: Zap, 
              label: 'Connectivity Usage', 
              value: currentSubscriptionTier === TIERS.PRO
                ? 'Unlimited'
                : `${usage.connectionRequestsSent || 0}/15 Sent`,
              sub: currentSubscriptionTier === TIERS.GROWTH ? `${usage.connectionsAccepted || 0}/5 Accepted` : null,
              color: 'text-blue-400',
              bg: 'bg-blue-400/10'
            },
            { 
              icon: Globe, 
              label: 'Global Exposure', 
              value: currentSubscriptionTier === TIERS.FREE ? 'Limited' : 'Full Access',
              color: 'text-purple-400',
              bg: 'bg-purple-400/10'
            }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-inner`}>
                <item.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.label}</p>
                <div className="flex flex-col">
                  <p className={`text-sm font-black ${item.color} tracking-tight`}>{item.value}</p>
                  {item.sub && <p className="text-[10px] font-bold text-white/40">{item.sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#926435]/10 text-[#926435] flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Payment Methods</h3>
            </div>
            <p className="text-slate-400 text-xs font-medium ml-11">First added card becomes default automatically.</p>
          </div>
          <Button
            onClick={handleAddCard}
            className="rounded-2xl bg-[#163146] hover:bg-[#1f4461] text-white px-8 py-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/10 transition-all border-none"
          >
            Add New Card
          </Button>
        </div>

        <div className="p-8">
          {subscriptionError && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600">
              <Shield size={18} className="shrink-0" />
              <p className="text-sm font-bold">{subscriptionError}</p>
            </div>
          )}

          {isLoadingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-44 rounded-[28px] bg-slate-50/50 border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-slate-100 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CreditCard size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">No cards yet. Add a card to manage subscriptions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => {
                const isDefault = method.id === defaultPaymentMethodId
                const brand = method.card?.brand || 'card'
                const last4 = method.card?.last4 || '----'
                const exp = method.card ? `${method.card.exp_month}/${method.card.exp_year}` : ''

                return (
                  <div 
                    key={method.id} 
                    className={`relative group rounded-[32px] p-6 transition-all duration-300 border
                      ${isDefault 
                        ? 'bg-[#163146] text-white border-[#163146] shadow-xl shadow-blue-900/20' 
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-800'}`}
                  >
                    <div className="flex flex-col h-full justify-between gap-8">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDefault ? 'text-blue-200/60' : 'text-slate-400'}`}>
                            {brand}
                          </p>
                          <p className="text-xl font-black tracking-widest whitespace-nowrap">
                            •••• •••• •••• {last4}
                          </p>
                        </div>
                        {isDefault && (
                          <div className="px-3 py-1 bg-amber-400/20 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
                            Default
                          </div>
                        )}
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="space-y-1">
                          <p className={`text-[8px] font-black uppercase tracking-widest ${isDefault ? 'text-blue-200/40' : 'text-slate-400'}`}>Expiry</p>
                          <p className="font-bold tracking-tight">{exp}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {!isDefault && (
                            <Button
                              variant="ghost"
                              className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border-none text-[#163146] hover:bg-white shadow-sm"
                              onClick={() => handleSetDefaultCard(method.id)}
                            >
                              Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-none transition-colors
                              ${isDefault 
                                ? 'bg-white/10 text-white hover:bg-red-600 hover:text-white'
                                : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                            onClick={() => handleRemoveCard(method.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Identity Verification</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Required to access Growth and Pro tiers</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsDocumentManagerOpen(true)}
            className="rounded-2xl border-gray-200 hover:bg-gray-50 font-bold text-xs md:text-sm px-4 md:px-6 py-2.5"
          >
            Open Document Center
          </Button>
        </div>

        <div className="relative">
          <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-100" />

          <div className="space-y-10">
            <Step
              number={1}
              title="Upload Documentation"
              desc="Submit your professional license or government ID for review."
              status={isVerified || verificationStatus !== VERIFICATION_STATUS.NOT_SUBMITTED ? 'completed' : 'pending'}
            />
            <Step
              number={2}
              title="Admin Review"
              desc="Our compliance team will verify your credentials within 24-48 hours."
              status={isVerified ? 'completed' : (verificationStatus === VERIFICATION_STATUS.PENDING ? 'current' : 'pending')}
            />
            <Step
              number={3}
              title="Unlock Tiers"
              desc="Once approved, you'll be eligible to purchase Growth or Pro plans."
              status={isVerified ? 'current' : 'locked'}
              isLast
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPlansTab = () => {
    const isPlansUiLoading = isLoadingPlans || isLoadingCards

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight ml-2">Available Plans</h3>
            <p className="text-xs text-slate-400 font-medium ml-2">Choose the perfect tier for your professional growth</p>
          </div>
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="rounded-2xl px-6 py-3 font-black uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-50 transition-all"
          >
            Refresh Status
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isPlansUiLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="relative flex flex-col p-8 rounded-[40px] bg-white shadow-sm border border-slate-100 animate-pulse">
                <div className="h-4 w-16 rounded-full bg-slate-100 mb-4" />
                <div className="h-8 w-40 rounded-full bg-slate-100 mb-6" />
                <div className="space-y-3 mb-8">
                  {Array.from({ length: 5 }).map((__, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-100" />
                      <div className="h-3 flex-1 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
                <div className="h-14 rounded-2xl bg-slate-100" />
              </div>
            ))
          ) : (
            visiblePlans.map((plan) => {
              const tier = plan.tier || 'free'
              const isCurrent = currentSubscriptionTier === tier
              const isPro = tier === 'pro'
              const isGrowth = tier === 'growth'
              const isPlanChange = currentSubscriptionTier !== 'free' && tier !== 'free'
              const actionButtonClass = isPro 
                ? 'bg-[#926435] hover:bg-[#7e5c3e] text-white shadow-xl shadow-[#926435]/20' 
                : isGrowth ? 'bg-[#163146] hover:bg-[#1f4461] text-white shadow-xl shadow-blue-900/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col p-8 rounded-[40px] transition-all duration-500 hover:scale-[1.02] bg-white
                    ${isPro ? 'shadow-2xl shadow-[#926435]/10 border-2 border-[#926435]/20' : 'shadow-sm border border-slate-100'}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#926435] to-[#7e5c3e] text-[10px] text-white font-black px-6 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap z-10">
                      Most Intensive
                    </div>
                  )}

                  <div className="mb-8">
                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4
                      ${isPro ? 'bg-[#926435]/10 text-[#926435]' : isGrowth ? 'bg-blue-400/10 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {tier}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: (plan.currency || 'usd').toUpperCase(),
                          maximumFractionDigits: plan.amount % 1 === 0 ? 0 : 2,
                        }).format(plan.amount || 0)}
                      </span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {(plan.features || []).map((feature, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-sm leading-snug">
                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                          ${isPro ? 'bg-amber-400/10 text-amber-600' : 'bg-emerald-400/10 text-emerald-600'}`}>
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-2 py-5 bg-slate-50 rounded-3xl text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Active Tier
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        className={`w-full h-16 rounded-3xl font-black text-[11px] tracking-widest uppercase transition-all duration-300 border-none
                          ${actionButtonClass} ${checkoutPlanId === plan._id ? 'opacity-50' : 'opacity-100'}`}
                        disabled={checkoutPlanId === plan._id}
                        onClick={() => handleCheckout(plan)}
                      >
                        {checkoutPlanId === plan._id 
                          ? 'Initializing...' 
                          : tier === 'free' 
                            ? 'Stay Free' 
                            : isPlanChange 
                              ? 'Change Plan' 
                              : 'Upgrade Now'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const Step = ({ number, title, desc, status }) => {
    const isCompleted = status === 'completed'
    const isCurrent = status === 'current'
    const isLocked = status === 'locked'

    return (
      <div className="flex gap-6 relative z-10">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-md transition-all ${
            isCompleted
              ? 'bg-emerald-500 text-white'
              : isCurrent
                ? 'bg-[#163146] text-white'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isCompleted ? <CheckCircle2 size={24} /> : <span className="text-lg font-black">{number}</span>}
        </div>
        <div>
          <h4 className={`text-lg font-bold mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{title}</h4>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">{desc}</p>
        </div>
      </div>
    )
  }

  const SettingSwitchRow = ({
    title,
    description,
    checked,
    onClick,
    disabled,
    isUpdating,
    tone = 'default',
    ariaLabel,
    icon: Icon,
  }) => (
    <div
      className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 ${
        tone === 'amber'
          ? 'border-[#926435]/20 bg-[#926435]/5 hover:bg-[#926435]/10'
          : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            tone === 'amber'
              ? 'bg-[#926435]/15 text-[#926435]'
              : checked
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          {Icon && <Icon size={18} />}
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-bold leading-tight ${
              tone === 'amber' ? 'text-[#926435]' : 'text-slate-900'
            }`}
          >
            {title}
          </p>
          <p className={`text-xs leading-tight mt-1 truncate ${tone === 'amber' ? 'text-[#926435]/70' : 'text-slate-500'}`}>
            {description}
          </p>
          {isUpdating && (
            <p className="text-[10px] font-bold text-blue-500 mt-1 animate-pulse uppercase tracking-wider">
              Updating...
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#163146] focus:ring-offset-2 ${
          checked ? 'bg-[#163146]' : 'bg-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Status Header */}
      <div className="bg-gradient-to-br from-[#163146] to-[#0f1f27] rounded-[32px] p-1 shadow-2xl shadow-blue-900/10">
        <div className="bg-white/5 backdrop-blur-xl rounded-[31px] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#926435] shadow-inner">
                <Shield size={28} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Security & Notifications</h3>
                <p className="text-blue-100/60 text-sm font-medium">Protect your account and stay updated</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Preferences */}
        <div className="space-y-8">
          {/* Notifications Section */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#926435]/10 text-[#926435] flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Communication</h4>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <SettingSwitchRow
                title="Notification Drawer"
                description="View all activity updates in your navigation panel."
                checked={inAppNotificationsEnabled}
                onClick={togglePanelNotifications}
                disabled={isUpdatingPanelNotifications}
                isUpdating={isUpdatingPanelNotifications}
                ariaLabel="Toggle notification panel"
                icon={Bell}
              />

              {!notificationsSupported ? (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400">
                  <Info size={16} className="mt-0.5" />
                  <p className="text-xs leading-relaxed">Browser push notifications are not supported on this device/browser.</p>
                </div>
              ) : (
                <>
                  <SettingSwitchRow
                    title="Real-time Alerts"
                    description="Get push notifications for new messages instantly."
                    checked={notificationsEnabled && notificationPermission === 'granted'}
                    onClick={toggleMessageNotifications}
                    disabled={notificationPermission === 'denied' || isUpdatingMessageNotifications}
                    isUpdating={isUpdatingMessageNotifications}
                    tone="amber"
                    ariaLabel="Toggle message notifications"
                    icon={Zap}
                  />

                  {notificationPermission === 'denied' && (
                    <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100 text-red-600">
                      <Shield size={14} className="shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">Blocked in browser settings</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Privacy & Presence</h4>
              </div>
            </div>
            
            <div className="p-6">
              <SettingSwitchRow
                title="Active Status"
                description="Allow others to see when you were last online."
                checked={showLastSeen}
                onClick={toggleLastSeen}
                disabled={isUpdatingLastSeen}
                isUpdating={isUpdatingLastSeen}
                ariaLabel="Toggle last seen visibility"
                icon={User}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Identity */}
        <div className="space-y-8">
          {/* Account Details */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Account Profile</h4>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={accountFormData.name}
                      onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={accountFormData.email}
                        onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                      />
                    </div>
                  </div>
                  <div className="relative group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Phone Number</label>
                    <div className="relative flex items-center">
                      <Phone size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                      <input
                        type="tel"
                        placeholder="+1 234 567 890"
                        value={accountFormData.phone}
                        onChange={(e) => setAccountFormData({ ...accountFormData, phone: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAccount}
                  disabled={isSavingAccount}
                  className="rounded-2xl bg-[#163146] hover:bg-[#1f4461] text-white px-8 py-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/10 transition-all border-none"
                >
                  {isSavingAccount ? 'Saving...' : 'Save Account'}
                </Button>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#926435]/10 text-[#926435] flex items-center justify-center">
                  <Key size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Security Credentials</h4>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Current Password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordFormData.currentPassword}
                      onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">New Password</label>
                    <div className="relative flex items-center">
                      <Key size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordFormData.newPassword}
                        onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="relative group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-4 text-slate-400 group-focus-within:text-[#163146] transition-colors" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordFormData.confirmPassword}
                        onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#163146]/5 focus:border-[#163146] transition-all"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  variant="outline"
                  className="rounded-2xl border-slate-100 hover:bg-slate-50 px-8 py-6 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="md:fixed md:left-[260px] md:right-4 md:top-4 md:bottom-4 md:overflow-y-auto max-w-8xl mx-auto px-4 md:px-5 py-6 md:py-4 space-y-6">

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm w-fit mx-auto overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-colors relative border-2 focus:outline-none focus-visible:ring-0 ${
                    isActive
                      ? 'bg-[#163146] text-white border-[#163146] shadow-xl shadow-blue-900/10'
                      : 'text-slate-400 bg-white border-transparent md:hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                          {tab.label}
                </button>
              )
            })}
          </div>

          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <div key={activeTab}>
                {activeTab === 'subscription' && renderSubscriptionTab()}
                {activeTab === 'plans' && renderPlansTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab !== 'subscription' && activeTab !== 'plans' && activeTab !== 'notifications' && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      {(() => {
                        const ActiveTabIcon = tabs.find((t) => t.id === activeTab)?.icon
                        return ActiveTabIcon ? <ActiveTabIcon size={40} /> : null
                      })()}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tabs.find((t) => t.id === activeTab)?.label}</h3>
                    <p className="text-gray-500">This section is currently being refined.</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <DocumentManager
        isOpen={isDocumentManagerOpen}
        onClose={() => setIsDocumentManagerOpen(false)}
        currentUser={currentUser}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plans={visiblePlans}
        onCheckout={handleCheckout}
        isLoadingPlans={isLoadingPlans}
        checkoutPlanId={checkoutPlanId}
        currentSubscriptionTier={currentSubscriptionTier}
        hasCardOnFile={paymentMethods.length > 0}
        allowSubscriptionUi={canAccessSubscriptionUi}
      />

      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onSuccess={async (paymentMethodId) => {
          if (paymentMethodId) {
            try {
              await subscriptionService.setDefaultPaymentMethod(paymentMethodId)
            } catch (error) {
              setSubscriptionError(error || 'Failed to set default card')
            }
          }
          await refreshPaymentMethods()
          setIsAddCardModalOpen(false)
        }}
        onError={(message) => setSubscriptionError(message)}
      />
    </DashboardLayout>
  )
}

export default SettingsPage
