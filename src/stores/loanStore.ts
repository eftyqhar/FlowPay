import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanRecord, LoanRepayment } from '@/lib/types';
import { generateId, roundCurrency } from '@/lib/utils';

interface LoanState {
  loans: LoanRecord[];
  applyLoan: (loanData: Omit<LoanRecord, 'id' | 'appliedAt' | 'remainingBalance' | 'status' | 'repayments'>) => LoanRecord;
  approveLoan: (id: string, approvedBy: string) => void;
  rejectLoan: (id: string) => void;
  recordInstallmentDeduction: (employeeId: string, month: number, year: number, payrollRecordId: string) => number;
  settleEarly: (id: string) => void;
  getActiveLoan: (employeeId: string) => LoanRecord | undefined;
  getLoansByEmployee: (employeeId: string) => LoanRecord[];
}

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      loans: [],
      applyLoan: (loanData) => {
        const newLoan: LoanRecord = {
          ...loanData,
          id: generateId(),
          remainingBalance: loanData.principalAmount,
          status: 'pending',
          appliedAt: new Date().toISOString(),
          repayments: [],
        };
        set((state) => ({
          loans: [newLoan, ...state.loans],
        }));
        return newLoan;
      },
      approveLoan: (id, approvedBy) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: 'active',
                  approvedBy,
                  approvedAt: new Date().toISOString(),
                }
              : l
          ),
        }));
      },
      rejectLoan: (id) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id ? { ...l, status: 'rejected' } : l
          ),
        }));
      },
      recordInstallmentDeduction: (employeeId, month, year, payrollRecordId) => {
        const activeLoan = get().getActiveLoan(employeeId);
        if (!activeLoan) return 0;

        // Check if installment already deducted for this month & year
        const alreadyDeducted = activeLoan.repayments.some(
          (r) => r.month === month && r.year === year
        );
        if (alreadyDeducted) return 0;

        const deductionAmount = Math.min(activeLoan.monthlyInstallment, activeLoan.remainingBalance);
        const newBalance = Math.max(0, activeLoan.remainingBalance - deductionAmount);
        const isCompleted = newBalance <= 0;

        const repayment: LoanRepayment = {
          id: generateId(),
          date: new Date().toISOString(),
          amount: deductionAmount,
          month,
          year,
          payrollRecordId,
        };

        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === activeLoan.id
              ? {
                  ...l,
                  remainingBalance: newBalance,
                  status: isCompleted ? 'completed' : 'active',
                  repayments: [...l.repayments, repayment],
                }
              : l
          ),
        }));

        return deductionAmount;
      },
      settleEarly: (id) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id
              ? {
                  ...l,
                  remainingBalance: 0,
                  status: 'completed',
                  repayments: [
                    ...l.repayments,
                    {
                      id: generateId(),
                      date: new Date().toISOString(),
                      amount: l.remainingBalance,
                    },
                  ],
                }
              : l
          ),
        }));
      },
      getActiveLoan: (employeeId) => {
        return get().loans.find(
          (l) => l.employeeId === employeeId && l.status === 'active' && l.remainingBalance > 0
        );
      },
      getLoansByEmployee: (employeeId) => {
        return get().loans.filter((l) => l.employeeId === employeeId);
      },
    }),
    {
      name: 'flowpay-loans',
    }
  )
);
