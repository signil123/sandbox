import axiosInstance from '../config'

const API_URL = '/messages'

export const messageService = {
  // Conversations
  getConversations: () => 
    axiosInstance.get(`${API_URL}/conversations`),
  
  startConversation: (recipientId) => 
    axiosInstance.post(`${API_URL}/conversations`, { recipientId }),
  
  // Messages
  getMessages: (conversationId, page = 1, limit = 50) => 
    axiosInstance.get(`${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  
  sendMessage: (conversationId, content, options = {}) => {
    const { type = 'text', attachments = [], eventInfo = null } = options
    return axiosInstance.post(`${API_URL}/conversations/${conversationId}/messages`, { 
        content, 
        type, 
        attachments, 
        eventInfo 
    })
  },

  uploadFile: (formData) => 
    axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  archiveConversation: (conversationId) =>
    axiosInstance.delete(`${API_URL}/conversations/${conversationId}`),

  /**
   * Search messages across all conversations
   * @param {string} query 
   */
  searchMessages: (query) => {
    return axiosInstance.get(`/messages/search?q=${encodeURIComponent(query)}`)
  },

  blockUser: (conversationId) =>
    axiosInstance.post(`${API_URL}/conversations/${conversationId}/block`),

  unblockUser: (conversationId) =>
    axiosInstance.post(`${API_URL}/conversations/${conversationId}/unblock`),
}
