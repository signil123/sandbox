import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Eye,
    Mail,
    Search,
    Shield,
    Trash2,
    User,
    UserCircle,
    X,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '../../services/adminService'

const UserTable = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  
  // Confirmation Modal State
  const [confirmingUpdate, setConfirmingUpdate] = useState(null) // { userId, type, value, label }
  const [confirmingDelete, setConfirmingDelete] = useState(null) // userId
  const [viewingUser, setViewingUser] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await adminService.getAllUsers(currentPage, 10, searchTerm, filterRole, filterType)
      if (response && response.status === 'success') {
        setUsers(response.data.users)
        setTotalPages(response.totalPages)
        setTotalResults(response.totalResults)
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, filterRole, filterType])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchUsers])

  // Disable scroll when modal is open
  useEffect(() => {
    if (viewingUser) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = 'unset'
    }
    return () => {
        document.body.style.overflow = 'unset'
    }
  }, [viewingUser])

  const handleUpdateUser = async () => {
    if (!confirmingUpdate) return
    const { userId, type, value } = confirmingUpdate
    try {
      await adminService.updateUser(userId, { [type]: value })
      toast.success('User updated successfully')
      setConfirmingUpdate(null)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    if (!confirmingDelete) return
    try {
      await adminService.deleteUser(confirmingDelete)
      toast.success('User deleted successfully')
      setConfirmingDelete(null)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search name or email..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#163146] transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                    }}
                />
            </div>
            <div className="flex gap-2">
                <select
                    className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#163146] shadow-sm font-medium text-slate-700"
                    value={filterRole}
                    onChange={(e) => {
                        setFilterRole(e.target.value)
                        setCurrentPage(1)
                    }}
                >
                    <option value="all">Roles: All</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                </select>
                <select
                    className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#163146] shadow-sm font-medium text-slate-700"
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value)
                        setCurrentPage(1)
                    }}
                >
                    <option value="all">Types: All</option>
                    <option value="athlete">Athlete</option>
                    <option value="advisor">Advisor</option>
                    <option value="agent">Agent</option>
                </select>
            </div>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Showing {users.length} of {totalResults} total users
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">User Type</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
                 [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="px-6 py-4"><div className="h-12 bg-slate-50 rounded-xl" /></td>
                    </tr>
                 ))
            ) : users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">No users found.</td></tr>
            ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#163146] border border-slate-200 overflow-hidden shrink-0">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#163146] truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate tracking-tight">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                        className="text-[10px] font-black text-white bg-[#163146] px-3 py-1.5 rounded-full outline-none uppercase tracking-widest cursor-pointer hover:bg-[#0f1f27] transition-colors"
                        value={user.role}
                        onChange={(e) => setConfirmingUpdate({ userId: user._id, type: 'role', value: e.target.value, label: e.target.value.toUpperCase(), userName: user.name })}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                     <select 
                        className="text-[10px] font-black text-[#163146] border-2 border-[#163146] px-3 py-1.5 rounded-full bg-white outline-none uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors"
                        value={user.userType || 'null'}
                        onChange={(e) => setConfirmingUpdate({ userId: user._id, type: 'userType', value: e.target.value === 'null' ? null : e.target.value, label: e.target.value.toUpperCase(), userName: user.name })}
                    >
                        <option value="null">NOT SET</option>
                        <option value="athlete">Athlete</option>
                        <option value="advisor">Advisor</option>
                        <option value="agent">Agent</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setViewingUser(user)}
                            className="p-2.5 text-slate-300 hover:text-[#986a41] hover:bg-slate-50 rounded-xl transition-all"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                        <button
                            onClick={() => setConfirmingDelete(user._id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Native UI Feel) */}
      <div className="lg:hidden space-y-4">
        {loading ? (
             [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl animate-pulse h-32" />
             ))
        ) : users.map((user) => (
            <motion.div 
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm space-y-4"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#163146] flex items-center justify-center text-white shrink-0 overflow-hidden">
                        {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#163146] truncate">{user.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewingUser(user)} className="p-2.5 text-[#163146] bg-slate-50 rounded-xl">
                            <Eye size={18} />
                        </button>
                        <button onClick={() => setConfirmingDelete(user._id)} className="p-2.5 text-red-500 bg-red-50 rounded-xl">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</span>
                        <select 
                            className="w-full text-xs font-bold text-white bg-[#163146] px-4 py-3 rounded-2xl outline-none"
                            value={user.role}
                            onChange={(e) => setConfirmingUpdate({ userId: user._id, type: 'role', value: e.target.value, label: e.target.value.toUpperCase(), userName: user.name })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type</span>
                        <select 
                            className="w-full text-xs font-bold text-[#163146] border border-slate-200 px-4 py-3 rounded-2xl outline-none"
                            value={user.userType || 'null'}
                            onChange={(e) => setConfirmingUpdate({ userId: user._id, type: 'userType', value: e.target.value === 'null' ? null : e.target.value, label: e.target.value.toUpperCase(), userName: user.name })}
                        >
                            <option value="null">NOT SET</option>
                            <option value="athlete">Athlete</option>
                            <option value="advisor">Advisor</option>
                            <option value="agent">Agent</option>
                        </select>
                    </div>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 pt-4 border-t border-slate-100">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#163146] hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
        >
          <ChevronLeft size={18} /> Prev
        </button>

        <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1
                // Show limited pages if many
                if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) return null
                return (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === pageNum 
                                ? 'bg-[#163146] text-white shadow-md' 
                                : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                        {pageNum}
                    </button>
                )
            })}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#163146] text-white rounded-xl text-sm font-bold hover:bg-[#0f1f27] disabled:opacity-50 transition-all shadow-lg shadow-blue-950/20"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {(confirmingUpdate || confirmingDelete) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setConfirmingUpdate(null); setConfirmingDelete(null); }}
                    className="absolute inset-0 bg-[#163146]/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmingDelete ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-[#986a41]'}`}>
                            {confirmingDelete ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-black text-[#163146] mb-2">Are you sure?</h3>
                        <p className="text-sm text-slate-500 mb-8">
                            {confirmingDelete 
                                ? "This will permanently remove this user from the system. This action cannot be undone."
                                : `You are about to change ${confirmingUpdate?.userName}'s ${confirmingUpdate?.type === 'role' ? 'role' : 'type'} to ${confirmingUpdate?.label}.`
                            }
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <button 
                                onClick={() => { setConfirmingUpdate(null); setConfirmingDelete(null); }}
                                className="py-3.5 px-6 rounded-2xl border-2 border-slate-100 text-[#163146] font-black text-xs uppercase tracking-widest hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmingDelete ? handleDeleteUser : handleUpdateUser}
                                className={`py-3.5 px-6 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg ${confirmingDelete ? 'bg-red-500 shadow-red-500/20' : 'bg-[#163146] shadow-blue-900/20'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      {/* User Details Modal */}
      <AnimatePresence>
        {viewingUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#163146]/60 backdrop-blur-sm" onClick={() => setViewingUser(null)}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header Banner */}
                    <div className="bg-[#163146] h-32 relative">
                        <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-8 pb-8 -mt-16">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-32 h-32 rounded-[32px] bg-white p-1.5 shadow-lg shrink-0 relative z-10">
                                <div className="w-full h-full rounded-[28px] overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                                    {viewingUser.profileImage ? (
                                        <img src={viewingUser.profileImage} alt={viewingUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-slate-300" />
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-16 md:pt-16 flex-1 w-full">
                                <h2 className="text-3xl font-black text-[#163146] leading-none mb-1">{viewingUser.name}</h2>
                                <p className="text-slate-500 font-medium">{viewingUser.email}</p>
                                
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingUser.role === 'admin' ? 'bg-[#163146] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {viewingUser.role}
                                    </span>
                                    <span className="px-3 py-1 bg-[#986a41]/10 text-[#986a41] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#986a41]/20">
                                        {viewingUser.userType || 'No Type Set'}
                                    </span>
                                    {viewingUser.isVerified && (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* General Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Profile Details</h3>
                                <div className="space-y-4">
                                    <DetailRow label="Phone" value={viewingUser.phone} />
                                    <DetailRow label="Gender" value={viewingUser.gender} />
                                    <DetailRow label="Language" value={viewingUser.language} />
                                    <DetailRow label="Joined" value={new Date(viewingUser.createdAt).toLocaleDateString()} />
                                </div>
                            </div>

                            {/* Type Specific Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Specifics</h3>
                                <div className="space-y-4">
                                    {viewingUser.userType === 'athlete' && (
                                        <>
                                            <DetailRow label="Sport" value={viewingUser.sport} />
                                            <DetailRow label="School" value={viewingUser.school} />
                                        </>
                                    )}
                                    {(viewingUser.userType === 'advisor' || viewingUser.userType === 'agent') && (
                                        <>
                                            <DetailRow label="Experience" value={viewingUser.experience} />
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 block mb-1">Specialties</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {viewingUser.specialties?.length > 0 ? viewingUser.specialties.map((spec, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-[#163146] text-[10px] font-bold rounded-md border border-slate-100">{spec}</span>
                                                    )) : <span className="text-sm font-bold text-[#163146]">-</span>}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <DetailRow label="Login Count" value={viewingUser.loginCount || 'N/A'} />
                                    <DetailRow label="Last Seen" value={viewingUser.lastSeen ? new Date(viewingUser.lastSeen).toLocaleString() : 'Never'} />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Raw Data Toggle could go here */}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper component for details
const DetailRow = ({ label, value }) => (
    <div>
        <span className="text-xs font-bold text-slate-400 block mb-0.5">{label}</span>
        <span className="text-sm font-bold text-[#163146]">{value || '-'}</span>
    </div>
)

export default UserTable
