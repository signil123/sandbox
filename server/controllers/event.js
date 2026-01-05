// File: server/controllers/event.js
import { createError } from '../error.js';
import { Event } from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a new event
 */
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, eventType, startDate, endDate, location, isVirtual, virtualLocation, inviteeId } = req.body;
    const creatorId = req.user.id;

    if (!title || !eventType || !startDate || !endDate) {
      return next(createError(400, 'Title, type, start date and end date are required'));
    }

    const event = await Event.create({
      creator: creatorId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      isVirtual,
      virtualLocation,
    });

    // If an invitee is provided, create an invitation automatically
    if (inviteeId) {
       // We can use the model method if we want, or do it here
       await event.sendInvitations([inviteeId]);

       // Create notification for invitee
       const creator = await User.findById(creatorId);
       await Notification.create({
         recipient: inviteeId,
         sender: creatorId,
         type: 'event_invitation',
         priority: 'medium',
         title: `New event invitation: ${title}`,
         description: `${creator.name} invited you to an event on ${new Date(startDate).toLocaleDateString()}`,
         actionUrl: `/calendar`, // Assuming there's a calendar page
       });
    }

    res.status(201).json({
      status: 'success',
      data: { event },
    });
  } catch (error) {
    console.error('Error in createEvent:', error);
    next(error);
  }
};

/**
 * Get event by ID
 */
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('creator', 'name profileImage');
    if (!event) {
      return next(createError(404, 'Event not found'));
    }
    res.status(200).json({
      status: 'success',
      data: { event },
    });
  } catch (error) {
    console.error('Error in getEvent:', error);
    next(error);
  }
};
