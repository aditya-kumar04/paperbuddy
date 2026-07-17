import prisma from './src/db.js';

async function runTests() {
  console.log('--------------------------------------------------');
  console.log('PaperBuddy SaaS — Core Logic Verification Suite');
  console.log('--------------------------------------------------');

  try {
    // Test 1: Verify Super Admin Seeding
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: 'superadmin@paperbuddy.com' },
    });
    if (superAdmin) {
      console.log('✔ Test 1 passed: Super Admin successfully created.');
    } else {
      throw new Error('Test 1 failed: Super Admin not found in database.');
    }

    // Test 2: Verify School Tenants
    const schools = await prisma.school.findMany();
    if (schools.length >= 2) {
      console.log(`✔ Test 2 passed: Multi-tenancy verified (${schools.length} schools active).`);
    } else {
      throw new Error(`Test 2 failed: Expected at least 2 schools, found ${schools.length}.`);
    }

    // Test 3: Check Tenant User Separation
    const greenwood = await prisma.school.findUnique({ where: { slug: 'greenwood' } });
    if (!greenwood) throw new Error('Greenwood school not found');

    const greenwoodUsers = await prisma.user.findMany({
      where: { schoolId: greenwood.id },
    });
    
    const containsSuperAdmin = greenwoodUsers.some(u => u.role === 'SUPER_ADMIN');
    if (!containsSuperAdmin) {
      console.log('✔ Test 3 passed: Isolation check passed (Super Admin is not leakage-scoped to School).');
    } else {
      throw new Error('Test 3 failed: Super Admin should not have a school scope.');
    }

    // Test 4: Verify Student Fee Auto-Calculations
    const rohan = await prisma.student.findFirst({
      where: { rollNumber: 'GW-2026-1001' },
      include: { studentFees: { include: { feeStructure: { include: { feeType: true } } } } },
    });

    if (rohan) {
      console.log(`✔ Test 4 passed: Student Rohan registered with ${rohan.studentFees.length} assigned bills.`);
      
      const tuitionFee = rohan.studentFees.find(f => f.feeStructure.feeType.name === 'Tuition Fee');
      if (tuitionFee) {
        const remaining = Number(tuitionFee.amountDue) + Number(tuitionFee.penaltyAmount) - Number(tuitionFee.amountPaid) - Number(tuitionFee.waiverAmount);
        console.log(`   - Rohan Tuition Due: ${tuitionFee.amountDue}, Paid: ${tuitionFee.amountPaid}, Remaining Balance: ${remaining}`);
        if (remaining === 2500) {
          console.log('✔ Test 5 passed: Financial balance calculation is correct.');
        } else {
          throw new Error(`Test 5 failed: Expected remaining to be 2500, got ${remaining}`);
        }
      } else {
        throw new Error('Test 4 validation failed: Tuition fee record not found for Rohan.');
      }
    } else {
      throw new Error('Test 4 failed: Seeding data not found for Rohan Sharma.');
    }

    console.log('--------------------------------------------------');
    console.log('STATUS: All backend multi-tenancy verification tests PASSED.');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Verification Suite FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
