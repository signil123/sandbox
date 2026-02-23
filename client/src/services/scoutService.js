import axiosInstance from '../config'

export const scoutService = {
  chat: async ({ message, history = [] }) => {
    const response = await axiosInstance.post('/scout/chat', {
      message,
      history,
    })
    return response.data
  },
}
