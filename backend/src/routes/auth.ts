import { Router, Request, Response } from 'express';
import { 
  login, 
  me, 
  requestPasswordResetOtp, 
  verifyPasswordResetOtp, 
  resetPasswordWithOtp 
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public signup is disabled — accounts are created by OWNER/MANAGER via the admin dashboard
router.post('/signup', (_req: Request, res: Response) => {
  res.status(403).json({ error: 'Public registration is disabled. Please contact your Owner or Manager to create an account.' });
});
router.post('/login', login);
router.get('/me', authMiddleware(), me);

// Password Reset via Mobile Phone Number OTP
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

export default router;
