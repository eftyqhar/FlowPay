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
 */
export function calculateOvertimePay(
  basicSalary: number,
  overtimeHours: number,
  multiplier: number = 1.5,
  workingDays: number = 22
): number {
  if (overtimeHours <= 0 || basicSalary <= 0) return 0;
  const hourlyRate = basicSalary / (workingDays * 8);
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
  const perDayRate = basicSalary / workingDays;
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
  const tax = employee.tax || 0;
  const unpaidDays = employee.absentDays !== undefined ? employee.absentDays : (employee.unpaidLeaveDays || 0);
  const loanInstallment = employee.loanInstallment || 0;
  const workingDays = settings?.standardWorkingDays || 22;

  const grossSalary = calculateGross(basic, allowances, bonus, overtime);

  // Unpaid leave / absence deduction
  const leaveDeduction = calculateAbsenceDeduction(basic, unpaidDays, workingDays);

  // PF calculation
  let pfEmployeeDeduction = 0;
  let pfEmployerContribution = 0;
  if (employee.pfEligible) {
    const pf = calculateProvidentFund(
      basic,
      settings?.pfEmployeePercent || 8.33,
      settings?.pfEmployerPercent || 8.33
    );
    pfEmployeeDeduction = pf.employeePF;
    pfEmployerContribution = pf.employerPF;
  }

  // Loan installment
  const loanDeduction = roundCurrency(loanInstallment);

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
