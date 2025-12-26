// File: client/src/services/exploreService.js
import axiosInstance from '../config'

export const exploreService = {
  getUsers: async (userId, params) => {
    return axiosInstance.get(`/explore/users/${userId}`, { params })
  },
  getRecommendations: async (userId, limit = 10) => {
    return axiosInstance.get(`/explore/recommendations/${userId}`, { params: { limit } })
  },
  getFilters: async (userId) => {
    return axiosInstance.get(`/explore/filters/${userId}`)
  },
  getMatchDetails: async (userId, targetUserId) => {
    return axiosInstance.get(`/explore/match/${userId}/${targetUserId}`)
  },
}
