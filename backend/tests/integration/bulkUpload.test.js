import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import xlsx from 'xlsx';
import app from '../../src/app.js';
import { resetDb } from '../helpers/db.js';
import { createSchool, createUser } from '../helpers/factories.js';
import { authHeader } from '../helpers/auth.js';

beforeEach(async () => {
  await resetDb();
});

function buildXlsxBuffer(rows) {
  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function setupSchoolAdmin() {
  const school = await createSchool();
  const admin = await createUser({ role: 'SCHOOL_ADMIN', schoolId: school.id });
  return { school, admin, header: authHeader({ id: admin.id, role: 'SCHOOL_ADMIN', schoolId: school.id }) };
}

describe('POST /api/school-admin/students/bulk-upload', () => {
  it('creates students with unique, non-default passwords', async () => {
    const { school, header } = await setupSchoolAdmin();

    const buffer = buildXlsxBuffer([
      {
        Name: 'Alice Example',
        Email: 'alice@example.com',
        RollNumber: 'R-100',
        Class: '10',
        Section: 'A',
        GuardianName: 'Guardian One',
        GuardianPhone: '9000000001',
      },
      {
        Name: 'Bob Example',
        Email: 'bob@example.com',
        RollNumber: 'R-101',
        Class: '10',
        Section: 'A',
        GuardianName: 'Guardian Two',
        GuardianPhone: '9000000002',
      },
    ]);

    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buffer, { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.status).toBe(200);
    expect(res.body.summary.success).toBe(2);
    expect(res.body.summary.failed).toBe(0);
    expect(res.body.summary.credentials).toHaveLength(2);

    const [cred1, cred2] = res.body.summary.credentials;
    // Passwords must be unique per student, and not the old shared default.
    expect(cred1.tempPassword).not.toBe(cred2.tempPassword);
    expect(cred1.tempPassword).not.toBe('Student123!');
    expect(cred2.tempPassword).not.toBe('Student123!');
  });

  it('rejects rows with missing required columns and still processes valid rows', async () => {
    const { header } = await setupSchoolAdmin();

    const buffer = buildXlsxBuffer([
      {
        Name: 'Missing Fields',
        Email: 'missing@example.com',
        // RollNumber intentionally omitted
        Class: '10',
        Section: 'A',
        GuardianName: 'Guardian',
        GuardianPhone: '9000000003',
      },
      {
        Name: 'Valid Row',
        Email: 'valid@example.com',
        RollNumber: 'R-200',
        Class: '10',
        Section: 'A',
        GuardianName: 'Guardian',
        GuardianPhone: '9000000004',
      },
    ]);

    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buffer, { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.status).toBe(200);
    expect(res.body.summary.success).toBe(1);
    expect(res.body.summary.failed).toBe(1);
    expect(res.body.summary.errors[0]).toMatch(/missing required columns/i);
  });

  it('rejects a row with an invalid email format', async () => {
    const { header } = await setupSchoolAdmin();

    const buffer = buildXlsxBuffer([
      {
        Name: 'Bad Email',
        Email: 'not-an-email',
        RollNumber: 'R-300',
        Class: '10',
        Section: 'A',
        GuardianName: 'Guardian',
        GuardianPhone: '9000000005',
      },
    ]);

    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buffer, { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.status).toBe(200);
    expect(res.body.summary.success).toBe(0);
    expect(res.body.summary.failed).toBe(1);
    expect(res.body.summary.errors[0]).toMatch(/not a valid email/i);
  });

  it('rejects a duplicate roll number within the same school', async () => {
    const { school, header } = await setupSchoolAdmin();

    // First upload
    await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buildXlsxBuffer([
        { Name: 'First', Email: 'first@example.com', RollNumber: 'DUP-1', Class: '10', Section: 'A', GuardianName: 'G', GuardianPhone: '9000000006' },
      ]), { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Second upload reusing the same roll number
    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buildXlsxBuffer([
        { Name: 'Second', Email: 'second@example.com', RollNumber: 'DUP-1', Class: '10', Section: 'A', GuardianName: 'G', GuardianPhone: '9000000007' },
      ]), { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.body.summary.success).toBe(0);
    expect(res.body.summary.failed).toBe(1);
    expect(res.body.summary.errors[0]).toMatch(/already exists/i);
  });

  it('rejects non-xlsx file types', async () => {
    const { header } = await setupSchoolAdmin();

    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', Buffer.from('just some text'), { filename: 'students.txt', contentType: 'text/plain' });

    expect(res.status).toBe(500); // multer fileFilter error surfaces via the global error handler
  });

  it('requires SCHOOL_ADMIN role (accountants cannot bulk-upload)', async () => {
    const school = await createSchool();
    const accountant = await createUser({ role: 'ACCOUNTANT', schoolId: school.id });
    const header = authHeader({ id: accountant.id, role: 'ACCOUNTANT', schoolId: school.id, permissions: {} });

    const buffer = buildXlsxBuffer([
      { Name: 'X', Email: 'x@example.com', RollNumber: 'R-999', Class: '10', Section: 'A', GuardianName: 'G', GuardianPhone: '9000000008' },
    ]);

    const res = await request(app)
      .post('/api/school-admin/students/bulk-upload')
      .set(header)
      .attach('file', buffer, { filename: 'students.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.status).toBe(403);
  });
});
