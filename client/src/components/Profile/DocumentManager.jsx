import { motion } from 'framer-motion'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Upload,
    X,
    XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { profileService } from '../../services/profileService'

const documentTypes = [
  { id: 'license', label: 'Professional License' },
  { id: 'certification', label: 'Certification' },
  { id: 'id_card', label: 'Government ID' },
  { id: 'other', label: 'Other Credential' },
]

const statusConfig = {
  not_submitted: {
    label: 'Not Submitted',
    color: 'bg-slate-100 text-slate-500',
    icon: AlertCircle,
  },
  pending: {
    label: 'In Review',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  pending_review: {
    label: 'In Review',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  in_review: {
    label: 'In Review',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  approved: {
    label: 'Verified',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  verified: {
    label: 'Verified',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  requires_update: {
    label: 'Requires Update',
    color: 'bg-orange-100 text-orange-700',
    icon: AlertCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
}

const DocumentManager = ({ isOpen, onClose, currentUser }) => {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('license')

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const data = await profileService.getAdvisorDocuments(currentUser._id)
      if (data && data.data && data.data.documents) {
        setDocuments(data.data.documents)
      }
    } catch (error) {
       toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // Fetch documents when modal opens
  React.useEffect(() => {
    if (isOpen && currentUser?._id) {
      fetchDocuments()
    }
  }, [isOpen, currentUser])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit')
        return
    }

    try {
        setUploading(true)
        
        // 1. Upload File
        const uploadRes = await profileService.uploadFile(file)
        if (!uploadRes?.url) throw new Error('Upload failed')

        // 2. Submit Document Entry
        await profileService.submitDocument(currentUser._id, {
            documentType: selectedType,
            issuer: 'Self Uploaded', // You might want to add an input for this
            documentId: `DOC-${Date.now()}`, // Temporary ID logic, or add input
            fileUrl: uploadRes.url,
            notes: 'Uploaded via Document Center'
        })
        
        toast.success('Document submitted successfully')
        // Refresh list
        fetchDocuments()
    } catch (error) {
        console.error(error)
        toast.error('Failed to upload document')
    } finally {
        setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    try {
        if (!confirm('Are you sure you want to delete this document?')) return
        await profileService.deleteDocument(currentUser._id, docId)
        toast.success('Document removed')
        setDocuments(documents.filter((doc) => doc._id !== docId))
    } catch (error) {
        toast.error('Failed to delete document')
    }
  }

  const requiredDocs = [
    { type: 'license', label: 'Professional License' },
    { type: 'id_card', label: 'Government ID' },
  ]

  const missingDocs = requiredDocs.filter(req => 
    !documents.some(doc => doc.documentType === req.type && doc.status !== 'rejected')
  )

  const progress = Math.round(((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100)

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]'
      >
        {/* Header */}
        <div className='p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10'>
          <div>
            <h2 className='text-xl font-bold text-slate-900'>Document Center</h2>
            <p className='text-sm text-slate-500 mt-1'>
              Manage your credentials and verification status
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500'
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto'>

           {/* Progress Section */}
           <div className='mb-6'>
             <div className='flex justify-between items-end mb-2'>
               <span className='text-sm font-semibold text-slate-700'>Verification Progress</span>
               <span className='text-xs font-bold text-slate-900'>{progress}%</span>
             </div>
             <div className='w-full bg-slate-100 rounded-full h-2.5'>
               <div className='bg-emerald-500 h-2.5 rounded-full transition-all duration-500' style={{ width: `${progress}%` }}></div>
             </div>
             
             {missingDocs.length > 0 && (
               <div className='mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 items-start'>
                 <AlertCircle size={16} className='text-amber-600 mt-0.5 flex-shrink-0' />
                 <div>
                   <p className='text-xs font-bold text-amber-800 mb-1'>Missing Required Documents</p>
                   <ul className='text-xs text-amber-700 list-disc list-inside'>
                     {missingDocs.map(doc => (
                       <li key={doc.type}>{doc.label}</li>
                     ))}
                   </ul>
                 </div>
               </div>
             )}
           </div>

          {/* Upload Section */}
          <div className='mb-8 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center'>
            <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm'>
              <Upload className='text-emerald-600' size={24} />
            </div>
            <h3 className='text-sm font-semibold text-slate-900 mb-1'>
              Upload New Document
            </h3>
            <p className='text-xs text-slate-500 mb-4 max-w-xs mx-auto'>
              Supported files: PDF, PNG, JPG (Max 10MB)
            </p>

            <div className='flex gap-2 justify-center max-w-md mx-auto'>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className='px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500'
              >
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <label className='relative'>
                <input
                  type='file'
                  onChange={handleFileUpload}
                  className='hidden'
                  accept='.pdf,.png,.jpg,.jpeg'
                  disabled={uploading}
                />
                <span
                  className={`px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors inline-block ${
                    uploading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </span>
              </label>
            </div>
          </div>

          {/* Documents List */}
          <div className='space-y-4'>
            <h3 className='text-sm font-bold text-slate-900'>
              Submitted Documents
            </h3>
            
            {documents.length === 0 ? (
              <p className='text-sm text-slate-500 text-center py-8'>
                No documents submitted yet
              </p>
            ) : (
              documents.map((doc) => {
                const status = statusConfig[doc.status]
                const StatusIcon = status.icon

                return (
                  <div
                    key={doc._id}
                    className='flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500'>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>
                          {documentTypes.find(t => t.id === doc.documentType)?.label || doc.documentType}
                        </p>
                        <p className='text-xs text-slate-500'>
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-4'>
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className='p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DocumentManager
