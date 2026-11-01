import { Router } from 'express';
import { checkIn, checkOut, getAttendances } from '../controllers/attendanceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/checkin', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER']), checkIn);
router.post('/checkout', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER']), checkOut);
router.get('/', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER', 'WORKER']), getAttendances);

export default router;
