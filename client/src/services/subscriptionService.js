import axiosInstance from '../config'

const handleError = (error) => {
  throw error.response?.data?.message || error.message || 'Subscription request failed'
}

export const subscriptionService = {
  getPlans: async () => {
    try {
      const response = await axiosInstance.get('/subscriptions/plans')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  getMySubscription: async () => {
    try {
      const response = await axiosInstance.get('/subscriptions/me')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  createCheckoutSession: async (planId) => {
    try {
      const response = await axiosInstance.post('/subscriptions/checkout-session', { planId })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  syncCheckoutSession: async (sessionId) => {
    try {
      const response = await axiosInstance.post('/subscriptions/checkout/sync', { sessionId })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  createBillingPortalSession: async () => {
    try {
      const response = await axiosInstance.post('/subscriptions/billing-portal')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  createSetupSession: async () => {
    try {
      const response = await axiosInstance.post('/subscriptions/setup-session')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  createSetupIntent: async () => {
    try {
      const response = await axiosInstance.post('/subscriptions/setup-intent')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  getPaymentMethods: async () => {
    try {
      const response = await axiosInstance.get('/subscriptions/payment-methods')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await axiosInstance.post('/subscriptions/payment-methods/default', { paymentMethodId })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  removePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await axiosInstance.delete(`/subscriptions/payment-methods/${paymentMethodId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  getAdminPlans: async () => {
    try {
      const response = await axiosInstance.get('/subscriptions/admin/plans')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  updateAdminPlan: async (planId, payload) => {
    try {
      const response = await axiosInstance.patch(`/subscriptions/admin/plans/${planId}`, payload)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
}
