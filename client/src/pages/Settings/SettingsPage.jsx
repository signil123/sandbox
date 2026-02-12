import { Button } from '@/components/ui/button'
import { AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Globe,
  Lock,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProBadge from '../../components/Common/ProBadge'
import DocumentManager from '../../components/Profile/DocumentManager'
import UpgradeModal from '../../components/Subscription/UpgradeModal'
import { TIERS, TIER_DETAILS, VERIFICATION_STATUS } from '../../constants/tiers'
import { selectCurrentUser, selectUserTier, selectVerificationStatus, setUser } from '../../redux/userSlice'
import axiosInstance from '../../config'
import { subscriptionService } from '../../services/subscriptionService'
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
  const currentUser = useSelector(selectCurrentUser)
  const currentTier = useSelector(selectUserTier)
  const verificationStatus = useSelector(selectVerificationStatus)

  const [activeTab, setActiveTab] = useState('subscription')
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState(null)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(null)
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const currentUserRef = useRef(currentUser)
  const refreshInFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const isVerified = verificationStatus === VERIFICATION_STATUS.APPROVED
  const isSubscriptionEligible = ['advisor', 'agent', 'athlete'].includes(currentUser?.userType)

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    ...(isSubscriptionEligible ? [{ id: 'subscription', label: 'Subscription', icon: CreditCard }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ]

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
      setCheckoutPlanId(plan._id)
      setSubscriptionError('')

      const response = await subscriptionService.createCheckoutSession(plan._id)
      const checkoutUrl = response?.data?.checkoutUrl

      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }

      await refreshSubscription()
      setIsUpgradeModalOpen(false)
    } catch (error) {
      setSubscriptionError(error || 'Failed to start checkout')
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

  const handleAddCard = async () => {
    try {
      const response = await subscriptionService.createSetupSession()
      const checkoutUrl = response?.data?.checkoutUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      setSubscriptionError(error || 'Failed to start card setup')
    }
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
    <div className="space-y-8">
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
                Next billing date:{' '}
                <span className="text-white font-medium">
                  {formatDate(subscription?.currentPeriodEnd)}
                </span>
              </p>
            </div>
            <Button
              onClick={handleManageSubscription}
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
                    ? '15 Requests / mo'
                    : 'Upgrade Required'}
              </p>
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
            <h3 className="text-2xl font-bold text-gray-900">Payment Methods</h3>
            <p className="text-gray-500 text-sm mt-1">First added card becomes default automatically.</p>
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
          <p className="text-sm text-gray-500">Loading payment methods...</p>
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
            <h3 className="text-2xl font-bold text-gray-900">Identity Verification</h3>
            <p className="text-gray-500 text-sm mt-1">Required to access Growth and Pro tiers</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsDocumentManagerOpen(true)}
            className="rounded-2xl border-gray-200 hover:bg-gray-50 font-bold"
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

  return (
    <DashboardLayout>
      <div className="max-w-8xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-[#163146] tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your identity and subscription preferences</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="lg:w-72 shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-sm ${
                      isActive
                        ? 'bg-[#163146] text-white shadow-xl shadow-[#163146]/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#986a41]' : ''} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <div
                key={activeTab}
              >
                {activeTab === 'subscription' && renderSubscriptionTab()}
                {activeTab !== 'subscription' && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      {tabs.find((t) => t.id === activeTab)?.icon({ size: 40 })}
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
      />
    </DashboardLayout>
  )
}

export default SettingsPage
