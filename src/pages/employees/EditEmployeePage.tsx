import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { calculateGross, calculateTotalDeductions, calculateNet } from '@/lib/salary';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Building, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['active', 'inactive']),
  paymentMethod: z.enum(['bank_transfer', 'mobile_banking', 'cash', 'check']).default('bank_transfer'),
  basicSalary: z.coerce.number().min(0, 'Must be positive'),
  allowances: z.coerce.number().min(0, 'Must be positive'),
  bonus: z.coerce.number().min(0, 'Must be positive'),
  overtime: z.coerce.number().min(0, 'Must be positive'),
  deductions: z.coerce.number().min(0, 'Must be positive'),
  tax: z.coerce.number().min(0, 'Must be positive'),
  bankInfo: z.object({
    bankName: z.string().optional().default(''),
    accountNumber: z.string().optional().default(''),
    routingNumber: z.string().optional().default(''),
    accountType: z.enum(['savings', 'checking']).default('savings'),
  }),
  mobileBankingInfo: z.object({
    provider: z.string().optional().default('bkash'),
    accountNumber: z.string().optional().default(''),
    accountType: z.enum(['personal', 'agent', 'merchant']).default('personal'),
  }),
});

type FormData = z.infer<typeof schema>;

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, updateEmployee } = useEmployeeStore();
  const { departments } = useDepartmentStore();

  const employee = employees.find((e) => e.id === id || e.employeeId === id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'active',
      paymentMethod: 'bank_transfer',
      basicSalary: 0,
      allowances: 0,
      bonus: 0,
      overtime: 0,
      deductions: 0,
      tax: 0,
      bankInfo: {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'savings',
      },
      mobileBankingInfo: {
        provider: 'bkash',
        accountNumber: '',
        accountType: 'personal',
      },
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone || '',
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        status: employee.status,
        paymentMethod: employee.paymentMethod || 'bank_transfer',
        basicSalary: employee.basicSalary,
        allowances: employee.allowances,
        bonus: employee.bonus,
        overtime: employee.overtime,
        deductions: employee.deductions,
        tax: employee.tax,
        bankInfo: employee.bankInfo || {
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountType: 'savings',
        },
        mobileBankingInfo: employee.mobileBankingInfo || {
          provider: 'bkash',
          accountNumber: '',
          accountType: 'personal',
        },
      });
    }
  }, [employee, reset]);

  const basic = watch('basicSalary') || 0;
  const allowances = watch('allowances') || 0;
  const bonus = watch('bonus') || 0;
  const overtime = watch('overtime') || 0;
  const deductions = watch('deductions') || 0;
  const tax = watch('tax') || 0;

  const currentGross = useMemo(
    () => calculateGross(basic, allowances, bonus, overtime),
    [basic, allowances, bonus, overtime]
  );
  const currentTotalDeductions = useMemo(
    () => calculateTotalDeductions(deductions, tax),
    [deductions, tax]
  );
  const currentNet = useMemo(
    () => calculateNet(currentGross, currentTotalDeductions),
    [currentGross, currentTotalDeductions]
  );

  const onSubmit = (data: FormData) => {
    if (!id) return;
    updateEmployee(id, {
      ...data,
      bankInfo: {
        bankName: data.bankInfo?.bankName || 'N/A',
        accountNumber: data.bankInfo?.accountNumber || 'N/A',
        routingNumber: data.bankInfo?.routingNumber || 'N/A',
        accountType: data.bankInfo?.accountType || 'savings',
      },
      mobileBankingInfo: data.mobileBankingInfo?.accountNumber
        ? {
            provider: data.mobileBankingInfo.provider || 'bkash',
            accountNumber: data.mobileBankingInfo.accountNumber,
            accountType: data.mobileBankingInfo.accountType || 'personal',
          }
        : undefined,
    });
    toast.success('Employee updated successfully');
    navigate(`/employees/${id}`);
  };

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border">
        <h2 className="text-xl font-bold text-slate-800">Employee Not Found</h2>
        <Button onClick={() => navigate('/employees')} className="mt-4">
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/employees/${id}`)}
          className="text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Profile
        </Button>
      </div>

      <PageHeader
        title={`Edit Employee: ${employee.fullName}`}
        description="Update personal, organizational, compensation, and payout account details."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input id="joiningDate" type="date" {...register('joiningDate')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={employee.employeeId} disabled className="bg-slate-50 font-mono font-bold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input id="designation" {...register('designation')} />
              {errors.designation && <p className="text-xs text-red-500">{errors.designation.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Salary Components</span>
              <div className="flex gap-4 text-sm font-normal">
                <span className="text-slate-500">
                  Gross: <span className="font-mono text-slate-900 font-medium">{formatCurrency(currentGross)}</span>
                </span>
                <span className="text-slate-500">
                  Net: <span className="font-mono text-emerald-600 font-bold">{formatCurrency(currentNet)}</span>
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basicSalary">Basic Salary (BDT ৳) *</Label>
              <Input id="basicSalary" type="number" min="0" {...register('basicSalary')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances</Label>
              <Input id="allowances" type="number" min="0" {...register('allowances')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus</Label>
              <Input id="bonus" type="number" min="0" {...register('bonus')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime">Overtime</Label>
              <Input id="overtime" type="number" min="0" {...register('overtime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions</Label>
              <Input id="deductions" type="number" min="0" {...register('deductions')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax Withholding</Label>
              <Input id="tax" type="number" min="0" {...register('tax')} />
            </div>
          </CardContent>
        </Card>

        {/* Payout & Banking Channels */}
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="bg-slate-50/60 pb-3 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Salary Payment & Disbursement Channels
                </CardTitle>
                <CardDescription>
                  Configure primary payment method, bank routing, and mobile banking accounts.
                </CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-[200px] bg-white font-medium">
                        <SelectValue placeholder="Primary Payout Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer (BEFTN/RTGS)</SelectItem>
                        <SelectItem value="mobile_banking">Mobile Banking (bKash/Nagad)</SelectItem>
                        <SelectItem value="cash">Cash Voucher</SelectItem>
                        <SelectItem value="check">Bank Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            {/* Bank Details Sub-Card */}
            <div className="p-4 border rounded-lg bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Bank Account Details (Traditional Banking)
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" {...register('bankInfo.bankName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" {...register('bankInfo.accountNumber')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Branch Routing Number</Label>
                  <Input id="routingNumber" {...register('bankInfo.routingNumber')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Controller
                    name="bankInfo.accountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Account Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">Savings Account</SelectItem>
                          <SelectItem value="checking">Current / Checking Account</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Banking / MFS Details Sub-Card */}
            <div className="p-4 border border-purple-100 rounded-lg bg-gradient-to-r from-purple-50/30 via-white to-pink-50/20 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Mobile Banking Account (MFS — bKash / Nagad / Rocket / Upay)
                  </h4>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded">
                  Instant MFS Payout
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mfsProvider">Mobile Banking Provider</Label>
                  <Controller
                    name="mobileBankingInfo.provider"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bkash">bKash (বিকাশ)</SelectItem>
                          <SelectItem value="nagad">Nagad (নগদ)</SelectItem>
                          <SelectItem value="rocket">Rocket (DBBL রকেট)</SelectItem>
                          <SelectItem value="upay">Upay (উপায়)</SelectItem>
                          <SelectItem value="other">Other Mobile Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfsAccountNumber">Mobile Account Number</Label>
                  <Input
                    id="mfsAccountNumber"
                    placeholder="e.g. 01712-345678"
                    {...register('mobileBankingInfo.accountNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mfsAccountType">Wallet Account Type</Label>
                  <Controller
                    name="mobileBankingInfo.accountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal Wallet</SelectItem>
                          <SelectItem value="agent">Agent / Cash Point</SelectItem>
                          <SelectItem value="merchant">Merchant Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={() => navigate(`/employees/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
