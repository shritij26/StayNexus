import { Router } from 'express';
import authenticationMiddleware from '../middlewares/authentication.js';
import {
	getAttendantMonthlyAttendance,
	getMonthlyAttendance,
	markAttendance,
} from '../controllers/attendance/attendance.js';

const router = Router();

router.post('/mark', authenticationMiddleware, markAttendance);
router.get('/monthly', authenticationMiddleware, getMonthlyAttendance);
router.get('/attendant/monthly', authenticationMiddleware, getAttendantMonthlyAttendance);

export default router;
