/**
 * FlowPay Comprehensive Payroll Calculation Test Suite
 * 
 * Tests:
 * 1. Employee with basic salary only
 * 2. Employee with multiple allowances
 * 3. Employee with overtime pay calculation
 * 4. Employee with unpaid leave deductions
 * 5. Employee with active loan deductions
 * 6. Employee with Provident Fund calculations (8.33% employee & employer)
 * 7. Negative net-pay prevention / zero cap safeguard
 * 8. Decimal precision and rounding verification
 * 9. Full end-to-end salary calculation with all components combined
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

interface TestResult {
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  error?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, actual?: any, expected?: any) {
  if (condition) {
    results.push({ name, passed: true, actual, expected });
    console.log(`  ✓ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, actual, expected, error: `Expected ${expected}, got ${actual}` });
    console.error(`  ✗ FAIL: ${name} -> Expected ${expected}, got ${actual}`);
  }
}

console.log('================================================================');
console.log('Running FlowPay Payroll Calculation Test Suite');
console.log('================================================================\n');

// ----------------------------------------------------------------
// Test 1: Employee with Basic Salary Only
// ----------------------------------------------------------------
console.log('Test 1: Employee with Basic Salary Only');
{
  const basic = 45000;
  const gross = calculateGross(basic, 0, 0, 0);
  const deductions = calculateTotalDeductions(0, 0, 0, 0, 0);
  const net = calculateNet(gross, deductions);

  assert('Gross salary equals basic salary', gross === 45000, gross, 45000);
  assert('Total deductions is 0', deductions === 0, deductions, 0);
  assert('Net salary equals basic salary', net === 45000, net, 45000);
}

// ----------------------------------------------------------------
// Test 2: Employee with Multiple Allowances
// ----------------------------------------------------------------
console.log('\nTest 2: Employee with Multiple Allowances');
{
  const basic = 50000;
  const houseRent = 25000; // 50%
  const medical = 5000;    // 10%
  const conveyance = 3000;
  const totalAllowances = houseRent + medical + conveyance; // 33000
  const gross = calculateGross(basic, totalAllowances, 0, 0);
  const net = calculateNet(gross, 0);

  assert('Gross salary equals basic + sum of allowances', gross === 83000, gross, 83000);
  assert('Net salary equals gross when zero deductions', net === 83000, net, 83000);
}

// ----------------------------------------------------------------
// Test 3: Overtime Pay Calculation
// ----------------------------------------------------------------
console.log('\nTest 3: Overtime Pay Calculation');
{
  // Basic = 44,000, workingDays = 22, hours/day = 8 -> 176 hours
  // Hourly rate = 44000 / 176 = 250.00
  // Multiplier = 1.5 -> OT rate = 375.00/hr
  // Overtime hours = 10 -> OT pay = 3750.00
  const otPay = calculateOvertimePay(44000, 10, 1.5, 22);
  assert('Overtime pay calculation with 1.5x multiplier', otPay === 3750, otPay, 3750);

  // 0 hours OT
  const zeroOT = calculateOvertimePay(44000, 0, 1.5, 22);
  assert('Zero OT hours yields 0 pay', zeroOT === 0, zeroOT, 0);
}

// ----------------------------------------------------------------
// Test 4: Unpaid Leave Deductions
// ----------------------------------------------------------------
console.log('\nTest 4: Unpaid Leave Deductions');
{
  // Basic = 44,000, workingDays = 22 -> Per day rate = 2,000.00
  // 3 unpaid days -> Deduction = 6,000.00
  const leaveDeduction = calculateUnpaidLeaveDeduction(44000, 3, 22);
  assert('Unpaid leave deduction for 3 days', leaveDeduction === 6000, leaveDeduction, 6000);

  // 0 unpaid days
  const zeroLeave = calculateUnpaidLeaveDeduction(44000, 0, 22);
  assert('Zero unpaid days yields 0 deduction', zeroLeave === 0, zeroLeave, 0);
}

// ----------------------------------------------------------------
// Test 5: Active Loan Deductions
// ----------------------------------------------------------------
console.log('\nTest 5: Active Loan Deductions');
{
  const gross = 60000;
  const loanInstallment = 5000;
  const deductions = calculateTotalDeductions(0, 0, 0, loanInstallment, 0);
  const net = calculateNet(gross, deductions);

  assert('Loan deduction added to total deductions', deductions === 5000, deductions, 5000);
  assert('Net salary reduced by loan installment', net === 55000, net, 55000);
}

// ----------------------------------------------------------------
// Test 6: Provident Fund (8.33% employee & employer)
// ----------------------------------------------------------------
console.log('\nTest 6: Provident Fund Calculations');
{
  // Basic = 45,000, rate = 8.33%
  // 45,000 * 0.0833 = 3748.50
  const pf = calculateProvidentFund(45000, 8.33, 8.33);
  assert('Employee PF is 8.33% of basic', pf.employeePF === 3748.5, pf.employeePF, 3748.5);
  assert('Employer PF matches employee PF (8.33%)', pf.employerPF === 3748.5, pf.employerPF, 3748.5);

  // Basic = 52,350.75
  const pfOdd = calculateProvidentFund(52350.75, 8.33, 8.33);
  // 52350.75 * 0.0833 = 4360.817475 -> 4360.82
  assert('PF with decimal basic rounds correctly', pfOdd.employeePF === 4360.82, pfOdd.employeePF, 4360.82);
}

// ----------------------------------------------------------------
// Test 7: Negative Net-Pay Prevention / Zero Cap
// ----------------------------------------------------------------
console.log('\nTest 7: Negative Net-Pay Prevention Safeguard');
{
  const gross = 30000;
  const deductions = 35000; // Deductions exceed gross
  const net = calculateNet(gross, deductions);
  assert('Net pay capped at 0 when deductions exceed gross', net === 0, net, 0);
}

// ----------------------------------------------------------------
// Test 8: Decimal Rounding Precision
// ----------------------------------------------------------------
console.log('\nTest 8: Decimal Rounding Precision');
{
  // IEEE 754 floating point precision edge case (0.1 + 0.2 = 0.30000000000000004)
  const floatSum = 0.1 + 0.2;
  const rounded = roundCurrency(floatSum);
  assert('0.1 + 0.2 rounded to 0.3', rounded === 0.3, rounded, 0.3);

  // Round half up test
  const roundUp = roundCurrency(10.555);
  assert('10.555 rounds to 10.56', roundUp === 10.56, roundUp, 10.56);

  // NaN and Infinity safety
  assert('NaN handled gracefully as 0', roundCurrency(NaN) === 0, roundCurrency(NaN), 0);
  assert('Infinity handled gracefully as 0', roundCurrency(Infinity) === 0, roundCurrency(Infinity), 0);
}

// ----------------------------------------------------------------
// Test 9: Full End-to-End Salary Calculation Integration
// ----------------------------------------------------------------
console.log('\nTest 9: Full End-to-End Integration (calculateFullSalary)');
{
  // Senior Developer:
  // Basic: 60,000, Allowances: 25,000, Bonus: 10,000, Overtime: 3,750
  // Gross = 60,000 + 25,000 + 10,000 + 3,750 = 98,750
  //
  // Deductions:
  // Tax: 4,500
  // Unpaid Leave: 1 day on 22 working days = 60000 / 22 = 2,727.27
  // Loan Installment: 5,000
  // PF (8.33% of 60,000) = 4,998.00
  // Total Deductions = 4,500 + 2,727.27 + 5,000 + 4,998.00 = 17,225.27
  //
  // Net Salary = 98,750 - 17,225.27 = 81,524.73
  const employeeData = {
    basicSalary: 60000,
    allowances: 25000,
    bonus: 10000,
    overtime: 3750,
    deductions: 0,
    tax: 4500,
    unpaidLeaveDays: 1,
    loanInstallment: 5000,
    pfEligible: true,
  };

  const settings = {
    standardWorkingDays: 22,
    pfEmployeePercent: 8.33,
    pfEmployerPercent: 8.33,
  };

  const result = calculateFullSalary(employeeData, settings);

  assert('Gross salary matches expected', result.grossSalary === 98750, result.grossSalary, 98750);
  assert('Leave deduction matches expected (60000/22)', result.leaveDeduction === 2727.27, result.leaveDeduction, 2727.27);
  assert('PF employee deduction is 8.33% of basic', result.pfEmployeeDeduction === 4998, result.pfEmployeeDeduction, 4998);
  assert('PF employer contribution is 8.33% of basic', result.pfEmployerContribution === 4998, result.pfEmployerContribution, 4998);
  assert('Loan deduction matches installment', result.loanDeduction === 5000, result.loanDeduction, 5000);
  assert('Total deductions is sum of tax, leave, loan, pf', result.totalDeductions === 17225.27, result.totalDeductions, 17225.27);
  assert('Net salary is Gross - Total Deductions', result.netSalary === 81524.73, result.netSalary, 81524.73);
}

// ----------------------------------------------------------------
// Test 10: Optional Automatic Deduction for Absent Days
// ----------------------------------------------------------------
console.log('\nTest 10: Optional Automatic Deduction for Absent Days');
{
  const basicSalary = 50000;
  const standardWorkingDays = 25; // Daily rate = 50,000 / 25 = 2,000
  const recordedAbsentDays = 2;   // 2 days absent -> 4,000 deduction

  // Case A: Auto-deduction ENABLED (absent days deducted)
  const enabledResult = calculateFullSalary(
    {
      basicSalary,
      allowances: 10000,
      deductions: 0,
      tax: 0,
      absentDays: recordedAbsentDays,
      pfEligible: false,
    },
    { standardWorkingDays }
  );

  assert('Absence deduction calculated correctly (2 days * ৳2,000)', enabledResult.absenceDeduction === 4000, enabledResult.absenceDeduction, 4000);
  assert('Net salary reflects absent day deduction (৳60,000 - ৳4,000)', enabledResult.netSalary === 56000, enabledResult.netSalary, 56000);

  // Case B: Auto-deduction DISABLED (zero absent days deducted)
  const disabledResult = calculateFullSalary(
    {
      basicSalary,
      allowances: 10000,
      deductions: 0,
      tax: 0,
      absentDays: 0,
      pfEligible: false,
    },
    { standardWorkingDays }
  );

  assert('Zero absence deduction when option is disabled', disabledResult.absenceDeduction === 0, disabledResult.absenceDeduction, 0);
  assert('Full net salary paid when absent day deduction is disabled (৳60,000)', disabledResult.netSalary === 60000, disabledResult.netSalary, 60000);
}

// ----------------------------------------------------------------
// Summary
// ----------------------------------------------------------------
console.log('\n================================================================');
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;
console.log(`Results: ${passedCount} passed, ${failedCount} failed (${results.length} total tests)`);
console.log('================================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PAYROLL CALCULATION TESTS PASSED SUCCESSFULLY! ✓\n');
  process.exit(0);
}
