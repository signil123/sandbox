import { AnimatePresence, motion } from 'framer-motion'
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    ShieldAlert,
    X,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '../../services/adminService'

const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8800'

const VerificationTable = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSub, setSelectedSub] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingDocuments(currentPage, 10)
      if (response && response.status === 'success') {
        setSubmissions(response.data.documents)
        setTotalPages(response.totalPages)
        setTotalResults(response.totalResults)
      }
    } catch (error) {
      toast.error('Failed to load pending submissions')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleApprove = async () => {
    if (!selectedSub) return
    try {
      setProcessing(true)
      await adminService.approveDocument(selectedSub._id, adminNotes)
      toast.success('Document approved')
      setSelectedSub(null)
      fetchSubmissions()
    } catch (error) {
      toast.error('Failed to approve')
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!selectedSub || !rejectionReason) {
      toast.error('Reason is required')
      return
    }
    try {
      setProcessing(true)
      await adminService.declineDocument(selectedSub._id, rejectionReason, adminNotes)
      toast.success('Document declined')
      setSelectedSub(null)
      setRejectionReason('')
      fetchSubmissions()
    } catch (error) {
      toast.error('Failed to decline')
    } finally {
      setProcessing(false)
    }
  }

  const getFullDocUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {totalResults} Pending Submissions
         </p>
      </div>

      {loading ? (
        <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-100 rounded-[28px] animate-pulse" />
             ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-[#163146]">All Caught Up!</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">The verification queue is empty. Good job!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((sub) => (
            <motion.div
              key={sub._id}
              onClick={() => setSelectedSub(sub)}
              className="group bg-white rounded-[28px] border border-slate-200 p-5 hover:border-[#986a41] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#163146] group-hover:bg-[#163146] group-hover:text-white transition-all">
                  <FileText size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-[#986a41] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {sub.documentType}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                        {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#163146]">{sub.user?.name || 'User'}</h4>
                  <p className="text-xs text-slate-400 font-medium">{sub.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-black text-[#986a41] uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> Awaiting Review
                    </span>
                 </div>
                 <ChevronRight size={20} className="text-slate-300 group-hover:text-[#986a41] group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
            <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-[#163146] disabled:opacity-30 shadow-sm"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-black text-[#163146] uppercase tracking-widest">
                Page {currentPage} of {totalPages}
            </span>
            <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-[#163146] disabled:opacity-30 shadow-sm"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      )}

      {/* Review Modal / Bottom Sheet */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#163146]/80 backdrop-blur-sm" onClick={() => setSelectedSub(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full h-full lg:h-auto lg:max-w-5xl lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative"
            >
               {/* Close Button Mobile */}
               <button onClick={() => setSelectedSub(null)} className="absolute top-6 right-6 z-10 p-2.5 bg-white/10 backdrop-blur text-white lg:text-slate-400 lg:bg-slate-100 rounded-full">
                    <X size={24} />
               </button>

              {/* Document Preview Section */}
              <div className="lg:w-3/5 bg-[#163146] flex flex-col p-6 lg:p-10 text-white min-h-[40vh] lg:min-h-[70vh]">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Proof of Credential</h3>
                        <p className="text-blue-200/60 text-sm font-medium">Verify the authenticity of the submission</p>
                    </div>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center relative">
                    {selectedSub.documentUrl?.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={getFullDocUrl(selectedSub.documentUrl)} className="w-full h-full border-none" title="Review" />
                    ) : (
                        <img src={getFullDocUrl(selectedSub.documentUrl)} alt="Review" className="max-w-full max-h-full object-contain" />
                    )}
                 </div>
                 <div className="pt-6 flex justify-center">
                    <a href={getFullDocUrl(selectedSub.documentUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#986a41] hover:text-white transition-colors">
                        Open in Full Window <ExternalLink size={14} />
                    </a>
                 </div>
              </div>

              {/* Action Section */}
              <div className="lg:w-2/5 p-8 lg:p-10 flex flex-col overflow-y-auto bg-white">
                 <div className="mb-8">
                    <span className="text-[10px] font-black text-[#986a41] uppercase tracking-[0.2em]">Reviewing Submission</span>
                    <h2 className="text-2xl font-black text-[#163146] mt-1">{selectedSub.user?.name}</h2>
                    <p className="text-sm font-medium text-slate-400">{selectedSub.user?.email}</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {selectedSub.documentType}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {selectedSub.user?.userType}
                        </span>
                    </div>
                 </div>

                 <div className="space-y-6 flex-1">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Internal Notes</label>
                        <textarea
                            placeholder="Add private logs about this verification..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#163146] min-h-[100px] transition-all resize-none"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                        />
                    </div>

                    <div className="p-5 bg-red-50/50 rounded-3xl border border-red-100">
                        <label className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 ml-1">
                            <ShieldAlert size={14} /> Rejection Feedback
                        </label>
                        <textarea
                            placeholder="Help the user understand why it was declined..."
                            className="w-full p-4 bg-white border border-red-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] transition-all resize-none"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-3 pt-8 pb-4">
                    <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="w-full py-4.5 bg-[#163146] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#0f1f27] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Approve Submission'}
                    </button>
                    <button
                        onClick={handleDecline}
                        disabled={processing || !rejectionReason}
                        className="w-full py-4 bg-white border-2 border-slate-100 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50"
                    >
                        Decline with Feedback
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VerificationTable
