import { create } from 'zustand';
import { PayrollRecord, Employee, PaymentMethod } from '@/lib/types';
import {
  calculateFullSalary,
  roundCurrency,
} from '@/lib/salary';
import { generateId, getMonthName } from '@/lib/utils';
import { useSettingsStore } from './settingsStore';
import { useLoanStore } from './loanStore';
import { useNotificationStore } from './notificationStore';
import { supabase } from '@/lib/supabase';
import { rowToPayroll, payrollToRow } from '@/lib/dbMappers';

export interface SalaryTrend {
  month: string;
  total: number;
}

export interface DepartmentSalary {
  department: string;
  total: number;
}

export interface EmployeePayrollInput extends Pick<Employee, 'basicSalary' | 'allowances' | 'bonus' | 'overtime' | 'deductions' | 'tax'> {
  id: string;
  fullName: string;
  department: string;
  designation: string;
  unpaidLeaveDays?: number;
  absentDays?: number;
  loanInstallment?: number;
  pfEligible?: boolean;
}

interface PayrollState {
  payrollRecords: PayrollRecord[];
  isLoading: boolean;
  fetchPayroll: () => Promise<void>;
  generatePayroll: (
    month: number,
    year: number,
    employees: EmployeePayrollInput[],
    createdBy: string,
    replaceExisting?: boolean
  ) => PayrollRecord[];
  approvePayroll: (ids: string[], approvedBy: string) => void;
  markAsPaid: (
    ids: string[],
    paidBy: string,
    paymentMethod: PaymentMethod,
    transactionRef?: string
  ) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  deletePayrollRecord: (id: string) => void;
  getPayrollByMonth: (month: number, year: number) => PayrollRecord[];
  getPayrollByEmployee: (employeeId: string) => PayrollRecord[];
  getPayrollByStatus: (status: PayrollRecord['status']) => PayrollRecord[];
  getPayrollById: (id: string) => PayrollRecord | undefined;
  getMonthlyStats: (month: number, year: number) => { total: number; paid: number; pending: number; draft: number };
  getSalaryTrends: (months: number) => SalaryTrend[];
  getDepartmentSalary: (month: number, year: number) => DepartmentSalary[];
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  payrollRecords: [],
  isLoading: false,

  fetchPayroll: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      set({ payrollRecords: (data || []).map(rowToPayroll), isLoading: false });
    } catch (err) {
      console.error('Error fetching payroll from Supabase:', err);
      set({ isLoading: false });
    }
  },

  generatePayroll: (month, year, employees, createdBy, replaceExisting = true) => {
    const now = new Date().toISOString();
    const settings = useSettingsStore.getState().settings;

    const existingRecordsForMonth = get().payrollRecords.filter(
      (r) => r.month === month && r.year === year && (r.status === 'approved' || r.status === 'paid')
    );
    const finalizedEmployeeIds = new Set(existingRecordsForMonth.map((r) => r.employeeId));

    const eligibleEmployees = employees.filter((emp) => !finalizedEmployeeIds.has(emp.id));

    const records: PayrollRecord[] = eligibleEmployees.map((emp) => {
      const calc = calculateFullSalary(
        {
          basicSalary: emp.basicSalary,
          allowances: emp.allowances,
          bonus: emp.bonus,
          overtime: emp.overtime,
          deductions: emp.deductions,
          tax: emp.tax,
          unpaidLeaveDays: emp.unpaidLeaveDays,
          absentDays: emp.absentDays,
          loanInstallment: emp.loanInstallment,
          pfEligible: emp.pfEligible,
        },
        settings
      );

      return {
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        month,
        year,
        basicSalary: emp.basicSalary,
        allowances: emp.allowances,
        bonus: emp.bonus,
        overtime: emp.overtime,
        grossSalary: calc.grossSalary,
        deductions: emp.deductions,
        tax: emp.tax,
        unpaidLeaveDays: emp.unpaidLeaveDays,
        leaveDeduction: calc.leaveDeduction,
        absentDays: emp.absentDays,
        absenceDeduction: calc.absenceDeduction,
        loanDeduction: calc.loanDeduction,
        pfEmployeeDeduction: calc.pfEmployeeDeduction,
        pfEmployerContribution: calc.pfEmployerContribution,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        status: 'draft',
        createdBy,
        createdAt: now,
      };
    });

    const targetEmpIds = new Set(records.map((r) => r.employeeId));

    set((state) => {
      let existingRecords = state.payrollRecords;
      if (replaceExisting) {
        existingRecords = existingRecords.filter(
          (r) =>
            !(
              r.month === month &&
              r.year === year &&
              r.status === 'draft' &&
              targetEmpIds.has(r.employeeId)
            )
        );
      }
      return {
        payrollRecords: [...existingRecords, ...records],
      };
    });

    // Sync generated drafts with Supabase: purge old drafts for the same period before inserting
    if (records.length > 0) {
      const syncDrafts = async () => {
        try {
          if (replaceExisting) {
            const empIdsList = Array.from(targetEmpIds);
            await supabase
              .from('payroll_records')
              .delete()
              .eq('month', month)
              .eq('year', year)
              .eq('status', 'draft')
              .in('employee_id', empIdsList);
          }
          const { error } = await supabase
            .from('payroll_records')
            .insert(records.map(payrollToRow));
          if (error) console.error('Failed to sync generated payroll to Supabase:', error);
        } catch (err) {
          console.error('Error syncing generated payroll:', err);
        }
      };
      syncDrafts();
    }

    return records;
  },

  approvePayroll: (ids, approvedBy) => {
    const now = new Date().toISOString();
    const recordsToApprove = get().payrollRecords.filter(
      (r) => ids.includes(r.id) && r.status === 'draft'
    );

    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) =>
        ids.includes(record.id) && record.status === 'draft'
          ? { ...record, status: 'approved', approvedBy, approvedAt: now }
          : record
      ),
    }));

    // Batched Sync to Supabase in a single atomic update
    supabase
      .from('payroll_records')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: now,
      })
      .in('id', ids)
      .then(({ error }) => {
        if (error) console.error('Failed to update payroll approval in Supabase:', error);
      });

    // Notify each employee
    recordsToApprove.forEach((rec) => {
      useNotificationStore.getState().addNotification({
        title: `Salary Approved — ${getMonthName(rec.month)} ${rec.year}`,
        message: `Your salary payslip of ৳${rec.netSalary.toLocaleString()} has been approved and queued for payment.`,
        type: 'info',
        link: `/payslips/${rec.id}`,
        targetEmployeeId: rec.employeeId,
      });
    });
  },

  markAsPaid: (ids, paidBy, paymentMethod, transactionRef) => {
    const now = new Date().toISOString();
    const txRef =
      transactionRef || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const approvedRecords = get().payrollRecords.filter(
      (record) => ids.includes(record.id) && record.status === 'approved'
    );

    approvedRecords.forEach((record) => {
      if (record.loanDeduction && record.loanDeduction > 0) {
        useLoanStore.getState().recordInstallmentDeduction(
          record.employeeId,
          record.month,
          record.year,
          record.id,
          record.loanDeduction
        );
      }

      useNotificationStore.getState().addNotification({
        title: `Salary Disbursed — ${getMonthName(record.month)} ${record.year}`,
        message: `Your net salary of ৳${record.netSalary.toLocaleString()} has been disbursed via ${paymentMethod.toUpperCase()}. Ref: ${txRef}.`,
        type: 'success',
        link: `/payslips/${record.id}`,
        targetEmployeeId: record.employeeId,
      });
    });

    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) =>
        ids.includes(record.id) && record.status === 'approved'
          ? {
              ...record,
              status: 'paid',
              paidBy,
              paidAt: now,
              paymentDate: now.split('T')[0],
              paymentMethod,
              transactionRef: txRef,
            }
          : record
      ),
    }));

    // Batched Sync to Supabase in a single atomic update
    supabase
      .from('payroll_records')
      .update({
        status: 'paid',
        paid_by: paidBy,
        paid_at: now,
        payment_date: now.split('T')[0],
        payment_method: paymentMethod,
        transaction_ref: txRef,
      })
      .in('id', ids)
      .then(({ error }) => {
        if (error) console.error('Failed to update payroll payment in Supabase:', error);
      });
  },

  updatePayrollRecord: (id, updates) => {
    const settings = useSettingsStore.getState().settings;
    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) => {
        if (record.id === id && record.status === 'draft') {
          const updated = { ...record, ...updates };
          const calc = calculateFullSalary(
            {
              basicSalary: updated.basicSalary,
              allowances: updated.allowances,
              bonus: updated.bonus,
              overtime: updated.overtime,
              deductions: updated.deductions,
              tax: updated.tax,
              unpaidLeaveDays: updated.unpaidLeaveDays,
              loanInstallment: updated.loanDeduction,
              pfEligible: updated.pfEmployeeDeduction ? updated.pfEmployeeDeduction > 0 : true,
            },
            settings
          );

          const fullUpdated: PayrollRecord = {
            ...updated,
            grossSalary: calc.grossSalary,
            leaveDeduction: calc.leaveDeduction,
            loanDeduction: calc.loanDeduction,
            pfEmployeeDeduction: calc.pfEmployeeDeduction,
            pfEmployerContribution: calc.pfEmployerContribution,
            totalDeductions: calc.totalDeductions,
            netSalary: calc.netSalary,
          };

          supabase
            .from('payroll_records')
            .update(payrollToRow(fullUpdated))
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error('Failed to update payroll record in Supabase:', error);
            });

          return fullUpdated;
        }
        return record;
      }),
    }));
  },

  deletePayrollRecord: (id) => {
    const record = get().payrollRecords.find((r) => r.id === id);
    if (record && record.loanDeduction && record.loanDeduction > 0) {
      useLoanStore
        .getState()
        .reverseInstallmentDeduction(record.employeeId, record.month, record.year, record.id);
    }

    set((state) => ({
      payrollRecords: state.payrollRecords.filter(
        (record) => record.id !== id || record.status !== 'draft'
      ),
    }));

    supabase
      .from('payroll_records')
      .delete()
      .eq('id', id)
      .eq('status', 'draft')
      .then(({ error }) => {
        if (error) console.error('Failed to delete draft payroll from Supabase:', error);
      });
  },

  getPayrollByMonth: (month, year) => {
    return get().payrollRecords.filter(
      (record) => record.month === month && record.year === year
    );
  },

  getPayrollByEmployee: (employeeId) => {
    return get().payrollRecords.filter((record) => record.employeeId === employeeId);
  },

  getPayrollByStatus: (status) => {
    return get().payrollRecords.filter((record) => record.status === status);
  },

  getPayrollById: (id) => {
    return get().payrollRecords.find((record) => record.id === id);
  },

  getMonthlyStats: (month, year) => {
    const records = get().getPayrollByMonth(month, year);
    let total = 0,
      paid = 0,
      pending = 0,
      draft = 0;
    records.forEach((r) => {
      total += r.netSalary;
      if (r.status === 'paid') paid += r.netSalary;
      else if (r.status === 'approved') pending += r.netSalary;
      else if (r.status === 'draft') draft += r.netSalary;
    });
    return {
      total: roundCurrency(total),
      paid: roundCurrency(paid),
      pending: roundCurrency(pending),
      draft: roundCurrency(draft),
    };
  },

  getSalaryTrends: (monthsCount) => {
    const trends: SalaryTrend[] = [];
    const records = get().payrollRecords;

    const d = new Date();
    d.setMonth(d.getMonth() - monthsCount + 1);

    for (let i = 0; i < monthsCount; i++) {
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthRecords = records.filter((r) => r.month === m && r.year === y);
      const total = monthRecords.reduce((acc, r) => acc + r.netSalary, 0);
      trends.push({ month: `${m}/${y}`, total: roundCurrency(total) });
      d.setMonth(d.getMonth() + 1);
    }
    return trends;
  },

  getDepartmentSalary: (month, year) => {
    const records = get().getPayrollByMonth(month, year);
    const deptTotals: Record<string, number> = {};
    records.forEach((r) => {
      if (!deptTotals[r.department]) {
        deptTotals[r.department] = 0;
      }
      deptTotals[r.department] += r.netSalary;
    });
    return Object.entries(deptTotals).map(([department, total]) => ({
      department,
      total: roundCurrency(total),
    }));
  },
}));
