import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEmployeeStore } from '@/stores/employeeStore';
import { usePayrollStore } from '@/stores/payrollStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useLoanStore } from '@/stores/loanStore';
import { useAuthStore } from '@/stores/authStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Wallet,
  CheckCircle,
  Clock,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CalendarCheck,
  PiggyBank,
  AlertCircle,
  ArrowRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, getMonthName, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { employees } = useEmployeeStore();
  const { payrollRecords } = usePayrollStore();
  const { departments } = useDepartmentStore();
  const { attendanceRecords, leaveRequests } = useAttendanceStore();
  const { loans } = useLoanStore();
  const { currentUser } = useAuthStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  const isHR = userRole === 'hr';
  const isFinance = userRole === 'accountant';
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';
  const myEmployee = useMemo(() => {
    return employees.find(
      (e) =>
        e.employeeId === currentUser?.employeeId ||
        e.email.toLowerCase() === currentUser?.email.toLowerCase()
    );
  }, [employees, currentUser]);

  const latestPayroll = useMemo(() => {
    if (payrollRecords.length === 0) return null;
    return [...payrollRecords].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
  }, [payrollRecords]);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    latestPayroll ? latestPayroll.month : new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    latestPayroll ? latestPayroll.year : new Date().getFullYear()
  );

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees]
  );

  // Today attendance metrics
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;
  const onLeaveCount = todayRecords.filter((r) => r.status === 'on_leave').length;

  // Pending items queue
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');
  const pendingLoans = loans.filter((l) => l.status === 'pending');

  // Current month stats
  const currentMonthRecords = useMemo(
    () => payrollRecords.filter((r) => r.month === selectedMonth && r.year === selectedYear),
    [payrollRecords, selectedMonth, selectedYear]
  );

  const totalGross = useMemo(
    () => currentMonthRecords.reduce((sum, record) => sum + record.grossSalary, 0),
    [currentMonthRecords]
  );

  const totalPaid = useMemo(
    () =>
      currentMonthRecords
        .filter((r) => r.status === 'paid')
        .reduce((sum, record) => sum + record.netSalary, 0),
    [currentMonthRecords]
  );

  const totalPending = useMemo(
    () =>
      currentMonthRecords
        .filter((r) => r.status !== 'paid')
        .reduce((sum, record) => sum + record.netSalary, 0),
    [currentMonthRecords]
  );

  // Salary Trend (last 6 months)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const monthRecords = payrollRecords.filter(
        (r) => r.month === m && r.year === y && r.status === 'paid'
      );
      const gross = monthRecords.reduce((sum, r) => sum + r.grossSalary, 0);
      const net = monthRecords.reduce((sum, r) => sum + r.netSalary, 0);

      data.push({
        name: getMonthName(m).substring(0, 3),
        Gross: gross,
        Net: net,
      });
    }
    return data;
  }, [payrollRecords, selectedMonth, selectedYear]);

  // Department Distribution
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
  const departmentData = useMemo(() => {
    return departments
      .map((dept) => {
        const deptEmployees = employees.filter((e) => e.department === dept.name);
        const value = deptEmployees.reduce((sum, e) => sum + e.basicSalary, 0);
        return { name: dept.name, value };
      })
      .filter((d) => d.value > 0);
  }, [departments, employees]);

  // Recent Activity
  const recentActivity = useMemo(() => {
    return [...payrollRecords]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7);
  }, [payrollRecords]);

  // Employee-specific records
  const myPayslips = useMemo(() => {
    if (!myEmployee) return [];
    return payrollRecords
      .filter((r) => r.employeeId === myEmployee.id && r.status === 'paid')
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [payrollRecords, myEmployee]);

  const myActiveLoan = useMemo(() => {
    if (!myEmployee) return null;
    return loans.find((l) => l.employeeId === myEmployee.id && l.status === 'active');
  }, [loans, myEmployee]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // ===================== EMPLOYEE PORTAL VIEW =====================
  if (isEmployee && myEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {myEmployee.fullName}
            </h1>
            <p className="text-sm text-slate-500">
              {myEmployee.designation} • {myEmployee.department} (ID: {myEmployee.employeeId})
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/payslips')} className="bg-indigo-600 hover:bg-indigo-700">
              <FileText className="w-4 h-4 mr-2" /> View Payslips
            </Button>
            <Button variant="outline" onClick={() => navigate('/attendance')}>
              <CalendarCheck className="w-4 h-4 mr-2" /> My Attendance
            </Button>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Current Basic Salary"
            value={formatCurrency(myEmployee.basicSalary)}
            icon={Wallet}
          />
          <StatCard
            title="Total Monthly Allowances"
            value={formatCurrency(myEmployee.allowances)}
            icon={CheckCircle}
          />
          <StatCard
            title="Casual Leave Balance"
            value={`${myEmployee.leaveBalance?.casual ?? 10} days`}
            icon={CalendarCheck}
          />
          <StatCard
            title="Active Loan Balance"
            value={myActiveLoan ? formatCurrency(myActiveLoan.remainingBalance) : '৳0.00'}
            icon={PiggyBank}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Issued Payslips</CardTitle>
              <CardDescription>Your official monthly salary statements</CardDescription>
            </CardHeader>
            <CardContent>
              {myPayslips.length > 0 ? (
                <div className="space-y-3">
                  {myPayslips.slice(0, 5).map((pay) => (
                    <div
                      key={pay.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {getMonthName(pay.month)} {pay.year}
                        </p>
                        <p className="text-xs text-slate-400">
                          Disbursed on {formatDate(pay.paymentDate || pay.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-indigo-700">
                          {formatCurrency(pay.netSalary)}
                        </span>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/payroll/${pay.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  No payslips finalized for your account yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Employee Services</CardTitle>
              <CardDescription>Self-service applications and personal history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={() => navigate('/attendance')}
                className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Apply for Leave</p>
                    <p className="text-xs text-slate-500">Casual, sick, or annual leave request</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => navigate('/loans')}
                className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Salary Advance / Loan</p>
                    <p className="text-xs text-slate-500">Apply for emergency salary advance</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => navigate(`/employees/${myEmployee.id}`)}
                className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">My Employment Profile</p>
                    <p className="text-xs text-slate-500">Review bank details, documents & contract</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===================== MANAGEMENT & EXECUTIVE VIEW =====================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Executive Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time compensation analytics, active headcount, and payroll cycle status.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {getMonthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px] bg-white">
              <SelectValue placeholder="Year" />
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

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Headcount"
          value={activeEmployees.length.toString()}
          icon={Users}
        />
        <StatCard
          title="Total Monthly Payroll"
          value={formatCurrency(totalGross)}
          icon={Wallet}
        />
        <StatCard
          title="Salary Disbursed"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(totalPending)}
          icon={Clock}
        />
      </div>

      {/* Operational Highlights: Attendance & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Today's Attendance Snapshot</span>
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-800 rounded-md">
              <span className="text-xs font-semibold">Present & On Time</span>
              <span className="font-bold text-base">{presentCount}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-amber-50 text-amber-800 rounded-md">
              <span className="text-xs font-semibold">Late Arrivals</span>
              <span className="font-bold text-base">{lateCount}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-purple-50 text-purple-800 rounded-md">
              <span className="text-xs font-semibold">On Approved Leave</span>
              <span className="font-bold text-base">{onLeaveCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/attendance')}
            >
              Open Daily Attendance Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Actionable Approvals Queue */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>
                {isHR
                  ? 'Human Resources Worklist'
                  : isFinance
                  ? 'Finance & Payroll Worklist'
                  : 'Pending Administrative Approvals'}
              </span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* HR or Admin sees Leave Applications */}
              {(isHR || isAdminOrOwner) && (
                <div
                  onClick={() => navigate('/attendance')}
                  className="p-3 border rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Leave Applications</p>
                    <p className="text-xl font-bold text-amber-600 mt-1">
                      {pendingLeaves.length} <span className="text-xs font-normal text-slate-400">pending HR review</span>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs">Review Requests</Button>
                </div>
              )}

              {/* Finance or Admin sees Loan & Advance Requests */}
              {(isFinance || isAdminOrOwner) && (
                <div
                  onClick={() => navigate('/loans')}
                  className="p-3 border rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Loan & Advance Requests</p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      {pendingLoans.length} <span className="text-xs font-normal text-slate-400">pending Finance approval</span>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs">Review Requests</Button>
                </div>
              )}

              {/* For HR: Talent Acquisition Shortcut */}
              {isHR && (
                <div
                  onClick={() => navigate('/employees/add')}
                  className="p-3 border rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Employee Onboarding</p>
                    <p className="text-xs text-slate-500 mt-1">Add new staff to corporate directory</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">Add Employee</Button>
                </div>
              )}

              {/* For Finance: Run Payroll Shortcut */}
              {isFinance && (
                <div
                  onClick={() => navigate('/payroll/generate')}
                  className="p-3 border rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Payroll Engine</p>
                    <p className="text-xs text-slate-500 mt-1">Generate draft for current cycle</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">Generate Run</Button>
                </div>
              )}
            </div>

            {/* Bottom operational status card */}
            {isHR ? (
              <div className="p-3 bg-slate-50 rounded-md border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Department Organization & Headcount
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeEmployees.length} active staff distributed across {departments.length} departments
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => navigate('/reports/department')}
                >
                  Department Report <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-md border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {getMonthName(selectedMonth)} {selectedYear} Payroll Status
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentMonthRecords.length} records generated •{' '}
                    {currentMonthRecords.filter((r) => r.status === 'draft').length} in draft status
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                  onClick={() => navigate('/payroll')}
                >
                  Go to Payroll <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Salary Expenditure Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(value: number) => `৳${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '6px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Gross"
                    stroke="#818cf8"
                    fill="#c7d2fe"
                    fillOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="Net"
                    stroke="#4f46e5"
                    fill="#818cf8"
                    fillOpacity={0.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              Department Salary Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {departmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Activity */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Payroll Cycles & Disbursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((record, i) => (
                <div key={record.id}>
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{record.employeeName}</p>
                      <p className="text-xs text-slate-500">
                        {record.department} • {getMonthName(record.month)} {record.year} •{' '}
                        {formatDate(record.paidAt || record.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold tabular-nums font-mono">
                        {formatCurrency(record.netSalary)}
                      </span>
                      <StatusBadge status={record.status} />
                    </div>
                  </div>
                  {i < recentActivity.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">No recent activity found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
