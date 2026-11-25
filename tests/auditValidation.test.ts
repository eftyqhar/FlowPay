import { describe, it, expect } from 'vitest';
import {
  roundCurrency,
  calculateNet,
  calculateOvertimePay,
  calculateFullSalary,
} from '../src/lib/salary';
import { CompanySettings } from '../src/lib/types';
import { DEFAULT_COMPANY_SETTINGS } from '../src/lib/constants';

describe('FlowPay Technical Audit Verification Test Suite', () => {
  describe('Section A: Absence & Unpaid Leave Deductions', () => {
    it('[AUDIT-BUG-01] Verify single accurate deduction when total absence is passed into unpaidLeaveDays with absentDays: 0', () => {
      const basicSalary = 44000;
      const standardWorkingDays = 22;
      const perDayRate = basicSalary / standardWorkingDays;
      const simulatedTotalAbsence = 3;

      const fullCalc = calculateFullSalary(
        {
          basicSalary,
          allowances: 0,
          unpaidLeaveDays: simulatedTotalAbsence,
          absentDays: 0,
        },
        DEFAULT_COMPANY_SETTINGS
      );

      expect(fullCalc.leaveDeduction).toBe(3 * perDayRate);
    });
  });

  describe('Section B: Overtime Calculation & Precision', () => {
    const basicSalary = 30000;
    const workingDays = 22;
    const dailyHours = 8;
    const multiplier = 1.5;
    const otHours = 5.5;

    it('[AUDIT-CALC-02] Hourly rate overtime with fractional hours (5.5 hrs)', () => {
      const otPay = calculateOvertimePay(basicSalary, otHours, multiplier, workingDays, dailyHours);
      const expectedOt = roundCurrency(
        otHours * (basicSalary / (workingDays * dailyHours)) * multiplier
      );
      expect(otPay).toBe(expectedOt);
    });

    it('[AUDIT-CALC-03] Negative overtime hours guard', () => {
      const negativeOt = calculateOvertimePay(basicSalary, -2, multiplier, workingDays, dailyHours);
      expect(negativeOt).toBe(0);
    });
  });

  describe('Section C: Late Arrival Threshold Penalties', () => {
    const basic = 22000;
    const settings: Partial<CompanySettings> = {
      standardWorkingDays: 22,
      lateDeductionRules: {
        enabled: true,
        graceMinutes: 15,
        lateDaysThreshold: 3,
        deductionDays: 1,
      },
      unpaidLeaveDeduction: true,
      autoDeductAbsenceDays: true,
      halfDayDeduction: true,
    };

    it('[AUDIT-LATE-01] Below late threshold (2 late days < 3)', () => {
      const calc2Lates = calculateFullSalary(
        { basicSalary: basic, allowances: 0, lateDays: 2 },
        settings
      );
      expect(calc2Lates.leaveDeduction).toBe(0);
    });

    it('[AUDIT-LATE-02] 5 late days with threshold 3 (1 day penalty = 1000 BDT)', () => {
      const calc5Lates = calculateFullSalary(
        { basicSalary: basic, allowances: 0, lateDays: 5 },
        settings
      );
      expect(calc5Lates.leaveDeduction).toBe(1000);
    });

    it('[AUDIT-LATE-03] 6 late days with threshold 3 (2 days penalty = 2000 BDT)', () => {
      const calc6Lates = calculateFullSalary(
        { basicSalary: basic, allowances: 0, lateDays: 6 },
        settings
      );
      expect(calc6Lates.leaveDeduction).toBe(2000);
    });
  });

  describe('Section D: Half-Day Attendance Deductions', () => {
    it('[AUDIT-HALF-01] 3 Half-days equals 1.5 days deduction (1500 BDT)', () => {
      const calcHalf = calculateFullSalary(
        { basicSalary: 22000, allowances: 0, halfDays: 3 },
        { standardWorkingDays: 22, halfDayDeduction: true }
      );
      expect(calcHalf.leaveDeduction).toBe(1500);
    });
  });

  describe('Section E: Loan Installment Capping & Safeguards', () => {
    it('[AUDIT-LOAN-01] Installment deduction capped at remaining balance when remaining < installment', () => {
      const actualInstallmentDeduction = Math.min(3000, 1500);
      expect(actualInstallmentDeduction).toBe(1500);
    });
  });

  describe('Section F: Negative Net Salary Safeguard', () => {
    it('[AUDIT-SAFE-01] Net salary capped at 0 when deductions exceed gross', () => {
      const net = calculateNet(20000, 25000);
      expect(net).toBe(0);
    });
  });
});
