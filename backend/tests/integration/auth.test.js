import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import {
  createSchool,
  createSuperAdmin,
  createUser,
  createInvite,
  TEST_PASSWORD,
} from '../helpers/factories.js';
import { authHeader, signResetToken } from '../helpers/auth.js';

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/auth/login', () => {
  it('logs in a super admin with correct credentials', async () => {
    const superAdmin = await createSuperAdmin({ email: 'super@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: superAdmin.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('logs in a school admin with correct credentials', async () => {
    const school = await createSchool();
    const admin = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'admin@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('SCHOOL_ADMIN');
    expect(res.body.user.schoolId).toBe(school.id);
  });

  it('rejects an incorrect password', async () => {
    const school = await createSchool();
    const admin = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'admin2@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects a non-existent email with the same generic error as a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects a malformed email with a 400 before hitting the database', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'whatever123' });

    expect(res.status).toBe(400);
  });

  it('rejects login for an inactive user', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'ACCOUNTANT', schoolId: school.id, email: 'inactive@example.com', status: 'inactive' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(403);
  });

  it('rejects login for a user whose school is suspended', async () => {
    const school = await createSchool({ status: 'SUSPENDED' });
    const user = await createUser({ role: 'ACCOUNTANT', schoolId: school.id, email: 'suspended-school@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(403);
  });

  it('requires both email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns the same generic message for an existing email', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'exists@example.com' });

    const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
  });

  it('returns the identical generic message for a non-existent email (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
  });

  it('includes resetUrl in non-production (test) environment for an existing user', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'reset-me@example.com' });

    const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });

    expect(res.body.resetUrl).toBeTruthy();
    expect(res.body.resetUrl).toContain('/reset-password');
  });

  it('never includes resetUrl for a non-existent email, even in dev', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost2@example.com' });
    expect(res.body.resetUrl).toBeUndefined();
  });

  it('rejects a malformed email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('resets the password with a valid token and allows login with the new password', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'will-reset@example.com' });
    const token = signResetToken(user, { role: 'SCHOOL_ADMIN' });

    const res = await request(app).post('/api/auth/reset-password').send({
      token,
      email: user.email,
      newPassword: 'BrandNewPass1',
    });

    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'BrandNewPass1' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects a weak new password', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'weak-pw@example.com' });
    const token = signResetToken(user, { role: 'SCHOOL_ADMIN' });

    const res = await request(app).post('/api/auth/reset-password').send({
      token,
      email: user.email,
      newPassword: 'short',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a token that was signed against a since-changed password hash', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'stale-token@example.com' });
    const token = signResetToken(user, { role: 'SCHOOL_ADMIN' });

    // Password changes after the token was issued (e.g. a second reset flow completed first)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await (await import('bcryptjs')).default.hash('SomeOtherPass1', 10) } });

    const res = await request(app).post('/api/auth/reset-password').send({
      token,
      email: user.email,
      newPassword: 'BrandNewPass1',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a garbage token', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'garbage-token@example.com' });

    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'not-a-real-token',
      email: user.email,
      newPassword: 'BrandNewPass1',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/accept-invite', () => {
  it('creates a user from a valid, unexpired invite', async () => {
    const school = await createSchool();
    const creator = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
    const invite = await createInvite(school.id, creator.id, { email: 'newaccountant@example.com', role: 'ACCOUNTANT' });

    const res = await request(app).post('/api/auth/accept-invite').send({
      token: invite.token,
      name: 'New Accountant',
      password: 'AcceptMe123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('newaccountant@example.com');
    expect(res.body.user.role).toBe('ACCOUNTANT');
    // Default accountant permissions should be seeded
    expect(res.body.user.permissions.can_record_payment).toBe(true);
    expect(res.body.user.permissions.can_apply_waiver).toBe(false);
  });

  it('rejects an already-accepted invite', async () => {
    const school = await createSchool();
    const creator = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
    const invite = await createInvite(school.id, creator.id, { accepted: true });

    const res = await request(app).post('/api/auth/accept-invite').send({
      token: invite.token,
      name: 'Someone',
      password: 'AcceptMe123',
    });

    expect(res.status).toBe(400);
  });

  it('rejects an expired invite', async () => {
    const school = await createSchool();
    const creator = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
    const invite = await createInvite(school.id, creator.id, { expiresAt: new Date(Date.now() - 1000) });

    const res = await request(app).post('/api/auth/accept-invite').send({
      token: invite.token,
      name: 'Someone',
      password: 'AcceptMe123',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a weak password', async () => {
    const school = await createSchool();
    const creator = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
    const invite = await createInvite(school.id, creator.id);

    const res = await request(app).post('/api/auth/accept-invite').send({
      token: invite.token,
      name: 'Someone',
      password: 'weak',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/change-password', () => {
  it('changes the password when the current password is correct', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'change-pw@example.com' });

    const res = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader({ id: user.id, role: user.role, schoolId: school.id }))
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'FreshPass123' });

    expect(res.status).toBe(200);
  });

  it('rejects an incorrect current password', async () => {
    const school = await createSchool();
    const user = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id, email: 'change-pw-2@example.com' });

    const res = await request(app)
      .post('/api/auth/change-password')
      .set(authHeader({ id: user.id, role: user.role, schoolId: school.id }))
      .send({ currentPassword: 'wrong', newPassword: 'FreshPass123' });

    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'FreshPass123' });

    expect(res.status).toBe(401);
  });
});
