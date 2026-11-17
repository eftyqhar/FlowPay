import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff, Sparkles, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const PRESET_ACCOUNTS = [
  {
    role: 'Super Admin (Owner)',
    name: 'Ifteqhar Ahmed',
    email: 'hrownok5@gmail.com',
    pass: 'admin123',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    role: 'Admin / Manager',
    name: 'Rabib',
    email: 'rabib@gmail.com',
    pass: 'admin123',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    role: 'Staff Employee',
    name: 'Rownok Hasan',
    email: 'hrownok39@gmail.com',
    pass: 'admin123',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, currentUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Reset password state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('hrownok5@gmail.com');
  const [resetNewPass, setResetNewPass] = useState('admin123');
  const [isResetting, setIsResetting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'hrownok5@gmail.com',
      password: 'admin123',
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

  const handleQuickLogin = async (email: string, pass: string) => {
    loginForm.setValue('email', email);
    loginForm.setValue('password', pass);
    await onLoginSubmit({ email, password: pass });
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetNewPass || resetNewPass.length < 6) {
      toast.error('Please enter a valid email and a password of at least 6 characters.');
      return;
    }
    setIsResetting(true);
    try {
      // Direct update via Supabase auth API or RPC
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resetEmail.trim(),
        password: 'admin123',
      });

      if (!error && data.user) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: resetNewPass,
        });
        if (updateErr) {
          toast.error(updateErr.message);
        } else {
          toast.success(`Password for ${resetEmail} successfully updated to: ${resetNewPass}`);
          loginForm.setValue('password', resetNewPass);
          setResetDialogOpen(false);
        }
      } else {
        toast.info(`Please sign in with: admin123, then change password in your Profile.`);
        setResetDialogOpen(false);
      }
    } catch (e: any) {
      toast.error(e.message || 'Reset failed.');
    } finally {
      setIsResetting(false);
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
            PostgreSQL Cloud Database & Authentication
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
                  <Label htmlFor="signin-email" className="text-xs font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="admin@yourcompany.com"
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-slate-700">Password</Label>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Need Help / Password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <KeyRound className="w-5 h-5 text-indigo-600" /> System Account Credentials
                          </DialogTitle>
                          <DialogDescription className="text-xs text-slate-500">
                            All pre-configured accounts use the default password below:
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2 text-xs">
                          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-indigo-950 space-y-1.5">
                            <div className="flex justify-between items-center font-mono">
                              <span>Default Password:</span>
                              <span className="font-bold bg-white px-2 py-0.5 rounded border border-indigo-300 text-indigo-700">
                                admin123
                              </span>
                            </div>
                            <p className="text-[11px] text-indigo-700">
                              You can use this password to sign in as Owner, Admin, or Employee.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            onClick={() => {
                              loginForm.setValue('password', 'admin123');
                              setResetDialogOpen(false);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Auto-Fill & Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                    'Sign In to FlowPay'
                  )}
                </Button>
              </form>

              {/* 1-Click Fast Demo Login Buttons */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Fast 1-Click Login Accounts:
                  </span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    PW: admin123
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleQuickLogin(acc.email, acc.pass)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition-all text-left text-xs group bg-white shadow-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-900 text-[11px]">
                          {acc.role} ({acc.name})
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">{acc.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${acc.badge}`}>
                        1-Click Login →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
                    placeholder="john@yourcompany.com"
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
                    <span className="font-semibold text-indigo-950">Default Role: Employee.</span> All new signups default to Employee. Higher administrative privileges can be granted by Super Admin from Settings.
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

          <p className="mt-5 text-center text-[11px] text-slate-400">
            Powered by Supabase Cloud Database & Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
