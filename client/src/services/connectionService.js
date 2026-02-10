import axiosInstance from '../config'

const API_URL = '/connections'

export const connectionService = {
  // Connection Requests
  sendRequest: (userId, targetUserId, message) => 
    axiosInstance.post(`${API_URL}/send/${userId}/${targetUserId}`, { message }),
  
  getPendingRequests: (userId) => 
    axiosInstance.get(`${API_URL}/pending/${userId}`),
  
  getSentRequests: (userId) => 
    axiosInstance.get(`${API_URL}/sent/${userId}`),
  
  acceptRequest: (userId, requestId) => 
    axiosInstance.put(`${API_URL}/accept/${userId}/${requestId}`),
  
  declineRequest: (userId, requestId) =>
    axiosInstance.delete(`/connections/decline/${userId}/${requestId}`),
  
  cancelRequest: (userId, requestId) =>
    axiosInstance.delete(`/connections/cancel/${userId}/${requestId}`),
  
  getSummary: (userId) => 
    axiosInstance.get(`${API_URL}/summary/${userId}`),

  // Network
  getNetwork: (userId) => 
    axiosInstance.get(`${API_URL}/network/${userId}`),

  getPublicNetwork: (userId) =>
    axiosInstance.get(`${API_URL}/public/${userId}`),

  removeConnection: (userId, connectionId) =>
    axiosInstance.delete(`${API_URL}/remove/${userId}/${connectionId}`),
    
  // Role specific network
  getAthletesAdvisors: (athleteId) => 
    axiosInstance.get(`/athlete/profile/${athleteId}/advisors`),
    
  getAdvisorsRoster: (advisorId) => 
    axiosInstance.get(`/advisor/roster/${advisorId}`),
}
