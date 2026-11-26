import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your full name' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, currentUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        toast.success(`Welcome back! Signed in successfully.`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await signup(data.email, data.password, data.name);
      if (res.success) {
        toast.success(`Account created successfully! Welcome to FlowPay.`);
        navigate(from, { replace: true });
      } else {
        toast.error(res.message || 'Signup failed.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Signup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex flex-col items-center bg-indigo-900 px-8 py-7 text-center">
          <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FlowPay Enterprise</h1>
          <p className="mt-1 text-xs text-indigo-200 font-medium">
            Workforce & Payroll Management Platform
          </p>
        </div>

        {isAuthenticated && currentUser && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-6 flex items-center justify-between text-xs text-emerald-900">
            <span>
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-white text-emerald-700 hover:bg-emerald-100 border-emerald-300"
              onClick={() => navigate('/')}
            >
              Go to Dashboard →
            </Button>
          </div>
        )}

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="signin" className="flex items-center gap-1.5 text-xs font-semibold">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-1.5 text-xs font-semibold">
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs font-medium text-slate-700">Work Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@company.com"
                    {...loginForm.register('email')}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-xs font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                      disabled={isSubmitting}
                      className="pr-10 h-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-1 h-9 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Create Account Tab */}
            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs font-medium text-slate-700">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="e.g. John Doe"
                    {...signupForm.register('name')}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-xs text-red-600">
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-medium text-slate-700">Work Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@company.com"
                    {...signupForm.register('email')}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-red-600">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      {...signupForm.register('password')}
                      disabled={isSubmitting}
                      className="pr-10 h-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-red-600">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5 text-[11px] text-indigo-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold text-indigo-950">Default Role: Employee.</span> All new accounts are registered as Employee by default. Higher administrative roles can be assigned by the Super Admin.
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-1 h-9 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
