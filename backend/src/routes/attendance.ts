import { Router } from 'express';
import { checkIn, checkOut, getAttendances } from '../controllers/attendanceController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/checkin', authMiddleware(['SITE_MANAGER']), checkIn);
router.post('/checkout', authMiddleware(['SITE_MANAGER']), checkOut);
router.get('/', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER', 'WORKER']), getAttendances);

export default router;
