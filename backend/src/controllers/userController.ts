import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; role: string; username?: string };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Get all users (filtered by role optionally)
// SITE_MANAGER: only sees workers from their own assigned sites
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = first(req.query.role as string | string[] | undefined);
    const user = req.user;

    // SITE_MANAGER: return only workers from their assigned sites
    if (user?.role === 'SITE_MANAGER') {
      const assignedSites = await prisma.site.findMany({
        where: { managers: { some: { id: user.id } } },
        select: { workers: { select: { id: true } } },
      });
      const workerIds = [...new Set(assignedSites.flatMap(s => s.workers.map(w => w.id)))];

      const workers = await prisma.user.findMany({
        where: { id: { in: workerIds } },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          hourlyRate: true,
          isApproved: true,
          createdAt: true,
        },
      });
      res.json(workers);
      return;
    }

    // OWNER / MANAGER: see all users
    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        hourlyRate: true,
        isApproved: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Create a new user (Site Manager or Worker)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, role, hourlyRate } = req.body;

    if (role === 'OWNER' || role === 'MANAGER') {
      res.status(403).json({ error: 'Cannot create additional Owners or Managers' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: passwordHash,
        name,
        role,
        isApproved: true, // Manually created by owner/manager, so approved automatically
        hourlyRate: role === 'WORKER' ? parseFloat(hourlyRate) : null,
      },
      select: { id: true, username: true, name: true, role: true, isApproved: true },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, username: true, isApproved: true },
    });

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a user with RBAC
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const requester = req.user;

    if (!requester) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the user to be deleted
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Rule: MANAGER cannot delete an OWNER
    if (requester.role === 'MANAGER' && targetUser.role === 'OWNER') {
      res.status(403).json({ error: 'Forbidden: Managers cannot delete Owners' });
      return;
    }

    // Prevent self-deletion
    if (requester.id === targetUser.id) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    // Transaction must be sequential: relation cleanup must happen
    // before deleting the User row.
    await prisma.$transaction(async (tx) => {
      // 1) Delete attendance where user is the worker
      await tx.attendance.deleteMany({ where: { workerId: id } });

      // 2) Delete attendance where user is the verifier
      await tx.attendance.deleteMany({ where: { verifiedById: id } });

      // 3) Delete salary reports for this worker
      await tx.salaryReport.deleteMany({ where: { workerId: id } });

      // 4) Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error: Could not delete user due to related records' });
  }
};

// Update a user with RBAC
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = first(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Missing user id' });
      return;
    }
    const { name, username, role, hourlyRate } = req.body;
    const requester = req.user;

    if (!requester) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the user to be updated
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Rule: MANAGER cannot edit an OWNER
    if (requester.role === 'MANAGER' && targetUser.role === 'OWNER') {
      res.status(403).json({ error: 'Forbidden: Managers cannot edit Owners' });
      return;
    }

    // Rule: Cannot change role to OWNER or MANAGER through this endpoint
    if (role && (role === 'OWNER' || role === 'MANAGER') && requester.role !== 'OWNER') {
      res.status(403).json({ error: 'Forbidden: Insufficient role to assign administrative roles' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        role,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      },
      select: { id: true, username: true, name: true, role: true, isApproved: true, hourlyRate: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
