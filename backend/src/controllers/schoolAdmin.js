import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import prisma from '../db.js';

// Helper function to auto-assign active fee structures to a student
async function autoAssignFeesForStudent(tx, studentId, className, schoolId) {
  // Find all active fee structures for this class in this school
  const structures = await tx.feeStructure.findMany({
    where: {
      schoolId,
      class: className,
    },
  });

  if (structures.length === 0) return;

  const studentFeesData = structures.map((structure) => ({
    schoolId,
    studentId,
    feeStructureId: structure.id,
    amountDue: structure.amount,
    amountPaid: 0,
    waiverAmount: 0,
    penaltyAmount: 0,
    dueDate: structure.dueDate,
    status: 'UNPAID',
  }));

  // CreateMany with skipDuplicates to prevent errors if already assigned
  await tx.studentFee.createMany({
    data: studentFeesData,
    skipDuplicates: true,
  });
}

// ----------------------------------------------------
// ACCOUNTANT CONTROL
// ----------------------------------------------------

export async function inviteOrCreateAccountant(req, res) {
  const { name, email, phone, password, permissions } = req.body;
  const schoolId = req.schoolId;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const accountant = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'ACCOUNTANT',
        schoolId,
        status: 'active',
        permissions: permissions || {
          can_record_payment: true,
          can_apply_waiver: false,
          can_apply_penalty: false,
          can_reconcile_cheque: true,
          can_view_dashboard_metrics: true,
          can_edit_fee_structure: false,
        },
      },
    });

    return res.status(201).json({
      message: 'Accountant account created successfully',
      accountant: {
        id: accountant.id,
        name: accountant.name,
        email: accountant.email,
        role: accountant.role,
        permissions: accountant.permissions,
      },
    });
  } catch (error) {
    console.error('Create accountant error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAccountants(req, res) {
  try {
    const accountants = await prisma.user.findMany({
      where: {
        schoolId: req.schoolId,
        role: 'ACCOUNTANT',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        permissions: true,
        createdAt: true,
      },
    });
    return res.json(accountants);
  } catch (error) {
    console.error('Get accountants error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAccountantPermissions(req, res) {
  const { id } = req.params;
  const { permissions, status } = req.body;
  const schoolId = req.schoolId;

  try {
    const user = await prisma.user.findFirst({
      where: { id, schoolId, role: 'ACCOUNTANT' },
    });

    if (!user) {
      return res.status(404).json({ error: 'Accountant not found in this school context' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        permissions: permissions !== undefined ? permissions : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return res.json({
      message: 'Accountant updated successfully',
      accountant: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        status: updated.status,
        permissions: updated.permissions,
      },
    });
  } catch (error) {
    console.error('Update accountant error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ----------------------------------------------------
// FEE TYPES & STRUCTURES CRUD
// ----------------------------------------------------

export async function createFeeType(req, res) {
  const { name, description, isRecurring } = req.body;
  const schoolId = req.schoolId;

  if (!name) {
    return res.status(400).json({ error: 'Fee Type name is required' });
  }

  try {
    const feeType = await prisma.feeType.create({
      data: {
        name,
        description,
        isRecurring: isRecurring || false,
        schoolId,
      },
    });
    return res.status(201).json(feeType);
  } catch (error) {
    console.error('Create fee type error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFeeTypes(req, res) {
  try {
    const feeTypes = await prisma.feeType.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(feeTypes);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFeeStructure(req, res) {
  const { feeTypeId, class: className, amount, dueDate, academicYear } = req.body;
  const schoolId = req.schoolId;

  if (!feeTypeId || !className || !amount || !dueDate || !academicYear) {
    return res.status(400).json({ error: 'All fields (feeTypeId, class, amount, dueDate, academicYear) are required' });
  }

  try {
    const feeType = await prisma.feeType.findFirst({
      where: { id: feeTypeId, schoolId },
    });

    if (!feeType) {
      return res.status(404).json({ error: 'Fee type not found in this school context' });
    }

    const structure = await prisma.$transaction(async (tx) => {
      // 1. Create Fee Structure
      const fs = await tx.feeStructure.create({
        data: {
          schoolId,
          feeTypeId,
          class: className,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          academicYear,
        },
      });

      // 2. AUTO-ASSIGN ENGINE: Get all students in this class
      const students = await tx.student.findMany({
        where: {
          schoolId,
          class: className,
        },
      });

      if (students.length > 0) {
        const studentFeesData = students.map((student) => ({
          schoolId,
          studentId: student.id,
          feeStructureId: fs.id,
          amountDue: fs.amount,
          amountPaid: 0,
          waiverAmount: 0,
          penaltyAmount: 0,
          dueDate: fs.dueDate,
          status: 'UNPAID',
        }));

        await tx.studentFee.createMany({
          data: studentFeesData,
          skipDuplicates: true,
        });
      }

      return fs;
    });

    return res.status(201).json({
      message: 'Fee structure created and auto-assigned to existing students in class',
      feeStructure: structure,
    });
  } catch (error) {
    console.error('Create fee structure error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFeeStructures(req, res) {
  try {
    const structures = await prisma.feeStructure.findMany({
      where: { schoolId: req.schoolId },
      include: { feeType: true },
      orderBy: { dueDate: 'asc' },
    });
    return res.json(structures);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ----------------------------------------------------
// STUDENT MANAGEMENT
// ----------------------------------------------------

export async function createStudent(req, res) {
  const { name, email, password, phone, rollNumber, class: className, section, guardianName, guardianPhone, photoUrl } = req.body;
  const schoolId = req.schoolId;

  if (!name || !email || !password || !rollNumber || !className || !section || !guardianName || !guardianPhone) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const existingStudent = await prisma.student.findFirst({
      where: { schoolId, rollNumber },
    });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this roll number already exists in this school' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: 'STUDENT',
          schoolId,
          status: 'active',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId,
          rollNumber,
          class: className,
          section,
          guardianName,
          guardianPhone,
          photoUrl,
        },
      });

      // AUTO-ASSIGN ENGINE
      await autoAssignFeesForStudent(tx, student.id, className, schoolId);

      return { user, student };
    });

    return res.status(201).json({
      message: 'Student registered successfully, fees auto-assigned',
      student: result.student,
    });
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStudents(req, res) {
  try {
    const students = await prisma.student.findMany({
      where: { schoolId: req.schoolId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        studentFees: {
          include: {
            feeStructure: {
              include: {
                feeType: true,
              },
            },
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });
    return res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function bulkUploadStudents(req, res) {
  const schoolId = req.schoolId;

  if (!req.file) {
    return res.status(400).json({ error: 'Excel file (.xlsx) is required' });
  }

  try {
    // Read buffer with SheetJS
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel sheet is empty' });
    }

    const summary = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Default password hash for uploaded students (Student123!)
    const defaultPasswordHash = await bcrypt.hash('Student123!', 10);

    for (const [index, row] of rows.entries()) {
      const {
        Name,
        Email,
        RollNumber,
        Class,
        Section,
        GuardianName,
        GuardianPhone,
        Phone,
      } = row;

      const rowNum = index + 2; // excel row offset (header is row 1)

      if (!Name || !Email || !RollNumber || !Class || !Section || !GuardianName || !GuardianPhone) {
        summary.failed++;
        summary.errors.push(`Row ${rowNum}: Missing required columns (Name, Email, RollNumber, Class, Section, GuardianName, GuardianPhone)`);
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Check email
          const existingUser = await tx.user.findUnique({ where: { email: String(Email).trim() } });
          if (existingUser) {
            throw new Error(`Email ${Email} already registered`);
          }

          // Check roll number
          const existingStudent = await tx.student.findFirst({
            where: { schoolId, rollNumber: String(RollNumber).trim() },
          });
          if (existingStudent) {
            throw new Error(`Roll number ${RollNumber} already exists in this school`);
          }

          // Create User
          const user = await tx.user.create({
            data: {
              name: String(Name).trim(),
              email: String(Email).trim(),
              phone: Phone ? String(Phone).trim() : null,
              passwordHash: defaultPasswordHash,
              role: 'STUDENT',
              schoolId,
              status: 'active',
            },
          });

          // Create Student
          const student = await tx.student.create({
            data: {
              userId: user.id,
              schoolId,
              rollNumber: String(RollNumber).trim(),
              class: String(Class).trim(),
              section: String(Section).trim(),
              guardianName: String(GuardianName).trim(),
              guardianPhone: String(GuardianPhone).trim(),
            },
          });

          // Auto-assign fees
          await autoAssignFeesForStudent(tx, student.id, String(Class).trim(), schoolId);
        });

        summary.success++;
      } catch (err) {
        summary.failed++;
        summary.errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return res.json({
      message: `Bulk upload completed. Success: ${summary.success}, Failed: ${summary.failed}`,
      summary,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ error: 'Failed to parse Excel file' });
  }
}

// ----------------------------------------------------
// WAIVERS & PENALTIES
// ----------------------------------------------------

export async function applyWaiver(req, res) {
  const { id } = req.params; // StudentFee ID
  const { waiverAmount, reason } = req.body;
  const schoolId = req.schoolId;

  if (waiverAmount === undefined || waiverAmount < 0) {
    return res.status(400).json({ error: 'Waiver amount must be a positive number' });
  }

  try {
    const studentFee = await prisma.studentFee.findFirst({
      where: { id, schoolId },
    });

    if (!studentFee) {
      return res.status(404).json({ error: 'Student fee record not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const wAmt = parseFloat(waiverAmount);
      const amountDue = Number(studentFee.amountDue);
      const amountPaid = Number(studentFee.amountPaid);
      const penaltyAmount = Number(studentFee.penaltyAmount);

      const totalRequired = amountDue + penaltyAmount;
      const totalCovered = amountPaid + wAmt;

      let status = 'UNPAID';
      if (totalCovered >= totalRequired) {
        status = wAmt >= totalRequired ? 'WAIVED' : 'PAID';
      } else if (totalCovered > 0) {
        status = 'PARTIAL';
      }

      return await tx.studentFee.update({
        where: { id },
        data: {
          waiverAmount: wAmt,
          waiverReason: reason,
          waiverApprovedBy: req.user.name || 'Admin',
          status,
        },
      });
    });

    return res.json({ message: 'Waiver applied successfully', studentFee: updated });
  } catch (error) {
    console.error('Apply waiver error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function applyPenalty(req, res) {
  const { id } = req.params; // StudentFee ID
  const { penaltyAmount } = req.body;
  const schoolId = req.schoolId;

  if (penaltyAmount === undefined || penaltyAmount < 0) {
    return res.status(400).json({ error: 'Penalty amount must be a positive number' });
  }

  try {
    const studentFee = await prisma.studentFee.findFirst({
      where: { id, schoolId },
    });

    if (!studentFee) {
      return res.status(404).json({ error: 'Student fee record not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const pAmt = parseFloat(penaltyAmount);
      const amountDue = Number(studentFee.amountDue);
      const amountPaid = Number(studentFee.amountPaid);
      const waiverAmount = Number(studentFee.waiverAmount);

      const totalRequired = amountDue + pAmt;
      const totalCovered = amountPaid + waiverAmount;

      let status = 'UNPAID';
      if (totalCovered >= totalRequired) {
        status = waiverAmount >= totalRequired ? 'WAIVED' : 'PAID';
      } else if (totalCovered > 0) {
        status = 'PARTIAL';
      }

      return await tx.studentFee.update({
        where: { id },
        data: {
          penaltyAmount: pAmt,
          status,
        },
      });
    });

    return res.json({ message: 'Penalty applied successfully', studentFee: updated });
  } catch (error) {
    console.error('Apply penalty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
