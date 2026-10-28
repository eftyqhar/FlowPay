// User & Auth
export type UserRole = 'owner' | 'admin' | 'accountant' | 'hr' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  employeeId?: string; // link to employee record for employee role
  createdAt: string;
}

// Employee
export interface BankInfo {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'savings' | 'checking';
}

export interface MobileBankingInfo {
  provider: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'other' | string;
  accountNumber: string;
  accountType?: 'personal' | 'agent' | 'merchant';
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
  annual: number;
}

export interface Employee {
  id: string;
  employeeId: string; // display ID like EMP-001
  fullName: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  overtime: number;
  deductions: number;
  tax: number;
  bankInfo: BankInfo;
  paymentMethod?: PaymentMethod;
  mobileBankingInfo?: MobileBankingInfo;
  status: 'active' | 'inactive';
  pfEligible?: boolean;
  leaveBalance?: LeaveBalance;
  emergencyContact?: EmergencyContact;
  documents?: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

// Department
export interface Department {
  id: string;
  name: string;
  head?: string;
  headId?: string;
  description?: string;
  createdAt: string;
}

// Payroll
export type PayrollStatus = 'draft' | 'approved' | 'paid';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'mobile_banking';

export interface SalaryBreakdown {
  houseRent?: number;
  medical?: number;
  transport?: number;
  otherAllowances?: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  deductions: number;
  tax: number;
  unpaidLeaveDays?: number;
  leaveDeduction?: number;
  absentDays?: number;
  absenceDeduction?: number;
  loanDeduction?: number;
  pfEmployeeDeduction?: number;
  pfEmployerContribution?: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  notes?: string;
  breakdown?: SalaryBreakdown;
}

// Company Settings
export interface CompanySettings {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  currency: string;
  currencySymbol: string;
  fiscalYearStart: number; // month 1-12
  defaultAllowancePercent: number;
  defaultTaxPercent: number;
  paymentMethods: PaymentMethod[];
  minimumWage?: number;
  overtimeMultiplier?: number;
  pfEmployeePercent?: number;
  pfEmployerPercent?: number;
  taxFreeThreshold?: number;
  standardWorkingDays?: number;
  autoDeductAbsenceDays?: boolean;
}

// Dashboard
export interface DashboardStats {
  totalEmployees: number;
  totalMonthlyPayroll: number;
  totalPaid: number;
  totalPending: number;
  activeEmployees: number;
}

export interface SalaryTrend {
  month: string;
  year: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
}

export interface DepartmentSalary {
  department: string;
  totalSalary: number;
  employeeCount: number;
}

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: AttendanceStatus;
  notes?: string;
  manualCorrection?: boolean;
  correctedBy?: string;
}

// Leave Application
export type LeaveType = 'casual' | 'sick' | 'annual' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Loan and Advance
export type LoanType = 'loan' | 'advance';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed';

export interface LoanRepayment {
  id: string;
  date: string;
  amount: number;
  payrollRecordId?: string;
  month?: number;
  year?: number;
}

export interface LoanRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: LoanType;
  principalAmount: number;
  monthlyInstallment: number;
  remainingBalance: number;
  termMonths: number;
  reason: string;
  status: LoanStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  repayments: LoanRepayment[];
}

// Audit Log
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}

// Notifications
export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  link?: string;
}
