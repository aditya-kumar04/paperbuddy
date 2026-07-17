import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, PRIMARY_FRONTEND_URL } from '../config.js';
import { isValidEmail, getPasswordError } from '../utils/validators.js';

// A precomputed bcrypt hash with no known matching plaintext. Used to run a
// "dummy" compare when a user/email isn't found, so that login takes roughly
// the same amount of time whether or not the account exists — this avoids
// leaking account existence via response timing.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8qKxbn6QGGVIjO1kJ8yTZEyWzhz9U6';

function generateTokens(userPayload) {
  const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign(userPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  try {
    // 1. Try to find in SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (superAdmin) {
      const match = await bcrypt.compare(password, superAdmin.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload = {
        id: superAdmin.id,
        role: 'SUPER_ADMIN',
        schoolId: null,
        permissions: {},
      };

      const tokens = generateTokens(payload);
      return res.json({
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: 'SUPER_ADMIN',
        },
        ...tokens,
      });
    }

    // 2. Try to find in standard User table
    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true, studentProfile: true },
    });

    if (!user) {
      // Run a dummy bcrypt compare so this path takes roughly as long as the
      // "user found, wrong password" path above — avoids leaking whether an
      // email is registered via response-time differences.
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your user account is suspended or inactive' });
    }

    // Check if the school itself is suspended
    if (user.school && user.school.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'This school tenant has been suspended by platform admins' });
    }

    const payload = {
      id: user.id,
      role: user.role,
      schoolId: user.schoolId,
      permissions: user.permissions || {},
    };

    const tokens = generateTokens(payload);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        permissions: user.permissions,
        schoolName: user.school ? user.school.name : null,
        studentProfile: user.studentProfile,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Check user and tenant status again
    if (decoded.role !== 'SUPER_ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { school: true },
      });

      if (!user || user.status !== 'active' || (user.school && user.school.status !== 'ACTIVE')) {
        return res.status(403).json({ error: 'User account or school context is invalid' });
      }
    }

    const payload = {
      id: decoded.id,
      role: decoded.role,
      schoolId: decoded.schoolId,
      permissions: decoded.permissions || {},
    };

    const tokens = generateTokens(payload);
    return res.json(tokens);
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function acceptInvite(req, res) {
  const { token, name, password, phone } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ error: 'Token, name, and password are required' });
  }
  const passwordError = getPasswordError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { school: true },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: 'Invite has already been accepted' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite token has expired' });
    }

    if (invite.school.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'School is currently suspended' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and mark invite as accepted in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create standard User
      const user = await tx.user.create({
        data: {
          name,
          email: invite.email,
          passwordHash,
          phone,
          role: invite.role,
          schoolId: invite.schoolId,
          status: 'active',
          permissions: invite.role === 'ACCOUNTANT' ? {
            can_record_payment: true,
            can_apply_waiver: false,
            can_apply_penalty: false,
            can_reconcile_cheque: true,
            can_view_dashboard_metrics: true,
            can_edit_fee_structure: false,
          } : null,
        },
      });

      // 2. Mark invite as accepted
      await tx.invite.update({
        where: { id: invite.id },
        data: { accepted: true },
      });

      return user;
    });

    const payload = {
      id: result.id,
      role: result.role,
      schoolId: result.schoolId,
      permissions: result.permissions || {},
    };

    const tokens = generateTokens(payload);

    return res.status(201).json({
      message: 'Account created successfully from invite',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        schoolId: result.schoolId,
        permissions: result.permissions,
        schoolName: invite.school.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  // Always respond with the same generic message whether or not the account
  // exists, so this endpoint can't be used to check which emails are registered.
  const genericResponse = {
    message: 'If an account with that email exists, a password reset link has been generated.',
  };

  try {
    let user = await prisma.superAdmin.findUnique({ where: { email } });
    let isSuperAdmin = true;

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      isSuperAdmin = false;
    }

    if (!user) {
      return res.json(genericResponse);
    }

    // Sign reset token with JWT_SECRET + current password hash (one-time use)
    const resetSecret = JWT_SECRET + user.passwordHash;
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, role: isSuperAdmin ? 'SUPER_ADMIN' : user.role },
      resetSecret,
      { expiresIn: '15m' }
    );

    // Build reset URL
    const resetUrl = `${PRIMARY_FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // TODO: send resetUrl via email (e.g. nodemailer/SES/SendGrid) instead of logging it.
    console.log(`\n========================================`);
    console.log(`PASSWORD RESET REQUESTED FOR: ${user.email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`========================================\n`);

    // Only ever return the raw reset link in the API response outside of
    // production — in production this must go out via email only, since
    // returning it here would let anyone reset any account's password
    // without ever needing access to that account's inbox.
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ ...genericResponse, resetUrl });
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPassword(req, res) {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    return res.status(400).json({ error: 'Token, email, and new password are required' });
  }
  const passwordError = getPasswordError(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    let user = await prisma.superAdmin.findUnique({ where: { email } });
    let isSuperAdmin = true;

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      isSuperAdmin = false;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify token using the composite secret
    const resetSecret = JWT_SECRET + user.passwordHash;
    let decoded;
    try {
      decoded = jwt.verify(token, resetSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.email !== email || decoded.id !== user.id) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update in database
    if (isSuperAdmin) {
      await prisma.superAdmin.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  const passwordError = getPasswordError(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    let user;
    if (role === 'SUPER_ADMIN') {
      user = await prisma.superAdmin.findUnique({ where: { id: userId } });
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Save to DB
    if (role === 'SUPER_ADMIN') {
      await prisma.superAdmin.update({
        where: { id: userId },
        data: { passwordHash },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
    }

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}