// File: server/controllers/documentManager.js
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'
import Document from '../models/Verification.js'

// ═══════════════════════════════════════════════════════════════════════════
// ADVISOR/AGENT DOCUMENT SUBMISSION
// ═══════════════════════════════════════════════════════════════════════════

// POST - Submit document for verification
export const submitDocument = async (req, res, next) => {
  try {
    const { advisorId } = req.params
    const {
      documentType,
      issuer,
      documentId,
      issueDate,
      expirationDate,
      fileUrl,
      notes,
    } = req.body

    // Ownership check via middleware ✓

    // Validate required fields
    if (!documentType || !issuer || !documentId) {
      return next(
        createError(400, 'documentType, issuer, and documentId are required')
      )
    }

    // Valid document types
    const validTypes = ['license', 'certification', 'id_card', 'credential']
    if (!validTypes.includes(documentType.toLowerCase())) {
      // Allow it if it matches schema, but these are the main ones we expect from frontend
      // Actually, let's just trust the schema validation or ensure this list matches schema
    }

    // Create document submission
    console.log("Submitting document. Data:", {
      user: advisorId,
      documentType: documentType.toLowerCase(),
      status: 'pending_review',
    })
    const newDocument = await Document.create({
      user: advisorId,
      documentType: documentType.toLowerCase(),
      issuer: issuer.trim(),
      documentId: documentId.trim(),
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      documentUrl: fileUrl || null,
      status: 'pending_review',
      submittedNotes: notes || '',
      submittedAt: new Date(),
    })

    // Create notification for admins
    const adminUsers = await User.find({ role: 'admin' })
    const notificationPromises = adminUsers.map((admin) =>
      Notification.create({
        type: 'document_submitted',
        priority: 'high',
        recipient: admin._id,
        relatedUser: advisorId,
        title: 'New Document Submission',
        message: `New document submitted for verification: ${documentType}`,
        actionUrl: `/admin/documents/${newDocument._id}`,
        isRead: false,
      })
    )

    await Promise.all(notificationPromises)

    res.status(201).json({
      status: 'success',
      message:
        'Document submitted for verification. Expected review time: 3-5 business days',
      data: {
        document: newDocument,
      },
    })
  } catch (error) {
    console.error('Error in submitDocument:', error)
    next(error)
  }
}

// GET - Get advisor's documents
export const getAdvisorDocuments = async (req, res, next) => {
  try {
    const { advisorId } = req.params

    const documents = await Document.find({ user: advisorId }).sort({
      createdAt: -1,
    })

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents },
    })
  } catch (error) {
    console.error('Error in getAdvisorDocuments:', error)
    next(error)
  }
}

// GET - Get single document
export const getDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params
    const { advisorId } = req.params

    // Ownership check via middleware ✓

    const document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    if (document.user.toString() !== advisorId) {
      return next(createError(403, 'You cannot access this document'))
    }

    res.status(200).json({
      status: 'success',
      data: { document },
    })
  } catch (error) {
    console.error('Error in getDocument:', error)
    next(error)
  }
}

// PUT - Update/resubmit document
export const updateDocument = async (req, res, next) => {
  try {
    const { advisorId, documentId } = req.params
    const {
      issuer,
      documentId: newDocId,
      issueDate,
      expirationDate,
      fileUrl,
      notes,
    } = req.body

    // Ownership check via middleware ✓

    let document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    if (document.user.toString() !== advisorId) {
      return next(createError(403, 'You cannot update this document'))
    }

    // Only allow update if status is 'requires_update' or 'rejected'
    if (!['requires_update', 'rejected'].includes(document.status)) {
      return next(
        createError(
          400,
          `Cannot update document with status: ${document.status}`
        )
      )
    }

    // Update fields
    if (issuer) document.issuer = issuer
    if (newDocId) document.documentId = newDocId
    if (issueDate) document.issueDate = new Date(issueDate)
    if (expirationDate) document.expirationDate = new Date(expirationDate)
    if (fileUrl) document.documentUrl = fileUrl
    if (notes) document.submittedNotes = notes

    document.status = 'pending_review'
    document.resubmittedAt = new Date()

    await document.save()

    // Notify admins of resubmission
    const adminUsers = await User.find({ role: 'admin' })
    const notificationPromises = adminUsers.map((admin) =>
      Notification.create({
        type: 'document_resubmitted',
        priority: 'high',
        recipient: admin._id,
        relatedUser: advisorId,
        title: 'Document Resubmitted',
        message: `Document resubmitted for verification: ${document.documentType}`,
        actionUrl: `/admin/documents/${document._id}`,
        isRead: false,
      })
    )

    await Promise.all(notificationPromises)

    res.status(200).json({
      status: 'success',
      message: 'Document resubmitted for verification',
      data: { document },
    })
  } catch (error) {
    console.error('Error in updateDocument:', error)
    next(error)
  }
}

// DELETE - Delete document (only if not verified)
export const deleteDocument = async (req, res, next) => {
  try {
    const { advisorId, documentId } = req.params

    // Ownership check via middleware ✓

    const document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    if (document.user.toString() !== advisorId) {
      return next(createError(403, 'You cannot delete this document'))
    }

    if (document.status === 'verified') {
      return next(createError(400, 'Cannot delete verified documents'))
    }

    await Document.findByIdAndDelete(documentId)

    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Error in deleteDocument:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN VERIFICATION & MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET - Admin: Get all pending documents
export const getPendingDocuments = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const documents = await Document.find({ status: 'pending_review' })
      .populate('user', 'name email userType')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await Document.countDocuments({ status: 'pending_review' })

    res.status(200).json({
      status: 'success',
      results: documents.length,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: { documents },
    })
  } catch (error) {
    console.error('Error in getPendingDocuments:', error)
    next(error)
  }
}

// GET - Admin: Get all documents for a user
export const getAdvisorDocumentsAdmin = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const { advisorId } = req.params

    const documents = await Document.find({ user: advisorId })
      .populate('user', 'name email userType')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents },
    })
  } catch (error) {
    console.error('Error in getAdvisorDocumentsAdmin:', error)
    next(error)
  }
}

// PUT - Admin: Approve document
export const approveDocument = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const { documentId } = req.params
    const { adminNotes } = req.body

    const document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    if (document.status !== 'pending_review') {
      return next(
        createError(
          400,
          `Cannot approve document with status: ${document.status}`
        )
      )
    }

    document.status = 'verified'
    document.reviewedAt = new Date()
    document.reviewedBy = req.user._id
    document.adminNotes = adminNotes || ''

    await document.save()

    // Update profile verification
    const profile = await Profile.findOne({ user: document.user })
    if (profile) {
      profile.verified = true
      profile.verificationStatus = 'approved'
      await profile.save()
    }

    // Notify advisor
    await Notification.create({
      type: 'document_approved',
      priority: 'high',
      recipient: document.user,
      relatedUser: req.user._id,
      title: 'Document Verified ✓',
      message: `Your ${document.documentType} has been verified and approved!`,
      actionUrl: `/settings/documents`,
      isRead: false,
    })

    res.status(200).json({
      status: 'success',
      message: 'Document approved',
      data: { document },
    })
  } catch (error) {
    console.error('Error in approveDocument:', error)
    next(error)
  }
}

// PUT - Admin: Decline/reject document
export const declineDocument = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const { documentId } = req.params
    const { rejectionReason, adminNotes } = req.body

    if (!rejectionReason) {
      return next(createError(400, 'rejectionReason is required'))
    }

    const document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    if (document.status !== 'pending_review') {
      return next(
        createError(
          400,
          `Cannot decline document with status: ${document.status}`
        )
      )
    }

    document.status = 'requires_update'
    document.reviewedAt = new Date()
    document.reviewedBy = req.user._id
    document.rejectionReason = rejectionReason
    document.adminNotes = adminNotes || ''

    await document.save()

    // Notify advisor
    await Notification.create({
      type: 'document_declined',
      priority: 'high',
      recipient: document.user,
      relatedUser: req.user._id,
      title: 'Document Requires Update',
      message: `Your ${document.documentType} requires updates. Reason: ${rejectionReason}`,
      actionUrl: `/settings/documents/${document._id}`,
      isRead: false,
    })

    res.status(200).json({
      status: 'success',
      message: 'Document declined - advisor notified to resubmit',
      data: { document },
    })
  } catch (error) {
    console.error('Error in declineDocument:', error)
    next(error)
  }
}

// PUT - Admin: Mark as expired
export const markDocumentExpired = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const { documentId } = req.params

    const document = await Document.findById(documentId)
    if (!document) {
      return next(createError(404, 'Document not found'))
    }

    document.status = 'expired'
    document.reviewedAt = new Date()
    await document.save()

    // Update profile
    const profile = await Profile.findOne({ user: document.user })
    if (profile) {
      profile.verified = false
      profile.verificationStatus = 'expired'
      await profile.save()
    }

    // Notify advisor
    await Notification.create({
      type: 'document_expired',
      priority: 'high',
      recipient: document.user,
      relatedUser: req.user._id,
      title: 'Document Expired',
      message: `Your ${document.documentType} has expired. Please renew it.`,
      actionUrl: `/settings/documents/${document._id}`,
      isRead: false,
    })

    res.status(200).json({
      status: 'success',
      message: 'Document marked as expired',
      data: { document },
    })
  } catch (error) {
    console.error('Error in markDocumentExpired:', error)
    next(error)
  }
}

// GET - Admin: Dashboard statistics
export const getVerificationStats = async (req, res, next) => {
  try {
    // Admin check via middleware (restrictTo('admin')) ✓

    const [pending, verified, expired, rejected] = await Promise.all([
      Document.countDocuments({ status: 'pending_review' }),
      Document.countDocuments({ status: 'verified' }),
      Document.countDocuments({ status: 'expired' }),
      Document.countDocuments({ status: 'requires_update' }),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          pending,
          verified,
          expired,
          rejected,
          total: pending + verified + expired + rejected,
        },
      },
    })
  } catch (error) {
    console.error('Error in getVerificationStats:', error)
    next(error)
  }
}
