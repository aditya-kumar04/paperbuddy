import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'paperbuddy-super-secret-jwt-signing-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'paperbuddy-super-secret-jwt-refresh-signing-key-2026';

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
