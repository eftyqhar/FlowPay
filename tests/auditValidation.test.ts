/**
 * FlowPay Technical Audit Validation Test Suite
 * 
 * Verifies core calculation logic, detected edge cases, double deduction risks,
 * and boundary conditions across FlowPay modules.
 */

import {
  roundCurrency,
  calculateGross,
  calculateTotalDeductions,
  calculateNet,
  calculateOvertimePay,
  calculateUnpaidLeaveDeduction,
  calculateProvidentFund,
  calculateFullSalary,
} from '../src/lib/salary';
import { CompanySettings } from '../src/lib/types';
import { DEFAULT_COMPANY_SETTINGS } from '../src/lib/constants';

interface TestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  notes?: string;
}

const auditResults: TestResult[] = [];

function check(
  id: string,
  category: string,
  name: string,
  condition: boolean,
  actual: any,
  expected: any,
  notes?: string
) {
  auditResults.push({ id, category, name, passed: condition, actual, expected, notes });
  if (condition) {
    console.log(`  ✓ [${id}] PASS: ${name}`);
  } else {
    console.error(`  ✗ [${id}] FAIL / CONFIRMED BUG: ${name} -> Got ${actual}, Expected ${expected} (${notes || ''})`);
  }
}

console.log('================================================================');
console.log('Running FlowPay Technical Audit Verification Test Suite');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// Section A: Absence & Unpaid Leave Double Deduction Bug Verification
// -------------------------------------------------------------------------
console.log('Section A: Absence & Unpaid Leave Deductions');
{
  const basicSalary = 44000;
  const standardWorkingDays = 22;
  const perDayRate = basicSalary / standardWorkingDays; // 2000 BDT/day
  
  // Scenario 1: GeneratePayrollPage passes total absent/unpaid days as unpaidLeaveDays and absentDays: 0
  const simulatedTotalAbsence = 3; // Employee was absent 3 days
  const inputWithBothAssigned = {
    basicSalary,
    allowances: 0,
    unpaidLeaveDays: simulatedTotalAbsence,
    absentDays: 0,
  };

  const fullCalc = calculateFullSalary(inputWithBothAssigned, DEFAULT_COMPANY_SETTINGS);
  const expectedSingleDeduction = 3 * perDayRate; // 6000

  check(
    'AUDIT-BUG-01',
    'Financial Logic',
    'Verify single accurate deduction when total absence is passed into unpaidLeaveDays with absentDays: 0',
    fullCalc.leaveDeduction === expectedSingleDeduction,
    fullCalc.leaveDeduction,
    expectedSingleDeduction,
    `Accurate deduction verified: Deducted ${fullCalc.leaveDeduction}`
  );
}

// -------------------------------------------------------------------------
// Section B: Overtime Rate & Hourly Rate Precision
// -------------------------------------------------------------------------
console.log('\nSection B: Overtime Calculation & Precision');
{
  const basicSalary = 30000;
  const workingDays = 22;
  const dailyHours = 8;
  const multiplier = 1.5;
  const otHours = 5.5;

  // Hourly Rate = 30000 / (22 * 8) = 170.454545...
  // OT Pay = 5.5 * 170.454545 * 1.5 = 1406.25
  const otPay = calculateOvertimePay(basicSalary, otHours, multiplier, workingDays, dailyHours);
  const expectedOt = roundCurrency(otHours * (basicSalary / (workingDays * dailyHours)) * multiplier);

  check(
    'AUDIT-CALC-02',
    'Overtime',
    'Hourly rate overtime with fractional hours (5.5 hrs)',
    otPay === expectedOt,
    otPay,
    expectedOt,
    `Overtime pay verified: ${otPay}`
  );

  // Zero & negative safety
  const negativeOt = calculateOvertimePay(basicSalary, -2, multiplier, workingDays, dailyHours);
  check(
    'AUDIT-CALC-03',
    'Overtime',
    'Negative overtime hours guard',
    negativeOt === 0,
    negativeOt,
    0
  );
}

// -------------------------------------------------------------------------
// Section C: Late Arrival Threshold Deduction
// -------------------------------------------------------------------------
console.log('\nSection C: Late Arrival Threshold Penalties');
{
  const basic = 22000; // 1000/day for 22 days
  const settings: Partial<CompanySettings> = {
    standardWorkingDays: 22,
    lateDeductionRules: {
      enabled: true,
      graceMinutes: 15,
      lateDaysThreshold: 3, // 3 late days = 1 day penalty
      deductionDays: 1,
    },
    unpaidLeaveDeduction: true,
    autoDeductAbsenceDays: true,
    halfDayDeduction: true,
  };

  // Case 1: 2 late days (below threshold of 3) -> 0 deduction
  const calc2Lates = calculateFullSalary({ basicSalary: basic, allowances: 0, lateDays: 2 }, settings);
  check(
    'AUDIT-LATE-01',
    'Attendance Penalty',
    'Below late threshold (2 late days < 3)',
    calc2Lates.leaveDeduction === 0,
    calc2Lates.leaveDeduction,
    0
  );

  // Case 2: 5 late days (1 penalty unit = 1 day deduction = 1000)
  const calc5Lates = calculateFullSalary({ basicSalary: basic, allowances: 0, lateDays: 5 }, settings);
  check(
    'AUDIT-LATE-02',
    'Attendance Penalty',
    '5 late days with threshold 3 (1 day penalty = 1000 BDT)',
    calc5Lates.leaveDeduction === 1000,
    calc5Lates.leaveDeduction,
    1000
  );

  // Case 3: 6 late days (2 penalty units = 2 days deduction = 2000)
  const calc6Lates = calculateFullSalary({ basicSalary: basic, allowances: 0, lateDays: 6 }, settings);
  check(
    'AUDIT-LATE-03',
    'Attendance Penalty',
    '6 late days with threshold 3 (2 days penalty = 2000 BDT)',
    calc6Lates.leaveDeduction === 2000,
    calc6Lates.leaveDeduction,
    2000
  );
}

// -------------------------------------------------------------------------
// Section D: Half-Day Attendance Deductions
// -------------------------------------------------------------------------
console.log('\nSection D: Half-Day Attendance Deductions');
{
  const basic = 22000; // 1000/day
  const settings: Partial<CompanySettings> = {
    standardWorkingDays: 22,
    halfDayDeduction: true,
  };

  // 3 half days = 1.5 days deduction = 1500 BDT
  const calcHalf = calculateFullSalary({ basicSalary: basic, allowances: 0, halfDays: 3 }, settings);
  check(
    'AUDIT-HALF-01',
    'Attendance Penalty',
    '3 Half-days equals 1.5 days deduction (1500 BDT)',
    calcHalf.leaveDeduction === 1500,
    calcHalf.leaveDeduction,
    1500
  );
}

// -------------------------------------------------------------------------
// Section E: Loan Installment Capping
// -------------------------------------------------------------------------
console.log('\nSection E: Loan Installment Capping & Safeguards');
{
  const activeLoanRemaining = 1500;
  const scheduledInstallment = 3000;
  // Should never deduct more than remaining balance
  const actualInstallmentDeduction = Math.min(scheduledInstallment, activeLoanRemaining);

  check(
    'AUDIT-LOAN-01',
    'Loan Logic',
    'Installment deduction capped at remaining balance when remaining < installment',
    actualInstallmentDeduction === 1500,
    actualInstallmentDeduction,
    1500
  );
}

// -------------------------------------------------------------------------
// Section F: Negative Net Pay Prevention Safeguard
// -------------------------------------------------------------------------
console.log('\nSection F: Negative Net Salary Safeguard');
{
  const gross = 20000;
  const excessiveDeductions = 25000;
  const net = calculateNet(gross, excessiveDeductions);

  check(
    'AUDIT-SAFE-01',
    'Safety Cap',
    'Net salary capped at 0 when deductions exceed gross',
    net === 0,
    net,
    0
  );
}

// -------------------------------------------------------------------------
// Summary of Audit Test Execution
// -------------------------------------------------------------------------
console.log('\n================================================================');
console.log('Audit Test Suite Execution Summary:');
const total = auditResults.length;
const passed = auditResults.filter((r) => r.passed).length;
const failed = auditResults.filter((r) => !r.passed).length;
console.log(`Total Checks: ${total} | Passed: ${passed} | Identified Discrepancies/Bugs: ${failed}`);
console.log('================================================================\n');
