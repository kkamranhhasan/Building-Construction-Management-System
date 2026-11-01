import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; role: string; username: string };
}

function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      workerId, 
      siteId, 
      locationLat, 
      locationLng, 
      imageProofUrl, 
      verificationMethod, 
      confidenceScore 
    } = req.body;
    const verifiedById = req.user!.id;
    const managerRole = req.user!.role;

    // Fetch site details for manager verification & GPS geofencing
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        managers: { select: { id: true, username: true } },
        workers: { select: { id: true } }
      }
    });

    if (!site) {
      res.status(404).json({ error: 'Construction site not found' });
      return;
    }

    // If SITE_MANAGER, verify they are assigned to this site
    if (managerRole === 'SITE_MANAGER') {
      const isManager = site.managers.some(
        m => m.id === verifiedById || m.username === req.user?.username
      );
      if (!isManager) {
        res.status(403).json({ error: 'Forbidden: You are not assigned as manager of this site' });
        return;
      }

      // Verify the worker is assigned to this site
      const isWorkerInSite = site.workers.some(w => w.id === workerId);
      if (!isWorkerInSite) {
        res.status(403).json({ error: 'Forbidden: This worker is not assigned to your site' });
        return;
      }
    }

    // ─── GPS GEOFENCING VALIDATION (STRICT ENFORCEMENT) ───
    let calculatedDistance: number | null = null;
    const siteLat = site?.latitude;
    const siteLng = site?.longitude;
    const enableGeofence = true; // Strict geofencing enabled per company policy
    if (enableGeofence && siteLat != null && siteLng != null) {
      if (locationLat == null || locationLng == null) {
        res.status(400).json({ 
          error: 'GPS Geofencing Required: You must enable and provide device GPS location to take attendance at this site.' 
        });
        return;
      }

      const userLat = parseFloat(locationLat);
      const userLng = parseFloat(locationLng);
      calculatedDistance = calculateDistanceInMeters(siteLat, siteLng, userLat, userLng);
      const maxAllowedRadius = site?.radiusMeters || 300;

      if (calculatedDistance != null && calculatedDistance > maxAllowedRadius) {
        res.status(403).json({
          error: `Location Mismatch: You are ${calculatedDistance}m away from ${site.name} (Allowed boundary: ${maxAllowedRadius}m). Attendance can only be taken physically on-site.`,
          distanceMeters: calculatedDistance,
          allowedRadius: maxAllowedRadius,
        });
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

    // ─── BIOMETRIC ENROLLMENT VERIFICATION ───
    if (verificationMethod === 'FACE_AI_AUTO') {
      const workerUser = await prisma.user.findUnique({
        where: { id: workerId },
        select: { isFaceEnrolled: true, faceDescriptor: true }
      });
      if (!workerUser?.isFaceEnrolled || !workerUser?.faceDescriptor) {
        res.status(400).json({ error: 'Face Biometrics Error: This worker has not enrolled their face template yet.' });
        return;
      }
      if (confidenceScore != null && parseFloat(confidenceScore) < 68) {
        res.status(400).json({ error: 'Biometric Security Reject: Face confidence score is below required threshold (min 68%).' });
        return;
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        workerId,
        siteId,
        verifiedById,
        date: new Date(),
        checkInTime: new Date(),
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        distanceMeters: calculatedDistance,
        verificationMethod: verificationMethod || 'FACE_AI_AUTO',
        confidenceScore: confidenceScore ? parseFloat(confidenceScore) : null,
        imageProofUrl,
        status: 'PRESENT',
      },
      include: {
        worker: { 
          select: { 
            id: true, 
            name: true, 
            username: true, 
            idNumber: true, 
            phone: true, 
            avatarUrl: true 
          } 
        },
        site: { select: { id: true, name: true, location: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('checkIn error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      attendanceId, 
      workerId, 
      siteId, 
      imageProofUrl, 
      locationLat, 
      locationLng, 
      verificationMethod, 
      confidenceScore 
    } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let targetAttendanceId = attendanceId;

    // If attendanceId not provided directly, lookup by workerId + siteId (active open check-in today)
    if (!targetAttendanceId && workerId && siteId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeRecord = await prisma.attendance.findFirst({
        where: {
          workerId,
          siteId,
          date: { gte: today },
          checkOutTime: null,
        },
        orderBy: { checkInTime: 'desc' },
      });

      if (!activeRecord) {
        res.status(404).json({ error: 'No active check-in found for this worker today to check out from.' });
        return;
      }
      targetAttendanceId = activeRecord.id;
    }

    if (!targetAttendanceId) {
      res.status(400).json({ error: 'Missing attendanceId or (workerId and siteId)' });
      return;
    }

    const record = await prisma.attendance.findUnique({ 
      where: { id: targetAttendanceId },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,
            managers: { select: { id: true, username: true } }
          }
        }
      }
    });

    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    if (record.checkOutTime) {
      res.status(400).json({ error: 'Worker has already checked out for this shift.' });
      return;
    }

    // SITE_MANAGER: verify they manage this site
    if (userRole === 'SITE_MANAGER') {
      const isSiteManager = record.site.managers.some(
        m => m.id === userId || m.username === req.user?.username
      );
      if (!isSiteManager && record.verifiedById !== userId) {
        res.status(403).json({ error: 'Forbidden: You are not assigned to manage this site' });
        return;
      }
    }

    // Geofencing check for checkout if site has coordinates
    const siteLat = record.site?.latitude;
    const siteLng = record.site?.longitude;
    const enableGeofence = true;
    if (enableGeofence && siteLat != null && siteLng != null) {
      if (locationLat == null || locationLng == null) {
        res.status(400).json({ 
          error: 'GPS Geofencing Required: You must enable and provide device GPS location to check out at this site.' 
        });
        return;
      }

      const userLat = parseFloat(locationLat);
      const userLng = parseFloat(locationLng);
      const calculatedDistance = calculateDistanceInMeters(siteLat, siteLng, userLat, userLng);
      const maxAllowedRadius = record.site?.radiusMeters || 300;

      if (calculatedDistance != null && calculatedDistance > maxAllowedRadius) {
        res.status(403).json({
          error: `Location Mismatch: You are ${calculatedDistance}m away from ${record.site.name} (Allowed boundary: ${maxAllowedRadius}m). Check-out can only be taken physically on-site.`,
          distanceMeters: calculatedDistance,
          allowedRadius: maxAllowedRadius,
        });
        return;
      }
    }

    // ─── BIOMETRIC ENROLLMENT VERIFICATION FOR CHECKOUT ───
    if (verificationMethod === 'FACE_AI_AUTO' && confidenceScore != null && parseFloat(confidenceScore) < 68) {
      res.status(400).json({ error: 'Biometric Security Reject: Face confidence score is below required threshold (min 68%).' });
      return;
    }

    const now = new Date();
    const attendance = await prisma.attendance.update({
      where: { id: targetAttendanceId },
      data: { 
        checkOutTime: now,
        ...(imageProofUrl ? { checkOutImageProofUrl: imageProofUrl } : {}),
        ...(verificationMethod ? { checkOutMethod: verificationMethod } : { checkOutMethod: 'MANUAL_CLICK' }),
      },
      include: {
        worker: { 
          select: { 
            id: true, 
            name: true, 
            username: true, 
            idNumber: true, 
            phone: true, 
            avatarUrl: true 
          } 
        },
        site: { select: { id: true, name: true, location: true } },
      },
    });

    const durationMs = attendance.checkOutTime!.getTime() - attendance.checkInTime.getTime();
    const hoursWorked = Math.max(0, durationMs / (1000 * 60 * 60));

    res.json({
      ...attendance,
      totalHours: Number(hoursWorked.toFixed(2)),
      message: `Checkout successful! Total duration: ${hoursWorked.toFixed(2)} hrs`
    });
  } catch (error) {
    console.error('checkOut error:', error);
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
        locationLat: true,
        locationLng: true,
        distanceMeters: true,
        verificationMethod: true,
        confidenceScore: true,
        checkOutImageProofUrl: true,
        checkOutMethod: true,
        worker: { select: { id: true, name: true, username: true, idNumber: true, phone: true, avatarUrl: true } },
        site: { select: { id: true, name: true, location: true } },
        verifiedBy: { select: { id: true, name: true, idNumber: true, phone: true, avatarUrl: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

