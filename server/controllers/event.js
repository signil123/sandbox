import crypto from 'crypto';
import { createError } from '../error.js';
import { Event, Invitation } from '../models/Event.js';
import { Conversation, Message } from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

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
      timeZone,
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
      timeZone: timeZone || 'UTC',
      attachments,
    });

    // If invitees are provided, send invitations
    if (inviteeIds && Array.isArray(inviteeIds) && inviteeIds.length > 0) {
      await event.sendInvitations(inviteeIds);

      const creator = await User.findById(creatorId);
      const io = getIO();
      
      // Send event invitation message and notify each invitee
      await Promise.all(inviteeIds.map(async (inviteeId) => {
        // Find conversation (including archived ones) or create new one
        let conversation = await Conversation.findOne({
          $or: [
            { participant1: creatorId, participant2: inviteeId },
            { participant1: inviteeId, participant2: creatorId },
          ],
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participant1: creatorId,
            participant2: inviteeId,
          });
        } else if (conversation.isArchived) {
          // Unarchive the conversation if it was previously archived/deleted
          conversation.isArchived = false;
          await conversation.save();
        }

        // Create event invitation message
        const message = await Message.create({
          conversation: conversation._id,
          sender: creatorId,
          content: `${creator.name} invited you to: ${title}`,
          type: 'event_invitation',
          eventInfo: {
            eventId: event._id,
            title,
            startTime: new Date(startDate),
            endTime: new Date(endDate),
            location: location?.address || virtualLocation?.link || '',
            link: virtualLocation?.link || '',
            invitationStatus: 'pending',
            timeZone: timeZone || 'UTC',
          }
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        conversation.messageCount = (conversation.messageCount || 0) + 1;
        await conversation.save();

        // Emit socket event to the invitee
        io.to(inviteeId.toString()).emit('event_invitation', {
          message,
          conversationId: conversation._id,
          event: { _id: event._id, title, startDate, endDate }
        });

        // Also emit to conversation room for anyone viewing
        io.to(conversation._id.toString()).emit('new_message', {
          message,
          conversationId: conversation._id,
        });

        // Create notification
        await Notification.create({
          recipient: inviteeId,
          sender: creatorId,
          type: 'event_invitation',
          priority: 'medium',
          title: `New event invitation: ${title}`,
          description: `${creator.name} invited you to an event on ${new Date(startDate).toLocaleDateString()}`,
          actionUrl: `/messages`,
          relatedEntity: {
            entityType: 'event',
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

    // Fetch all invitations for events where the logged-in user is the creator
    const creatorEventIds = events
      .filter(e => e.creator._id.toString() === userId)
      .map(e => e._id);
    
    let allInvitationsForOwnedEvents = [];
    if (creatorEventIds.length > 0) {
      allInvitationsForOwnedEvents = await Invitation.find({ event: { $in: creatorEventIds } })
        .populate('invitee', 'name profileImage email');
    }

    // Enrich events with invitation status for this user
    const enrichedEvents = events.map(event => {
      const invitation = invitations.find(inv => inv.event.toString() === event._id.toString());
      const eventObj = event.toObject();
      // If creator, or no invitation (shouldn't happen with the query), default to 'accepted'
      eventObj.invitationStatus = invitation ? invitation.status : (event.creator._id.toString() === userId ? 'accepted' : 'none');
      
      // If creator, attach all invitations for this event
      if (event.creator._id.toString() === userId) {
        eventObj.attendees = allInvitationsForOwnedEvents.filter(inv => inv.event.toString() === event._id.toString());
      }
      
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

/**
 * Respond to event invitation from a message (MessagePage flow)
 */
export const respondToEventInviteFromMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    const userId = req.user.id;

    if (!['accepted', 'declined'].includes(status)) {
      return next(createError(400, 'Invalid status. Must be "accepted" or "declined"'));
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message || message.type !== 'event_invitation') {
      return next(createError(404, 'Event invitation message not found'));
    }

    // Verify user is the recipient (not sender)
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    const isRecipient = 
      (conversation.participant1.toString() === userId || conversation.participant2.toString() === userId) &&
      message.sender.toString() !== userId;

    if (!isRecipient) {
      return next(createError(403, 'You cannot respond to this invitation'));
    }

    // Update the invitation in Event model
    const invitation = await Invitation.findOne({ 
      event: message.eventInfo.eventId, 
      invitee: userId 
    });

    if (!invitation) {
      return next(createError(404, 'Invitation not found'));
    }

    if (status === 'accepted') {
      await invitation.accept();
    } else {
      await invitation.decline();
    }

    // Update message's eventInfo.invitationStatus
    message.eventInfo.invitationStatus = status;
    await message.save();

    // Notify the event creator
    const responder = await User.findById(userId);
    const event = await Event.findById(message.eventInfo.eventId);
    
    await Notification.create({
      recipient: event.creator,
      sender: userId,
      type: 'event_response',
      priority: 'low',
      title: `Event invitation ${status}`,
      description: `${responder.name} has ${status} your invitation to ${event.title}`,
      actionUrl: `/calendar`,
    });

    // Emit socket event to update both parties
    const io = getIO();
    io.to(message.conversation.toString()).emit('event_invitation_response', {
      messageId: message._id,
      status,
      eventId: event._id
    });

    res.status(200).json({
      status: 'success',
      message: `Successfully ${status} the event invitation`,
      data: { invitation, message }
    });
  } catch (error) {
    console.error('Error in respondToEventInviteFromMessage:', error);
    next(error);
  }
};

/**
 * GET iCal feed for a user
 * Public route with token verification
 */
export const getEventFeed = async (req, res, next) => {
  try {
    const { userId, token } = req.params;

    // Verify token: hmac of userId with JWT_SECRET
    const expectedToken = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(userId)
      .digest('hex')
      .substring(0, 16);

    if (token !== expectedToken) {
      return next(createError(403, 'Invalid calendar token'));
    }

    // Fetch user events and accepted invitations
    const invitations = await Invitation.find({ 
      invitee: userId, 
      status: 'accepted' 
    });
    
    const invitedEventIds = invitations.map(inv => inv.event);

    const events = await Event.find({
      $or: [
        { creator: userId },
        { _id: { $in: invitedEventIds } }
      ],
      isCancelled: false
    });

    // Generate ICS content
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Signil//NONSGML Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Signil Calendar',
      'X-WR-TIMEZONE:UTC',
    ];

    const formatIcalDate = (date) => {
      try {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      } catch (e) {
        return new Date().toISOString().replace(/-|:|\.\d+/g, '');
      }
    };

    events.forEach(event => {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event._id}@signil.com`);
      icsContent.push(`DTSTAMP:${formatIcalDate(new Date())}`);
      icsContent.push(`DTSTART:${formatIcalDate(event.startDate)}`);
      icsContent.push(`DTEND:${formatIcalDate(event.endDate)}`);
      icsContent.push(`SUMMARY:${event.title}`);
      if (event.description) icsContent.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
      
      const location = event.location?.address || event.virtualLocation?.link || '';
      if (location) icsContent.push(`LOCATION:${location}`);
      
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.status(200).send(icsContent.join('\r\n'));
  } catch (error) {
    console.error('Error in getEventFeed:', error);
    next(error);
  }
};

/**
 * Get calendar sync information (personal link)
 */
export const getSyncInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Generate secure token
    const token = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(userId)
      .digest('hex')
      .substring(0, 16);
      
    const apiBaseUrl = process.env.VITE_API_URL || `${req.protocol}://${req.get('host')}/api`;
    const syncUrl = `${apiBaseUrl}/events/feed/${userId}/${token}`.replace('http://', 'webcal://').replace('https://', 'webcal://');
    const downloadUrl = `${apiBaseUrl}/events/feed/${userId}/${token}`;

    res.status(200).json({
      status: 'success',
      data: {
        syncUrl,
        downloadUrl,
        token
      }
    });
  } catch (error) {
    console.error('Error in getSyncInfo:', error);
    next(error);
  }
};
