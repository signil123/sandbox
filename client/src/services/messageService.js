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
  
  sendMessage: (conversationId, content, type = 'text', attachments = [], eventInfo = null) => 
    axiosInstance.post(`${API_URL}/conversations/${conversationId}/messages`, { content, type, attachments, eventInfo }),
}
