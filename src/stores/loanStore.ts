import { create } from 'zustand';
import { LoanRecord, LoanRepayment } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToLoan, loanToRow, loanRepaymentToRow } from '@/lib/dbMappers';
import { toast } from 'sonner';

interface LoanState {
  loans: LoanRecord[];
  isLoading: boolean;
  fetchLoans: () => Promise<void>;
  applyLoan: (
    loanData: Omit<LoanRecord, 'id' | 'appliedAt' | 'remainingBalance' | 'status' | 'repayments'>
  ) => Promise<LoanRecord>;
  approveLoan: (id: string, approvedBy: string) => Promise<void>;
  rejectLoan: (id: string) => Promise<void>;
  recordInstallmentDeduction: (
    employeeId: string,
    month: number,
    year: number,
    payrollRecordId: string,
    customAmount?: number
  ) => Promise<number>;
  reverseInstallmentDeduction: (
    employeeId: string,
    month: number,
    year: number,
    payrollRecordId: string
  ) => Promise<void>;
  settleEarly: (id: string) => Promise<void>;
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
        .select('*, loan_repayments(*)')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      set({ loans: (data || []).map(rowToLoan), isLoading: false });
    } catch (err: any) {
      console.error('Error fetching loans from Supabase:', err);
      toast.error(err?.message || 'Failed to load loans');
      set({ isLoading: false });
    }
  },

  applyLoan: async (loanData) => {
    const previousLoans = get().loans;
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

    const { error } = await supabase.from('loans').insert(loanToRow(newLoan));
    if (error) {
      set({ loans: previousLoans });
      toast.error(`Failed to submit loan application: ${error.message}`);
      throw new Error(error.message);
    }

    return newLoan;
  },

  approveLoan: async (id, approvedBy) => {
    const previousLoans = get().loans;
    const approvedAt = new Date().toISOString();

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === id ? { ...l, status: 'active', approvedBy, approvedAt } : l
      ),
    }));

    const { error } = await supabase
      .from('loans')
      .update({
        status: 'active',
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .eq('id', id);

    if (error) {
      set({ loans: previousLoans });
      toast.error(`Failed to approve loan: ${error.message}`);
      throw new Error(error.message);
    }
  },

  rejectLoan: async (id) => {
    const previousLoans = get().loans;

    set((state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, status: 'rejected' } : l)),
    }));

    const { error } = await supabase
      .from('loans')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      set({ loans: previousLoans });
      toast.error(`Failed to reject loan: ${error.message}`);
      throw new Error(error.message);
    }
  },

  recordInstallmentDeduction: async (employeeId, month, year, payrollRecordId, customAmount) => {
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

    const previousLoans = get().loans;
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

    const { error: repError } = await supabase
      .from('loan_repayments')
      .insert(loanRepaymentToRow(repayment, activeLoan.id));

    if (repError) {
      set({ loans: previousLoans });
      toast.error(`Failed to record loan repayment: ${repError.message}`);
      throw new Error(repError.message);
    }

    const { error: loanError } = await supabase
      .from('loans')
      .update({
        remaining_balance: newBalance,
        status: newStatus,
      })
      .eq('id', activeLoan.id);

    if (loanError) {
      // Compensating delete of the inserted repayment row
      await supabase.from('loan_repayments').delete().eq('id', repayment.id);
      set({ loans: previousLoans });
      toast.error(`Failed to update loan balance: ${loanError.message}`);
      throw new Error(loanError.message);
    }

    return deductionAmount;
  },

  reverseInstallmentDeduction: async (employeeId, month, year, payrollRecordId) => {
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

    const previousLoans = get().loans;
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

    const { error: delError } = await supabase
      .from('loan_repayments')
      .delete()
      .eq('id', matchedRepayment.id);

    if (delError) {
      set({ loans: previousLoans });
      toast.error(`Failed to reverse loan repayment: ${delError.message}`);
      throw new Error(delError.message);
    }

    const { error: updError } = await supabase
      .from('loans')
      .update({
        remaining_balance: restoredBalance,
        status: newStatus,
      })
      .eq('id', loan.id);

    if (updError) {
      set({ loans: previousLoans });
      toast.error(`Failed to restore loan balance: ${updError.message}`);
      throw new Error(updError.message);
    }
  },

  settleEarly: async (id) => {
    const loan = get().loans.find((l) => l.id === id);
    if (!loan) return;

    const previousLoans = get().loans;
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

    const { error: repError } = await supabase
      .from('loan_repayments')
      .insert(loanRepaymentToRow(newRepayment, id));

    if (repError) {
      set({ loans: previousLoans });
      toast.error(`Failed to log settlement repayment: ${repError.message}`);
      throw new Error(repError.message);
    }

    const { error: loanError } = await supabase
      .from('loans')
      .update({
        remaining_balance: 0,
        status: 'completed',
      })
      .eq('id', id);

    if (loanError) {
      await supabase.from('loan_repayments').delete().eq('id', newRepayment.id);
      set({ loans: previousLoans });
      toast.error(`Failed to settle loan early: ${loanError.message}`);
      throw new Error(loanError.message);
    }
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
