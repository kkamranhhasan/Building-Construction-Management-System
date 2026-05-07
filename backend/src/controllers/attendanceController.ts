import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, siteId, locationLat, locationLng, imageProofUrl } = req.body;
    const verifiedById = req.user!.id;
    const managerRole = req.user!.role;

    // If SITE_MANAGER, verify they are assigned to this site
    if (managerRole === 'SITE_MANAGER') {
      const site = await prisma.site.findFirst({
        where: {
          id: siteId,
          managers: { 
            some: { 
              OR: [
                { id: verifiedById },
                { username: req.user?.username }
              ]
            } 
          },
        },
      });
      if (!site) {
        res.status(403).json({ error: 'Forbidden: You are not the manager of this site' });
        return;
      }

      // Verify the worker is assigned to this site
      const workerInSite = await prisma.site.findFirst({
        where: {
          id: siteId,
          workers: { some: { id: workerId } },
        },
      });
      if (!workerInSite) {
        res.status(403).json({ error: 'Forbidden: This worker is not assigned to your site' });
        return;
      }
    }

    // Check if there's already an open check-in (no checkout) for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        workerId,
        siteId,
        date: { gte: today },
        checkOutTime: null,
      },
    });
    if (existingAttendance) {
      res.status(400).json({ error: 'Worker is already checked in at this site today' });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        workerId,
        siteId,
        verifiedById,
        date: new Date(),
        checkInTime: new Date(),
        locationLat,
        locationLng,
        imageProofUrl,
        status: 'PRESENT',
      },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attendanceId } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // SITE_MANAGER: verify they verified the original check-in
    if (userRole === 'SITE_MANAGER') {
      const record = await prisma.attendance.findUnique({ where: { id: attendanceId } });
      if (!record) {
        res.status(404).json({ error: 'Attendance record not found' });
        return;
      }
      if (record.verifiedById !== userId) {
        res.status(403).json({ error: 'Forbidden: You did not record this check-in' });
        return;
      }
    }

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { checkOutTime: new Date() },
      include: {
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { siteId, workerId } = req.query;
    const user = req.user;

    let whereClause: any = {
      ...(siteId && { siteId: String(siteId) }),
      ...(workerId && { workerId: String(workerId) }),
    };

    // SITE_MANAGER: only see attendances for their assigned sites
    if (user?.role === 'SITE_MANAGER') {
      const mySites = await prisma.site.findMany({
        where: { managers: { some: { id: user.id } } },
        select: { id: true },
      });
      const mySiteIds = mySites.map(s => s.id);

      if (siteId && !mySiteIds.includes(String(siteId))) {
        res.status(403).json({ error: 'Forbidden: Not your site' });
        return;
      }

      whereClause = {
        ...whereClause,
        siteId: siteId ? String(siteId) : { in: mySiteIds },
      };
    }

    // WORKER: only see their own attendances
    if (user?.role === 'WORKER') {
      whereClause.workerId = user.id;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        imageProofUrl: true,
        worker: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

