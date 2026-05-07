import { Router } from 'express';
import { 
  getSites, 
  createSite, 
  assignUserToSite, 
  getSiteWorkers, 
  getMyAssignedWorkers, 
  removeUserFromSite,
  updateSite,
  deleteSite
} from '../controllers/siteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All authenticated roles can see sites (SITE_MANAGER sees all with isAssigned flag)
router.get('/', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER', 'WORKER']), getSites);

// SITE_MANAGER: get workers from all their assigned sites grouped by site
router.get('/my-workers', authMiddleware(['SITE_MANAGER']), getMyAssignedWorkers);

// Get workers for a specific site (OWNER/MANAGER = any site, SITE_MANAGER = only own sites)
router.get('/:id/workers', authMiddleware(['OWNER', 'MANAGER', 'SITE_MANAGER']), getSiteWorkers);

// Only OWNER/MANAGER can create, edit, delete sites or assign/remove users
router.post('/', authMiddleware(['OWNER', 'MANAGER']), createSite);
router.put('/:id', authMiddleware(['OWNER', 'MANAGER']), updateSite);
router.delete('/:id', authMiddleware(['OWNER', 'MANAGER']), deleteSite);
router.post('/:id/assign', authMiddleware(['OWNER', 'MANAGER']), assignUserToSite);
router.post('/:id/remove', authMiddleware(['OWNER', 'MANAGER']), removeUserFromSite);

export default router;
