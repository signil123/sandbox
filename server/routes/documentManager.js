// File: server/routes/documentManager.js
// File: server/routes/documentManager.js
import express from 'express'
import {
  approveDocument,
  declineDocument,
  deleteDocument,
  getAdvisorDocuments,
  getAdvisorDocumentsAdmin,
  getDocument,
  getPendingDocuments,
  getVerificationStats,
  markDocumentExpired,
  submitDocument,
  updateDocument,
} from '../controllers/documentManager.js'
import {
  checkOwnershipOrAdmin,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// ═══════════════════════════════════════════════════════════════════════════
// ADVISOR/AGENT DOCUMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// Submit document for verification
router.post(
  '/submit/:advisorId',
  checkOwnershipOrAdmin('advisorId'),
  submitDocument
)

// Get all documents for advisor
router.get(
  '/advisor/:advisorId',
  checkOwnershipOrAdmin('advisorId'),
  getAdvisorDocuments
)

// Get single document
router.get(
  '/document/:advisorId/:documentId',
  checkOwnershipOrAdmin('advisorId'),
  getDocument
)

// Update/resubmit document
router.put(
  '/update/:advisorId/:documentId',
  checkOwnershipOrAdmin('advisorId'),
  updateDocument
)

// Delete document
router.delete(
  '/delete/:advisorId/:documentId',
  checkOwnershipOrAdmin('advisorId'),
  deleteDocument
)

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN VERIFICATION & MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// Admin only routes
router.use(restrictTo('admin'))

// Get all pending documents (with pagination)
router.get('/admin/pending', getPendingDocuments)

// Get all documents for specific advisor
router.get('/admin/advisor/:advisorId', getAdvisorDocumentsAdmin)

// Approve document
router.put('/admin/approve/:documentId', approveDocument)

// Decline/reject document
router.put('/admin/decline/:documentId', declineDocument)

// Mark document as expired
router.put('/admin/expire/:documentId', markDocumentExpired)

// Get verification statistics
router.get('/admin/stats', getVerificationStats)

export default router
