import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
interface AuthRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export const calculateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, month, year } = req.body;
    const requester = req.user;

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'MANAGER')) {
      res.status(403).json({ error: 'Forbidden: Insufficient role to calculate salary' });
      return;
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });
    if (!worker || worker.role !== 'WORKER' || !worker.hourlyRate) {
      res.status(400).json({ error: 'Invalid worker or missing hourly rate' });
      return;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        workerId,
        date: { gte: startDate, lte: endDate },
        checkOutTime: { not: null },
      },
    });

    let totalHours = 0;
    attendances.forEach(att => {
      if (att.checkOutTime && att.checkInTime) {
        const diffInMs = att.checkOutTime.getTime() - att.checkInTime.getTime();
        totalHours += diffInMs / (1000 * 60 * 60);
      }
    });

    const amountPaid = totalHours * worker.hourlyRate;

    const salaryReport = await prisma.salaryReport.create({
      data: {
        workerId,
        month,
        year,
        totalHours,
        amountPaid,
        status: 'PENDING',
      },
    });

    res.status(201).json(salaryReport);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalaryReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workerId } = req.query;

    const reports = await prisma.salaryReport.findMany({
      where: workerId ? { workerId: String(workerId) } : undefined,
      include: {
        worker: { select: { id: true, name: true, hourlyRate: true } },
      },
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
