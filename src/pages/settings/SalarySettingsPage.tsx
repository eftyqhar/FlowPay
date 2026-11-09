import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuditStore } from '@/stores/auditStore';
import { useAuthStore } from '@/stores/authStore';
import { PaymentMethod } from '@/lib/types';
import {
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Info,
  DollarSign,
  Gift,
  HandCoins,
  Banknote,
  Receipt,
} from 'lucide-react';

const salarySettingsSchema = z.object({
  // 1. Payroll schedule & Working hours
  payrollFrequency: z.enum(['monthly', 'bi-weekly', 'weekly']),
  salaryPaymentDate: z.number().min(1).max(31),
  dailyWorkingHours: z.number().min(4).max(16),
  weeklyHoliday: z.string().min(1),
  standardWorkingDays: z.number().min(15).max(31),

  // 2. Attendance & Leave Deductions
  autoDeductAbsenceDays: z.boolean(),
  halfDayDeduction: z.boolean(),
  unpaidLeaveDeduction: z.boolean(),
  paidLeaveDeduction: z.number().min(0).max(0),
  lateDeductionEnabled: z.boolean(),
  lateGraceMinutes: z.number().min(0).max(120),
  lateDaysThreshold: z.number().min(1).max(10),
  lateDeductionDays: z.number().min(0.5).max(5),

  // 3. Overtime Rules & Detection
  overtimeMultiplier: z.number().min(1),
  overtimeApprovalRequired: z.boolean(),

  // 4. Festival Bonus & Allowances
  festivalBonusEnabled: z.boolean(),
  festivalBonusPercent: z.number().min(0).max(200),
  festivalBonusFrequency: z.number().min(1).max(4),
  defaultAllowancePercent: z.number().min(0).max(100),

  // 5. Salary Advance & Loan Deduction
  salaryAdvanceEnabled: z.boolean(),
  loanDeductionEnabled: z.boolean(),

  // 6. Tax, Rounding & Statutory Rules (Default 0% Tax)
  defaultTaxPercent: z.number().min(0).max(100),
  salaryRoundingDecimals: z.number().min(0).max(4),
  minimumWage: z.number().min(0),
  taxFreeThreshold: z.number().min(0),
  pfEmployeePercent: z.number().min(0).max(50),
  pfEmployerPercent: z.number().min(0).max(50),

  // 7. Payment Channels
  paymentMethods: z.object({
    bankTransfer: z.boolean(),
    cash: z.boolean(),
    check: z.boolean(),
    mobileBanking: z.boolean(),
  }),
});

type SalarySettingsFormValues = z.infer<typeof salarySettingsSchema>;

export default function SalarySettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { addLog } = useAuditStore();
  const { currentUser } = useAuthStore();

  const form = useForm<SalarySettingsFormValues>({
    resolver: zodResolver(salarySettingsSchema),
    defaultValues: {
      payrollFrequency: (settings?.payrollFrequency as any) || 'monthly',
      salaryPaymentDate: settings?.salaryPaymentDate || 1,
      dailyWorkingHours: settings?.dailyWorkingHours || 8,
      weeklyHoliday: settings?.weeklyHoliday || 'friday',
      standardWorkingDays: settings?.standardWorkingDays || 22,

      autoDeductAbsenceDays: settings?.autoDeductAbsenceDays ?? true,
      halfDayDeduction: settings?.halfDayDeduction ?? true,
      unpaidLeaveDeduction: settings?.unpaidLeaveDeduction ?? true,
      paidLeaveDeduction: 0,
      lateDeductionEnabled: settings?.lateDeductionRules?.enabled ?? true,
      lateGraceMinutes: settings?.lateDeductionRules?.graceMinutes ?? 15,
      lateDaysThreshold: settings?.lateDeductionRules?.lateDaysThreshold ?? 3,
      lateDeductionDays: settings?.lateDeductionRules?.deductionDays ?? 1,

      overtimeMultiplier: settings?.overtimeMultiplier || 1.5,
      overtimeApprovalRequired: settings?.overtimeApprovalRequired ?? true,

      festivalBonusEnabled: settings?.festivalBonusConfig?.enabled ?? true,
      festivalBonusPercent: settings?.festivalBonusConfig?.value ?? 50,
      festivalBonusFrequency: settings?.festivalBonusConfig?.frequencyPerYear ?? 2,
      defaultAllowancePercent: settings?.defaultAllowancePercent || 15,

      salaryAdvanceEnabled: settings?.salaryAdvanceEnabled ?? true,
      loanDeductionEnabled: settings?.loanDeductionEnabled ?? true,

      defaultTaxPercent: settings?.defaultTaxPercent ?? 0, // Default 0%
      salaryRoundingDecimals: settings?.salaryRoundingDecimals ?? 2,
      minimumWage: settings?.minimumWage || 12500,
      taxFreeThreshold: settings?.taxFreeThreshold || 350000,
      pfEmployeePercent: settings?.pfEmployeePercent ?? 0,
      pfEmployerPercent: settings?.pfEmployerPercent ?? 0,

      paymentMethods: {
        bankTransfer: settings?.paymentMethods?.includes('bank_transfer') ?? true,
        cash: settings?.paymentMethods?.includes('cash') ?? true,
        check: settings?.paymentMethods?.includes('check') ?? true,
        mobileBanking: settings?.paymentMethods?.includes('mobile_banking') ?? true,
      },
    },
  });

  const onSubmit = (data: SalarySettingsFormValues) => {
    const paymentMethods: PaymentMethod[] = [];
    if (data.paymentMethods.bankTransfer) paymentMethods.push('bank_transfer');
    if (data.paymentMethods.cash) paymentMethods.push('cash');
    if (data.paymentMethods.check) paymentMethods.push('check');
    if (data.paymentMethods.mobileBanking) paymentMethods.push('mobile_banking');

    updateSettings({
      payrollFrequency: data.payrollFrequency,
      salaryPaymentDate: data.salaryPaymentDate,
      dailyWorkingHours: data.dailyWorkingHours,
      weeklyHoliday: data.weeklyHoliday,
      standardWorkingDays: data.standardWorkingDays,

      autoDeductAbsenceDays: data.autoDeductAbsenceDays,
      halfDayDeduction: data.halfDayDeduction,
      unpaidLeaveDeduction: data.unpaidLeaveDeduction,
      paidLeaveDeduction: 0,
      lateDeductionRules: {
        enabled: data.lateDeductionEnabled,
        graceMinutes: data.lateGraceMinutes,
        lateDaysThreshold: data.lateDaysThreshold,
        deductionDays: data.lateDeductionDays,
      },

      overtimeMultiplier: data.overtimeMultiplier,
      overtimeApprovalRequired: data.overtimeApprovalRequired,

      festivalBonusConfig: {
        enabled: data.festivalBonusEnabled,
        type: 'percentage',
        value: data.festivalBonusPercent,
        frequencyPerYear: data.festivalBonusFrequency,
      },
      defaultAllowancePercent: data.defaultAllowancePercent,

      salaryAdvanceEnabled: data.salaryAdvanceEnabled,
      loanDeductionEnabled: data.loanDeductionEnabled,

      defaultTaxPercent: data.defaultTaxPercent,
      salaryRoundingDecimals: data.salaryRoundingDecimals,
      minimumWage: data.minimumWage,
      taxFreeThreshold: data.taxFreeThreshold,
      pfEmployeePercent: data.pfEmployeePercent,
      pfEmployerPercent: data.pfEmployerPercent,
      paymentMethods,
    });

    addLog({
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Owner',
      action: 'Update Salary & Compensation Rules',
      module: 'Settings',
      details: `Updated rules: Frequency (${data.payrollFrequency}), Pay Day (${data.salaryPaymentDate}), Work Hours (${data.dailyWorkingHours}h), Tax (${data.defaultTaxPercent}%), OT Multiplier (${data.overtimeMultiplier}x), OT Approval (${data.overtimeApprovalRequired ? 'Required' : 'Auto'}), Rounding (${data.salaryRoundingDecimals} dec)`,
    });

    toast.success('Salary & Compensation policy rules saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader
        title="Salary & Compensation Rules"
        description="Configure payroll frequency, work hours, overtime detection, leave deductions, and compensation policies."
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Recommended Configuration Summary Banner */}
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-indigo-950">
                Recommended Policy Architecture & Overtime Detection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>How Overtime is Detected:</strong> The system compares daily attendance Check-in & Check-out times with your configured <strong>Daily Working Hours (default 8h)</strong>. Any work duration beyond 8 hours is automatically classified as Overtime hours. With <strong>Overtime Approval Required</strong>, overtime is verified before monthly payroll payout.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                <strong>Net Salary Protection:</strong> Default tax withholding is set to <strong>0%</strong> (income tax is calculated per personal exemption brackets). Net salary will not be artificially reduced below Basic Salary unless unapproved absent days or active loan installments occur.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Schedule & Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Payroll Schedule & Daily Working Hours
            </CardTitle>
            <CardDescription>
              Baseline parameters for payroll run frequency and daily shift durations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payrollFrequency">Payroll Frequency</Label>
                <Controller
                  name="payrollFrequency"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly (Recommended)</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly (Every 2 weeks)</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryPaymentDate">Salary Payment Date (Day of Month)</Label>
                <Input
                  id="salaryPaymentDate"
                  type="number"
                  min="1"
                  max="31"
                  {...form.register('salaryPaymentDate', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Scheduled disbursement day each month (e.g. 1st or 5th of the month).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyWorkingHours">Daily Working Hours (Overtime Baseline)</Label>
                <Input
                  id="dailyWorkingHours"
                  type="number"
                  min="4"
                  max="16"
                  step="0.5"
                  {...form.register('dailyWorkingHours', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Standard shift is <strong>8 hours</strong>. Excess attendance duration counts as Overtime.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyHoliday">Weekly Holiday</Label>
                <Controller
                  name="weeklyHoliday"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Weekly Off" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friday">Friday (Standard Bangladesh)</SelectItem>
                        <SelectItem value="friday_saturday">Friday & Saturday (2 Days Weekend)</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-[11px] text-slate-400">
                  Paid regular weekly rest day for employees.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="standardWorkingDays">Standard Monthly Working Days (Divisor)</Label>
                <Input
                  id="standardWorkingDays"
                  type="number"
                  min="15"
                  max="31"
                  {...form.register('standardWorkingDays', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Used as divisor to calculate per-day rate: <code>(Basic Salary / Standard Working Days)</code> (Usually 22 or 26 days).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Overtime Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Overtime Detection & Approval Policy
            </CardTitle>
            <CardDescription>
              Calculate overtime payments based on daily shift hours and manager sign-off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border rounded-lg p-4 bg-amber-50/40 border-amber-200">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-slate-800">Overtime Approval</Label>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                    Required
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  When enabled, auto-detected overtime hours from attendance check-in/out must be verified and approved by the administrator before inclusion in the final payroll disbursement.
                </p>
              </div>
              <Switch
                checked={form.watch('overtimeApprovalRequired')}
                onCheckedChange={(c) => form.setValue('overtimeApprovalRequired', c)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="overtimeMultiplier">Overtime Hourly Rate Multiplier</Label>
                <Input
                  id="overtimeMultiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  {...form.register('overtimeMultiplier', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Standard is <strong>1.5x</strong> (150%) or <strong>2.0x</strong> (200%) of hourly basic wage rate.
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border p-3.5 text-xs text-slate-600 flex flex-col justify-center">
                <span className="font-semibold text-slate-800 mb-1">Hourly Overtime Formula:</span>
                <code>Hourly Rate = Basic Salary / (Working Days × Daily Hours)</code>
                <code className="text-indigo-600 mt-1 font-semibold">
                  OT Pay = Overtime Hours × Hourly Rate × Multiplier ({form.watch('overtimeMultiplier')}x)
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Absence, Leave & Penalty Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" /> Attendance, Leave & Penalty Deductions
            </CardTitle>
            <CardDescription>
              Rules for unapproved absences, half-days, late arrivals, and leave types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Automatic Absent Day Deduction */}
            <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Automatic Absent Day Deduction</Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically deducts recorded absent days during payroll: <code>Absent Days × Daily Rate</code>.
                </p>
              </div>
              <Switch
                checked={form.watch('autoDeductAbsenceDays')}
                onCheckedChange={(c) => form.setValue('autoDeductAbsenceDays', c)}
              />
            </div>

            {/* Unpaid Leave Deduction */}
            <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Unpaid Leave Deduction</Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deducts salary for approved unpaid leaves (Leave Without Pay / LWP) at daily basic rate.
                </p>
              </div>
              <Switch
                checked={form.watch('unpaidLeaveDeduction')}
                onCheckedChange={(c) => form.setValue('unpaidLeaveDeduction', c)}
              />
            </div>

            {/* Half-day Deduction */}
            <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Half-day Deduction</Label>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                    0.5 Day Rate
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, an attendance record marked as Half-day incurs a 0.5 day basic salary deduction.
                </p>
              </div>
              <Switch
                checked={form.watch('halfDayDeduction')}
                onCheckedChange={(c) => form.setValue('halfDayDeduction', c)}
              />
            </div>

            {/* Paid Leave Deduction */}
            <div className="flex items-center justify-between border rounded-lg p-4 bg-emerald-50/30 border-emerald-200">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-emerald-900">Paid Leave Deduction</Label>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    0% (Free)
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800">
                  Casual Leave, Sick Leave, and Annual Leave carry exactly <strong>0 deduction</strong> and are fully paid.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md">
                ৳ 0.00 (Zero Deduction)
              </span>
            </div>

            {/* Late Attendance Deduction Rules */}
            <div className="border rounded-lg p-4 space-y-3 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Late Attendance Deduction</Label>
                  <p className="text-xs text-muted-foreground">
                    Configurable penalty for repetitive late arrivals beyond grace period.
                  </p>
                </div>
                <Switch
                  checked={form.watch('lateDeductionEnabled')}
                  onCheckedChange={(c) => form.setValue('lateDeductionEnabled', c)}
                />
              </div>

              {form.watch('lateDeductionEnabled') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grace Period (Minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      {...form.register('lateGraceMinutes', { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-400">e.g. 15 minutes grace</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Late Days Threshold</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...form.register('lateDaysThreshold', { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-400">e.g. 3 late arrivals</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Salary Deduction (Days)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5"
                      {...form.register('lateDeductionDays', { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-400">e.g. 1 day salary deduction</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Festival Bonus & Allowances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-600" /> Festival Bonus & Standard Allowances
            </CardTitle>
            <CardDescription>
              Corporate bonuses (Eid / Puja / Festivals) and standard monthly allowances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3 bg-purple-50/30 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-purple-950">Festival Bonus Policy</Label>
                  <p className="text-xs text-slate-600">
                    Configurable statutory festival bonus distributed to eligible employees.
                  </p>
                </div>
                <Switch
                  checked={form.watch('festivalBonusEnabled')}
                  onCheckedChange={(c) => form.setValue('festivalBonusEnabled', c)}
                />
              </div>

              {form.watch('festivalBonusEnabled') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bonus Value (% of Basic Salary)</Label>
                    <Input
                      type="number"
                      min="10"
                      max="200"
                      {...form.register('festivalBonusPercent', { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-400">Standard is 50% or 100% of basic salary.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frequency (Per Year)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      {...form.register('festivalBonusFrequency', { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-400">Typically 2 times per year (Eid-ul-Fitr / Eid-ul-Adha).</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="defaultAllowancePercent">Default Standard Allowance (% of Basic)</Label>
                <Input
                  id="defaultAllowancePercent"
                  type="number"
                  {...form.register('defaultAllowancePercent', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Assigned during employee onboarding (House rent, medical, conveyance).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Salary Advances & Loan Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-emerald-600" /> Salary Advance & Loan Deduction
            </CardTitle>
            <CardDescription>
              Employee self-service advances and automated EMI recovery through payroll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Salary Advance Feature</Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow employees to submit emergency advance salary applications via their self-service portal.
                </p>
              </div>
              <Switch
                checked={form.watch('salaryAdvanceEnabled')}
                onCheckedChange={(c) => form.setValue('salaryAdvanceEnabled', c)}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Loan Deduction (EMI)</Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically deduct approved monthly loan installments and salary advances from monthly payouts.
                </p>
              </div>
              <Switch
                checked={form.watch('loanDeductionEnabled')}
                onCheckedChange={(c) => form.setValue('loanDeductionEnabled', c)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. Tax, Rounding & Statutory Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" /> Tax Withholding & Salary Rounding
            </CardTitle>
            <CardDescription>
              Configure default tax withholding (default 0%) and currency rounding precision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="defaultTaxPercent">Default Tax Withholding (%)</Label>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px]">
                    Default: 0%
                  </Badge>
                </div>
                <Input
                  id="defaultTaxPercent"
                  type="number"
                  min="0"
                  max="100"
                  {...form.register('defaultTaxPercent', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">
                  Set to <strong>0%</strong> by default so basic salary is not unnecessarily reduced. Individual employees can be assigned specific slab rates in their profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryRoundingDecimals">Salary Rounding</Label>
                <Controller
                  name="salaryRoundingDecimals"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Rounding" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Decimal Places (e.g. ৳ 35,420.50)</SelectItem>
                        <SelectItem value="0">0 Decimal Places / Whole Integer (e.g. ৳ 35,421)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-[11px] text-slate-400">
                  Standard format is <strong>2 Decimal Places</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumWage">Minimum Basic Wage (BDT ৳)</Label>
                <Input
                  id="minimumWage"
                  type="number"
                  {...form.register('minimumWage', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">Legal minimum wage floor (e.g. ৳12,500).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxFreeThreshold">Annual Tax-Free Threshold (BDT ৳)</Label>
                <Input
                  id="taxFreeThreshold"
                  type="number"
                  {...form.register('taxFreeThreshold', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-400">Annual income tax exemption slab (৳350,000).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Authorized Payment Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Authorized Payment Channels
            </CardTitle>
            <CardDescription>Payment methods enabled for salary disbursement batches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Label className="text-sm font-medium">Bank Transfer (BEFTN / RTGS / NPSB)</Label>
                <p className="text-xs text-muted-foreground">Direct automated clearing house transfer to employee bank account</p>
              </div>
              <Switch
                checked={form.watch('paymentMethods.bankTransfer')}
                onCheckedChange={(c) => form.setValue('paymentMethods.bankTransfer', c)}
              />
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Label className="text-sm font-medium">Mobile Financial Services (bKash / Nagad / Rocket)</Label>
                <p className="text-xs text-muted-foreground">Instant corporate payroll wallet disbursement</p>
              </div>
              <Switch
                checked={form.watch('paymentMethods.mobileBanking')}
                onCheckedChange={(c) => form.setValue('paymentMethods.mobileBanking', c)}
              />
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <Label className="text-sm font-medium">Physical Cash</Label>
                <p className="text-xs text-muted-foreground">Company petty cash / cash in envelope</p>
              </div>
              <Switch
                checked={form.watch('paymentMethods.cash')}
                onCheckedChange={(c) => form.setValue('paymentMethods.cash', c)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Account Payee Cheque</Label>
                <p className="text-xs text-muted-foreground">Physical bank cheque issued to employee</p>
              </div>
              <Switch
                checked={form.watch('paymentMethods.check')}
                onCheckedChange={(c) => form.setValue('paymentMethods.check', c)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 shadow-md">
            Save All Calculation Rules
          </Button>
        </div>
      </form>
    </div>
  );
}
