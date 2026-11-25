import { describe, it, expect } from 'vitest';
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

describe('FlowPay Payroll Calculation Test Suite', () => {
  describe('Test 1: Employee with Basic Salary Only', () => {
    const basic = 45000;
    const gross = calculateGross(basic, 0, 0, 0);
    const deductions = calculateTotalDeductions(0, 0, 0, 0, 0);
    const net = calculateNet(gross, deductions);

    it('Gross salary equals basic salary', () => {
      expect(gross).toBe(45000);
    });

    it('Total deductions is 0', () => {
      expect(deductions).toBe(0);
    });

    it('Net salary equals basic salary', () => {
      expect(net).toBe(45000);
    });
  });

  describe('Test 2: Employee with Multiple Allowances', () => {
    const basic = 50000;
    const houseRent = 25000;
    const medical = 5000;
    const conveyance = 3000;
    const totalAllowances = houseRent + medical + conveyance;
    const gross = calculateGross(basic, totalAllowances, 0, 0);
    const net = calculateNet(gross, 0);

    it('Gross salary equals basic + sum of allowances', () => {
      expect(gross).toBe(83000);
    });

    it('Net salary equals gross when zero deductions', () => {
      expect(net).toBe(83000);
    });
  });

  describe('Test 3: Overtime Pay Calculation', () => {
    it('Overtime pay calculation with 1.5x multiplier', () => {
      const otPay = calculateOvertimePay(44000, 10, 1.5, 22);
      expect(otPay).toBe(3750);
    });

    it('Zero OT hours yields 0 pay', () => {
      const zeroOT = calculateOvertimePay(44000, 0, 1.5, 22);
      expect(zeroOT).toBe(0);
    });
  });

  describe('Test 4: Unpaid Leave Deductions', () => {
    it('Unpaid leave deduction for 3 days', () => {
      const leaveDeduction = calculateUnpaidLeaveDeduction(44000, 3, 22);
      expect(leaveDeduction).toBe(6000);
    });

    it('Zero unpaid days yields 0 deduction', () => {
      const zeroLeave = calculateUnpaidLeaveDeduction(44000, 0, 22);
      expect(zeroLeave).toBe(0);
    });
  });

  describe('Test 5: Active Loan Deductions', () => {
    const gross = 60000;
    const loanInstallment = 5000;
    const deductions = calculateTotalDeductions(0, 0, 0, loanInstallment, 0);
    const net = calculateNet(gross, deductions);

    it('Loan deduction added to total deductions', () => {
      expect(deductions).toBe(5000);
    });

    it('Net salary reduced by loan installment', () => {
      expect(net).toBe(55000);
    });
  });

  describe('Test 6: Provident Fund Calculations', () => {
    const pf = calculateProvidentFund(45000, 8.33, 8.33);
    const pfOdd = calculateProvidentFund(52350.75, 8.33, 8.33);

    it('Employee PF is 8.33% of basic', () => {
      expect(pf.employeePF).toBe(3748.5);
    });

    it('Employer PF matches employee PF (8.33%)', () => {
      expect(pf.employerPF).toBe(3748.5);
    });

    it('PF with decimal basic rounds correctly', () => {
      expect(pfOdd.employeePF).toBe(4360.82);
    });
  });

  describe('Test 7: Negative Net-Pay Prevention Safeguard', () => {
    it('Net pay capped at 0 when deductions exceed gross', () => {
      const net = calculateNet(30000, 35000);
      expect(net).toBe(0);
    });
  });

  describe('Test 8: Decimal Rounding Precision', () => {
    it('0.1 + 0.2 rounded to 0.3', () => {
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    });

    it('10.555 rounds to 10.56', () => {
      expect(roundCurrency(10.555)).toBe(10.56);
    });

    it('NaN handled gracefully as 0', () => {
      expect(roundCurrency(NaN)).toBe(0);
    });

    it('Infinity handled gracefully as 0', () => {
      expect(roundCurrency(Infinity)).toBe(0);
    });
  });

  describe('Test 9: Full End-to-End Integration (calculateFullSalary)', () => {
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

    it('Gross salary matches expected', () => {
      expect(result.grossSalary).toBe(98750);
    });

    it('Leave deduction matches expected (60000/22)', () => {
      expect(result.leaveDeduction).toBe(2727.27);
    });

    it('PF employee deduction is 8.33% of basic', () => {
      expect(result.pfEmployeeDeduction).toBe(4998);
    });

    it('PF employer contribution is 8.33% of basic', () => {
      expect(result.pfEmployerContribution).toBe(4998);
    });

    it('Loan deduction matches installment', () => {
      expect(result.loanDeduction).toBe(5000);
    });

    it('Total deductions is sum of tax, leave, loan, pf', () => {
      expect(result.totalDeductions).toBe(17225.27);
    });

    it('Net salary is Gross - Total Deductions', () => {
      expect(result.netSalary).toBe(81524.73);
    });
  });

  describe('Test 10: Optional Automatic Deduction for Absent Days', () => {
    const basicSalary = 50000;
    const standardWorkingDays = 25;

    const enabledResult = calculateFullSalary(
      {
        basicSalary,
        allowances: 10000,
        deductions: 0,
        tax: 0,
        absentDays: 2,
        pfEligible: false,
      },
      { standardWorkingDays }
    );

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

    it('Absence deduction calculated correctly (2 days * 2000)', () => {
      expect(enabledResult.absenceDeduction).toBe(4000);
    });

    it('Net salary reflects absent day deduction (60000 - 4000)', () => {
      expect(enabledResult.netSalary).toBe(56000);
    });

    it('Zero absence deduction when option is disabled', () => {
      expect(disabledResult.absenceDeduction).toBe(0);
    });

    it('Full net salary paid when absent day deduction is disabled (60000)', () => {
      expect(disabledResult.netSalary).toBe(60000);
    });
  });
});
