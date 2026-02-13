import express from 'express'
import {
  createAdminPlan,
  createBillingPortalSession,
  createCheckoutSession,
  createSetupSession,
  createSetupIntent,
  getAdminPlans,
  getMySubscription,
  getPaymentMethods,
  getPlans,
  removePaymentMethod,
  setDefaultPaymentMethod,
  syncCheckoutSession,
  updateAdminPlan,
} from '../controllers/subscriptionController.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)

router.get('/plans', getPlans)
router.get('/me', getMySubscription)
router.post('/checkout-session', createCheckoutSession)
router.post('/checkout/sync', syncCheckoutSession)
router.post('/billing-portal', createBillingPortalSession)
router.post('/setup-session', createSetupSession)
router.post('/setup-intent', createSetupIntent)
router.get('/payment-methods', getPaymentMethods)
router.post('/payment-methods/default', setDefaultPaymentMethod)
router.delete('/payment-methods/:paymentMethodId', removePaymentMethod)

router.use(restrictTo('admin'))

router.get('/admin/plans', getAdminPlans)
router.post('/admin/plans', createAdminPlan)
router.patch('/admin/plans/:planId', updateAdminPlan)

export default router
