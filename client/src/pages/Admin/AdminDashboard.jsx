import {
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Button } from '../../components/ui/button'
import UserTable from '../../components/Admin/UserTable'
import VerificationTable from '../../components/Admin/VerificationTable'
import { adminService } from '../../services/adminService'
import { subscriptionService } from '../../services/subscriptionService'
import DashboardLayout from '../Layout/DashboardLayout'

const BillingManager = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: 0,
    featuresText: '',
  })

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await subscriptionService.getAdminPlans()
      setPlans(response?.data?.plans || [])
    } catch (error) {
      toast.error(error || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const togglePlan = async (plan) => {
    try {
      await subscriptionService.updateAdminPlan(plan._id, { active: !plan.active })
      toast.success(`Plan ${!plan.active ? 'activated' : 'deactivated'}`)
      await loadPlans()
    } catch (error) {
      toast.error(error || 'Failed to update plan')
    }
  }

  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => a.amount - b.amount)
  }, [plans])

  const startEditing = (plan) => {
    setEditingPlanId(plan._id)
    setEditForm({
      description: plan.description || '',
      amount: plan.amount,
      featuresText: (plan.features || []).join('\n'),
    })
  }

  const cancelEditing = () => {
    setEditingPlanId(null)
    setEditForm({
      description: '',
      amount: 0,
      featuresText: '',
    })
  }

  const saveEdits = async (planId) => {
    try {
      const features = editForm.featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      await subscriptionService.updateAdminPlan(planId, {
        description: editForm.description,
        amount: Number(editForm.amount),
        features,
      })

      toast.success('Plan updated')
      cancelEditing()
      await loadPlans()
    } catch (error) {
      toast.error(error || 'Failed to update plan')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 md:px-10 md:py-6 bg-gradient-to-r from-[#163146] via-[#1b3e57] to-[#0f1f27] text-white">
          <h3 className="text-xl md:text-2xl font-black tracking-tight">Stripe Plans</h3>
          <p className="text-xs md:text-sm text-white/70 mt-1 uppercase tracking-[0.2em] font-semibold">Exactly 3 plans • Monthly only</p>
        </div>
        <div className="p-5 md:p-8">
          <p className="text-sm text-slate-500">Edit price, features, and description for the fixed plans below.</p>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-[#163146] tracking-tight">Published Plans</h3>
            <p className="text-sm text-slate-500 mt-1">Edit or toggle plans visible in Settings.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 mt-6">Loading plans...</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {orderedPlans.map((plan) => (
              <div key={plan._id} className="rounded-2xl border border-slate-100 p-5 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-lg text-[#163146]">{plan.name}</h4>
                  <span className={`text-[10px] uppercase tracking-widest font-black ${plan.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {plan.active ? 'active' : 'inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{plan.tier.toUpperCase()} • {plan.currency.toUpperCase()} {plan.amount}/mo</p>
                <p className="text-xs text-slate-500 mt-2 break-all">Price ID: {plan.stripePriceId || 'N/A'}</p>

                {(plan.features || []).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <p key={idx} className="text-xs text-slate-600">• {feature}</p>
                    ))}
                  </div>
                )}

                {editingPlanId === plan._id ? (
                  <div className="mt-4 space-y-3">
                    <input
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      value={editForm.amount}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <textarea
                      value={editForm.featuresText}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, featuresText: e.target.value }))}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <div className="flex items-center gap-2">
                      <Button className="rounded-2xl font-bold" onClick={() => saveEdits(plan._id)}>
                        Save
                      </Button>
                      <Button variant="outline" className="rounded-2xl font-bold" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl font-bold"
                      onClick={() => startEditing(plan)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={plan.active ? 'outline' : 'default'}
                      className="rounded-2xl font-bold"
                      onClick={() => togglePlan(plan)}
                    >
                      {plan.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const TAB_IDS = ['users', 'verification', 'billing']
const DEFAULT_TAB = 'users'

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => {
    const candidate = searchParams.get('tab')
    return TAB_IDS.includes(candidate) ? candidate : DEFAULT_TAB
  }, [searchParams])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    expired: 0,
  })

  useEffect(() => {
    const current = searchParams.get('tab')
    if (!current || !TAB_IDS.includes(current)) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', DEFAULT_TAB)
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getVerificationStats()
        if (response && response.status === 'success') {
          setStats(response.data.stats)
        }
      } catch {
        console.error('Failed to fetch admin stats')
      }
    }
    fetchStats()
  }, [])

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification', label: 'Queue', icon: ShieldCheck, badge: stats.pending },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <DashboardLayout hideSidebar>
      <Toaster position="bottom-right" theme="dark" />
      <div className="w-full flex flex-col p-4 md:p-8 space-y-6 md:space-y-10 bg-slate-50/30 min-h-[calc(100vh-64px)] overflow-x-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#986a41] text-[10px] font-black uppercase tracking-[0.3em] mb-2 pl-1">
                <LayoutDashboard size={14} strokeWidth={3} /> Administration
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#163146] tracking-tight leading-none">System Control</h1>
            </div>

            <div className="flex gap-1.5 bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams)
                      nextParams.set('tab', tab.id)
                      setSearchParams(nextParams, { replace: true })
                    }}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all relative border-2 ${
                      isActive
                        ? 'bg-[#163146] text-white border-[#163146] shadow-xl shadow-blue-900/10'
                        : 'text-slate-400 bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[9px] font-black bg-[#986a41] text-white">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {activeTab !== 'billing' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
              <StatCard label="Total Submissions" value={stats.total} color="blue" />
              <StatCard label="Pending Review" value={stats.pending} color="accent" />
              <StatCard label="Fully Verified" value={stats.verified} color="blue" />
              <StatCard label="Needs Update" value={stats.rejected} color="blue" />
            </div>
          )}
        </div>

        <div className="flex-1 w-full max-w-full">
          <div
            key={activeTab}
            className="pb-20 md:pb-10"
          >
            {activeTab === 'users' && <UserTable />}
            {activeTab === 'verification' && <VerificationTable />}
            {activeTab === 'billing' && <BillingManager />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

const StatCard = ({ label, value }) => {
  return (
    <div className="p-6 rounded-[32px] border bg-white shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-slate-200 transition-all">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-3xl md:text-4xl font-black text-[#163146] tracking-tighter leading-none">{value}</span>
        <div className="p-2.5 rounded-2xl bg-slate-50 text-[#986a41] group-hover:bg-[#163146] group-hover:text-white transition-all">
          <ChevronRight size={18} strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
