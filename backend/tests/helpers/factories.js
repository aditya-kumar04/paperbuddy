import bcrypt from 'bcryptjs';
import prisma from '../../src/db.js';

// Used as the plaintext password for any factory-created account whose
// passwordHash isn't explicitly overridden. Meets the app's password
// strength rule (8+ chars, at least one letter and one number).
export const TEST_PASSWORD = 'TestPass123';
let cachedTestPasswordHash = null;

async function testPasswordHash() {
  if (!cachedTestPasswordHash) {
    cachedTestPasswordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  }
  return cachedTestPasswordHash;
}

let schoolCounter = 0;
export async function createSchool(overrides = {}) {
  schoolCounter += 1;
  return prisma.school.create({
    data: {
      name: overrides.name || `Test School ${schoolCounter}`,
      slug: overrides.slug || `test-school-${schoolCounter}-${Date.now()}`,
      contactEmail: overrides.contactEmail || `school${schoolCounter}@example.com`,
      status: overrides.status || 'ACTIVE',
    },
  });
}

export async function createSuperAdmin(overrides = {}) {
  return prisma.superAdmin.create({
    data: {
      name: overrides.name || 'Test Super Admin',
      email: overrides.email || `superadmin-${Date.now()}@example.com`,
      passwordHash: overrides.passwordHash || (await testPasswordHash()),
    },
  });
}

// Creates a User row for a given role (SCHOOL_ADMIN, ACCOUNTANT, STUDENT).
// For STUDENT role, prefer createStudent() below, which also creates the
// linked Student profile row.
let userCounter = 0;
export async function createUser(overrides = {}) {
  userCounter += 1;
  return prisma.user.create({
    data: {
      name: overrides.name || `Test User ${userCounter}`,
      email: overrides.email || `user${userCounter}-${Date.now()}@example.com`,
      passwordHash: overrides.passwordHash || (await testPasswordHash()),
      role: overrides.role || 'SCHOOL_ADMIN',
      schoolId: overrides.schoolId,
      status: overrides.status || 'active',
      permissions: overrides.permissions ?? null,
      phone: overrides.phone,
    },
  });
}

let studentCounter = 0;
export async function createStudent({ schoolId, userOverrides = {}, studentOverrides = {} }) {
  studentCounter += 1;
  const user = await createUser({
    role: 'STUDENT',
    schoolId,
    name: userOverrides.name || `Test Student ${studentCounter}`,
    email: userOverrides.email || `student${studentCounter}-${Date.now()}@example.com`,
    ...userOverrides,
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      schoolId,
      rollNumber: studentOverrides.rollNumber || `ROLL-${studentCounter}-${Date.now()}`,
      class: studentOverrides.class || '10',
      section: studentOverrides.section || 'A',
      guardianName: studentOverrides.guardianName || 'Test Guardian',
      guardianPhone: studentOverrides.guardianPhone || '9999999999',
    },
  });

  return { user, student };
}

export async function createFeeType(schoolId, overrides = {}) {
  return prisma.feeType.create({
    data: {
      schoolId,
      name: overrides.name || 'Tuition Fee',
      description: overrides.description,
      isRecurring: overrides.isRecurring ?? false,
    },
  });
}

export async function createFeeStructure(schoolId, feeTypeId, overrides = {}) {
  return prisma.feeStructure.create({
    data: {
      schoolId,
      feeTypeId,
      class: overrides.class || '10',
      amount: overrides.amount ?? 5000,
      dueDate: overrides.dueDate || new Date('2026-12-31'),
      academicYear: overrides.academicYear || '2026-2027',
    },
  });
}

export async function createStudentFee(schoolId, studentId, feeStructureId, overrides = {}) {
  return prisma.studentFee.create({
    data: {
      schoolId,
      studentId,
      feeStructureId,
      amountDue: overrides.amountDue ?? 5000,
      amountPaid: overrides.amountPaid ?? 0,
      status: overrides.status || 'UNPAID',
      waiverAmount: overrides.waiverAmount ?? 0,
      penaltyAmount: overrides.penaltyAmount ?? 0,
      dueDate: overrides.dueDate || new Date('2026-12-31'),
    },
  });
}

export async function createInvite(schoolId, createdById, overrides = {}) {
  return prisma.invite.create({
    data: {
      schoolId,
      email: overrides.email || `invitee-${Date.now()}@example.com`,
      role: overrides.role || 'ACCOUNTANT',
      token: overrides.token || `test-invite-token-${Date.now()}-${Math.random()}`,
      expiresAt: overrides.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      accepted: overrides.accepted ?? false,
      createdById,
    },
  });
}
