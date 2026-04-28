import axiosInstance from '../config'

export const scoutService = {
  chat: async ({ message, history = [], file = null }) => {
    if (file) {
      const formData = new FormData()
      formData.append('message', message || '')
      formData.append('history', JSON.stringify(history))
      formData.append('file', file)
      const response = await axiosInstance.post('/scout/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    const response = await axiosInstance.post('/scout/chat', { message, history })
    return response.data
  },
}
