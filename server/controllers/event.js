// File: server/controllers/event.js
import { createError } from '../error.js';
import { Event, Invitation } from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a new event
 */
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      eventType,
      locationType,
      location,
      virtualLocation,
      startDate,
      endDate,
      attachments,
      inviteeIds, // Changed to array for consistency with plan
    } = req.body;
    const creatorId = req.user.id;

    if (!title || !eventType || !locationType || !startDate || !endDate) {
      return next(createError(400, 'Title, eventType, locationType, start date and end date are required'));
    }

    const event = await Event.create({
      creator: creatorId,
      title,
      description,
      eventType,
      locationType,
      location,
      virtualLocation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      attachments,
    });

    // If invitees are provided, send invitations
    if (inviteeIds && Array.isArray(inviteeIds) && inviteeIds.length > 0) {
      await event.sendInvitations(inviteeIds);

      const creator = await User.findById(creatorId);
      // Notify each invitee
      await Promise.all(inviteeIds.map(async (inviteeId) => {
        await Notification.create({
          recipient: inviteeId,
          sender: creatorId,
          type: 'event_invitation',
          priority: 'medium',
          title: `New event invitation: ${title}`,
          description: `${creator.name} invited you to an event on ${new Date(startDate).toLocaleDateString()}`,
          actionUrl: `/calendar`,
          relatedEntity: {
            entityType: 'Event',
            entityId: event._id
          }
        });
      }));
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
 * Get all events for the user (created or invited/accepted)
 */
export const getUserEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    // Get all non-declined invitations
    const invitations = await Invitation.find({ 
      invitee: userId, 
      status: { $in: ['accepted', 'pending', 'maybe'] } 
    });
    
    const invitedEventIds = invitations.map(inv => inv.event);

    const query = {
      $or: [
        { creator: userId },
        { _id: { $in: invitedEventIds } }
      ]
    };

    if (type && type !== 'All') {
      query.locationType = type;
    }

    const events = await Event.find(query)
      .populate('creator', 'name profileImage')
      .sort({ startDate: 1 });

    // Enrich events with invitation status for this user
    const enrichedEvents = events.map(event => {
      const invitation = invitations.find(inv => inv.event.toString() === event._id.toString());
      const eventObj = event.toObject();
      // If creator, or no invitation (shouldn't happen with the query), default to 'accepted'
      eventObj.invitationStatus = invitation ? invitation.status : (event.creator._id.toString() === userId ? 'accepted' : 'none');
      return eventObj;
    });

    res.status(200).json({
      status: 'success',
      data: { events: enrichedEvents },
    });
  } catch (error) {
    console.error('Error in getUserEvents:', error);
    next(error);
  }
};

/**
 * Get upcoming events for dashboard/widget
 */
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const invitations = await Invitation.find({ 
      invitee: userId, 
      status: { $in: ['accepted', 'pending', 'maybe'] } 
    });
    
    const invitedEventIds = invitations.map(inv => inv.event);

    const events = await Event.find({
      $or: [
        { creator: userId, startDate: { $gt: now } },
        { _id: { $in: invitedEventIds }, startDate: { $gt: now } }
      ],
      isCancelled: false
    })
      .populate('creator', 'name profileImage')
      .sort({ startDate: 1 })
      .limit(10);

    const enrichedEvents = events.map(event => {
      const invitation = invitations.find(inv => inv.event.toString() === event._id.toString());
      const eventObj = event.toObject();
      eventObj.invitationStatus = invitation ? invitation.status : (event.creator._id.toString() === userId ? 'accepted' : 'none');
      return eventObj;
    });

    res.status(200).json({
      status: 'success',
      data: { events: enrichedEvents },
    });
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error);
    next(error);
  }
};

/**
 * Get pending invites for user
 */
export const getPendingInvites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const invitations = await Invitation.find({ invitee: userId, status: 'pending' })
      .populate({
        path: 'event',
        populate: { path: 'creator', select: 'name profileImage' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { invitations },
    });
  } catch (error) {
    console.error('Error in getPendingInvites:', error);
    next(error);
  }
};

/**
 * Helper to get IDs of events where user has accepted
 */
const getAcceptedEventIds = async (userId) => {
  const invitations = await Invitation.find({ invitee: userId, status: 'accepted' });
  return invitations.map(inv => inv.event);
};

/**
 * Get event by ID
 */
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name profileImage')
      .populate({
        path: 'agenda.speaker',
        select: 'name profileImage'
      });

    if (!event) {
      return next(createError(404, 'Event not found'));
    }

    // Check if user has an invitation
    const invitation = await Invitation.findOne({ 
      event: event._id, 
      invitee: req.user.id 
    });

    res.status(200).json({
      status: 'success',
      data: { 
        event,
        invitationStatus: invitation ? invitation.status : (event.creator.toString() === req.user.id ? 'creator' : 'none')
      },
    });
  } catch (error) {
    console.error('Error in getEvent:', error);
    next(error);
  }
};

/**
 * Update event
 */
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(createError(404, 'Event not found'));

    if (event.creator.toString() !== req.user.id) {
      return next(createError(403, 'You can only update your own events'));
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { event: updatedEvent },
    });
  } catch (error) {
    console.error('Error in updateEvent:', error);
    next(error);
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(createError(404, 'Event not found'));

    if (event.creator.toString() !== req.user.id) {
      return next(createError(403, 'You can only delete your own events'));
    }

    // If it has invitations, we should probably mark as cancelled or delete invitations too
    await Invitation.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    next(error);
  }
};

/**
 * Respond to an invitation
 */
export const respondToInvite = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted', 'declined'
    const userId = req.user.id;
    const eventId = req.params.id;

    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return next(createError(400, 'Invalid status'));
    }

    const invitation = await Invitation.findOne({ event: eventId, invitee: userId });
    if (!invitation) return next(createError(404, 'Invitation not found'));

    if (status === 'accepted') {
      await invitation.accept();
    } else if (status === 'declined') {
      await invitation.decline();
    } else {
      await invitation.markMaybe();
    }

    // Notify creator
    const invitee = await User.findById(userId);
    const event = await Event.findById(eventId);
    
    await Notification.create({
      recipient: event.creator,
      sender: userId,
      type: 'event_response',
      priority: 'low',
      title: `Event invitation ${status}`,
      description: `${invitee.name} has ${status} your invitation to ${event.title}`,
      actionUrl: `/calendar`,
    });

    res.status(200).json({
      status: 'success',
      message: `Successfully ${status} the invitation`,
    });
  } catch (error) {
    console.error('Error in respondToInvite:', error);
    next(error);
  }
};
