import prisma from '../db.js';

export async function getStudentFees(req, res) {
  const userId = req.user.id;

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const fees = await prisma.studentFee.findMany({
      where: { studentId: student.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        feeStructure: {
          include: {
            feeType: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(fees);
  } catch (error) {
    console.error('Get student fees error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function payFeeSimulated(req, res) {
  const { id } = req.params; // StudentFee ID
  const { method } = req.body; // UPI, CARD, NETBANKING
  const userId = req.user.id;

  if (!method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const studentFee = await prisma.studentFee.findFirst({
      where: { id, studentId: student.id },
    });

    if (!studentFee) {
      return res.status(404).json({ error: 'Student fee record not found' });
    }

    if (studentFee.status === 'PAID' || studentFee.status === 'WAIVED') {
      return res.status(400).json({ error: 'Fee has already been fully settled' });
    }

    const amountDue = Number(studentFee.amountDue);
    const amountPaid = Number(studentFee.amountPaid);
    const waiverAmount = Number(studentFee.waiverAmount);
    const penaltyAmount = Number(studentFee.penaltyAmount);

    const remaining = (amountDue + penaltyAmount) - (amountPaid + waiverAmount);

    if (remaining <= 0) {
      return res.status(400).json({ error: 'No balance remaining on this fee' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a transaction marked as SUCCESS
      const receiptCode = `TXN-SYS-${Math.floor(100000 + Math.random() * 900000)}`;
      const txn = await tx.transaction.create({
        data: {
          schoolId: studentFee.schoolId,
          studentFeeId: studentFee.id,
          amount: remaining,
          method: method === 'CARD' ? 'CARD' : (method === 'CHEQUE' ? 'CHEQUE' : 'UPI'), // Map string to schema Enum
          status: 'SUCCESS',
          recordedBy: 'system',
          receiptUrl: receiptCode,
        },
      });

      // 2. Set status to PAID and increase paid amount
      const updatedFee = await tx.studentFee.update({
        where: { id: studentFee.id },
        data: {
          amountPaid: amountPaid + remaining,
          status: 'PAID',
        },
      });

      return { txn, updatedFee };
    });

    return res.json({
      message: 'Payment simulated successfully',
      transaction: result.txn,
      studentFee: result.updatedFee,
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStudentTransactions(req, res) {
  const userId = req.user.id;

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        studentFee: { studentId: student.id },
      },
      include: {
        studentFee: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            feeStructure: {
              include: {
                feeType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(transactions);
  } catch (error) {
    console.error('Get student transactions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
