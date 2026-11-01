import { Router } from 'express';
import { calculateSalary, getSalaryReports } from '../controllers/salaryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/calculate', authMiddleware(['OWNER', 'MANAGER']), calculateSalary);
router.get('/reports', authMiddleware(['OWNER', 'MANAGER', 'WORKER']), getSalaryReports);
router.get('/:workerId', authMiddleware(['OWNER', 'MANAGER', 'WORKER']), getSalaryReports);
router.get('/', authMiddleware(['OWNER', 'MANAGER', 'WORKER']), getSalaryReports);

export default router;

