import { Router } from 'express';
import { 
  getCompanyInfo, updateCompanyInfo, 
  getProjects, createProject, deleteProject, 
  submitContact, getContacts, markContactRead 
} from '../controllers/cmsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (Used by the public website)
router.get('/info', getCompanyInfo);
router.get('/projects', getProjects);
router.post('/contact', submitContact);

// Protected routes (Used by Admin Dashboard)
router.put('/info', authMiddleware(['OWNER', 'MANAGER']), updateCompanyInfo);
router.post('/projects', authMiddleware(['OWNER', 'MANAGER']), createProject);
router.delete('/projects/:id', authMiddleware(['OWNER', 'MANAGER']), deleteProject);
router.get('/contact', authMiddleware(['OWNER', 'MANAGER']), getContacts);
router.put('/contact/:id/read', authMiddleware(['OWNER', 'MANAGER']), markContactRead);

export default router;
