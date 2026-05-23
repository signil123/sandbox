import axiosInstance from '../config'

const handleError = (error) => {
  const message =
    error.response?.data?.message || error.message || 'An error occurred'
  console.error('Profile Service Error:', {
    message,
    status: error.response?.status,
    error,
  })
  throw message
}

let _interestsCatalogCache = null
let _focusAreasCatalogCache = null

export const profileService = {
  /**
   * Get the athlete interests catalog. Memoized — fetched once per session.
   * Returns: { catalog: [{category, value}], minForCompletion: number }
   */
  getInterestsCatalog: async () => {
    if (_interestsCatalogCache) return _interestsCatalogCache
    try {
      const response = await axiosInstance.get('/profile/interests/catalog')
      _interestsCatalogCache = response.data?.data || response.data
      return _interestsCatalogCache
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get the NIL focus areas catalog. Memoized — fetched once per session.
   * Returns: { catalog: [{category, value}], minForCompletion: number }
   */
  getFocusAreasCatalog: async () => {
    if (_focusAreasCatalogCache) return _focusAreasCatalogCache
    try {
      const response = await axiosInstance.get('/profile/nil/focus-areas-catalog')
      _focusAreasCatalogCache = response.data?.data || response.data
      return _focusAreasCatalogCache
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get or create user's profile
   */
  getMyProfile: async () => {
    try {
      const response = await axiosInstance.get('/profile/me')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get complete athlete profile bundle (single request)
   * Includes: profile data, interests, NIL preferences, completion percentage
   */
  getAthleteProfileBundle: async () => {
    try {
      const response = await axiosInstance.get('/profile/me/bundle')
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get specific user profile
   */
  getProfileByUserId: async (userId) => {
    try {
      const response = await axiosInstance.get(`/profile/${userId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get public profile (no auth required)
   *
   * 404s are silently re-thrown without `console.error` because the caller —
   * the Connection mini-card data builder — falls back to stub fields when
   * a connection has no Profile doc. Logging would flood the console for
   * what is an expected branch on synthetic / test users.
   */
  getPublicProfile: async (userId) => {
    try {
      const response = await axiosInstance.get(`/profile/public/${userId}`)
      return response.data
    } catch (error) {
      if (error?.response?.status === 404) {
        const message = error.response?.data?.message || 'Profile not found'
        throw message
      }
      handleError(error)
    }
  },

  /**
   * Update basic profile information
   */
  updateBasicProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/profile/me/basic', profileData)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update athlete-specific profile
   */
  updateAthleteProfile: async (athleteData) => {
    try {
      const response = await axiosInstance.put(
        '/profile/me/athlete',
        athleteData
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update athlete interests.
   * @param {string[]} interests - array of catalog values (min 5 enforced server-side)
   * Example: ['Brand Partnerships', 'Content Creation', 'Sports Nutrition', ...]
   */
  updateAthleteInterests: async (interests) => {
    try {
      const response = await axiosInstance.put('/profile/me/interests', {
        interests,
      })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update advisor-specific profile
   */
  updateAdvisorProfile: async (advisorData) => {
    try {
      const response = await axiosInstance.put(
        '/profile/me/advisor',
        advisorData
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update NIL preferences
   */
  updateNILPreferences: async (preferences) => {
    try {
      const response = await axiosInstance.put(
        '/profile/me/nil-preferences',
        preferences
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get activity timeseries for a metric + range.
   * @param {'views'|'connections'|'received'|'sent'} metric
   * @param {'1D'|'1W'|'1M'|'3M'|'YTD'|'1Y'} range
   * Returns: { points, allTimeTotal, windowDelta, deltaPct, rangeLabel, ... }
   */
  getActivityStats: async (metric, range) => {
    try {
      const response = await axiosInstance.get(
        `/profile/me/stats/${metric}?range=${encodeURIComponent(range)}`
      )
      return response.data?.data || response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get profile completion percentage
   */
  getProfileCompletion: async () => {
    try {
      const response = await axiosInstance.get('/profile/me/completion')
      return response.data
    } catch (error) {
      console.warn('Failed to fetch profile completion:', error.message)
      return { data: { completionPercentage: 0 } }
    }
  },

  /**
   * Get all advisors with filtering
   */
  getAllAdvisors: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page)
      if (filters.limit) params.append('limit', filters.limit)
      if (filters.specialization)
        params.append('specialization', filters.specialization)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)

      const response = await axiosInstance.get(
        `/profile/advisors?${params.toString()}`
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get recommended advisors for current user
   */
  getRecommendedAdvisors: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(
        `/profile/recommendations/advisors?limit=${limit}`
      )
      return response.data
    } catch (error) {
      console.warn('Failed to fetch recommended advisors:', error.message)
      return { data: { advisors: [] } }
    }
  },

  /**
   * Delete profile
   */
  deleteProfile: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/profile/${userId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Upload file
   */
  uploadFile: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Submit document for verification
   */
  submitDocument: async (advisorId, documentData) => {
    try {
      const response = await axiosInstance.post(
        `/documents/submit/${advisorId}`,
        documentData
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get advisor documents
   */
  getAdvisorDocuments: async (advisorId) => {
    try {
      const response = await axiosInstance.get(`/documents/advisor/${advisorId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get complete advisor profile bundle
   */
  getAdvisorProfile: async (advisorId) => {
    try {
      const response = await axiosInstance.get(`/advisor/profile/${advisorId}`)
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update advisor personal information
   */
  updateAdvisorInfo: async (advisorId, advisorData) => {
    try {
      const response = await axiosInstance.put(
        `/advisor/profile/${advisorId}/info`,
        advisorData
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update advisor professional information
   */
  updateAdvisorProfessionalInfo: async (advisorId, professionalData) => {
    try {
      const response = await axiosInstance.put(
        `/advisor/profile/${advisorId}/professional`,
        professionalData
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update advisor NIL preferences
   */
  updateAdvisorNILPreferences: async (advisorId, preferences) => {
    try {
      const response = await axiosInstance.put(
        `/advisor/nil-preferences/${advisorId}`,
        preferences
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Get advisor verification status
   */
  getVerificationStatus: async (advisorId) => {
    try {
      const response = await axiosInstance.get(
        `/advisor/verification/${advisorId}`
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Delete document
   */
  deleteDocument: async (advisorId, documentId) => {
    try {
      const response = await axiosInstance.delete(
        `/documents/delete/${advisorId}/${documentId}`
      )
      return response.data
    } catch (error) {
      handleError(error)
    }
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await axiosInstance.put('/messages/settings', { settings })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
  /**
   * Update user status (online, away, idle, etc)
   */
  updateStatus: async (status) => {
    try {
      const response = await axiosInstance.put('/messages/status', { status })
      return response.data
    } catch (error) {
      handleError(error)
    }
  },
}
