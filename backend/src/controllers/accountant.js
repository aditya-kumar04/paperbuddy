import prisma from '../db.js';

export async function getStudentFeesQueue(req, res) {
  const schoolId = req.schoolId;
  const { class: className, status, search } = req.query;

  try {
    const whereClause = {
      schoolId,
    };

    if (className) {
      whereClause.student = {
        class: className,
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.student = {
        ...(whereClause.student || {}),
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const fees = await prisma.studentFee.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
    console.error('Get fees queue error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function recordManualTransaction(req, res) {
  const { studentFeeId, amount, method, chequeNumber, chequeDate } = req.body;
  const schoolId = req.schoolId;
  const recordedBy = req.user.id; // User ID of Accountant or Admin

  if (!studentFeeId || !amount || !method) {
    return res.status(400).json({ error: 'StudentFeeId, amount, and method are required' });
  }

  try {
    const studentFee = await prisma.studentFee.findFirst({
      where: { id: studentFeeId, schoolId },
    });

    if (!studentFee) {
      return res.status(404).json({ error: 'Student fee record not found' });
    }

    const amt = parseFloat(amount);
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const txnStatus = method === 'CHEQUE' ? 'PENDING' : 'SUCCESS';
      
      const txn = await tx.transaction.create({
        data: {
          schoolId,
          studentFeeId,
          amount: amt,
          method,
          status: txnStatus,
          chequeNumber: method === 'CHEQUE' ? chequeNumber : null,
          chequeDate: method === 'CHEQUE' && chequeDate ? new Date(chequeDate) : null,
          recordedBy,
          receiptUrl: `TXN-${Math.floor(100000 + Math.random() * 900000)}`, // simulated receipt code
        },
      });

      // If method is cash/upi/card (not cheque), clear it and update student fee instantly
      if (method !== 'CHEQUE') {
        const newPaid = Number(studentFee.amountPaid) + amt;
        const required = Number(studentFee.amountDue) + Number(studentFee.penaltyAmount) - Number(studentFee.waiverAmount);

        let status = 'PARTIAL';
        if (newPaid >= required) {
          status = 'PAID';
        }

        await tx.studentFee.update({
          where: { id: studentFeeId },
          data: {
            amountPaid: newPaid,
            status,
          },
        });
      }

      return txn;
    });

    return res.status(201).json({
      message: method === 'CHEQUE' ? 'Cheque transaction recorded, status pending reconciliation' : 'Payment recorded successfully',
      transaction,
    });
  } catch (error) {
    console.error('Record transaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reconcileCheque(req, res) {
  const { id } = req.params; // Transaction ID
  const { status } = req.body; // 'CLEARED' or 'BOUNCED'
  const schoolId = req.schoolId;

  if (!status || !['CLEARED', 'BOUNCED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be CLEARED or BOUNCED' });
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, schoolId, method: 'CHEQUE', status: 'PENDING' },
      include: { studentFee: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Pending cheque transaction not found' });
    }

    const updatedTxn = await prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      const resolvedStatus = status === 'CLEARED' ? 'CLEARED' : 'BOUNCED';
      const txn = await tx.transaction.update({
        where: { id },
        data: { status: resolvedStatus },
      });

      // 2. If cleared, update the StudentFee balance
      const studentFee = transaction.studentFee;
      if (status === 'CLEARED') {
        const newPaid = Number(studentFee.amountPaid) + Number(transaction.amount);
        const required = Number(studentFee.amountDue) + Number(studentFee.penaltyAmount) - Number(studentFee.waiverAmount);

        let feeStatus = 'PARTIAL';
        if (newPaid >= required) {
          feeStatus = 'PAID';
        }

        await tx.studentFee.update({
          where: { id: studentFee.id },
          data: {
            amountPaid: newPaid,
            status: feeStatus,
          },
        });
      } else {
        // If BOUNCED: we can optionally apply a cheque bounce penalty (e.g. 500 units)
        const bouncePenalty = 500;
        const newPenalty = Number(studentFee.penaltyAmount) + bouncePenalty;
        const required = Number(studentFee.amountDue) + newPenalty - Number(studentFee.waiverAmount);
        
        let feeStatus = 'UNPAID';
        if (Number(studentFee.amountPaid) + Number(studentFee.waiverAmount) > 0) {
          feeStatus = 'PARTIAL';
        }

        await tx.studentFee.update({
          where: { id: studentFee.id },
          data: {
            penaltyAmount: newPenalty,
            status: feeStatus,
          },
        });
      }

      return txn;
    });

    return res.json({
      message: `Cheque transaction successfully reconciled to ${status}`,
      transaction: updatedTxn,
    });
  } catch (error) {
    console.error('Reconcile cheque error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDashboardMetrics(req, res) {
  const schoolId = req.schoolId;

  try {
    // 1. Fetch all student fees to calculate totals
    const studentFees = await prisma.studentFee.findMany({
      where: { schoolId },
    });

    let totalExpected = 0;
    let totalCollected = 0;

    studentFees.forEach((fee) => {
      const due = Number(fee.amountDue);
      const paid = Number(fee.amountPaid);
      const waiver = Number(fee.waiverAmount);
      const penalty = Number(fee.penaltyAmount);

      totalExpected += (due + penalty - waiver);
      totalCollected += paid;
    });

    const totalPending = Math.max(0, totalExpected - totalCollected);

    // 2. Defaulters count (unpaid/partial, past due date)
    const today = new Date();
    const defaultersCount = await prisma.studentFee.count({
      where: {
        schoolId,
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: today },
      },
    });

    // 3. Defaulter students list
    const defaultersList = await prisma.studentFee.findMany({
      where: {
        schoolId,
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: today },
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        feeStructure: {
          include: {
            feeType: true,
          },
        },
      },
      take: 10,
      orderBy: { dueDate: 'asc' },
    });

    // 4. Monthly collections trend (past 6 months)
    const transactions = await prisma.transaction.findMany({
      where: {
        schoolId,
        status: { in: ['SUCCESS', 'CLEARED'] },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const monthlyMap = {};
    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + Number(tx.amount);
    });

    const revenueByMonth = Object.keys(monthlyMap).map((key) => ({
      month: key,
      collected: monthlyMap[key],
    })).slice(-6); // last 6 months

    // 5. Fee Type breakdown
    const feeStructures = await prisma.studentFee.findMany({
      where: { schoolId },
      include: {
        feeStructure: {
          include: {
            feeType: true,
          },
        },
      },
    });

    const feeTypeMap = {};
    feeStructures.forEach((sf) => {
      const typeName = sf.feeStructure.feeType.name;
      feeTypeMap[typeName] = (feeTypeMap[typeName] || 0) + Number(sf.amountPaid);
    });

    const feeTypeBreakdown = Object.keys(feeTypeMap).map((key) => ({
      name: key,
      value: feeTypeMap[key],
    }));

    // 6. Recent transactions
    const recentTxns = await prisma.transaction.findMany({
      where: { schoolId },
      include: {
        studentFee: {
          include: {
            student: {
              include: { user: { select: { name: true } } },
            },
            feeStructure: {
              include: { feeType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Pending cheques
    const pendingCheques = await prisma.transaction.findMany({
      where: {
        schoolId,
        method: 'CHEQUE',
        status: 'PENDING',
      },
      include: {
        studentFee: {
          include: {
            student: {
              include: { user: { select: { name: true } } },
            },
            feeStructure: {
              include: { feeType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      totalExpected,
      totalCollected,
      totalPending,
      defaultersCount,
      defaultersList,
      revenueByMonth,
      feeTypeBreakdown,
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        studentName: t.studentFee.student.user.name,
        feeName: t.studentFee.feeStructure.feeType.name,
        amount: Number(t.amount),
        method: t.method,
        status: t.status,
        date: t.createdAt,
      })),
      pendingCheques: pendingCheques.map((t) => ({
        id: t.id,
        studentName: t.studentFee.student.user.name,
        feeName: t.studentFee.feeStructure.feeType.name,
        amount: Number(t.amount),
        chequeNumber: t.chequeNumber,
        chequeDate: t.chequeDate,
        date: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTransactionsList(req, res) {
  const schoolId = req.schoolId;
  const { search, method, status } = req.query;

  try {
    const whereClause = {
      schoolId,
    };

    if (method) {
      whereClause.method = method;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.studentFee = {
        student: {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { rollNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        studentFee: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
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
    console.error('Get transactions list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
