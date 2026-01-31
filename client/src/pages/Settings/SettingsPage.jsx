// File: client/src/pages/Settings/SettingsPage.jsx
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    Globe,
    Lock,
    ShieldCheck,
    Upload,
    User,
    Zap
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import ProBadge from '../../components/Common/ProBadge'
import DocumentManager from '../../components/Profile/DocumentManager'
import UpgradeModal from '../../components/Subscription/UpgradeModal'
import { TIERS, TIER_DETAILS, VERIFICATION_STATUS } from '../../constants/tiers'
import { selectCurrentUser, selectUserTier, selectVerificationStatus } from '../../redux/userSlice'
import DashboardLayout from '../Layout/DashboardLayout'

const SettingsPage = () => {
  const currentUser = useSelector(selectCurrentUser)
  const currentTier = useSelector(selectUserTier)
  const verificationStatus = useSelector(selectVerificationStatus)
  const [activeTab, setActiveTab] = useState('subscription')
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  const isVerified = verificationStatus === VERIFICATION_STATUS.APPROVED
  const isAgentOrAdvisor = currentUser?.userType === 'advisor' || currentUser?.userType === 'agent'

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    ...(isAgentOrAdvisor ? [{ id: 'subscription', label: 'Subscription', icon: CreditCard }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  const renderSubscriptionTab = () => (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 bg-gradient-to-br from-[#163146] to-[#0f1f27] text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#986a41]">Current Status</h3>
                {currentTier === TIERS.PRO && <ProBadge size="md" />}
              </div>
              <h2 className="text-4xl font-black mb-1">
                {TIER_DETAILS[currentTier]?.name || 'Free'} Plan
              </h2>
              <p className="text-gray-400 text-sm">
                Next billing date: <span className="text-white font-medium">March 1, 2026</span>
              </p>
            </div>
            <Button 
              onClick={() => setIsUpgradeModalOpen(true)}
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
                {currentTier === TIERS.PRO ? 'Unlimited' : currentTier === TIERS.GROWTH ? '15 Requests / mo' : 'Upgrade Required'}
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
                {currentTier === TIERS.FREE ? 'Limited' : 'Full Exposure'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Steps */}
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
          {/* Vertical line connecting steps */}
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

  const Step = ({ number, title, desc, status, isLast = false }) => {
    const isCompleted = status === 'completed'
    const isCurrent = status === 'current'
    const isLocked = status === 'locked'

    return (
      <div className="flex gap-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-md transition-all ${
          isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#163146] text-white' : 'bg-gray-100 text-gray-400'
        }`}>
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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-[#163146] tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your identity and subscription preferences</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Tabs */}
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

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'subscription' && renderSubscriptionTab()}
                {activeTab !== 'subscription' && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      {tabs.find(t => t.id === activeTab)?.icon({ size: 40 })}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </h3>
                    <p className="text-gray-500">This section is currently being refined.</p>
                  </div>
                )}
              </motion.div>
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
      />
    </DashboardLayout>
  )
}

export default SettingsPage
