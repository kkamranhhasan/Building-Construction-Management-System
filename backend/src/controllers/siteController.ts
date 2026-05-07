import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; role: string; username?: string };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// GET /api/sites
export const getSites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (user.role === 'WORKER') {
      const sites = await prisma.site.findMany({
        where: { workers: { some: { id: user.id } } },
        include: {
          managers: { select: { id: true, name: true, username: true } },
          workers: { select: { id: true, name: true, username: true } },
        },
      });
      res.json(sites);
      return;
    }

    // OWNER, MANAGER, SITE_MANAGER
    const allSites = await prisma.site.findMany({
      include: {
        managers: { select: { id: true, name: true, username: true } },
        workers: { select: { id: true, name: true, username: true } },
      },
    });

    if (user.role === 'SITE_MANAGER') {
      const sitesWithFlag = allSites.map(site => {
        const plainSite = JSON.parse(JSON.stringify(site));
        
        // Multi-field robust matching
        const isAssigned = site.managers.some(m => {
          const matchId = m.id && user.id && m.id.toLowerCase() === user.id.toLowerCase();
          const matchUsername = m.username && user.username && m.username.toLowerCase() === user.username.toLowerCase();
          // Fallback to name if other fields are shaky
          const matchName = m.name && user.id && m.name.toLowerCase() === user.id.toLowerCase(); // Sometimes ID holds the name in legacy sessions
          
          return matchId || matchUsername || matchName;
        });

        console.log(`[DEBUG] Site: ${site.name}, TargetUser: ${user.username || user.id}, isAssigned: ${isAssigned}`);
        
        return {
          ...plainSite,
          isAssigned: isAssigned
        };
      });
      res.json(sitesWithFlag);
      return;
    }

    // OWNER / MANAGER: mark all as isAssigned (Total oversight)
    const adminSites = allSites.map(site => ({
      ...JSON.parse(JSON.stringify(site)),
      isAssigned: true
    }));
    res.json(adminSites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/sites/:id/workers
export const getSiteWorkers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = first(req.params.id);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!id) {
      res.status(400).json({ error: 'Missing site id' });
      return;
    }

    // For SITE_MANAGER: verify they manage this site
    if (user.role === 'SITE_MANAGER') {
      const site = await prisma.site.findFirst({
        where: { id, managers: { some: { id: user.id } } },
      });
      if (!site) {
        res.status(403).json({ error: 'Forbidden: You are not assigned to this site' });
        return;
      }
    }

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            username: true,
            hourlyRate: true,
            isApproved: true,
            createdAt: true,
          },
        },
        managers: { select: { id: true, name: true, username: true } },
      },
    });

    if (!site) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    res.json(site);
  } catch (error) {
    console.error('Error fetching site workers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/sites/my-workers
export const getMyAssignedWorkers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const assignedSites = await prisma.site.findMany({
      where: { 
        OR: [
          { managers: { some: { id: user.id } } },
          { managers: { some: { username: user.username } } }
        ]
      },
      select: {
        id: true,
        name: true,
        location: true,
        workers: {
          select: {
            id: true,
            name: true,
            username: true,
            hourlyRate: true,
            isApproved: true,
            createdAt: true,
          },
        },
      },
    });

    res.json(assignedSites);
  } catch (error) {
    console.error('Error fetching my workers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, description } = req.body;
    const site = await prisma.site.create({
      data: { name, location, description },
    });
    res.status(201).json(site);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignUserToSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    const { userId, type } = req.body; // type: 'MANAGER' or 'WORKER'

    if (!id) {
      res.status(400).json({ error: 'Missing site id' });
      return;
    }

    console.log(`[ASSIGN] Site: ${id}, User: ${userId}, Type: ${type}`);

    // Verify user exists and has correct role
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User to assign not found' });
      return;
    }

    // Role validation
    if (type === 'MANAGER' && targetUser.role !== 'SITE_MANAGER') {
      res.status(400).json({ error: `Cannot assign as manager: user role is ${targetUser.role}, expected SITE_MANAGER` });
      return;
    }
    if (type === 'WORKER' && targetUser.role !== 'WORKER') {
      res.status(400).json({ error: `Cannot assign as worker: user role is ${targetUser.role}, expected WORKER` });
      return;
    }

    // Verify site exists
    const existingSite = await prisma.site.findUnique({ where: { id } });
    if (!existingSite) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    if (type === 'MANAGER') {
      // Atomic transaction: disconnect ALL managers then connect only the new one
      await prisma.$transaction(async (tx) => {
        // Remove ALL existing managers
        await tx.site.update({
          where: { id },
          data: { managers: { set: [] } },
        });
        // Add ONLY the new manager
        await tx.site.update({
          where: { id },
          data: { managers: { connect: { id: userId } } },
        });
      });
      console.log(`[ASSIGN] Manager set to ${targetUser.username} for site ${existingSite.name}`);
    } else if (type === 'WORKER') {
      await prisma.site.update({
        where: { id },
        data: { workers: { connect: { id: userId } } },
      });
    }

    // Fetch the final state
    const updatedSite = await prisma.site.findUnique({
      where: { id },
      include: {
        managers: { select: { id: true, name: true, username: true } },
        workers: { select: { id: true, name: true, username: true } },
      },
    });

    console.log(`[ASSIGN] Done. Managers: ${updatedSite?.managers.map(m => m.username)}`);
    res.json(updatedSite);
  } catch (error: any) {
    console.error('Error assigning user to site:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Remove a user (manager or worker) from a site
export const removeUserFromSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    const { userId, type } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Missing site id' });
      return;
    }

    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(type === 'MANAGER' && { managers: { disconnect: { id: userId } } }),
        ...(type === 'WORKER' && { workers: { disconnect: { id: userId } } }),
      },
    });

    res.json(site);
  } catch (error) {
    console.error('Error removing user from site:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    const { name, location, description } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Missing site id' });
      return;
    }

    const site = await prisma.site.update({
      where: { id },
      data: { name, location, description },
    });

    res.json(site);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing site id' });
      return;
    }
    console.log(`[DELETE] Attempting to delete site: ${id}`);

    // Verify site exists first
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    // Transaction must be sequential: relation cleanup must happen
    // before deleting the Site row (Prisma may otherwise run queries concurrently).
    await prisma.$transaction(async (tx) => {
      // 1) Delete all attendance records for this site
      await tx.attendance.deleteMany({ where: { siteId: id } });

      // 2) Disconnect all workers and managers (clears the many-to-many link tables)
      await tx.site.update({
        where: { id },
        data: {
          workers: { set: [] },
          managers: { set: [] },
        },
      });

      // 3) Finally delete the site itself
      await tx.site.delete({ where: { id } });
    });

    console.log(`[DELETE] Success. Site ${id} deleted.`);
    res.json({ message: 'Site deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting site:', error);
    res.status(500).json({ 
      error: 'Internal server error: Could not delete site.', 
      details: error.message 
    });
  }
};
