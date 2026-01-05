// File: server/routes/eventRoutes.js
import express from 'express';
import { createEvent, getEvent } from '../controllers/event.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createEvent);
router.get('/:id', getEvent);

export default router;
