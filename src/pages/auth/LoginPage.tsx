import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().min(1, { message: 'Please enter an email address or role' }),
  password: z.string().min(1, { message: 'Please enter a password' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Owner', email: 'owner@flowpay.com', label: 'Owner', desc: 'Full System Access' },
  { role: 'Admin', email: 'admin@flowpay.com', label: 'Admin', desc: 'Payroll & HR Operations' },
  { role: 'Accountant', email: 'accountant@flowpay.com', label: 'Accountant', desc: 'Disbursements & Tax' },
  { role: 'HR', email: 'hr@flowpay.com', label: 'HR Manager', desc: 'Employees & Leaves' },
  { role: 'Employee', email: 'employee@flowpay.com', label: 'Employee', desc: 'Self-Service & Payslips' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: 'password123',
    },
  });

  const performLogin = (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const ok = login(email, pass);
      if (ok) {
        toast.success(`Signed in successfully as ${email}`);
        navigate(from, { replace: true });
      } else {
        toast.error('Invalid credentials. Select a 1-click demo account or use password123.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    performLogin(data.email, data.password);
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password123', { shouldValidate: true });
    performLogin(email, 'password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex flex-col items-center bg-indigo-900 px-8 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FlowPay Enterprise</h1>
          <p className="mt-1 text-xs text-indigo-200 font-medium">
            Production Salary, Tax & Payroll Management Platform
          </p>
        </div>

        {isAuthenticated && currentUser && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 px-8 flex items-center justify-between text-xs text-indigo-900">
            <span>
              Currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-white text-indigo-700 hover:bg-indigo-100"
              onClick={() => navigate('/')}
            >
              Continue to Dashboard →
            </Button>
          </div>
        )}

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email Address or Role Name
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="e.g. admin@flowpay.com, owner, hr, accountant, employee"
                {...register('email')}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <span className="text-[11px] text-slate-400">Default: password123</span>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                'Sign In to FlowPay'
              )}
            </Button>
          </form>

          {/* Demo Accounts Section */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                1-Click Instant Role Logins
              </h3>
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  disabled={isLoading}
                  className="flex flex-col items-start p-2.5 rounded-md border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left shadow-2xs group"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                    {account.label}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {account.desc}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
