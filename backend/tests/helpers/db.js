import prisma from '../../src/db.js';

// Order doesn't strictly matter since CASCADE handles FK dependencies, but
// listed in child-to-parent order for readability.
const TABLES = [
  'Transaction',
  'StudentFee',
  'FeeStructure',
  'FeeType',
  'Invite',
  'Student',
  'User',
  'School',
  'SuperAdmin',
];

export async function resetDb() {
  const quoted = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
