import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { resetDb } from '../helpers/db.js';
import {
  createSchool,
  createUser,
  createStudent,
  createFeeType,
  createFeeStructure,
  createStudentFee,
} from '../helpers/factories.js';
import { authHeader } from '../helpers/auth.js';

beforeEach(async () => {
  await resetDb();
});

// Sets up two independent schools, each with their own admin, accountant,
// student, fee type/structure, and a student fee record.
async function setupTwoSchools() {
  const schoolA = await createSchool({ name: 'School A' });
  const schoolB = await createSchool({ name: 'School B' });

  const adminA = await createUser({ role: 'SCHOOL_ADMIN', schoolId: schoolA.id, email: 'adminA@example.com' });
  const adminB = await createUser({ role: 'SCHOOL_ADMIN', schoolId: schoolB.id, email: 'adminB@example.com' });

  const accountantA = await createUser({
    role: 'ACCOUNTANT',
    schoolId: schoolA.id,
    email: 'accA@example.com',
    permissions: { can_apply_waiver: true, can_record_payment: true, can_view_dashboard_metrics: true },
  });

  const { student: studentA } = await createStudent({ schoolId: schoolA.id, studentOverrides: { rollNumber: 'A-1001' } });
  const { student: studentB } = await createStudent({ schoolId: schoolB.id, studentOverrides: { rollNumber: 'B-1001' } });

  const feeTypeA = await createFeeType(schoolA.id, { name: 'Tuition A' });
  const feeTypeB = await createFeeType(schoolB.id, { name: 'Tuition B' });

  const structureA = await createFeeStructure(schoolA.id, feeTypeA.id);
  const structureB = await createFeeStructure(schoolB.id, feeTypeB.id);

  const studentFeeA = await createStudentFee(schoolA.id, studentA.id, structureA.id);
  const studentFeeB = await createStudentFee(schoolB.id, studentB.id, structureB.id);

  return { schoolA, schoolB, adminA, adminB, accountantA, studentA, studentB, feeTypeA, feeTypeB, studentFeeA, studentFeeB };
}

describe('Tenant isolation: students', () => {
  it("a school admin only sees their own school's students", async () => {
    const { schoolA, adminA } = await setupTwoSchools();

    const res = await request(app)
      .get('/api/school-admin/students')
      .set(authHeader({ id: adminA.id, role: 'SCHOOL_ADMIN', schoolId: schoolA.id }));

    expect(res.status).toBe(200);
    const rollNumbers = res.body.map((s) => s.rollNumber);
    expect(rollNumbers).toContain('A-1001');
    expect(rollNumbers).not.toContain('B-1001');
  });
});

describe('Tenant isolation: fee types', () => {
  it("a school admin only sees their own school's fee types", async () => {
    const { schoolA, adminA } = await setupTwoSchools();

    const res = await request(app)
      .get('/api/school-admin/fee-types')
      .set(authHeader({ id: adminA.id, role: 'SCHOOL_ADMIN', schoolId: schoolA.id }));

    expect(res.status).toBe(200);
    const names = res.body.map((f) => f.name);
    expect(names).toContain('Tuition A');
    expect(names).not.toContain('Tuition B');
  });
});

describe('Tenant isolation: student fees queue (accountant)', () => {
  it("an accountant only sees their own school's fee records", async () => {
    const { schoolA, accountantA, studentFeeA } = await setupTwoSchools();

    const res = await request(app)
      .get('/api/accountant/student-fees')
      .set(authHeader({ id: accountantA.id, role: 'ACCOUNTANT', schoolId: schoolA.id, permissions: accountantA.permissions }));

    expect(res.status).toBe(200);
    const ids = res.body.map((f) => f.id);
    expect(ids).toContain(studentFeeA.id);
  });
});

describe('Tenant isolation: cross-school mutation attempts are blocked', () => {
  it("School A's admin cannot apply a waiver to School B's student fee (404, not leaked)", async () => {
    const { schoolA, adminA, studentFeeB } = await setupTwoSchools();

    const res = await request(app)
      .post(`/api/school-admin/student-fees/${studentFeeB.id}/waiver`)
      .set(authHeader({ id: adminA.id, role: 'SCHOOL_ADMIN', schoolId: schoolA.id }))
      .send({ waiverAmount: 1000, reason: 'Attempted cross-tenant waiver' });

    expect(res.status).toBe(404);
  });

  it("School A's admin cannot apply a penalty to School B's student fee (404, not leaked)", async () => {
    const { schoolA, adminA, studentFeeB } = await setupTwoSchools();

    const res = await request(app)
      .post(`/api/school-admin/student-fees/${studentFeeB.id}/penalty`)
      .set(authHeader({ id: adminA.id, role: 'SCHOOL_ADMIN', schoolId: schoolA.id }))
      .send({ penaltyAmount: 500 });

    expect(res.status).toBe(404);
  });

  it("an accountant cannot record a payment against another school's fee record", async () => {
    const { schoolA, accountantA, studentFeeB } = await setupTwoSchools();

    const res = await request(app)
      .post('/api/accountant/transactions')
      .set(authHeader({ id: accountantA.id, role: 'ACCOUNTANT', schoolId: schoolA.id, permissions: accountantA.permissions }))
      .send({ studentFeeId: studentFeeB.id, amount: 100, method: 'CASH' });

    // Should not succeed against a fee record outside the accountant's school
    expect(res.status).toBe(404);
  });
});

describe('attachSchoolScope edge cases', () => {
  it('rejects a SCHOOL_ADMIN token with no schoolId', async () => {
    const res = await request(app)
      .get('/api/school-admin/students')
      .set(authHeader({ id: 'some-id', role: 'SCHOOL_ADMIN', schoolId: null }));

    expect(res.status).toBe(403);
  });

  it('rejects requests with no token at all', async () => {
    const res = await request(app).get('/api/school-admin/students');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const badToken = jwt.sign({ id: 'x', role: 'SCHOOL_ADMIN', schoolId: 'y' }, 'wrong-secret');

    const res = await request(app)
      .get('/api/school-admin/students')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(403);
  });
});

describe('checkPermission for accountants', () => {
  it('blocks an accountant without can_record_payment from recording a payment', async () => {
    const school = await createSchool();
    const accountant = await createUser({
      role: 'ACCOUNTANT',
      schoolId: school.id,
      permissions: { can_record_payment: false },
    });
    const { student } = await createStudent({ schoolId: school.id });
    const feeType = await createFeeType(school.id);
    const structure = await createFeeStructure(school.id, feeType.id);
    const studentFee = await createStudentFee(school.id, student.id, structure.id);

    const res = await request(app)
      .post('/api/accountant/transactions')
      .set(authHeader({ id: accountant.id, role: 'ACCOUNTANT', schoolId: school.id, permissions: accountant.permissions }))
      .send({ studentFeeId: studentFee.id, amount: 100, method: 'CASH' });

    expect(res.status).toBe(403);
  });

  it('SCHOOL_ADMIN always has full permission regardless of the permission key', async () => {
    const school = await createSchool();
    const admin = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
    const { student } = await createStudent({ schoolId: school.id });
    const feeType = await createFeeType(school.id);
    const structure = await createFeeStructure(school.id, feeType.id);
    const studentFee = await createStudentFee(school.id, student.id, structure.id);

    const res = await request(app)
      .post('/api/accountant/transactions')
      .set(authHeader({ id: admin.id, role: 'SCHOOL_ADMIN', schoolId: school.id }))
      .send({ studentFeeId: studentFee.id, amount: 100, method: 'CASH' });

    expect(res.status).toBe(201);
  });
});
