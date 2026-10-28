import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PayrollRecord, Employee, PaymentMethod } from '@/lib/types';
import {
  calculateGross,
  calculateTotalDeductions,
  calculateNet,
  calculateFullSalary,
  roundCurrency,
} from '@/lib/salary';
import { generateId } from '@/lib/utils';
import { useSettingsStore } from './settingsStore';

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

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set, get) => ({
      payrollRecords: [],
      generatePayroll: (month, year, employees, createdBy, replaceExisting = true) => {
        const now = new Date().toISOString();
        const settings = useSettingsStore.getState().settings;

        const records: PayrollRecord[] = employees.map((emp) => {
          const absentDays = emp.absentDays !== undefined ? emp.absentDays : (emp.unpaidLeaveDays || 0);
          const calc = calculateFullSalary(
            {
              basicSalary: emp.basicSalary,
              allowances: emp.allowances,
              bonus: emp.bonus,
              overtime: emp.overtime,
              deductions: emp.deductions,
              tax: emp.tax,
              unpaidLeaveDays: absentDays,
              absentDays: absentDays,
              loanInstallment: emp.loanInstallment || 0,
              pfEligible: emp.pfEligible ?? true,
            },
            settings
          );

          // Allowances breakdown
          const allowances = emp.allowances || 0;
          const houseRent = roundCurrency(allowances * 0.5);
          const medical = roundCurrency(allowances * 0.3);
          const transport = roundCurrency(allowances * 0.2);

          return {
            id: generateId(),
            employeeId: emp.id,
            employeeName: emp.fullName,
            department: emp.department,
            designation: emp.designation,
            month,
            year,
            basicSalary: roundCurrency(emp.basicSalary),
            allowances: roundCurrency(emp.allowances),
            bonus: roundCurrency(emp.bonus || 0),
            overtime: roundCurrency(emp.overtime || 0),
            grossSalary: calc.grossSalary,
            deductions: roundCurrency(emp.deductions || 0),
            tax: roundCurrency(emp.tax || 0),
            unpaidLeaveDays: absentDays,
            absentDays: absentDays,
            leaveDeduction: calc.leaveDeduction,
            absenceDeduction: calc.leaveDeduction,
            loanDeduction: calc.loanDeduction,
            pfEmployeeDeduction: calc.pfEmployeeDeduction,
            pfEmployerContribution: calc.pfEmployerContribution,
            totalDeductions: calc.totalDeductions,
            netSalary: calc.netSalary,
            status: 'draft',
            createdAt: now,
            createdBy,
            breakdown: {
              houseRent,
              medical,
              transport,
              otherAllowances: 0,
            },
          };
        });

        set((state) => {
          // If replaceExisting is true, remove any previous DRAFT records for the same month/year
          let existingRecords = state.payrollRecords;
          if (replaceExisting) {
            existingRecords = existingRecords.filter(
              (r) => !(r.month === month && r.year === year && r.status === 'draft')
            );
          }
          return {
            payrollRecords: [...existingRecords, ...records],
          };
        });

        return records;
      },
      approvePayroll: (ids, approvedBy) => {
        const now = new Date().toISOString();
        set((state) => ({
          payrollRecords: state.payrollRecords.map((record) =>
            ids.includes(record.id) && record.status === 'draft'
              ? { ...record, status: 'approved', approvedBy, approvedAt: now }
              : record
          ),
        }));
      },
      markAsPaid: (ids, paidBy, paymentMethod, transactionRef) => {
        const now = new Date().toISOString();
        const txRef =
          transactionRef || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

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

              return {
                ...updated,
                grossSalary: calc.grossSalary,
                leaveDeduction: calc.leaveDeduction,
                loanDeduction: calc.loanDeduction,
                pfEmployeeDeduction: calc.pfEmployeeDeduction,
                pfEmployerContribution: calc.pfEmployerContribution,
                totalDeductions: calc.totalDeductions,
                netSalary: calc.netSalary,
              };
            }
            return record;
          }),
        }));
      },
      deletePayrollRecord: (id) => {
        set((state) => ({
          payrollRecords: state.payrollRecords.filter(
            (record) => record.id !== id || record.status !== 'draft'
          ),
        }));
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
    }),
    {
      name: 'flowpay-payroll',
    }
  )
);
