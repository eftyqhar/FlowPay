import { Employee, CompanySettings } from './types';

/**
 * Decimal-safe rounding utility to 2 decimal places.
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function validateSalaryComponents(components: Record<string, number>): void {
  for (const [key, value] of Object.entries(components)) {
    if (value < 0) {
      throw new Error(`${key} cannot be negative.`);
    }
  }
}

/**
 * Calculates Gross Salary = Basic + Allowances + Bonus + Overtime
 */
export function calculateGross(
  basic: number = 0,
  allowances: number = 0,
  bonus: number = 0,
  overtime: number = 0
): number {
  validateSalaryComponents({ basic, allowances, bonus, overtime });
  return roundCurrency(basic + allowances + bonus + overtime);
}

/**
 * Calculates Total Deductions
 */
export function calculateTotalDeductions(
  deductions: number = 0,
  tax: number = 0,
  leaveDeduction: number = 0,
  loanDeduction: number = 0,
  pfEmployee: number = 0
): number {
  validateSalaryComponents({
    deductions,
    tax,
    leaveDeduction,
    loanDeduction,
    pfEmployee,
  });
  return roundCurrency(deductions + tax + leaveDeduction + loanDeduction + pfEmployee);
}

/**
 * Calculates Net Salary with safeguard against negative results.
 */
export function calculateNet(grossSalary: number, totalDeductions: number): number {
  if (grossSalary < totalDeductions) {
    // Return 0 or capped value to prevent negative payouts
    return 0;
  }
  return roundCurrency(grossSalary - totalDeductions);
}

/**
 * Computes Overtime pay based on hourly rate.
 * Hourly rate = basicSalary / (standardWorkingDays * dailyWorkingHours)
 */
export function calculateOvertimePay(
  basicSalary: number,
  overtimeHours: number,
  multiplier: number = 1.5,
  workingDays: number = 22,
  dailyWorkingHours: number = 8
): number {
  if (overtimeHours <= 0 || basicSalary <= 0) return 0;
  const safeDays = workingDays > 0 && isFinite(workingDays) ? workingDays : 22;
  const safeHours = dailyWorkingHours > 0 && isFinite(dailyWorkingHours) ? dailyWorkingHours : 8;
  const hourlyRate = basicSalary / (safeDays * safeHours);
  return roundCurrency(overtimeHours * hourlyRate * multiplier);
}

/**
 * Computes deduction for unpaid leave days.
 */
export function calculateUnpaidLeaveDeduction(
  basicSalary: number,
  unpaidDays: number,
  workingDays: number = 22
): number {
  if (unpaidDays <= 0 || basicSalary <= 0) return 0;
  const safeDays = workingDays > 0 && isFinite(workingDays) ? workingDays : 22;
  const perDayRate = basicSalary / safeDays;
  return roundCurrency(unpaidDays * perDayRate);
}

/**
 * Computes deduction for absent days.
 * Daily rate = basicSalary / standardWorkingDays
 */
export const calculateAbsenceDeduction = calculateUnpaidLeaveDeduction;

/**
 * Computes employee and employer provident fund contributions.
 */
export function calculateProvidentFund(
  basicSalary: number,
  employeePercent: number = 8.33,
  employerPercent: number = 8.33
): { employeePF: number; employerPF: number } {
  if (basicSalary <= 0) return { employeePF: 0, employerPF: 0 };
  const employeePF = roundCurrency((basicSalary * employeePercent) / 100);
  const employerPF = roundCurrency((basicSalary * employerPercent) / 100);
  return { employeePF, employerPF };
}

export interface FullSalaryCalculationInput {
  basicSalary: number;
  allowances: number;
  bonus?: number;
  overtime?: number;
  deductions?: number;
  tax?: number;
  unpaidLeaveDays?: number;
  absentDays?: number;
  halfDays?: number;
  lateDays?: number;
  loanInstallment?: number;
  isPfEligible?: boolean;
  settings?: Partial<CompanySettings>;
}

export interface FullSalaryCalculationResult {
  grossSalary: number;
  leaveDeduction: number;
  absenceDeduction: number;
  loanDeduction: number;
  pfEmployeeDeduction: number;
  pfEmployerContribution: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculateFullSalary(
  employee: Pick<Employee, 'basicSalary' | 'allowances' | 'bonus' | 'overtime' | 'deductions' | 'tax'> & {
    unpaidLeaveDays?: number;
    absentDays?: number;
    halfDays?: number;
    lateDays?: number;
    loanInstallment?: number;
    pfEligible?: boolean;
  },
  settings?: Partial<CompanySettings>
): FullSalaryCalculationResult {
  const basic = employee.basicSalary || 0;
  const allowances = employee.allowances || 0;
  const bonus = employee.bonus || 0;
  const overtime = employee.overtime || 0;
  const deductions = employee.deductions || 0;

  // Tax handling: default to 0% unless explicitly configured
  const tax = employee.tax || 0;

  const workingDays = settings?.standardWorkingDays || 22;
  const perDayRate = workingDays > 0 ? basic / workingDays : 0;

  // Unpaid leave deduction
  const unpaidCount = employee.unpaidLeaveDays ?? 0;
  const unpaidDeduction = (settings?.unpaidLeaveDeduction ?? true)
    ? roundCurrency(unpaidCount * perDayRate)
    : 0;

  // Absent days deduction
  const absentCount = employee.absentDays ?? 0;
  const absenceDeduction = (settings?.autoDeductAbsenceDays ?? true)
    ? roundCurrency(absentCount * perDayRate)
    : 0;

  // Half-day deduction (0.5 day rate per half day attendance)
  const halfDaysCount = employee.halfDays ?? 0;
  const halfDayDeduction = (settings?.halfDayDeduction ?? true)
    ? roundCurrency(halfDaysCount * 0.5 * perDayRate)
    : 0;

  // Late arrival deduction (configurable threshold, e.g. 3 lates = 1 day penalty)
  const lateCount = employee.lateDays ?? 0;
  let lateDeduction = 0;
  if (settings?.lateDeductionRules?.enabled && settings.lateDeductionRules.lateDaysThreshold > 0) {
    const penaltyUnits = Math.floor(lateCount / settings.lateDeductionRules.lateDaysThreshold);
    lateDeduction = roundCurrency(
      penaltyUnits * (settings.lateDeductionRules.deductionDays || 1) * perDayRate
    );
  }

  const leaveDeduction = roundCurrency(unpaidDeduction + absenceDeduction + halfDayDeduction + lateDeduction);

  // Provident Fund calculation (only if pfEligible and pf percent > 0)
  let pfEmployeeDeduction = 0;
  let pfEmployerContribution = 0;
  const pfEmployeeRate = settings?.pfEmployeePercent ?? 0;
  const pfEmployerRate = settings?.pfEmployerPercent ?? 0;
  if (employee.pfEligible && pfEmployeeRate > 0) {
    const pf = calculateProvidentFund(basic, pfEmployeeRate, pfEmployerRate);
    pfEmployeeDeduction = pf.employeePF;
    pfEmployerContribution = pf.employerPF;
  }

  // Loan deduction (only if loanDeductionEnabled is true)
  const isLoanDeductionEnabled = settings?.loanDeductionEnabled ?? true;
  const loanInstallment = isLoanDeductionEnabled ? (employee.loanInstallment || 0) : 0;
  const loanDeduction = roundCurrency(loanInstallment);

  const grossSalary = calculateGross(basic, allowances, bonus, overtime);

  const totalDeductions = calculateTotalDeductions(
    deductions,
    tax,
    leaveDeduction,
    loanDeduction,
    pfEmployeeDeduction
  );

  const netSalary = calculateNet(grossSalary, totalDeductions);

  return {
    grossSalary,
    leaveDeduction,
    absenceDeduction: leaveDeduction,
    loanDeduction,
    pfEmployeeDeduction,
    pfEmployerContribution,
    totalDeductions,
    netSalary,
  };
}
