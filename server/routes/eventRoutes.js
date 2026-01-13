// File: server/routes/eventRoutes.js
import express from 'express';
import {
    createEvent,
    deleteEvent,
    getEvent,
    getEventFeed,
    getPendingInvites,
    getSyncInfo,
    getUpcomingEvents,
    getUserEvents,
    respondToEventInviteFromMessage,
    respondToInvite,
    updateEvent
} from '../controllers/event.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public iCal feed route
router.get('/feed/:userId/:token', getEventFeed);

router.use(verifyToken);

router.post('/', createEvent);
router.get('/', getUserEvents);
router.get('/sync-info', getSyncInfo);
router.get('/upcoming', getUpcomingEvents);
router.get('/invites', getPendingInvites);
router.get('/:id', getEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.patch('/:id/respond', respondToInvite);
router.post('/messages/:messageId/respond', respondToEventInviteFromMessage);

export default router;

