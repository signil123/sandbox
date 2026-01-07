// File: server/routes/eventRoutes.js
import express from 'express';
import {
    createEvent,
    deleteEvent,
    getEvent,
    getPendingInvites,
    getUpcomingEvents,
    getUserEvents,
    respondToInvite,
    updateEvent
} from '../controllers/event.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createEvent);
router.get('/', getUserEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/invites', getPendingInvites);
router.get('/:id', getEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.patch('/:id/respond', respondToInvite);

export default router;
