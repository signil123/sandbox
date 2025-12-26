import axiosInstance from '../config'

const handleError = (error) => {
  const message =
    error.response?.data?.message || error.message || 'An error occurred'
  console.error('Notification Service Error:', {
    message,
    status: error.response?.status,
    error,
  })
  throw message
}

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('/notifications')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id) => {
    try {
      const response = await axiosInstance.put(`/notifications/${id}/read`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await axiosInstance.put('/notifications/mark-all-read')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    try {
      const response = await axiosInstance.delete(`/notifications/${id}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
}
