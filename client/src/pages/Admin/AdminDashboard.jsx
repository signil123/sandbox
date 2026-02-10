import { motion } from 'framer-motion'
import {
    ChevronRight,
    LayoutDashboard,
    ShieldCheck,
    Users,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import UserTable from '../../components/Admin/UserTable'
import VerificationTable from '../../components/Admin/VerificationTable'
import { adminService } from '../../services/adminService'
import DashboardLayout from '../Layout/DashboardLayout'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    expired: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getVerificationStats()
        if (response && response.status === 'success') {
          setStats(response.data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch admin stats')
      }
    }
    fetchStats()
  }, [])

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification', label: 'Queue', icon: ShieldCheck, badge: stats.pending },
  ]

  return (
    <DashboardLayout hideSidebar>
      <Toaster position="bottom-right" theme="dark" />
      <div className="w-full flex flex-col p-4 md:p-8 space-y-6 md:space-y-10 bg-slate-50/30 min-h-[calc(100vh-64px)] overflow-x-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#986a41] text-[10px] font-black uppercase tracking-[0.3em] mb-2 pl-1">
                  <LayoutDashboard size={14} strokeWidth={3} /> Administration
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#163146] tracking-tight leading-none">System Control</h1>
            </div>
            
            {/* Native Tab Switcher */}
            <div className="flex gap-1.5 bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all relative border-2 ${
                      isActive 
                        ? 'bg-[#163146] text-white border-[#163146] shadow-xl shadow-blue-900/10' 
                        : 'text-slate-400 bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[9px] font-black ${
                          isActive ? 'bg-[#986a41] text-white' : 'bg-[#986a41] text-white'
                      }`}>
                          {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
            <StatCard label="Total Submissions" value={stats.total} color="blue" />
            <StatCard label="Pending Review" value={stats.pending} color="accent" />
            <StatCard label="Fully Verified" value={stats.verified} color="blue" />
            <StatCard label="Needs Update" value={stats.rejected} color="blue" />
        </div>
        </div>

        {/* Content Section with Glass Card */}
        <div className="flex-1 w-full max-w-full">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
               className="pb-20 md:pb-10"
            >
              {activeTab === 'users' ? <UserTable /> : <VerificationTable />}
            </motion.div>
        </div>
        
      </div>
    </DashboardLayout>
  )
}

const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'bg-white text-[#163146] border-slate-100',
        accent: 'bg-white text-[#163146] border-slate-100',
    }

    return (
        <div className={`p-6 rounded-[32px] border bg-white shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-slate-200 transition-all`}>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-4">{label}</span>
             <div className="flex items-end justify-between">
                <span className="text-3xl md:text-4xl font-black text-[#163146] tracking-tighter leading-none">{value}</span>
                <div className={`p-2.5 rounded-2xl bg-slate-50 text-[#986a41] group-hover:bg-[#163146] group-hover:text-white transition-all`}>
                    <ChevronRight size={18} strokeWidth={3} />
                </div>
             </div>
        </div>
    )
}

export default AdminDashboard
