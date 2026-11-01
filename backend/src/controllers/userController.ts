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
          idNumber: true,
          phone: true,
          avatarUrl: true,
          trade: true,
          isFaceEnrolled: true,
          faceEnrolledAt: true,
          faceDescriptor: true,
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
        idNumber: true,
        phone: true,
        avatarUrl: true,
        trade: true,
        isFaceEnrolled: true,
        faceEnrolledAt: true,
        faceDescriptor: true,
        role: true,
        hourlyRate: true,
        isApproved: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Role-based ID number validation and generation (All IDs are 8 digits)
export function validateIdFormat(idNumber: string, role: string): { valid: boolean; error?: string } {
  const trimmed = idNumber.trim();
  if (role === 'WORKER') {
    if (!/^11\d{6}$/.test(trimmed)) {
      return { valid: false, error: 'Worker ID must be exactly 8 digits and start with 11 (e.g. 11000001).' };
    }
  } else if (role === 'SITE_MANAGER') {
    if (!/^22\d{6}$/.test(trimmed)) {
      return { valid: false, error: 'Site Manager ID must be exactly 8 digits and start with 22 (e.g. 22000001).' };
    }
  } else if (role === 'MANAGER') {
    if (!/^33\d{6}$/.test(trimmed)) {
      return { valid: false, error: 'Manager ID must be exactly 8 digits and start with 33 (e.g. 33000001).' };
    }
  } else if (role === 'OWNER') {
    if (!/^99\d{6}$/.test(trimmed)) {
      return { valid: false, error: 'Owner ID must be exactly 8 digits and start with 99 (e.g. 99000001).' };
    }
  } else {
    if (!/^\d{8}$/.test(trimmed)) {
      return { valid: false, error: 'ID must be exactly 8 digits.' };
    }
  }
  return { valid: true };
}

export async function generateUniqueIdNumber(role: string): Promise<string> {
  let prefix = '11';
  const min = 100000;
  const max = 999999;

  if (role === 'WORKER') {
    prefix = '11';
  } else if (role === 'SITE_MANAGER') {
    prefix = '22';
  } else if (role === 'MANAGER') {
    prefix = '33';
  } else if (role === 'OWNER') {
    prefix = '99';
  }

  for (let i = 0; i < 50; i++) {
    const randomSuffix = Math.floor(min + Math.random() * (max - min + 1));
    const candidateId = `${prefix}${randomSuffix}`;
    const exists = await prisma.user.findFirst({ where: { idNumber: candidateId } });
    if (!exists) {
      return candidateId;
    }
  }

  // Fallback sequential (6 digits padding -> total 8 digits with 2-digit prefix)
  const count = await prisma.user.count({ where: { role } });
  const padded = String(count + 1).padStart(6, '0');
  return `${prefix}${padded}`;
}

// Create a new user (Site Manager or Worker)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, role, hourlyRate, idNumber, phone, avatarUrl, trade } = req.body;

    if (role === 'OWNER' || role === 'MANAGER') {
      res.status(403).json({ error: 'Cannot create additional Owners or Managers' });
      return;
    }

    let finalIdNumber = idNumber?.trim();
    if (finalIdNumber) {
      const validation = validateIdFormat(finalIdNumber, role);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
      const existingId = await prisma.user.findFirst({ where: { idNumber: finalIdNumber } });
      if (existingId) {
        res.status(400).json({ error: `ID number '${finalIdNumber}' is already assigned to another user.` });
        return;
      }
    } else {
      finalIdNumber = await generateUniqueIdNumber(role);
    }

    const finalUsername = (username && username.trim()) ? username.trim() : finalIdNumber;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: finalUsername },
          { idNumber: finalIdNumber }
        ]
      }
    });
    if (existingUser) {
      res.status(400).json({ error: 'Username or User ID already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        password: passwordHash,
        name,
        role,
        idNumber: finalIdNumber,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
        trade: trade || (role === 'WORKER' ? 'General Laborer' : (role === 'SITE_MANAGER' ? 'Site Manager' : undefined)),
        isApproved: true, // Manually created by owner/manager, so approved automatically
        hourlyRate: role === 'WORKER' ? parseFloat(hourlyRate || '0') : null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        idNumber: true,
        phone: true,
        avatarUrl: true,
        trade: true,
        role: true,
        isApproved: true,
        hourlyRate: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('createUser error:', error);
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
    const { name, username, role, hourlyRate, idNumber, phone, avatarUrl, password, faceDescriptor, trade } = req.body;
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

    const effectiveRole = role || targetUser.role;

    // Check unique idNumber and format if changing
    if (idNumber && idNumber !== targetUser.idNumber) {
      const validation = validateIdFormat(idNumber, effectiveRole);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const existingId = await prisma.user.findFirst({
        where: { idNumber, NOT: { id } }
      });
      if (existingId) {
        res.status(400).json({ error: `ID number '${idNumber}' is already assigned to another user.` });
        return;
      }
    }

    let passwordHash: string | undefined = undefined;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const isEnrollingFace = faceDescriptor !== undefined ? Boolean(faceDescriptor && faceDescriptor.trim()) : undefined;

    // ─── STRICT DUPLICATE FACE ENROLLMENT PREVENTION ───
    if (isEnrollingFace && faceDescriptor) {
      try {
        const newDesc = JSON.parse(faceDescriptor);
        if (Array.isArray(newDesc) && newDesc.length === 128) {
          const allOtherEnrolled = await prisma.user.findMany({
            where: {
              isFaceEnrolled: true,
              faceDescriptor: { not: null },
              id: { not: id },
            },
            select: { id: true, name: true, idNumber: true, username: true, faceDescriptor: true }
          });

          for (const other of allOtherEnrolled) {
            if (!other.faceDescriptor) continue;
            try {
              const otherDesc = JSON.parse(other.faceDescriptor);
              if (Array.isArray(otherDesc) && otherDesc.length === 128) {
                let sum = 0;
                for (let k = 0; k < 128; k++) {
                  const d = newDesc[k] - otherDesc[k];
                  sum += d * d;
                }
                const dist = Math.sqrt(sum);
                // Threshold 0.52 indicates the same physical person
                if (dist < 0.52) {
                  const confidence = Math.round(Math.max(0, (1 - dist) * 100));
                  res.status(400).json({
                    error: `Duplicate Face Detected: This exact face is already enrolled for "${other.name}" (ID: #${other.idNumber || other.username}, Match: ${confidence}%). The same face cannot be registered to multiple accounts.`
                  });
                  return;
                }
              }
            } catch {}
          }
        }
      } catch {
        res.status(400).json({ error: 'Invalid biometric face template data' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        role,
        idNumber: idNumber !== undefined ? idNumber : undefined,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        trade: trade !== undefined ? trade : undefined,
        hourlyRate: hourlyRate !== undefined ? (hourlyRate ? parseFloat(hourlyRate) : null) : undefined,
        faceDescriptor: isEnrollingFace !== undefined ? (isEnrollingFace ? faceDescriptor : null) : undefined,
        isFaceEnrolled: isEnrollingFace !== undefined ? isEnrollingFace : undefined,
        faceEnrolledAt: isEnrollingFace ? new Date() : (isEnrollingFace === false ? null : undefined),
        password: passwordHash,
      },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        idNumber: true, 
        phone: true, 
        avatarUrl: true, 
        trade: true,
        isFaceEnrolled: true, 
        faceEnrolledAt: true, 
        role: true, 
        isApproved: true, 
        hourlyRate: true 
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Self-Profile & Biometric Face Enrollment Endpoint (Any logged-in user)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, phone, avatarUrl, faceDescriptor, password, trade } = req.body;

    let passwordHash: string | undefined = undefined;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const isEnrollingFace = Boolean(faceDescriptor && faceDescriptor.trim());

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        trade: trade !== undefined ? trade : undefined,
        faceDescriptor: isEnrollingFace ? faceDescriptor : undefined,
        isFaceEnrolled: isEnrollingFace ? true : undefined,
        faceEnrolledAt: isEnrollingFace ? new Date() : undefined,
        password: passwordHash,
      },
      select: {
        id: true,
        username: true,
        name: true,
        idNumber: true,
        phone: true,
        avatarUrl: true,
        trade: true,
        isFaceEnrolled: true,
        faceEnrolledAt: true,
        role: true,
        hourlyRate: true,
        isApproved: true,
      },
    });

    res.json({
      message: isEnrollingFace ? 'Profile & Face Biometrics enrolled successfully!' : 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
