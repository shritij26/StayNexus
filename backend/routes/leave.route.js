import express from 'express';
import authenticationMiddleware from '../middlewares/authentication.js';
import { createLeave, getLeaves, updateLeaveStatus } from '../controllers/leave/leave.js';

const router = express.Router();

router.get('/leaves', authenticationMiddleware, getLeaves);
router.post('/leaves', authenticationMiddleware, createLeave);
router.patch('/leaves/:leaveId', authenticationMiddleware, updateLeaveStatus);

export default router;