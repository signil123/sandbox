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
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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
      const nextUser = responseData.user || null

      setSubscription(nextSubscription)
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
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 bg-gradient-to-br from-[#163146] to-[#0f1f27] text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#986a41]">Current Status</h3>
                {currentSubscriptionTier === TIERS.PRO && <ProBadge size="md" />}
              </div>
              <h2 className="text-4xl font-black mb-1">
                {subscription?.plan?.name || TIER_DETAILS[currentSubscriptionTier]?.name || 'Free'} Plan
              </h2>
              <p className="text-gray-400 text-sm">
                {subscription?.cancelAtPeriodEnd ? 'Downgrade takes effect:' : 'Next billing date:'}{' '}
                <span className="text-white font-medium">
                  {formatDate(subscription?.currentPeriodEnd)}
                </span>
              </p>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-amber-200 text-xs font-semibold mt-2 uppercase tracking-[0.15em]">
                  Scheduled downgrade at period end
                </p>
              )}
            </div>
            <Button
              onClick={() => handleTabChange('plans')}
              className="bg-[#986a41] hover:bg-[#855c38] text-white font-bold rounded-2xl px-8 py-6 text-lg shadow-xl shadow-[#986a41]/20 transition-all border-none"
            >
              Manage Subscription
            </Button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verification</p>
              <p className={`text-sm font-bold ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isVerified ? 'Verified Account' : 'Pending Verification'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Zap size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan Limit</p>
              <p className="text-sm font-bold text-gray-900">
                {currentSubscriptionTier === TIERS.PRO
                  ? 'Unlimited'
                  : currentSubscriptionTier === TIERS.GROWTH
                    ? `${usage.connectionRequestsSent || 0}/15 sent • ${usage.connectionsAccepted || 0}/5 accepted`
                    : 'Upgrade Required'}
              </p>
              {currentSubscriptionTier === TIERS.GROWTH && usageMonthKey && (
                <p className="text-[10px] text-gray-500 mt-1">UTC month: {usageMonthKey}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Globe size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibility</p>
              <p className="text-sm font-bold text-gray-900">
                {currentSubscriptionTier === TIERS.FREE ? 'Limited' : 'Full Exposure'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">Payment Methods</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1">First added card becomes default automatically.</p>
          </div>
          <Button
            onClick={handleAddCard}
            className="rounded-2xl bg-[#163146] hover:bg-[#1f4461] text-white font-bold"
          >
            Add Card
          </Button>
        </div>

        {subscriptionError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            {subscriptionError}
          </div>
        )}

        {isLoadingCards ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/60 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded-full bg-gray-200" />
                    <div className="h-3 w-24 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-4 w-16 rounded-full bg-gray-200" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="h-9 w-28 rounded-xl bg-gray-200" />
                  <div className="h-9 w-24 rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            No cards yet. Add a card to manage subscriptions faster.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const isDefault = method.id === defaultPaymentMethodId
              const brand = method.card?.brand || 'card'
              const last4 = method.card?.last4 || '----'
              const exp = method.card ? `${method.card.exp_month}/${method.card.exp_year}` : ''

              return (
                <div key={method.id} className="rounded-2xl border border-gray-100 p-5 bg-gray-50/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#163146] capitalize">{brand} •••• {last4}</p>
                      <p className="text-xs text-gray-500 mt-1">Expires {exp}</p>
                    </div>
                    {isDefault && (
                      <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Default</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isDefault && (
                      <Button
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => handleSetDefaultCard(method.id)}
                      >
                        Make Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-rose-600 border-rose-200 hover:text-rose-700"
                      onClick={() => handleRemoveCard(method.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
      <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={handleManageSubscription}
          variant="outline"
          className="rounded-2xl px-5 py-3 font-bold"
        >
          Refresh Status
        </Button>
      </div>

      <div className="bg-transparent">
        {isPlansUiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="relative flex flex-col p-6 rounded-[28px] bg-white shadow-sm border border-slate-100 animate-pulse">
                <div className="mb-4 space-y-2">
                  <div className="h-4 w-16 rounded-full bg-gray-200" />
                  <div className="h-5 w-32 rounded-full bg-gray-200" />
                  <div className="h-6 w-24 rounded-full bg-gray-200" />
                </div>
                <div className="flex-1 space-y-2 mb-6">
                  {Array.from({ length: 5 }).map((__, lineIdx) => (
                    <div key={lineIdx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                      <div className="h-3 flex-1 rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
                <div className="h-10 rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {visiblePlans.map((plan) => {
              const tier = plan.tier || 'free'
              const isCurrent = currentSubscriptionTier === tier
              const isPro = tier === 'pro'
              const currentRank = { free: 0, growth: 1, pro: 2 }[currentSubscriptionTier] ?? 0
              const targetRank = { free: 0, growth: 1, pro: 2 }[tier] ?? 0
              const isUpgrade = targetRank > currentRank
              const isDowngrade = targetRank < currentRank
              const canPurchase = tier === 'free'
                ? true
                : isUpgrade
                  ? (isVerified && paymentMethods.length > 0)
                  : true
              const actionButtonClass = isDowngrade
                ? 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-[#163146] hover:bg-[#1f4461] text-white shadow-md'

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col p-6 rounded-[28px] transition-all duration-300 bg-white
                    ${isPro
                      ? 'shadow-[0_18px_40px_-18px_rgba(152,106,65,0.35)] border border-[#986a41]/30'
                      : 'shadow-sm border border-slate-100'
                    }`}
                >
                  {isPro && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#986a41] to-[#855c38] text-[8px] md:text-[9px] text-white font-black px-3.5 py-1 rounded-full uppercase tracking-[0.1em] flex items-center gap-1 z-20 shadow-md">
                      <Zap size={8} fill="currentColor" /> Most Popular
                    </div>
                  )}

                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest mb-2
                      ${isPro ? 'bg-[#986a41]/10 text-[#986a41]' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {tier}
                    </div>
                    <h3 className={`text-base md:text-lg font-black tracking-tight mb-1 ${isPro ? 'text-[#986a41]' : 'text-[#163146]'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-black text-[#163146]">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: (plan.currency || 'usd').toUpperCase(),
                          maximumFractionDigits: plan.amount % 1 === 0 ? 0 : 2,
                        }).format(plan.amount || 0)}
                        /mo
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 mb-6">
                    {(plan.features || []).slice(0, 7).map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[11px] md:text-[12px] text-[#2c3e50] leading-tight">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                          ${isPro ? 'bg-[#986a41]/15 text-[#986a41]' : 'bg-gray-100 text-gray-400'}`}
                        >
                          <CheckCircle2 size={10} strokeWidth={3} />
                        </div>
                        <span className="font-semibold">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-50 rounded-lg text-slate-400 font-black text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Current
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!canPurchase && (
                        <div className="flex items-center justify-center gap-1 py-1 px-2 bg-amber-50/50 rounded-lg border border-amber-200/50">
                          <ShieldCheck size={10} className="text-amber-600" />
                          <span className="text-[8px] font-bold text-amber-700 uppercase">
                            {isVerified ? 'Add Card First' : 'Verification Required'}
                          </span>
                        </div>
                      )}
                      {!canPurchase && !isVerified && (
                        <Button
                          variant="outline"
                          className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider"
                          onClick={() => setIsDocumentManagerOpen(true)}
                        >
                          Complete Verification
                        </Button>
                      )}
                      {!canPurchase && isVerified && paymentMethods.length === 0 && (
                        <Button
                          variant="outline"
                          className="w-full rounded-lg font-bold text-[10px] uppercase tracking-wider"
                          onClick={() => setIsAddCardModalOpen(true)}
                        >
                          Add Card
                        </Button>
                      )}
                      <Button
                        className={`w-full h-10 md:h-11 rounded-lg font-black text-[10px] md:text-[11px] tracking-widest uppercase transition-all duration-300
                          ${actionButtonClass} ${!canPurchase && 'grayscale opacity-60'}`}
                        disabled={!canPurchase || checkoutPlanId === plan._id}
                        onClick={() => handleCheckout(plan)}
                      >
                        {checkoutPlanId === plan._id
                          ? 'Processing...'
                          : isDowngrade
                            ? 'Schedule Downgrade'
                            : isUpgrade
                              ? 'Upgrade Now'
                              : 'Get Started'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl md:rounded-2xl border px-4 md:px-5 py-3.5 md:py-4 ${
        tone === 'amber' ? 'border-amber-100 bg-amber-50/70' : 'border-gray-100 bg-gray-50'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span
              className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${
                tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-700'
              }`}
            >
              <Icon size={12} />
            </span>
          )}
          <p
            className={`text-xs md:text-sm font-semibold leading-tight ${
              tone === 'amber' ? 'text-amber-900' : 'text-gray-900'
            }`}
          >
            {title}
          </p>
        </div>
        <p className={`text-[11px] md:text-xs leading-tight mt-1 ${tone === 'amber' ? 'text-amber-700' : 'text-gray-500'}`}>
          {description}
        </p>
        {isUpdating && (
          <p className={`text-xs leading-tight mt-1 ${tone === 'amber' ? 'text-amber-700/80' : 'text-gray-400'}`}>
            Updating...
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8">
        <div className="flex items-start gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Notifications & Security</h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage message alerts and account visibility in one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">In App</p>
            <p className="mt-1 text-xs md:text-sm font-bold text-gray-900">
              {inAppNotificationsEnabled ? 'Enabled' : 'Muted'}
            </p>
          </div>
          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Browser Push</p>
            <p className="mt-1 text-xs md:text-sm font-bold text-gray-900">
              {!notificationsSupported
                ? 'Unavailable'
                : notificationsEnabled && notificationPermission === 'granted'
                  ? 'Enabled'
                  : 'Disabled'}
            </p>
          </div>
          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Permission</p>
            <p className="mt-1 text-xs md:text-sm font-bold text-gray-900 capitalize">
              {!notificationsSupported ? 'Not supported' : notificationPermission}
            </p>
          </div>
          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Last Seen</p>
            <p className="mt-1 text-xs md:text-sm font-bold text-gray-900">
              {showLastSeen ? 'Visible' : 'Hidden'}
            </p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <h4 className="text-[11px] md:text-xs uppercase tracking-widest text-gray-400 font-bold">Notifications</h4>
          <SettingSwitchRow
            title="Notification panel"
            description="Show updates in the bell drawer and notification badges."
            checked={inAppNotificationsEnabled}
            onClick={togglePanelNotifications}
            disabled={isUpdatingPanelNotifications}
            isUpdating={isUpdatingPanelNotifications}
            ariaLabel="Toggle notification panel"
            icon={Bell}
          />

          {!notificationsSupported ? (
            <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs md:text-sm text-gray-500">
              Message/browser push notifications are not supported on this device.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <SettingSwitchRow
                title="Message notifications"
                description="Receive browser push alerts for new messages, even outside chat."
                checked={notificationsEnabled && notificationPermission === 'granted'}
                onClick={toggleMessageNotifications}
                disabled={notificationPermission === 'denied' || isUpdatingMessageNotifications}
                isUpdating={isUpdatingMessageNotifications}
                tone="amber"
                ariaLabel="Toggle message notifications"
                icon={Zap}
              />

              {notificationPermission === 'denied' && (
                <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-[11px] md:text-xs text-gray-500">
                  Notifications are blocked in your browser settings. Allow them there to enable alerts.
                </div>
              )}
            </div>
          )}
          <h4 className="text-[11px] md:text-xs uppercase tracking-widest text-gray-400 font-bold pt-1">Security</h4>
          <SettingSwitchRow
            title="Last seen"
            description="Let other users see when you were last active."
            checked={showLastSeen}
            onClick={toggleLastSeen}
            disabled={isUpdatingLastSeen}
            isUpdating={isUpdatingLastSeen}
            ariaLabel="Toggle last seen visibility"
            icon={User}
          />

          <h4 className="text-[11px] md:text-xs uppercase tracking-widest text-gray-400 font-bold pt-1">Account</h4>
          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 p-4 md:p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={accountFormData.name}
                onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
              />
              <input
                type="email"
                placeholder="Email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={accountFormData.phone}
                onChange={(e) => setAccountFormData({ ...accountFormData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveAccount}
                disabled={isSavingAccount}
                className="rounded-lg bg-[#163146] hover:bg-[#1f4461] text-white text-xs font-bold"
              >
                {isSavingAccount ? 'Saving...' : 'Save Account'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl md:rounded-2xl border border-gray-100 bg-gray-50 p-4 md:p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-900">Change Password</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwordFormData.currentPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
                autoComplete="current-password"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition"
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                variant="outline"
                className="rounded-lg text-xs font-bold"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-8xl mx-auto px-4 md:px-8 py-6 space-y-6">

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
