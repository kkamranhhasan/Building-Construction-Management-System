import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateUniqueIdNumber } from './userController';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ─── SSL Wireless SMS Gateway ───────────────────────────────────────────────
// Docs: https://developer.sslwireless.com/
async function sendSmsViaSslWireless(toPhone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiUser = process.env.SSL_WIRELESS_API_USER;
  const apiPassword = process.env.SSL_WIRELESS_API_PASSWORD;
  const sid = process.env.SSL_WIRELESS_SID;

  if (!apiUser || !apiPassword || !sid ||
      apiUser === 'YOUR_SSL_WIRELESS_USER' ||
      apiPassword === 'YOUR_SSL_WIRELESS_PASSWORD') {
    console.warn('[SMS] SSL Wireless credentials not configured. OTP not sent via SMS.');
    return { success: false, error: 'SMS_NOT_CONFIGURED' };
  }

  try {
    // Normalize the phone number to BD format (88XXXXXXXXXXX)
    const digits = toPhone.replace(/\D/g, '');
    let bdNumber = digits;
    if (digits.startsWith('01') && digits.length === 11) {
      bdNumber = '88' + digits;
    } else if (digits.startsWith('1') && digits.length === 10) {
      bdNumber = '880' + digits;
    }

    const params = new URLSearchParams({
      api_token: apiPassword,
      sid: sid,
      sms: message,
      msisdn: bdNumber,
      csms_id: `OTP_${Date.now()}`,
    });

    const url = `https://sms.sslwireless.com/pushapi/dynamic/server.php?${params.toString()}`;
    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();

    console.log(`[SMS] SSL Wireless response for ${bdNumber}: ${text}`);

    // SSL Wireless returns status code in response text
    if (text.includes('ACCEPTED') || text.includes('200') || response.ok) {
      return { success: true };
    } else {
      return { success: false, error: text };
    }
  } catch (err: any) {
    console.error('[SMS] SSL Wireless error:', err.message);
    return { success: false, error: err.message };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, role, hourlyRate } = req.body;

    if (role === 'OWNER' || role === 'MANAGER') {
      res.status(403).json({ error: 'Registration for OWNER or MANAGER is not allowed publicly.' });
      return;
    }

    const assignedIdNumber = await generateUniqueIdNumber(role || 'WORKER');
    const finalUsername = (username && username.trim()) ? username.trim() : assignedIdNumber;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: finalUsername },
          { idNumber: assignedIdNumber }
        ]
      }
    });
    if (existingUser) {
      res.status(400).json({ error: 'Username or ID number already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        password: passwordHash,
        name,
        role,
        idNumber: assignedIdNumber,
        hourlyRate: role === 'WORKER' ? parseFloat(hourlyRate || '0') : null,
      },
    });

    res.status(201).json({
      message: 'Account created successfully. Please wait for an administrator to approve your account before logging in.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        idNumber: user.idNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const identifier = username ? String(username).trim() : '';

    if (!identifier) {
      res.status(400).json({ error: 'Please enter your User ID or Username' });
      return;
    }

    // Support login via either username OR 8-digit idNumber
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { idNumber: identifier },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid User ID / Username or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid User ID / Username or password' });
      return;
    }

    if (!user.isApproved) {
      res.status(403).json({ error: 'Account pending approval. Please contact your manager.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        idNumber: user.idNumber,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper to normalize phone numbers (e.g. +880 1711-000001 -> 01711000001)
function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8801')) {
    return digits.slice(2); // '01...'
  }
  if (digits.startsWith('01')) {
    return digits;
  }
  return digits;
}

// 1. Request Password Reset OTP via Phone Number
export const requestPasswordResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, identifier } = req.body;
    if (!phone || !phone.trim()) {
      res.status(400).json({ error: 'Please enter your registered mobile number.' });
      return;
    }

    const inputPhoneDigits = normalizePhoneDigits(phone.trim());
    if (inputPhoneDigits.length < 10) {
      res.status(400).json({ error: 'Please enter a valid mobile number (e.g. 01711-000001).' });
      return;
    }

    // Find all users with phone numbers
    const allUsers = await prisma.user.findMany({
      where: { phone: { not: null } },
      select: {
        id: true,
        name: true,
        username: true,
        idNumber: true,
        phone: true,
        role: true,
      },
    });

    const matchingUsers = allUsers.filter(u => {
      if (!u.phone) return false;
      const userDigits = normalizePhoneDigits(u.phone);
      const phoneMatches = userDigits === inputPhoneDigits || userDigits.endsWith(inputPhoneDigits) || inputPhoneDigits.endsWith(userDigits);
      if (!phoneMatches) return false;

      if (identifier && identifier.trim()) {
        const idTrimmed = identifier.trim().toLowerCase();
        return (
          u.username.toLowerCase() === idTrimmed ||
          (u.idNumber && u.idNumber.toLowerCase() === idTrimmed)
        );
      }
      return true;
    });

    if (matchingUsers.length === 0) {
      res.status(404).json({ 
        error: `No registered account found matching mobile number "${phone}". Please check the number or contact your site manager.` 
      });
      return;
    }

    const targetUser = matchingUsers[0];

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expires,
      },
    });

    const raw = targetUser.phone || phone;
    const masked = raw.length > 6 ? raw.slice(0, 4) + '****' + raw.slice(-3) : raw;

    // Always log OTP to console for debugging
    console.log(`\n======================================================`);
    console.log(`📱 [SSL WIRELESS SMS DISPATCH]`);
    console.log(`To: ${targetUser.phone}`);
    console.log(`User: ${targetUser.name} (@${targetUser.username}, ID: #${targetUser.idNumber || 'NO ID'})`);
    console.log(`OTP Code: [ ${otp} ] (Valid for 10 minutes)`);
    console.log(`======================================================\n`);

    // Send real SMS via SSL Wireless
    const smsMessage = `Your S Islam ERP password reset OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    const smsResult = await sendSmsViaSslWireless(targetUser.phone || phone, smsMessage);

    const smsSent = smsResult.success;
    const responseMsg = smsSent
      ? `OTP sent to ${masked} via SMS`
      : `OTP generated. SMS not configured — check backend console for OTP code.`;

    res.json({
      success: true,
      message: responseMsg,
      maskedPhone: masked,
      smsSent,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        idNumber: targetUser.idNumber,
      },
      // Only include otpCode in response if SMS not configured (dev mode)
      ...(smsSent ? {} : { otpCode: otp }),
    });
  } catch (error) {
    console.error('requestPasswordResetOtp error:', error);
    res.status(500).json({ error: 'Internal server error while sending OTP.' });
  }
};

// 2. Verify Password Reset OTP
export const verifyPasswordResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp, identifier } = req.body;
    if (!otp || !otp.trim()) {
      res.status(400).json({ error: 'Please enter the 6-digit OTP code.' });
      return;
    }

    const inputPhoneDigits = normalizePhoneDigits((phone || '').trim());
    const allUsers = await prisma.user.findMany({
      where: {
        phone: { not: null },
        resetOtp: { not: null },
      },
    });

    const targetUser = allUsers.find(u => {
      if (!u.phone) return false;
      const userDigits = normalizePhoneDigits(u.phone);
      const phoneMatches = userDigits === inputPhoneDigits || userDigits.endsWith(inputPhoneDigits) || inputPhoneDigits.endsWith(userDigits);
      if (!phoneMatches) return false;

      if (identifier && identifier.trim()) {
        const idTrimmed = identifier.trim().toLowerCase();
        return (
          u.username.toLowerCase() === idTrimmed ||
          (u.idNumber && u.idNumber.toLowerCase() === idTrimmed)
        );
      }
      return true;
    });

    if (!targetUser || !targetUser.resetOtp) {
      res.status(400).json({ error: 'Invalid or expired OTP session. Please request a new OTP.' });
      return;
    }

    if (targetUser.resetOtp !== otp.trim()) {
      res.status(400).json({ error: 'Incorrect 6-digit OTP code. Please check and try again.' });
      return;
    }

    if (targetUser.resetOtpExpires && targetUser.resetOtpExpires.getTime() < Date.now()) {
      res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
      return;
    }

    res.json({
      success: true,
      message: 'OTP verified successfully! You may now set a new password.',
    });
  } catch (error) {
    console.error('verifyPasswordResetOtp error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// 3. Reset Password with verified OTP
export const resetPasswordWithOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp, newPassword, identifier } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const inputPhoneDigits = normalizePhoneDigits((phone || '').trim());
    const allUsers = await prisma.user.findMany({
      where: {
        phone: { not: null },
        resetOtp: { not: null },
      },
    });

    const targetUser = allUsers.find(u => {
      if (!u.phone) return false;
      const userDigits = normalizePhoneDigits(u.phone);
      const phoneMatches = userDigits === inputPhoneDigits || userDigits.endsWith(inputPhoneDigits) || inputPhoneDigits.endsWith(userDigits);
      if (!phoneMatches) return false;

      if (identifier && identifier.trim()) {
        const idTrimmed = identifier.trim().toLowerCase();
        return (
          u.username.toLowerCase() === idTrimmed ||
          (u.idNumber && u.idNumber.toLowerCase() === idTrimmed)
        );
      }
      return true;
    });

    if (!targetUser || !targetUser.resetOtp) {
      res.status(400).json({ error: 'Invalid or expired OTP session. Please request a new OTP.' });
      return;
    }

    if (targetUser.resetOtp !== otp.trim()) {
      res.status(400).json({ error: 'Incorrect OTP code.' });
      return;
    }

    if (targetUser.resetOtpExpires && targetUser.resetOtpExpires.getTime() < Date.now()) {
      res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        password: passwordHash,
        resetOtp: null,
        resetOtpExpires: null,
      },
    });

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      user: {
        username: targetUser.username,
        idNumber: targetUser.idNumber,
        name: targetUser.name,
      },
    });
  } catch (error) {
    console.error('resetPasswordWithOtp error:', error);
    res.status(500).json({ error: 'Internal server error while resetting password.' });
  }
};
