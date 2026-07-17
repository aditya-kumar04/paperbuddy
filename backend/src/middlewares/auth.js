import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'paperbuddy-super-secret-jwt-signing-key-2026';

export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
}

export function attachSchoolScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next(); // Super Admins are not scoped to a single school
  }

  if (!req.user.schoolId) {
    return res.status(403).json({ error: 'School context missing. Access denied.' });
  }

  req.schoolId = req.user.schoolId;
  next();
}

export function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  };
}

export function checkPermission(permKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // School admin always has full privileges
    if (req.user.role === 'SCHOOL_ADMIN') {
      return next();
    }

    // Accountants are checked based on their stored permissions JSON
    if (req.user.role === 'ACCOUNTANT') {
      const permissions = req.user.permissions || {};
      if (permissions[permKey] === true) {
        return next();
      }
    }

    return res.status(403).json({ error: `Permission denied: Requires ${permKey}` });
  };
}
