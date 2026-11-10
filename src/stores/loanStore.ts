import { create } from 'zustand';
import { LoanRecord, LoanRepayment } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToLoan, loanToRow } from '@/lib/dbMappers';

interface LoanState {
  loans: LoanRecord[];
  isLoading: boolean;
  fetchLoans: () => Promise<void>;
  applyLoan: (loanData: Omit<LoanRecord, 'id' | 'appliedAt' | 'remainingBalance' | 'status' | 'repayments'>) => LoanRecord;
  approveLoan: (id: string, approvedBy: string) => void;
  rejectLoan: (id: string) => void;
  recordInstallmentDeduction: (
    employeeId: string,
    month: number,
    year: number,
    payrollRecordId: string,
    customAmount?: number
  ) => number;
  reverseInstallmentDeduction: (
    employeeId: string,
    month: number,
    year: number,
    payrollRecordId: string
  ) => void;
  settleEarly: (id: string) => void;
  getActiveLoan: (employeeId: string) => LoanRecord | undefined;
  getLoansByEmployee: (employeeId: string) => LoanRecord[];
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  isLoading: false,

  fetchLoans: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      set({ loans: (data || []).map(rowToLoan), isLoading: false });
    } catch (err) {
      console.error('Error fetching loans from Supabase:', err);
      set({ isLoading: false });
    }
  },

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

    supabase
      .from('loans')
      .insert(loanToRow(newLoan))
      .then(({ error }) => {
        if (error) console.error('Failed to sync loan to Supabase:', error);
      });

    return newLoan;
  },

  approveLoan: (id, approvedBy) => {
    const approvedAt = new Date().toISOString();
    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === id
          ? {
              ...l,
              status: 'active',
              approvedBy,
              approvedAt,
            }
          : l
      ),
    }));

    supabase
      .from('loans')
      .update({
        status: 'active',
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update loan approval in Supabase:', error);
      });
  },

  rejectLoan: (id) => {
    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === id ? { ...l, status: 'rejected' } : l
      ),
    }));

    supabase
      .from('loans')
      .update({ status: 'rejected' })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update loan rejection in Supabase:', error);
      });
  },

  recordInstallmentDeduction: (employeeId, month, year, payrollRecordId, customAmount) => {
    const activeLoan = get().getActiveLoan(employeeId);
    if (!activeLoan) return 0;

    const alreadyDeducted = activeLoan.repayments.some(
      (r) => r.month === month && r.year === year
    );
    if (alreadyDeducted) return 0;

    const scheduledAmount =
      customAmount !== undefined && customAmount > 0
        ? customAmount
        : activeLoan.monthlyInstallment;

    const deductionAmount = Math.min(scheduledAmount, activeLoan.remainingBalance);
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

    const updatedRepayments = [...activeLoan.repayments, repayment];
    const newStatus = isCompleted ? 'completed' : 'active';

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === activeLoan.id
          ? {
              ...l,
              remainingBalance: newBalance,
              status: newStatus,
              repayments: updatedRepayments,
            }
          : l
      ),
    }));

    supabase
      .from('loans')
      .update({
        remaining_balance: newBalance,
        status: newStatus,
        repayments: updatedRepayments,
      })
      .eq('id', activeLoan.id)
      .then(({ error }) => {
        if (error) console.error('Failed to update loan deduction in Supabase:', error);
      });

    return deductionAmount;
  },

  reverseInstallmentDeduction: (employeeId, month, year, payrollRecordId) => {
    const loan = get().loans.find(
      (l) =>
        l.employeeId === employeeId &&
        l.repayments.some(
          (r) =>
            (r.payrollRecordId && r.payrollRecordId === payrollRecordId) ||
            (r.month === month && r.year === year)
        )
    );
    if (!loan) return;

    const matchedRepayment = loan.repayments.find(
      (r) =>
        (r.payrollRecordId && r.payrollRecordId === payrollRecordId) ||
        (r.month === month && r.year === year)
    );
    if (!matchedRepayment) return;

    const restoredBalance = loan.remainingBalance + matchedRepayment.amount;
    const updatedRepayments = loan.repayments.filter((r) => r.id !== matchedRepayment.id);
    const newStatus = restoredBalance > 0 ? 'active' : loan.status;

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === loan.id
          ? {
              ...l,
              remainingBalance: restoredBalance,
              status: newStatus,
              repayments: updatedRepayments,
            }
          : l
      ),
    }));

    supabase
      .from('loans')
      .update({
        remaining_balance: restoredBalance,
        status: newStatus,
        repayments: updatedRepayments,
      })
      .eq('id', loan.id)
      .then(({ error }) => {
        if (error) console.error('Failed to reverse loan installment in Supabase:', error);
      });
  },

  settleEarly: (id) => {
    const loan = get().loans.find((l) => l.id === id);
    if (!loan) return;

    const newRepayment: LoanRepayment = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: loan.remainingBalance,
    };

    const updatedRepayments = [...loan.repayments, newRepayment];

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === id
          ? {
              ...l,
              remainingBalance: 0,
              status: 'completed',
              repayments: updatedRepayments,
            }
          : l
      ),
    }));

    supabase
      .from('loans')
      .update({
        remaining_balance: 0,
        status: 'completed',
        repayments: updatedRepayments,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update early settlement in Supabase:', error);
      });
  },

  getActiveLoan: (employeeId) => {
    return get().loans.find(
      (l) => l.employeeId === employeeId && l.status === 'active' && l.remainingBalance > 0
    );
  },

  getLoansByEmployee: (employeeId) => {
    return get().loans.filter((l) => l.employeeId === employeeId);
  },
}));
