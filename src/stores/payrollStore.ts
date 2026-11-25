import { create } from 'zustand';
import { PayrollRecord, Employee, PaymentMethod } from '@/lib/types';
import { calculateFullSalary, roundCurrency } from '@/lib/salary';
import { generateId, getMonthName } from '@/lib/utils';
import { useSettingsStore } from './settingsStore';
import { useLoanStore } from './loanStore';
import { useNotificationStore } from './notificationStore';
import { useAuditStore } from './auditStore';
import { supabase } from '@/lib/supabase';
import { rowToPayroll, payrollToRow } from '@/lib/dbMappers';
import { toast } from 'sonner';

export interface SalaryTrend {
  month: string;
  total: number;
}

export interface DepartmentSalary {
  department: string;
  total: number;
}

export interface EmployeePayrollInput
  extends Pick<
    Employee,
    | 'basicSalary'
    | 'allowances'
    | 'bonus'
    | 'overtime'
    | 'deductions'
    | 'tax'
    | 'houseRentAllowance'
    | 'medicalAllowance'
    | 'transportAllowance'
  > {
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
  ) => Promise<PayrollRecord[]>;
  approvePayroll: (ids: string[], approvedBy: string) => Promise<void>;
  markAsPaid: (
    ids: string[],
    paidBy: string,
    paymentMethod: PaymentMethod,
    transactionRef?: string
  ) => Promise<void>;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => Promise<void>;
  deletePayrollRecord: (id: string) => Promise<void>;
  getPayrollByMonth: (month: number, year: number) => PayrollRecord[];
  getPayrollByEmployee: (employeeId: string) => PayrollRecord[];
  getPayrollByStatus: (status: PayrollRecord['status']) => PayrollRecord[];
  getPayrollById: (id: string) => PayrollRecord | undefined;
  getMonthlyStats: (
    month: number,
    year: number
  ) => { total: number; paid: number; pending: number; draft: number };
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
    } catch (err: any) {
      console.error('Error fetching payroll from Supabase:', err);
      toast.error(err?.message || 'Failed to load payroll records');
      set({ isLoading: false });
    }
  },

  generatePayroll: async (month, year, employees, createdBy, replaceExisting = true) => {
    const previousRecords = get().payrollRecords;
    const now = new Date().toISOString();
    const settings = useSettingsStore.getState().settings;

    const existingRecordsForMonth = previousRecords.filter(
      (r) =>
        r.month === month &&
        r.year === year &&
        (r.status === 'approved' || r.status === 'paid')
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
        breakdown: {
          houseRent: emp.houseRentAllowance ?? Math.round((emp.allowances || 0) * 0.5),
          medical: emp.medicalAllowance ?? Math.round((emp.allowances || 0) * 0.3),
          transport: emp.transportAllowance ?? Math.round((emp.allowances || 0) * 0.2),
        },
      };
    });

    if (records.length === 0) {
      return [];
    }

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

    try {
      if (replaceExisting) {
        const empIdsList = Array.from(targetEmpIds);
        const { error: delError } = await supabase
          .from('payroll_records')
          .delete()
          .eq('month', month)
          .eq('year', year)
          .eq('status', 'draft')
          .in('employee_id', empIdsList);

        if (delError) throw delError;
      }

      const { error: insError } = await supabase
        .from('payroll_records')
        .insert(records.map(payrollToRow));

      if (insError) throw insError;

      return records;
    } catch (err: any) {
      set({ payrollRecords: previousRecords });
      await get().fetchPayroll();
      toast.error(`Failed to generate payroll: ${err?.message || 'Database error'}`);
      throw err;
    }
  },

  approvePayroll: async (ids, approvedBy) => {
    const previousRecords = get().payrollRecords;
    const now = new Date().toISOString();
    const recordsToApprove = previousRecords.filter(
      (r) => ids.includes(r.id) && r.status === 'draft'
    );
    const targetIds = recordsToApprove.map((r) => r.id);
    if (targetIds.length === 0) return;

    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) =>
        targetIds.includes(record.id)
          ? { ...record, status: 'approved', approvedBy, approvedAt: now }
          : record
      ),
    }));

    const { error } = await supabase
      .from('payroll_records')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: now,
      })
      .in('id', targetIds)
      .eq('status', 'draft');

    if (error) {
      set({ payrollRecords: previousRecords });
      toast.error(`Failed to approve payroll: ${error.message}`);
      throw new Error(error.message);
    }

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

  markAsPaid: async (ids, paidBy, paymentMethod, transactionRef) => {
    const previousRecords = get().payrollRecords;
    const txRef =
      transactionRef ||
      `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const approvedRecords = previousRecords.filter(
      (record) => ids.includes(record.id) && record.status === 'approved'
    );
    if (approvedRecords.length === 0) {
      toast.info('No approved payroll records selected for disbursement');
      return;
    }

    const approvedIds = approvedRecords.map((r) => r.id);

    const { data, error } = await supabase.rpc('disburse_payroll_batch', {
      p_record_ids: approvedIds,
      p_paid_by: paidBy,
      p_method: paymentMethod,
      p_ref: txRef,
    });

    if (error) {
      set({ payrollRecords: previousRecords });
      toast.error(`Payroll disbursement failed: ${error.message}`);
      throw new Error(error.message);
    }

    const updatedRows: PayrollRecord[] = (Array.isArray(data) ? data : []).map(rowToPayroll);
    const updatedMap = new Map(updatedRows.map((r) => [r.id, r]));

    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) => updatedMap.get(record.id) ?? record),
    }));

    // Refresh dependent loan balances and DB audit trail
    await Promise.all([
      useLoanStore.getState().fetchLoans(),
      useAuditStore.getState().fetchLogs(),
    ]);

    updatedRows.forEach((record) => {
      useNotificationStore.getState().addNotification({
        title: `Salary Disbursed — ${getMonthName(record.month)} ${record.year}`,
        message: `Your net salary of ৳${record.netSalary.toLocaleString()} has been disbursed via ${paymentMethod.toUpperCase()}. Ref: ${txRef}.`,
        type: 'success',
        link: `/payslips/${record.id}`,
        targetEmployeeId: record.employeeId,
      });
    });
  },

  updatePayrollRecord: async (id, updates) => {
    const previousRecords = get().payrollRecords;
    const target = previousRecords.find((r) => r.id === id && r.status === 'draft');
    if (!target) return;

    const settings = useSettingsStore.getState().settings;
    const updated = { ...target, ...updates };
    const calc = calculateFullSalary(
      {
        basicSalary: updated.basicSalary,
        allowances: updated.allowances,
        bonus: updated.bonus,
        overtime: updated.overtime,
        deductions: updated.deductions,
        tax: updated.tax,
        unpaidLeaveDays: updated.unpaidLeaveDays,
        absentDays: updated.absentDays,
        loanInstallment: updated.loanDeduction,
        pfEligible: updated.pfEmployeeDeduction ? updated.pfEmployeeDeduction > 0 : true,
      },
      settings
    );

    const fullUpdated: PayrollRecord = {
      ...updated,
      grossSalary: calc.grossSalary,
      leaveDeduction: calc.leaveDeduction,
      absenceDeduction: calc.absenceDeduction,
      loanDeduction: calc.loanDeduction,
      pfEmployeeDeduction: calc.pfEmployeeDeduction,
      pfEmployerContribution: calc.pfEmployerContribution,
      totalDeductions: calc.totalDeductions,
      netSalary: calc.netSalary,
    };

    set((state) => ({
      payrollRecords: state.payrollRecords.map((record) =>
        record.id === id ? fullUpdated : record
      ),
    }));

    const { error } = await supabase
      .from('payroll_records')
      .update(payrollToRow(fullUpdated))
      .eq('id', id)
      .eq('status', 'draft');

    if (error) {
      set({ payrollRecords: previousRecords });
      toast.error(`Failed to update draft payroll: ${error.message}`);
      throw new Error(error.message);
    }
  },

  deletePayrollRecord: async (id) => {
    const previousRecords = get().payrollRecords;
    const record = previousRecords.find((r) => r.id === id);
    if (!record || record.status !== 'draft') {
      toast.error('Only draft payroll records can be deleted');
      return;
    }

    set((state) => ({
      payrollRecords: state.payrollRecords.filter((r) => r.id !== id),
    }));

    const { error } = await supabase
      .from('payroll_records')
      .delete()
      .eq('id', id)
      .eq('status', 'draft');

    if (error) {
      set({ payrollRecords: previousRecords });
      toast.error(`Failed to delete draft payroll: ${error.message}`);
      throw new Error(error.message);
    }
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
