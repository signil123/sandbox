import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, CheckCircle2, ChevronRight, ShieldCheck, X, Zap } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { TIER_DETAILS, VERIFICATION_STATUS } from '../../constants/tiers'
import { selectUserTier, selectVerificationStatus } from '../../redux/userSlice'

const MobileBottomSheet = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />

        <div
          className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[40px] shadow-2xl max-h-[95vh] overflow-hidden"
        >
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <div className="overflow-y-auto max-h-[90vh] pb-safe">{children}</div>
        </div>
      </>
    </AnimatePresence>
  )
}

const formatPrice = (amount, currency = 'usd', interval = 'month') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount || 0)

  return `${formatted}/${interval === 'year' ? 'yr' : 'mo'}`
}

const TIER_ORDER = {
  free: 0,
  growth: 1,
  pro: 2,
}

const ModalContent = ({
  onClose,
  triggerAction,
  currentTier,
  isVerified,
  hasCardOnFile,
  plans,
  isLoading,
  checkoutPlanId,
  onCheckout,
}) => {
  const getActionMessage = () => {
    switch (triggerAction) {
      case 'connect':
        return 'Unlock connection requests to grow your roster'
      case 'message':
        return 'Unlimited messaging is just one upgrade away'
      case 'socials':
        return 'View athlete social media and build deeper connections'
      case 'explore':
        return 'See all 99+ athletes looking for advisors like you'
      case 'filters':
        return 'Use more precise athlete filters to find the perfect fit'
      case 'limit_reached':
        return 'You reached your Growth monthly limit. Upgrade to Pro for unlimited access'
      default:
        return 'Choose the plan that fits your professional needs'
    }
  }

  const fallbackPlans = useMemo(
    () =>
      Object.entries(TIER_DETAILS).map(([tier, details]) => ({
        _id: tier,
        tier,
        name: details.name,
        description: details.description,
        amount: tier === 'free' ? 0 : tier === 'growth' ? 49 : 99,
        currency: 'usd',
        interval: 'month',
        features: details.features,
      })),
    []
  )

  const displayPlans = plans?.length ? plans : fallbackPlans

  return (
    <>
      <div className="relative bg-gradient-to-br from-[#163146] via-[#1a3a54] to-[#0f1f27] text-white overflow-hidden px-5 py-6 md:px-10 md:py-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#986a41]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {!isVerified && (
            <div className="group flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">Identity Verification Required</span>
              <ChevronRight size={12} className="text-amber-500" />
            </div>
          )}

          <h2 className="text-lg md:text-3xl font-black mb-1.5 tracking-tight leading-tight">
            Manage <span className="bg-gradient-to-r from-[#986a41] to-[#c18c5d] bg-clip-text text-transparent">Subscription</span>
          </h2>
          <p className="text-gray-400 max-w-lg text-[10px] md:text-sm leading-relaxed font-semibold uppercase tracking-[0.15em] opacity-80">
            {getActionMessage()}
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 md:top-6 right-4 md:right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white backdrop-blur-sm z-50 border border-white/10"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-[#fcfcfd] px-4 md:px-8 py-6 md:py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 max-w-[1000px] mx-auto">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="relative flex flex-col p-5 md:p-6 rounded-[28px] border border-gray-100 bg-white animate-pulse">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 max-w-[1000px] mx-auto">
            {displayPlans.map((plan) => {
              const tier = plan.tier || 'free'
              const isCurrent = currentTier === tier
              const isPro = tier === 'pro'
              const currentRank = TIER_ORDER[currentTier] ?? 0
              const targetRank = TIER_ORDER[tier] ?? 0
              const isUpgrade = targetRank > currentRank
              const isDowngrade = targetRank < currentRank
              const canPurchase = tier === 'free'
                ? true
                : isUpgrade
                  ? (isVerified && hasCardOnFile)
                  : true
              const actionButtonClass = isDowngrade
                ? 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-[#163146] hover:bg-[#1f4461] text-white shadow-md'

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col p-5 md:p-6 rounded-[28px] border transition-all duration-300
                    ${isPro
                      ? 'bg-white border-[#986a41]/40 shadow-[0_15px_30px_-10px_rgba(152,106,65,0.12)] ring-1 ring-[#986a41]/10'
                      : 'bg-white border-gray-100 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.04)]'
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
                      <span className="text-2xl md:text-3xl font-black text-[#163146]">{formatPrice(plan.amount, plan.currency, plan.interval)}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 mb-6">
                    {(plan.features || []).slice(0, 7).map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[11px] md:text-[12px] text-[#2c3e50] leading-tight">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                          ${isPro ? 'bg-[#986a41]/15 text-[#986a41]' : 'bg-gray-100 text-gray-400'}`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="font-semibold">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-50 rounded-lg text-gray-400 font-black border border-gray-100 text-[10px] uppercase tracking-widest">
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
                      <Button
                        className={`w-full h-10 md:h-11 rounded-lg font-black text-[10px] md:text-[11px] tracking-widest uppercase transition-all duration-300
                          ${actionButtonClass} ${!canPurchase && 'grayscale opacity-60'}`}
                        disabled={!canPurchase || checkoutPlanId === plan._id}
                        onClick={() => onCheckout(plan)}
                      >
                        {checkoutPlanId === plan._id
                          ? 'Redirecting...'
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
    </>
  )
}

const UpgradeModal = ({
  isOpen,
  onClose,
  triggerAction = '',
  plans = [],
  onCheckout,
  isLoadingPlans = false,
  checkoutPlanId = null,
  currentSubscriptionTier = null,
  hasCardOnFile = false,
  allowSubscriptionUi = true,
}) => {
  const currentTier = useSelector(selectUserTier)
  const verificationStatus = useSelector(selectVerificationStatus)
  const isVerified = verificationStatus === VERIFICATION_STATUS.APPROVED
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const effectiveTier = currentSubscriptionTier || currentTier

  if (!allowSubscriptionUi) {
    return null
  }

  const content = (
    <ModalContent
      onClose={onClose}
      triggerAction={triggerAction}
      currentTier={effectiveTier}
      isVerified={isVerified}
      hasCardOnFile={hasCardOnFile}
      plans={plans}
      isLoading={isLoadingPlans}
      checkoutPlanId={checkoutPlanId}
      onCheckout={onCheckout || (() => {})}
    />
  )

  if (isMobile) {
    return (
      <MobileBottomSheet isOpen={isOpen} onClose={onClose}>
        {content}
      </MobileBottomSheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-5xl sm:w-[90vw] max-h-[85vh] p-0 overflow-hidden bg-white border-none rounded-[32px] shadow-2xl"
        showCloseButton={false}
      >
        <div className="overflow-y-auto max-h-[85vh] scrollbar-hide">{content}</div>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeModal
