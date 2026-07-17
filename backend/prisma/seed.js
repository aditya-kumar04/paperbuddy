import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with enriched multi-tenant mock SaaS data...');

  // Clean existing tables in correct order due to constraints
  await prisma.transaction.deleteMany({});
  await prisma.studentFee.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  await prisma.feeType.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.superAdmin.deleteMany({});

  const adminHash = bcrypt.hashSync('Admin123!', 10);
  const accountantHash = bcrypt.hashSync('Accountant123!', 10);
  const studentHash = bcrypt.hashSync('Student123!', 10);

  // 1. Create Super Admin
  const superAdminHash = bcrypt.hashSync('SuperAdmin123!', 10);
  const superAdmin = await prisma.superAdmin.create({
    data: {
      name: 'Super Admin Operator',
      email: 'superadmin@paperbuddy.com',
      passwordHash: superAdminHash,
    },
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);

  // 2. Create School Tenants
  const schoolGreenwood = await prisma.school.create({
    data: {
      name: 'Greenwood International School',
      slug: 'greenwood',
      address: '77 Oakridge Blvd, Sector 4, Bangalore',
      logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=120',
      contactEmail: 'info@greenwood.edu',
      status: 'ACTIVE',
    },
  });

  const schoolBeacon = await prisma.school.create({
    data: {
      name: 'Beacon Hill Prep School',
      slug: 'beacon',
      address: '102 Sunset Lane, New Delhi',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=120',
      contactEmail: 'contact@beaconhill.edu',
      status: 'ACTIVE',
    },
  });
  console.log(`Created Schools: ${schoolGreenwood.name}, ${schoolBeacon.name}`);

  // -------------------------------------------------------------------
  // SCHOOL 1: GREENWOOD INTERNATIONAL
  // -------------------------------------------------------------------
  
  // Staff Accounts
  const greenwoodAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'admin@greenwood.com',
      passwordHash: adminHash,
      role: 'SCHOOL_ADMIN',
      schoolId: schoolGreenwood.id,
      status: 'active',
    },
  });

  const greenwoodAccountant = await prisma.user.create({
    data: {
      name: 'Mark Miller',
      email: 'accountant@greenwood.com',
      passwordHash: accountantHash,
      role: 'ACCOUNTANT',
      schoolId: schoolGreenwood.id,
      status: 'active',
      permissions: {
        can_record_payment: true,
        can_apply_waiver: true,
        can_apply_penalty: true,
        can_reconcile_cheque: true,
        can_view_dashboard_metrics: true,
        can_edit_fee_structure: true,
      },
    },
  });

  // Students (Grade 10 and Grade 12)
  const stUsersData = [
    { name: 'Rohan Sharma', email: 'student@greenwood.com', roll: 'GW-2026-1001', class: '10', sec: 'A', gName: 'Amit Sharma', gPhone: '+919876543210' },
    { name: 'Emily Watson', email: 'emily@greenwood.com', roll: 'GW-2026-1002', class: '10', sec: 'A', gName: 'Robert Watson', gPhone: '+919876543212' },
    { name: 'Aarav Patel', email: 'aarav@greenwood.com', roll: 'GW-2026-1003', class: '10', sec: 'A', gName: 'Nitin Patel', gPhone: '+919811223344' },
    { name: 'Priya Nair', email: 'priya@greenwood.com', roll: 'GW-2026-1004', class: '10', sec: 'B', gName: 'Gopal Nair', gPhone: '+919933445566' },
    { name: 'Kabir Mehta', email: 'kabir@greenwood.com', roll: 'GW-2026-1005', class: '10', sec: 'B', gName: 'Vikram Mehta', gPhone: '+919822334455' },
    { name: 'Sneha Sen', email: 'sneha@greenwood.com', roll: 'GW-2026-1201', class: '12', sec: 'A', gName: 'Pradip Sen', gPhone: '+919866778899' },
    { name: 'Vikram Rao', email: 'vikram@greenwood.com', roll: 'GW-2026-1202', class: '12', sec: 'A', gName: 'Anil Rao', gPhone: '+919877889900' }
  ];

  const studentsList = [];
  for (const st of stUsersData) {
    const user = await prisma.user.create({
      data: {
        name: st.name,
        email: st.email,
        passwordHash: studentHash,
        role: 'STUDENT',
        schoolId: schoolGreenwood.id,
        status: 'active',
      }
    });

    const studentObj = await prisma.student.create({
      data: {
        userId: user.id,
        schoolId: schoolGreenwood.id,
        rollNumber: st.roll,
        class: st.class,
        section: st.sec,
        guardianName: st.gName,
        guardianPhone: st.gPhone
      }
    });
    studentsList.push(studentObj);
  }
  console.log(`Seeded ${studentsList.length} students at Greenwood.`);

  // Fee Categories
  const feeTuition = await prisma.feeType.create({
    data: { schoolId: schoolGreenwood.id, name: 'Tuition Fee', description: 'Standard term tuition fee billing', isRecurring: true }
  });
  const feeTransport = await prisma.feeType.create({
    data: { schoolId: schoolGreenwood.id, name: 'Transport Fee', description: 'School bus transport fee routing', isRecurring: true }
  });
  const feeExam = await prisma.feeType.create({
    data: { schoolId: schoolGreenwood.id, name: 'Exam Fee', description: 'Annual term exam registration', isRecurring: false }
  });
  const feeLab = await prisma.feeType.create({
    data: { schoolId: schoolGreenwood.id, name: 'Lab Practical Fee', description: 'Physics & Chemistry lab material fee', isRecurring: false }
  });

  // Fee Structures (Grade 10 and Grade 12)
  const fsTuition10 = await prisma.feeStructure.create({
    data: { schoolId: schoolGreenwood.id, feeTypeId: feeTuition.id, class: '10', amount: 4500.00, dueDate: new Date('2026-07-31'), academicYear: '2026-2027' }
  });
  const fsTransport10 = await prisma.feeStructure.create({
    data: { schoolId: schoolGreenwood.id, feeTypeId: feeTransport.id, class: '10', amount: 1500.00, dueDate: new Date('2026-08-15'), academicYear: '2026-2027' }
  });
  const fsExam10 = await prisma.feeStructure.create({
    data: { schoolId: schoolGreenwood.id, feeTypeId: feeExam.id, class: '10', amount: 800.00, dueDate: new Date('2026-06-30'), academicYear: '2026-2027' }
  });

  const fsTuition12 = await prisma.feeStructure.create({
    data: { schoolId: schoolGreenwood.id, feeTypeId: feeTuition.id, class: '12', amount: 6000.00, dueDate: new Date('2026-07-31'), academicYear: '2026-2027' }
  });
  const fsLab12 = await prisma.feeStructure.create({
    data: { schoolId: schoolGreenwood.id, feeTypeId: feeLab.id, class: '12', amount: 1200.00, dueDate: new Date('2026-06-15'), academicYear: '2026-2027' }
  });

  // Assign Bills and Create History
  const findStudent = (roll) => studentsList.find(s => s.rollNumber === roll);

  // Student 1: Rohan Sharma (Grade 10)
  const sfRohanTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1001').id, feeStructureId: fsTuition10.id, amountDue: 4500.00, amountPaid: 2000.00, status: 'PARTIAL', dueDate: fsTuition10.dueDate }
  });
  const sfRohanTransport = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1001').id, feeStructureId: fsTransport10.id, amountDue: 1500.00, amountPaid: 0.00, status: 'UNPAID', dueDate: fsTransport10.dueDate }
  });
  const sfRohanExam = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1001').id, feeStructureId: fsExam10.id, amountDue: 800.00, amountPaid: 800.00, status: 'PAID', dueDate: fsExam10.dueDate }
  });

  // Student 2: Emily Watson (Grade 10)
  const sfEmilyTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1002').id, feeStructureId: fsTuition10.id, amountDue: 4500.00, amountPaid: 3500.00, waiverAmount: 1000.00, waiverReason: 'Merit Scholarship', waiverApprovedBy: greenwoodAdmin.name, status: 'PAID', dueDate: fsTuition10.dueDate }
  });
  const sfEmilyExam = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1002').id, feeStructureId: fsExam10.id, amountDue: 800.00, amountPaid: 0.00, penaltyAmount: 100.00, status: 'UNPAID', dueDate: fsExam10.dueDate }
  });

  // Student 3: Aarav Patel (Grade 10)
  const sfAaravTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1003').id, feeStructureId: fsTuition10.id, amountDue: 4500.00, amountPaid: 4500.00, status: 'PAID', dueDate: fsTuition10.dueDate }
  });
  const sfAaravTransport = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1003').id, feeStructureId: fsTransport10.id, amountDue: 1500.00, amountPaid: 0.00, status: 'UNPAID', dueDate: fsTransport10.dueDate }
  });

  // Student 4: Priya Nair (Grade 10)
  const sfPriyaTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1004').id, feeStructureId: fsTuition10.id, amountDue: 4500.00, amountPaid: 2000.00, waiverAmount: 1500.00, waiverReason: 'Sports Scholarship', waiverApprovedBy: greenwoodAdmin.name, status: 'PARTIAL', dueDate: fsTuition10.dueDate }
  });

  // Student 5: Kabir Mehta (Grade 10)
  const sfKabirTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1005').id, feeStructureId: fsTuition10.id, amountDue: 4500.00, amountPaid: 0.00, status: 'UNPAID', dueDate: fsTuition10.dueDate }
  });

  // Student 6: Sneha Sen (Grade 12)
  const sfSnehaTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1201').id, feeStructureId: fsTuition12.id, amountDue: 6000.00, amountPaid: 6000.00, status: 'PAID', dueDate: fsTuition12.dueDate }
  });
  const sfSnehaLab = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1201').id, feeStructureId: fsLab12.id, amountDue: 1200.00, amountPaid: 1200.00, status: 'PAID', dueDate: fsLab12.dueDate }
  });

  // Student 7: Vikram Rao (Grade 12)
  const sfVikramTuition = await prisma.studentFee.create({
    data: { schoolId: schoolGreenwood.id, studentId: findStudent('GW-2026-1202').id, feeStructureId: fsTuition12.id, amountDue: 6000.00, amountPaid: 0.00, penaltyAmount: 200.00, status: 'UNPAID', dueDate: fsTuition12.dueDate }
  });

  // Seed Historical & Spread Transactions for Greenwood School
  const txnData = [
    { sfId: sfRohanExam.id, amt: 800, method: 'CASH', status: 'SUCCESS', ref: 'TXN-902001', date: new Date('2026-03-15T10:00:00Z') },
    { sfId: sfRohanTuition.id, amt: 2000, method: 'UPI', status: 'SUCCESS', ref: 'TXN-902002', date: new Date('2026-04-02T14:30:00Z') },
    { sfId: sfEmilyTuition.id, amt: 3500, method: 'CHEQUE', status: 'CLEARED', ref: 'TXN-902003', date: new Date('2026-05-05T09:15:00Z'), chqNum: 'CHQ90812', chqDate: new Date('2026-05-05') },
    { sfId: sfAaravTuition.id, amt: 4500, method: 'CARD', status: 'SUCCESS', ref: 'TXN-902004', date: new Date('2026-06-10T12:00:00Z') },
    { sfId: sfSnehaTuition.id, amt: 6000, method: 'UPI', status: 'SUCCESS', ref: 'TXN-902005', date: new Date('2026-07-01T15:20:00Z') },
    { sfId: sfSnehaLab.id, amt: 1200, method: 'CARD', status: 'SUCCESS', ref: 'TXN-902006', date: new Date('2026-07-02T10:45:00Z') },
    { sfId: sfPriyaTuition.id, amt: 2000, method: 'CASH', status: 'SUCCESS', ref: 'TXN-902007', date: new Date('2026-07-08T11:00:00Z') },
    // Bounced Cheque logs
    { sfId: sfVikramTuition.id, amt: 3000, method: 'CHEQUE', status: 'BOUNCED', ref: 'TXN-902008', date: new Date('2026-07-09T09:30:00Z'), chqNum: 'CHQ44556', chqDate: new Date('2026-07-05') },
    // Pending Cheques
    { sfId: sfRohanTuition.id, amt: 1000, method: 'CHEQUE', status: 'PENDING', ref: 'TXN-902009', date: new Date('2026-07-15T11:45:00Z'), chqNum: 'CHQ88112', chqDate: new Date('2026-07-15') },
    { sfId: sfKabirTuition.id, amt: 2500, method: 'CHEQUE', status: 'PENDING', ref: 'TXN-902010', date: new Date('2026-07-16T14:10:00Z'), chqNum: 'CHQ77665', chqDate: new Date('2026-07-16') }
  ];

  for (const t of txnData) {
    await prisma.transaction.create({
      data: {
        schoolId: schoolGreenwood.id,
        studentFeeId: t.sfId,
        amount: t.amt,
        method: t.method,
        status: t.status,
        recordedBy: greenwoodAccountant.id,
        receiptUrl: t.ref,
        createdAt: t.date,
        chequeNumber: t.chqNum,
        chequeDate: t.chqDate
      }
    });
  }
  console.log('Successfully seeded Greenwood transaction ledger records.');

  // -------------------------------------------------------------------
  // SCHOOL 2: BEACON HILL PREP
  // -------------------------------------------------------------------
  
  const beaconAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Gupta',
      email: 'admin@beacon.com',
      passwordHash: adminHash,
      role: 'SCHOOL_ADMIN',
      schoolId: schoolBeacon.id,
      status: 'active',
    },
  });

  const beaconAccountant = await prisma.user.create({
    data: {
      name: 'Sanjay Verma',
      email: 'accountant@beacon.com',
      passwordHash: accountantHash,
      role: 'ACCOUNTANT',
      schoolId: schoolBeacon.id,
      status: 'active',
      permissions: {
        can_record_payment: true,
        can_apply_waiver: false,
        can_apply_penalty: true,
        can_reconcile_cheque: true,
        can_view_dashboard_metrics: true,
        can_edit_fee_structure: false,
      },
    },
  });

  // Students for Beacon Hill
  const beaconStudentUser1 = await prisma.user.create({
    data: { name: 'Karan Malhotra', email: 'karan@beacon.com', passwordHash: studentHash, role: 'STUDENT', schoolId: schoolBeacon.id, status: 'active' }
  });
  const beaconStudent1 = await prisma.student.create({
    data: { userId: beaconStudentUser1.id, schoolId: schoolBeacon.id, rollNumber: 'BH-2026-2001', class: '10', section: 'A', guardianName: 'Sunil Malhotra', guardianPhone: '+919988776655' }
  });

  const beaconStudentUser2 = await prisma.user.create({
    data: { name: 'Diya Sen', email: 'diya@beacon.com', passwordHash: studentHash, role: 'STUDENT', schoolId: schoolBeacon.id, status: 'active' }
  });
  const beaconStudent2 = await prisma.student.create({
    data: { userId: beaconStudentUser2.id, schoolId: schoolBeacon.id, rollNumber: 'BH-2026-2002', class: '10', section: 'A', guardianName: 'Sujit Sen', guardianPhone: '+919977665544' }
  });

  // Beacon Hill Fee Structures
  const feeTuitionBeacon = await prisma.feeType.create({
    data: { schoolId: schoolBeacon.id, name: 'Term Tuition Fee', isRecurring: true }
  });
  const fsTuitionBeacon10 = await prisma.feeStructure.create({
    data: { schoolId: schoolBeacon.id, feeTypeId: feeTuitionBeacon.id, class: '10', amount: 5000.00, dueDate: new Date('2026-07-31'), academicYear: '2026-2027' }
  });

  // Assign Fees
  const sfKaranTuition = await prisma.studentFee.create({
    data: { schoolId: schoolBeacon.id, studentId: beaconStudent1.id, feeStructureId: fsTuitionBeacon10.id, amountDue: 5000.00, amountPaid: 5000.00, status: 'PAID', dueDate: fsTuitionBeacon10.dueDate }
  });
  const sfDiyaTuition = await prisma.studentFee.create({
    data: { schoolId: schoolBeacon.id, studentId: beaconStudent2.id, feeStructureId: fsTuitionBeacon10.id, amountDue: 5000.00, amountPaid: 1500.00, status: 'PARTIAL', dueDate: fsTuitionBeacon10.dueDate }
  });

  // Transactions
  await prisma.transaction.create({
    data: {
      schoolId: schoolBeacon.id,
      studentFeeId: sfKaranTuition.id,
      amount: 5000.00,
      method: 'UPI',
      status: 'SUCCESS',
      recordedBy: 'system',
      receiptUrl: 'BH-TXN-1001',
      createdAt: new Date('2026-07-04T16:00:00Z')
    }
  });

  await prisma.transaction.create({
    data: {
      schoolId: schoolBeacon.id,
      studentFeeId: sfDiyaTuition.id,
      amount: 1500.00,
      method: 'CASH',
      status: 'SUCCESS',
      recordedBy: beaconAccountant.id,
      receiptUrl: 'BH-TXN-1002',
      createdAt: new Date('2026-07-12T10:30:00Z')
    }
  });

  console.log('Successfully seeded Beacon Hill Prep accounts and records.');
  console.log('Database seeding process complete! Database is fully populated with rich multi-tenant logs.');
}

main()
  .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
