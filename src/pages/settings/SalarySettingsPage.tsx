import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuditStore } from '@/stores/auditStore';
import { useAuthStore } from '@/stores/authStore';
import { PaymentMethod } from '@/lib/types';

const salarySettingsSchema = z.object({
  defaultAllowancePercent: z.number().min(0).max(100),
  defaultTaxPercent: z.number().min(0).max(100),
  minimumWage: z.number().min(0),
  overtimeMultiplier: z.number().min(1),
  pfEmployeePercent: z.number().min(0).max(50),
  pfEmployerPercent: z.number().min(0).max(50),
  standardWorkingDays: z.number().min(15).max(31),
  taxFreeThreshold: z.number().min(0),
  autoDeductAbsenceDays: z.boolean(),
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
      defaultAllowancePercent: settings?.defaultAllowancePercent || 10,
      defaultTaxPercent: settings?.defaultTaxPercent || 5,
      minimumWage: settings?.minimumWage || 12500,
      overtimeMultiplier: settings?.overtimeMultiplier || 1.5,
      pfEmployeePercent: settings?.pfEmployeePercent || 8.33,
      pfEmployerPercent: settings?.pfEmployerPercent || 8.33,
      standardWorkingDays: settings?.standardWorkingDays || 22,
      taxFreeThreshold: settings?.taxFreeThreshold || 350000,
      autoDeductAbsenceDays: settings?.autoDeductAbsenceDays ?? true,
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
      defaultAllowancePercent: data.defaultAllowancePercent,
      defaultTaxPercent: data.defaultTaxPercent,
      minimumWage: data.minimumWage,
      overtimeMultiplier: data.overtimeMultiplier,
      pfEmployeePercent: data.pfEmployeePercent,
      pfEmployerPercent: data.pfEmployerPercent,
      standardWorkingDays: data.standardWorkingDays,
      taxFreeThreshold: data.taxFreeThreshold,
      autoDeductAbsenceDays: data.autoDeductAbsenceDays,
      paymentMethods,
    });

    addLog({
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Owner',
      action: 'Update Salary & Tax Rules',
      module: 'Settings',
      details: `Updated OT Multiplier (${data.overtimeMultiplier}x), PF Rate (${data.pfEmployeePercent}%), Min Wage (৳${data.minimumWage}), Auto-deduct Absence: ${data.autoDeductAbsenceDays ? 'Enabled' : 'Disabled'}`,
    });

    toast.success('Salary settings and calculation rules updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Salary & Compensation Rules"
        description="Configure overtime rate multipliers, statutory provident funds, and payment options"
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Standard Allowances & Taxes</CardTitle>
            <CardDescription>Default percentages assigned during employee onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultAllowancePercent">Default Allowance (% of Basic)</Label>
                <Input
                  id="defaultAllowancePercent"
                  type="number"
                  {...form.register('defaultAllowancePercent', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTaxPercent">Default Tax Withholding (%)</Label>
                <Input
                  id="defaultTaxPercent"
                  type="number"
                  {...form.register('defaultTaxPercent', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Statutory Rules & Overtime Calculation</CardTitle>
            <CardDescription>Legal compliance parameters under Bangladesh Labor Law / Company Policy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumWage">Minimum Basic Wage (BDT ৳)</Label>
                <Input
                  id="minimumWage"
                  type="number"
                  {...form.register('minimumWage', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeMultiplier">Overtime Hourly Rate Multiplier</Label>
                <Input
                  id="overtimeMultiplier"
                  type="number"
                  step="0.1"
                  {...form.register('overtimeMultiplier', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-400">Standard is 1.5x or 2.0x hourly basic rate.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="standardWorkingDays">Standard Monthly Working Days</Label>
                <Input
                  id="standardWorkingDays"
                  type="number"
                  {...form.register('standardWorkingDays', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-400">Used for per-day absence & overtime calculations (usually 22 or 26 days).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxFreeThreshold">Annual Tax-Free Threshold (BDT ৳)</Label>
                <Input
                  id="taxFreeThreshold"
                  type="number"
                  {...form.register('taxFreeThreshold', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-400">General individual slab threshold (e.g. ৳350,000).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Salary Absence Deduction Policy</CardTitle>
            <CardDescription>Configure default automatic deduction behavior for absent / unpaid days during monthly payroll generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
              <div className="space-y-1 max-w-xl">
                <Label className="text-sm font-semibold">Automatic Absent Day Deduction</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, FlowPay calculates daily rate = (Basic Salary / Standard Working Days) and automatically deducts recorded absent days and unpaid leaves from monthly payroll payouts. You can also override or fine-tune this per-run during payroll generation.
                </p>
              </div>
              <Switch
                checked={form.watch('autoDeductAbsenceDays')}
                onCheckedChange={(c) => form.setValue('autoDeductAbsenceDays', c)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Provident Fund (PF) Contributions</CardTitle>
            <CardDescription>Configured separately for employee deduction and employer matching contribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pfEmployeePercent">Employee Contribution (% of Basic)</Label>
                <Input
                  id="pfEmployeePercent"
                  type="number"
                  step="0.01"
                  {...form.register('pfEmployeePercent', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pfEmployerPercent">Employer Matching Contribution (% of Basic)</Label>
                <Input
                  id="pfEmployerPercent"
                  type="number"
                  step="0.01"
                  {...form.register('pfEmployerPercent', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Authorized Payment Channels</CardTitle>
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
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            Save All Calculation Rules
          </Button>
        </div>
      </form>
    </div>
  );
}
