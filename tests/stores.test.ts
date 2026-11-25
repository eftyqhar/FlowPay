import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { usePayrollStore } from '@/stores/payrollStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useLoanStore } from '@/stores/loanStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DEFAULT_COMPANY_SETTINGS } from '@/lib/constants';
import { toast } from 'sonner';

describe('FlowPay Store Reliability & Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: { ...DEFAULT_COMPANY_SETTINGS, standardWorkingDays: 22 } });
    usePayrollStore.setState({ payrollRecords: [], isLoading: false });
    useAttendanceStore.setState({ attendanceRecords: [], leaveRequests: [], isLoading: false });
    useEmployeeStore.setState({ employees: [], isLoading: false });
    useLoanStore.setState({ loans: [], isLoading: false });
  });

  it('[FUNC-03] updatePayrollRecord preserves absentDays deduction when editing draft bonus', async () => {
    const eqStatus = vi.fn().mockResolvedValue({ error: null });
    const eqId = vi.fn(() => ({ eq: eqStatus }));
    const updateFn = vi.fn(() => ({ eq: eqId }));
    mockFrom.mockReturnValue({ update: updateFn });

    usePayrollStore.setState({
      payrollRecords: [
        {
          id: 'pay-1',
          employeeId: 'emp-1',
          employeeName: 'Ayesha Rahman',
          department: 'Engineering',
          designation: 'Developer',
          month: 11,
          year: 2026,
          basicSalary: 44000,
          allowances: 0,
          bonus: 0,
          overtime: 0,
          grossSalary: 44000,
          deductions: 0,
          tax: 0,
          unpaidLeaveDays: 0,
          leaveDeduction: 4000,
          absentDays: 2,
          absenceDeduction: 4000,
          loanDeduction: 0,
          pfEmployeeDeduction: 0,
          pfEmployerContribution: 0,
          totalDeductions: 4000,
          netSalary: 40000,
          status: 'draft',
          createdBy: 'Admin',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });

    await usePayrollStore.getState().updatePayrollRecord('pay-1', { bonus: 5000 });

    const updated = usePayrollStore.getState().getPayrollById('pay-1');
    expect(updated?.grossSalary).toBe(49000);
    expect(updated?.absenceDeduction).toBe(4000);
    expect(updated?.netSalary).toBe(45000);
  });

  it('[FUNC-01] updatePayrollRecord rolls back optimistic state if Supabase fails', async () => {
    const eqStatus = vi.fn().mockResolvedValue({ error: { message: 'RLS denied' } });
    const eqId = vi.fn(() => ({ eq: eqStatus }));
    const updateFn = vi.fn(() => ({ eq: eqId }));
    mockFrom.mockReturnValue({ update: updateFn });

    usePayrollStore.setState({
      payrollRecords: [
        {
          id: 'pay-2',
          employeeId: 'emp-1',
          employeeName: 'Karim Uddin',
          department: 'Finance',
          designation: 'Analyst',
          month: 11,
          year: 2026,
          basicSalary: 30000,
          allowances: 0,
          bonus: 0,
          overtime: 0,
          grossSalary: 30000,
          deductions: 0,
          tax: 0,
          totalDeductions: 0,
          netSalary: 30000,
          status: 'draft',
          createdBy: 'Admin',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });

    await expect(
      usePayrollStore.getState().updatePayrollRecord('pay-2', { bonus: 2000 })
    ).rejects.toThrow('RLS denied');

    const rolledBack = usePayrollStore.getState().getPayrollById('pay-2');
    expect(rolledBack?.bonus).toBe(0);
    expect(rolledBack?.netSalary).toBe(30000);
    expect(toast.error).toHaveBeenCalled();
  });

  it('[FUNC-02] markAsPaid invokes atomic disburse_payroll_batch RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'pay-3',
          employee_id: 'emp-1',
          employee_name: 'Nadia Islam',
          department: 'HR',
          designation: 'Manager',
          month: 11,
          year: 2026,
          basic_salary: 50000,
          allowances: 0,
          bonus: 0,
          overtime: 0,
          gross_salary: 50000,
          deductions: 0,
          tax: 0,
          total_deductions: 0,
          net_salary: 50000,
          status: 'paid',
          payment_method: 'bank_transfer',
          transaction_ref: 'TXN-TEST-1',
          created_by: 'Admin',
          created_at: '2026-11-01T00:00:00.000Z',
        },
      ],
      error: null,
    });

    // Mock fetchLoans, fetchLogs, and notification insert
    mockFrom.mockImplementation((table: string) => {
      if (table === 'loans') {
        return {
          select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        };
      }
      if (table === 'audit_logs') {
        return {
          select: () => ({
            order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
        };
      }
      return {
        insert: () => Promise.resolve({ error: null }),
      };
    });

    usePayrollStore.setState({
      payrollRecords: [
        {
          id: 'pay-3',
          employeeId: 'emp-1',
          employeeName: 'Nadia Islam',
          department: 'HR',
          designation: 'Manager',
          month: 11,
          year: 2026,
          basicSalary: 50000,
          allowances: 0,
          bonus: 0,
          overtime: 0,
          grossSalary: 50000,
          deductions: 0,
          tax: 0,
          totalDeductions: 0,
          netSalary: 50000,
          status: 'approved',
          createdBy: 'Admin',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });

    await usePayrollStore.getState().markAsPaid(['pay-3'], 'Accountant', 'bank_transfer', 'TXN-TEST-1');

    expect(mockRpc).toHaveBeenCalledWith('disburse_payroll_batch', {
      p_record_ids: ['pay-3'],
      p_paid_by: 'Accountant',
      p_method: 'bank_transfer',
      p_ref: 'TXN-TEST-1',
    });
    expect(usePayrollStore.getState().getPayrollById('pay-3')?.status).toBe('paid');
  });

  it('attendanceStore.getMonthlyEmployeeSummary counts 1-day month-boundary unpaid leave accurately', () => {
    useAttendanceStore.setState({
      attendanceRecords: [],
      leaveRequests: [
        {
          id: 'lv-1',
          employeeId: 'emp-1',
          employeeName: 'Hasan',
          department: 'Ops',
          leaveType: 'unpaid',
          startDate: '2026-11-30',
          endDate: '2026-11-30',
          daysCount: 1,
          reason: 'Personal',
          status: 'approved',
          appliedAt: '2026-11-29T00:00:00.000Z',
        },
        {
          id: 'lv-2',
          employeeId: 'emp-1',
          employeeName: 'Hasan',
          department: 'Ops',
          leaveType: 'unpaid',
          startDate: '2026-11-01',
          endDate: '2026-11-01',
          daysCount: 1,
          reason: 'Personal',
          status: 'approved',
          appliedAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });

    const summary = useAttendanceStore.getState().getMonthlyEmployeeSummary('emp-1', 11, 2026);
    expect(summary.unpaidLeaveDays).toBe(2);
  });

  it('[FUNC-04] employeeStore.addEmployee sends null employee_id and adopts DB-assigned ID', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'emp-generated-1',
        employee_id: 'EMP-0042',
        full_name: 'Tariq Aziz',
        email: 'tariq@flowpay.com',
        phone: '01700000000',
        department: 'Engineering',
        designation: 'Engineer',
        joining_date: '2026-11-25',
        basic_salary: 40000,
        allowances: 0,
        bonus: 0,
        overtime: 0,
        deductions: 0,
        tax: 0,
        status: 'active',
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const created = await useEmployeeStore.getState().addEmployee({
      fullName: 'Tariq Aziz',
      email: 'tariq@flowpay.com',
      phone: '01700000000',
      department: 'Engineering',
      designation: 'Engineer',
      joiningDate: '2026-11-25',
      basicSalary: 40000,
      allowances: 0,
      bonus: 0,
      overtime: 0,
      deductions: 0,
      tax: 0,
      status: 'active',
    });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ employee_id: null, bank_info: null }));
    expect(created.employeeId).toBe('EMP-0042');
    expect(useEmployeeStore.getState().employees).toHaveLength(1);
  });

  it('[FUNC-01] loanStore.applyLoan rolls back state if insert fails', async () => {
    mockFrom.mockReturnValue({
      insert: () => Promise.resolve({ error: { message: 'Permission denied' } }),
    });

    await expect(
      useLoanStore.getState().applyLoan({
        employeeId: 'emp-1',
        employeeName: 'Tariq Aziz',
        department: 'Engineering',
        type: 'advance',
        principalAmount: 10000,
        monthlyInstallment: 5000,
        termMonths: 2,
        reason: 'Medical',
      })
    ).rejects.toThrow('Permission denied');

    expect(useLoanStore.getState().loans).toHaveLength(0);
    expect(toast.error).toHaveBeenCalled();
  });
});
