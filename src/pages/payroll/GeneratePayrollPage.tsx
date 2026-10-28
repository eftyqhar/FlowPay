import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEmployeeStore } from '@/stores/employeeStore';
import { usePayrollStore, EmployeePayrollInput } from '@/stores/payrollStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useLoanStore } from '@/stores/loanStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculateFullSalary, roundCurrency } from '@/lib/salary';
import { getMonthName, getMonthYear, formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function GeneratePayrollPage() {
  const navigate = useNavigate();
  const { employees } = useEmployeeStore();
  const { generatePayroll, getPayrollByMonth } = usePayrollStore();
  const { getMonthlyEmployeeSummary } = useAttendanceStore();
  const { getActiveLoan } = useLoanStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();
  const { settings } = useSettingsStore();

  const [step, setStep] = useState(1);
  const now = new Date();

  // 1-indexed months (1-12)
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // Configurable absent days auto deduction
  const [autoDeductAbsence, setAutoDeductAbsence] = useState<boolean>(settings?.autoDeductAbsenceDays ?? true);

  // Per-employee adjustments
  const [adjustments, setAdjustments] = useState<
    Record<
      string,
      {
        bonus: number;
        overtime: number;
        unpaidLeaveDays: number;
        loanInstallment: number;
      }
    >
  >({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const monthNum = parseInt(selectedMonth, 10);
  const yearNum = parseInt(selectedYear, 10);
  const periodString = getMonthYear(monthNum, yearNum);

  const existingPayrolls = getPayrollByMonth(monthNum, yearNum);
  const hasExisting = existingPayrolls.length > 0;
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees]
  );

  const handleNextStep1 = () => {
    if (activeEmployees.length === 0) {
      toast.error('No active employees found to generate payroll');
      return;
    }

    // Auto-populate adjustments from attendance and loan stores
    const initialAdjustments: Record<string, any> = {};
    activeEmployees.forEach((emp) => {
      const summary = getMonthlyEmployeeSummary(emp.id, monthNum, yearNum);
      const activeLoan = getActiveLoan(emp.id);
      const totalAbsenceDays = (summary.absent || 0) + (summary.unpaidLeaveDays || 0);

      initialAdjustments[emp.id] = {
        bonus: emp.bonus || 0,
        overtime: emp.overtime || 0,
        unpaidLeaveDays: autoDeductAbsence ? totalAbsenceDays : 0,
        loanInstallment: activeLoan ? Math.min(activeLoan.monthlyInstallment, activeLoan.remainingBalance) : 0,
      };
    });

    setAdjustments(initialAdjustments);
    setSelectedEmployees(activeEmployees.map((e) => e.id));
    setStep(2);
  };

  const handleToggleAutoDeduct = (checked: boolean) => {
    setAutoDeductAbsence(checked);
    setAdjustments((prev) => {
      const updated = { ...prev };
      activeEmployees.forEach((emp) => {
        const summary = getMonthlyEmployeeSummary(emp.id, monthNum, yearNum);
        const totalAbsenceDays = (summary.absent || 0) + (summary.unpaidLeaveDays || 0);
        updated[emp.id] = {
          ...(updated[emp.id] || {
            bonus: emp.bonus || 0,
            overtime: emp.overtime || 0,
            loanInstallment: 0,
          }),
          unpaidLeaveDays: checked ? totalAbsenceDays : 0,
        };
      });
      return updated;
    });
  };

  const handleAdjustmentChange = (
    employeeId: string,
    field: 'bonus' | 'overtime' | 'unpaidLeaveDays' | 'loanInstallment',
    value: string
  ) => {
    const numValue = Math.max(0, Number(value) || 0);
    setAdjustments((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {
          bonus: 0,
          overtime: 0,
          unpaidLeaveDays: 0,
          loanInstallment: 0,
        }),
        [field]: numValue,
      },
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(activeEmployees.map((e) => e.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, id]);
    } else {
      setSelectedEmployees((prev) => prev.filter((empId) => empId !== id));
    }
  };

  const calculatedSalaries = useMemo(() => {
    return activeEmployees.map((emp) => {
      const adj = adjustments[emp.id] || {
        bonus: 0,
        overtime: 0,
        unpaidLeaveDays: 0,
        loanInstallment: 0,
      };

      const calc = calculateFullSalary(
        {
          basicSalary: emp.basicSalary,
          allowances: emp.allowances,
          bonus: adj.bonus,
          overtime: adj.overtime,
          deductions: emp.deductions,
          tax: emp.tax,
          unpaidLeaveDays: adj.unpaidLeaveDays,
          absentDays: adj.unpaidLeaveDays,
          loanInstallment: adj.loanInstallment,
          pfEligible: emp.pfEligible ?? true,
        },
        settings
      );

      const workingDays = settings?.standardWorkingDays || 22;
      const dailyRate = roundCurrency(emp.basicSalary / workingDays);

      return {
        employee: emp,
        gross: calc.grossSalary,
        deductions: calc.totalDeductions,
        absenceDeduction: calc.leaveDeduction,
        dailyRate,
        net: calc.netSalary,
        bonus: adj.bonus,
        overtime: adj.overtime,
        unpaidLeaveDays: adj.unpaidLeaveDays,
        loanInstallment: adj.loanInstallment,
      };
    });
  }, [activeEmployees, adjustments, settings]);

  const selectedCalculations = calculatedSalaries.filter((c) =>
    selectedEmployees.includes(c.employee.id)
  );

  const summaryTotals = useMemo(() => {
    return selectedCalculations.reduce(
      (acc, curr) => ({
        gross: acc.gross + curr.gross,
        deductions: acc.deductions + curr.deductions,
        absenceDeductions: acc.absenceDeductions + curr.absenceDeduction,
        net: acc.net + curr.net,
      }),
      { gross: 0, deductions: 0, absenceDeductions: 0, net: 0 }
    );
  }, [selectedCalculations]);

  const handleGenerate = () => {
    if (selectedCalculations.length === 0) {
      toast.error('No employees selected');
      return;
    }

    try {
      const selectedPayload: EmployeePayrollInput[] = selectedCalculations.map((c) => ({
        id: c.employee.id,
        fullName: c.employee.fullName,
        department: c.employee.department,
        designation: c.employee.designation,
        basicSalary: c.employee.basicSalary,
        allowances: c.employee.allowances,
        bonus: c.bonus,
        overtime: c.overtime,
        deductions: c.employee.deductions,
        tax: c.employee.tax,
        unpaidLeaveDays: c.unpaidLeaveDays,
        absentDays: c.unpaidLeaveDays,
        loanInstallment: c.loanInstallment,
        pfEligible: c.employee.pfEligible ?? true,
      }));

      generatePayroll(
        monthNum,
        yearNum,
        selectedPayload,
        currentUser?.name || 'Admin',
        true
      );

      addLog({
        userId: currentUser?.id || 'USR-002',
        userName: currentUser?.name || 'Admin',
        action: 'Generate Payroll Draft',
        module: 'Payroll',
        details: `Generated payroll for ${selectedPayload.length} employees for ${periodString} (Total: ${formatCurrency(summaryTotals.net)}, Auto-deduct Absences: ${autoDeductAbsence ? 'Yes' : 'No'})`,
      });

      toast.success(`Successfully generated payroll draft for ${periodString}`);
      navigate('/payroll');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate payroll');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Generate Monthly Payroll"
        description="Automated calculation engine with attendance deductions and active loan installments."
      />

      {/* Progress Indicator */}
      <div className="flex items-center space-x-3 text-sm bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <span className={step >= 1 ? 'font-bold text-indigo-600' : 'text-slate-400'}>
          1. Select Period
        </span>
        <span className="text-slate-300">→</span>
        <span className={step >= 2 ? 'font-bold text-indigo-600' : 'text-slate-400'}>
          2. Review & Adjust Components
        </span>
        <span className="text-slate-300">→</span>
        <span className={step >= 3 ? 'font-bold text-indigo-600' : 'text-slate-400'}>
          3. Preview & Finalize
        </span>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Payroll Period</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {getMonthName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-md border text-sm text-slate-600 mb-6 space-y-1">
            <p>
              • <strong>Active Employees to process:</strong> {activeEmployees.length}
            </p>
            <p>
              • <strong>Rules applied:</strong> Active loan installments and statutory taxes are automatically calculated.
            </p>
          </div>

          {/* Absence Deduction Option */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-sm">
                <Label htmlFor="auto-deduct-step1" className="text-sm font-semibold text-slate-800">
                  Auto-Deduct Absent Days
                </Label>
                <p className="text-xs text-slate-500">
                  Calculate daily rate (Basic ÷ {settings?.standardWorkingDays || 22} days) and automatically deduct unapproved absences.
                </p>
              </div>
              <Switch
                id="auto-deduct-step1"
                checked={autoDeductAbsence}
                onCheckedChange={setAutoDeductAbsence}
              />
            </div>
            <div className="text-xs pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
              <span className="text-slate-500">Policy Mode:</span>
              {autoDeductAbsence ? (
                <span className="text-emerald-700 font-medium">
                  Automatic (Pulls monthly absent & unpaid leave days from attendance)
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  Disabled (Zero absent days deducted unless manually entered)
                </span>
              )}
            </div>
          </div>

          {hasExisting && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-6 text-sm flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Notice: Existing records found for {periodString}</strong>
                <p className="mt-0.5 text-xs">
                  {existingPayrolls.length} record(s) already exist. Proceeding will refresh and recalculate the draft records with the latest components.
                </p>
              </div>
            </div>
          )}

          <Button onClick={handleNextStep1} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Continue to Employee Review <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Adjust Variables for {periodString}
              </h3>
              <p className="text-xs text-slate-500">
                Review bonuses, overtime hours, unpaid leave deductions, and loan installments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-lg text-xs">
                <span className="text-slate-700 font-medium">Auto-deduct Absences:</span>
                <Switch
                  checked={autoDeductAbsence}
                  onCheckedChange={handleToggleAutoDeduct}
                />
              </div>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={selectedEmployees.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Review Summary ({selectedEmployees.length}) <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        selectedEmployees.length > 0 &&
                        selectedEmployees.length === activeEmployees.length
                      }
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="w-28 text-center">Bonus (৳)</TableHead>
                  <TableHead className="w-28 text-center">Overtime (৳)</TableHead>
                  <TableHead className="w-32 text-center">Absent Days (৳)</TableHead>
                  <TableHead className="w-28 text-center">Loan Repay (৳)</TableHead>
                  <TableHead className="text-right font-bold">Estimated Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedSalaries.map(
                  ({
                    employee,
                    net,
                    bonus,
                    overtime,
                    unpaidLeaveDays,
                    absenceDeduction,
                    dailyRate,
                    loanInstallment,
                  }) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) =>
                            handleSelectEmployee(employee.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{employee.fullName}</div>
                        <div className="text-xs text-slate-500">{employee.department}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <CurrencyDisplay amount={employee.basicSalary} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right font-mono"
                          value={bonus}
                          onChange={(e) =>
                            handleAdjustmentChange(employee.id, 'bonus', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right font-mono"
                          value={overtime}
                          onChange={(e) =>
                            handleAdjustmentChange(employee.id, 'overtime', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-center font-mono"
                          value={unpaidLeaveDays}
                          onChange={(e) =>
                            handleAdjustmentChange(
                              employee.id,
                              'unpaidLeaveDays',
                              e.target.value
                            )
                          }
                        />
                        {unpaidLeaveDays > 0 ? (
                          <div className="text-[11px] text-red-600 text-center font-mono mt-0.5 font-medium">
                            -<CurrencyDisplay amount={absenceDeduction} />
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 text-center font-mono mt-0.5">
                            ৳0 (৳{dailyRate}/d)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right font-mono"
                          value={loanInstallment}
                          onChange={(e) =>
                            handleAdjustmentChange(
                              employee.id,
                              'loanInstallment',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-slate-900">
                        <CurrencyDisplay amount={net} />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Payroll Preview & Confirmation
              </h3>
              <p className="text-sm text-slate-500">Period: {periodString}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Adjustments
              </Button>
              <Button
                onClick={handleGenerate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Confirm & Generate Drafts
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Total Gross Salary
              </span>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {formatCurrency(summaryTotals.gross)}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <span className="text-xs text-amber-700 uppercase tracking-wider font-semibold">
                Absence Deductions
              </span>
              <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                -{formatCurrency(summaryTotals.absenceDeductions)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <span className="text-xs text-red-600 uppercase tracking-wider font-semibold">
                Total Deductions
              </span>
              <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
                -{formatCurrency(summaryTotals.deductions)}
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-800 uppercase tracking-wider font-semibold">
                Total Net Payable
              </span>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatCurrency(summaryTotals.net)}
              </p>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Absence Ded.</TableHead>
                  <TableHead className="text-right">Total Deductions</TableHead>
                  <TableHead className="text-right font-bold">Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCalculations.map(
                  ({ employee, gross, deductions, absenceDeduction, net, unpaidLeaveDays }) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.fullName}</TableCell>
                      <TableCell className="text-slate-600">{employee.department}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <CurrencyDisplay amount={gross} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-amber-700 font-medium">
                        {absenceDeduction > 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            <span>-<CurrencyDisplay amount={absenceDeduction} /></span>
                            <span className="text-[11px] text-slate-400">({unpaidLeaveDays}d)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">৳0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">
                        -<CurrencyDisplay amount={deductions} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-emerald-700">
                        <CurrencyDisplay amount={net} />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
