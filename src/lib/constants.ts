import { UserRole, PaymentMethod, PayrollStatus, CompanySettings, AttendanceStatus, LeaveStatus, LoanStatus } from './types';

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr', label: 'HR' },
  { value: 'employee', label: 'Employee' },
];

export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'mobile_banking', label: 'Mobile Banking (bKash/Nagad)' },
];

export const PAYROLL_STATUSES: Record<PayrollStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
};

export const EMPLOYEE_STATUSES = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-800' },
};

export const ATTENDANCE_STATUSES: Record<AttendanceStatus, { label: string; color: string }> = {
  present: { label: 'Present', color: 'bg-green-100 text-green-800 border-green-200' },
  late: { label: 'Late', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  half_day: { label: 'Half Day', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200' },
  on_leave: { label: 'On Leave', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export const LEAVE_STATUSES: Record<LeaveStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
};

export const LOAN_STATUSES: Record<LoanStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  active: { label: 'Active / In Repayment', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  completed: { label: 'Paid Off', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'FlowPay Enterprise',
  address: 'Level 12, Crystal Tower, Gulshan-2, Dhaka 1212',
  phone: '+880 2 988 7766',
  email: 'finance@flowpay.com',
  website: 'https://flowpay.internal',
  currency: 'BDT',
  currencySymbol: '৳',
  fiscalYearStart: 7, // July
  defaultAllowancePercent: 10,
  defaultTaxPercent: 5,
  paymentMethods: ['bank_transfer', 'cash', 'check', 'mobile_banking'],
  minimumWage: 12500,
  overtimeMultiplier: 1.5,
  pfEmployeePercent: 8.33,
  pfEmployerPercent: 8.33,
  taxFreeThreshold: 350000,
  standardWorkingDays: 22,
  autoDeductAbsenceDays: true,
};

export const PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['all'],
  admin: [
    'view_dashboard', 'manage_users', 'manage_employees', 'manage_payroll',
    'manage_settings', 'view_reports', 'manage_departments', 'manage_attendance',
    'manage_loans', 'approve_loans', 'approve_leaves', 'view_audit_logs', 'manage_salary_settings'
  ],
  accountant: [
    'view_dashboard', 'view_employees', 'manage_payroll', 'view_reports',
    'manage_loans', 'approve_loans', 'view_audit_logs', 'manage_salary_settings'
  ],
  hr: [
    'view_dashboard', 'manage_employees', 'manage_departments',
    'manage_attendance', 'approve_leaves', 'view_reports'
  ],
  employee: [
    'view_dashboard', 'view_own_payroll', 'view_own_profile',
    'view_own_attendance', 'apply_leave', 'apply_loan'
  ],
};
