import bcrypt from 'bcryptjs';
import prisma from '../db.js';

export async function createSchool(req, res) {
  const { name, slug, address, logoUrl, contactEmail, adminName, adminEmail, adminPassword } = req.body;

  if (!name || !slug || !contactEmail || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'All primary fields (school name, slug, contact email, admin credentials) are required.' });
  }

  try {
    // Check if school slug or admin email already exists
    const existingSchool = await prisma.school.findUnique({ where: { slug } });
    if (existingSchool) {
      return res.status(400).json({ error: 'School with this slug already exists' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create School
      const school = await tx.school.create({
        data: {
          name,
          slug,
          address,
          logoUrl,
          contactEmail,
          status: 'ACTIVE',
        },
      });

      // 2. Create the first School Admin User
      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id,
          status: 'active',
        },
      });

      return { school, admin };
    });

    return res.status(201).json({
      message: 'School and Admin onboarded successfully',
      school: result.school,
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        role: result.admin.role,
      },
    });
  } catch (error) {
    console.error('School onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSchools(req, res) {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            studentFees: true,
          },
        },
      },
    });
    return res.json(schools);
  } catch (error) {
    console.error('Get schools error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleSchoolStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (ACTIVE or SUSPENDED) is required' });
  }

  try {
    const school = await prisma.school.update({
      where: { id },
      data: { status },
    });
    return res.json({ message: `School status updated to ${status}`, school });
  } catch (error) {
    console.error('Toggle school status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSuperAdminAnalytics(req, res) {
  try {
    // 1. Total revenue collected across all tenants
    const revenueAgg = await prisma.transaction.aggregate({
      where: {
        status: { in: ['SUCCESS', 'CLEARED'] },
      },
      _sum: {
        amount: true,
      },
    });

    // 2. Count metrics
    const schoolCount = await prisma.school.count();
    const activeSchoolCount = await prisma.school.count({ where: { status: 'ACTIVE' } });
    const studentCount = await prisma.student.count();

    // 3. Revenue by school
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    const revenueBySchool = [];
    for (const school of schools) {
      const schoolRevenue = await prisma.transaction.aggregate({
        where: {
          schoolId: school.id,
          status: { in: ['SUCCESS', 'CLEARED'] },
        },
        _sum: {
          amount: true,
        },
      });

      const schoolStudents = await prisma.student.count({
        where: { schoolId: school.id },
      });

      revenueBySchool.push({
        id: school.id,
        name: school.name,
        slug: school.slug,
        status: school.status,
        revenue: Number(schoolRevenue._sum.amount || 0),
        students: schoolStudents,
      });
    }

    return res.json({
      totalRevenue: Number(revenueAgg._sum.amount || 0),
      totalSchools: schoolCount,
      activeSchools: activeSchoolCount,
      totalStudents: studentCount,
      schoolsRevenue: revenueBySchool,
    });
  } catch (error) {
    console.error('Super Admin analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
