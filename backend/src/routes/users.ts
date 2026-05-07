import { Router } from 'express';
import { getUsers, createUser, approveUser, deleteUser, updateUser } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER']), getUsers);
router.post('/', authMiddleware(['OWNER', 'MANAGER']), createUser);
router.put('/:id/approve', authMiddleware(['OWNER', 'MANAGER']), approveUser);
router.put('/:id', authMiddleware(['OWNER', 'MANAGER']), updateUser);
router.delete('/:id', authMiddleware(['OWNER', 'MANAGER']), deleteUser);

export default router;
