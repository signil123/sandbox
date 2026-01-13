// File: client/src/services/eventService.js
import axiosInstance from '../config'

export const eventService = {
  /**
   * Create a new event
   * @param {Object} eventData - title, description, eventType, startDate, endDate, location, isVirtual, virtualLocation, inviteeId
   */
  createEvent: (eventData) => {
    return axiosInstance.post('/events', eventData)
  },

  /**
   * Get event by ID
   * @param {string} id 
   */
  getEvent: (id) => {
    return axiosInstance.get(`/events/${id}`)
  },

  /**
   * Respond to an event invitation from a message
   * @param {string} messageId - The message ID containing the event invitation
   * @param {string} status - 'accepted' or 'declined'
   */
  respondToEventInviteFromMessage: (messageId, status) => {
    return axiosInstance.post(`/events/messages/${messageId}/respond`, { status })
  }
}
