import axiosInstance from '../config'

const handleError = (error) => {
  const message =
    error.response?.data?.message || error.message || 'An error occurred'
  console.error('Admin Service Error:', {
    message,
    status: error.response?.status,
    error,
  })
  throw message
}

export const adminService = {
  /**
   * User Management
   */
  getAllUsers: async (page = 1, limit = 10, search = '', role = 'all', userType = 'all') => {
    try {
      const response = await axiosInstance.get(`/auth/all-users?page=${page}&limit=${limit}&search=${search}&role=${role}&userType=${userType}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/auth/admin/users/${userId}`, userData)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Verification Queue
   */
  getPendingDocuments: async (page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/documents/admin/pending?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  getVerificationStats: async () => {
    try {
      const response = await axiosInstance.get('/documents/admin/stats')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  approveDocument: async (docId, adminNotes = '') => {
    try {
      const response = await axiosInstance.put(`/documents/admin/approve/${docId}`, { adminNotes })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  declineDocument: async (docId, rejectionReason, adminNotes = '') => {
    try {
      const response = await axiosInstance.put(`/documents/admin/decline/${docId}`, { 
        rejectionReason, 
        adminNotes 
      })
      return response.data
    } catch (error) {
      handleError(error)
    }
  }
}
