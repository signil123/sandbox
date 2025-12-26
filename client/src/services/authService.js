// File: client/src/services/authService.js
import axiosInstance from '../config'

export const authService = {
  signup: async (userData) => {
    try {
      const { firstName, lastName, email, password, phone, userType } = userData

      const response = await axiosInstance.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
        phone,
        userType,
      })

      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        sessionStorage.setItem('token', response.data.token)
      }

      return response.data
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Signup failed'
    }
  },

  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/signin', {
        email,
        password,
      })

      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        sessionStorage.setItem('token', response.data.token)
      }

      return response.data
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed'
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/auth/profile', profileData)
      return response.data
    } catch (error) {
      throw (
        error.response?.data?.message ||
        error.message ||
        'Profile update failed'
      )
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      return response.data
    } catch (error) {
      throw (
        error.response?.data?.message ||
        error.message ||
        'Password change failed'
      )
    }
  },
}
