import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  PiggyBank,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Calendar,
  DollarSign,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useLoanStore } from '@/stores/loanStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { LOAN_STATUSES } from '@/lib/constants';
import { formatDate, formatCurrency, getMonthName } from '@/lib/utils';
import { LoanType, LoanRecord } from '@/lib/types';
import { toast } from 'sonner';

export default function LoansPage() {
  const { loans, applyLoan, approveLoan, rejectLoan, settleEarly } = useLoanStore();
  const { employees } = useEmployeeStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();
  const { addNotification } = useNotificationStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  const canApproveLoans = ['owner', 'admin', 'accountant'].includes(userRole);

  const myEmployee = useMemo(() => {
    return employees.find(
      (e) =>
        e.employeeId === currentUser?.employeeId ||
        e.email.toLowerCase() === currentUser?.email.toLowerCase() ||
        e.fullName.toLowerCase() === currentUser?.name?.toLowerCase()
    );
  }, [employees, currentUser]);

  // Loan Application State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('loan');
  const [amount, setAmount] = useState(30000);
  const [termMonths, setTermMonths] = useState(6);
  const [reason, setReason] = useState('');

  // Selected employee for application
  const selectedEmpId = isEmployee
    ? myEmployee?.id || employees[0]?.id || ''
    : employeeId || employees[0]?.id || '';

  const targetEmp = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || myEmployee || employees[0];
  }, [employees, selectedEmpId, myEmployee]);

  // Check existing loans for target employee
  const targetEmployeeActiveLoan = useMemo(() => {
    if (!targetEmp) return undefined;
    return loans.find(
      (l) => l.employeeId === targetEmp.id && l.status === 'active' && l.remainingBalance > 0
    );
  }, [loans, targetEmp]);

  const targetEmployeePendingLoan = useMemo(() => {
    if (!targetEmp) return undefined;
    return loans.find((l) => l.employeeId === targetEmp.id && l.status === 'pending');
  }, [loans, targetEmp]);

  // Initialize employee ID when dialog opens or employees load
  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(isEmployee && myEmployee ? myEmployee.id : employees[0].id);
    }
  }, [employees, isEmployee, myEmployee, employeeId]);

  // Repayment Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const monthlyInstallment = useMemo(() => {
    if (!amount || !termMonths || termMonths <= 0) return 0;
    return Math.round(amount / termMonths);
  }, [amount, termMonths]);

  // Quick preset reason helper
  const handleSelectPresetReason = (preset: string) => {
    setReason(preset);
  };

  // Facility Type Change Handler
  const handleTypeChange = (newType: LoanType) => {
    setLoanType(newType);
    if (newType === 'advance') {
      // Advance defaults: 1 to 3 months, smaller amount up to basic salary
      setTermMonths(1);
      if (targetEmp && targetEmp.basicSalary > 0) {
        setAmount(Math.min(amount, targetEmp.basicSalary));
      } else {
        setAmount(15000);
      }
    } else {
      // Loan defaults: 6 to 12 months
      setTermMonths(12);
      setAmount(50000);
    }
  };

  const visibleLoans = useMemo(() => {
    let list = loans;
    if (isEmployee) {
      const empId = myEmployee?.id;
      list = list.filter((l) => l.employeeId === empId);
    }
    if (statusFilter !== 'all') {
      list = list.filter((l) => l.status === statusFilter);
    }
    return list;
  }, [loans, isEmployee, myEmployee, statusFilter]);

  const adminKpis = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalRemaining = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const activeCount = loans.filter((l) => l.status === 'active').length;
    const pendingCount = loans.filter((l) => l.status === 'pending').length;
    return { totalPrincipal, totalRemaining, activeCount, pendingCount };
  }, [loans]);

  const employeeKpis = useMemo(() => {
    const empId = myEmployee?.id;
    const empLoans = loans.filter((l) => l.employeeId === empId);
    const active = empLoans.find((l) => l.status === 'active' && l.remainingBalance > 0);
    const pending = empLoans.filter((l) => l.status === 'pending').length;
    const totalBorrowed = empLoans.reduce((sum, l) => sum + l.principalAmount, 0);
    return {
      activeBalance: active?.remainingBalance || 0,
      monthlyDeduction: active?.monthlyInstallment || 0,
      pendingCount: pending,
      totalBorrowed,
      basicSalary: myEmployee?.basicSalary || 0,
    };
  }, [loans, myEmployee]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = targetEmp;
    if (!emp) {
      toast.error('Please select a valid employee');
      return;
    }
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a purpose or reason for the application');
      return;
    }

    if (loanType === 'advance' && termMonths > 3) {
      toast.error('Salary Advance cannot exceed 3 months term. For longer terms, please select Personal Loan.');
      return;
    }

    const newLoan = applyLoan({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      type: loanType,
      principalAmount: amount,
      monthlyInstallment,
      termMonths,
      reason: reason.trim(),
    });

    // Notify Admins, Owners, Accountants & HR
    addNotification({
      title: loanType === 'advance' ? 'New Salary Advance Application' : 'New Personal Loan Request',
      message: `${emp.fullName} (${emp.department}) applied for ${
        loanType === 'advance' ? 'Salary Advance' : 'Personal Loan'
      } of ৳${amount.toLocaleString()} for ${termMonths} month(s).`,
      type: 'info',
      link: '/loans',
      targetRoles: ['admin', 'owner', 'accountant', 'hr'],
    });

    // Audit Log
    addLog({
      userId: currentUser?.id || 'USR-005',
      userName: currentUser?.name || emp.fullName,
      action: 'Apply for Loan / Advance',
      module: 'Loans',
      details: `${emp.fullName} applied for ${loanType.toUpperCase()} of ৳${amount} (${termMonths} months @ ৳${monthlyInstallment}/mo). Reason: ${reason.trim()}`,
    });

    toast.success(
      `${loanType === 'advance' ? 'Salary Advance' : 'Loan'} application submitted successfully!`
    );
    setReason('');
    setApplyModalOpen(false);
  };

  const handleApprove = (loan: LoanRecord) => {
    const approverName = currentUser?.name || 'Finance Admin';
    approveLoan(loan.id, approverName);

    // Notify the specific employee
    addNotification({
      title: `${loan.type === 'advance' ? 'Salary Advance' : 'Loan'} Approved!`,
      message: `Your ${loan.type === 'advance' ? 'Salary Advance' : 'Personal Loan'} of ৳${loan.principalAmount.toLocaleString()} has been approved. Monthly payroll deduction: ৳${loan.monthlyInstallment.toLocaleString()}.`,
      type: 'success',
      link: '/loans',
      targetEmployeeId: loan.employeeId,
    });

    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: approverName,
      action: 'Approve Loan / Advance',
      module: 'Loans',
      details: `Approved ${loan.type} of ৳${loan.principalAmount} for ${loan.employeeName} (${loan.termMonths} mo @ ৳${loan.monthlyInstallment}/mo)`,
    });

    toast.success(`Loan approved for ${loan.employeeName}`);
  };

  const handleReject = (loan: LoanRecord) => {
    rejectLoan(loan.id);

    // Notify the specific employee
    addNotification({
      title: `${loan.type === 'advance' ? 'Salary Advance' : 'Loan'} Not Approved`,
      message: `Your request for ${loan.type === 'advance' ? 'Salary Advance' : 'Personal Loan'} of ৳${loan.principalAmount.toLocaleString()} was not approved at this time.`,
      type: 'warning',
      link: '/loans',
      targetEmployeeId: loan.employeeId,
    });

    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: currentUser?.name || 'Finance Admin',
      action: 'Reject Loan Application',
      module: 'Loans',
      details: `Rejected ${loan.type} application of ৳${loan.principalAmount} for ${loan.employeeName}`,
    });

    toast.info(`Application rejected for ${loan.employeeName}`);
  };

  const handleSettleEarly = (loan: LoanRecord) => {
    if (
      window.confirm(
        `Are you sure you want to mark this loan of ৳${loan.remainingBalance.toLocaleString()} for ${loan.employeeName} as fully settled?`
      )
    ) {
      settleEarly(loan.id);

      // Notify employee
      addNotification({
        title: 'Loan Settled in Full',
        message: `Your ${loan.type === 'advance' ? 'Salary Advance' : 'Loan'} balance of ৳${loan.remainingBalance.toLocaleString()} has been marked as fully settled and closed.`,
        type: 'success',
        link: '/loans',
        targetEmployeeId: loan.employeeId,
      });

      addLog({
        userId: currentUser?.id || 'USR-003',
        userName: currentUser?.name || 'Finance Admin',
        action: 'Early Loan Settlement',
        module: 'Loans',
        details: `Settled remaining balance of ৳${loan.remainingBalance} early for ${loan.employeeName}`,
      });

      toast.success('Loan marked as fully settled and closed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Loan & Salary Advance Management"
          description="Employee cash advance applications, approval workflows, and automated monthly payroll deductions"
        />
        <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Apply for Loan / Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
                Loan & Salary Advance Application
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4 pt-2">
              {/* Employee Selection for Admins / Card for Employees */}
              {canApproveLoans ? (
                <div className="space-y-2">
                  <Label htmlFor="empSelect">Select Employee *</Label>
                  <Select
                    value={selectedEmpId}
                    onValueChange={(val) => setEmployeeId(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee from Directory" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeId} — {emp.department} — Basic: {formatCurrency(emp.basicSalary)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{targetEmp?.fullName}</p>
                    <p className="text-slate-500">
                      ID: <span className="font-mono">{targetEmp?.employeeId}</span> • {targetEmp?.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Monthly Basic Salary</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatCurrency(targetEmp?.basicSalary || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Outstanding or Pending Alert */}
              {targetEmployeePendingLoan && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pending Application Awaiting Review:</strong>
                    <p className="mt-0.5">
                      {targetEmp?.fullName} already has a pending application for{' '}
                      <strong>{targetEmployeePendingLoan.type === 'advance' ? 'Salary Advance' : 'Personal Loan'}</strong> of{' '}
                      <strong>{formatCurrency(targetEmployeePendingLoan.principalAmount)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {targetEmployeeActiveLoan && (
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Existing Active Facility:</strong>
                    <p className="mt-0.5">
                      Current balance: <strong>{formatCurrency(targetEmployeeActiveLoan.remainingBalance)}</strong>{' '}
                      (Deduction: {formatCurrency(targetEmployeeActiveLoan.monthlyInstallment)} / mo).
                    </p>
                  </div>
                </div>
              )}

              {/* Facility Type Selector */}
              <div className="space-y-2">
                <Label>Facility Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('advance')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      loanType === 'advance'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      Salary Advance
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Short-term advance against upcoming salary (1-3 months).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('loan')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      loanType === 'loan'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <PiggyBank className="w-3.5 h-3.5 text-indigo-600" />
                      Company Personal Loan
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Medium/longer-term personal loan (3-36 months).
                    </p>
                  </button>
                </div>
              </div>

              {/* Amount & Term Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="amount">Requested Amount (৳) *</Label>
                    {loanType === 'advance' && targetEmp && (
                      <span className="text-[10px] text-slate-400">
                        Max recommended: {formatCurrency(targetEmp.basicSalary)}
                      </span>
                    )}
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    min="1000"
                    step="500"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="termMonths">
                      {loanType === 'advance' ? 'Repayment Term (1-3 Mo) *' : 'Repayment Term (Months) *'}
                    </Label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {termMonths} installment(s)
                    </span>
                  </div>
                  <Input
                    id="termMonths"
                    type="number"
                    min="1"
                    max={loanType === 'advance' ? '3' : '36'}
                    value={termMonths}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxLimit = loanType === 'advance' ? 3 : 36;
                      setTermMonths(Math.min(maxLimit, Math.max(1, val)));
                    }}
                    required
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Card */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Calculated Monthly Installment:</span>
                  <span className="font-bold text-sm text-indigo-700">
                    {formatCurrency(monthlyInstallment)} / month
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-indigo-100/60">
                  <span>Repayment Schedule:</span>
                  <span>
                    Deducted automatically via next {termMonths} monthly payroll cycles (0% interest).
                  </span>
                </div>
              </div>

              {/* Purpose / Reason with Quick Presets */}
              <div className="space-y-2">
                <Label htmlFor="reason">Purpose / Justification *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Medical Emergency',
                    'House Rent Advance',
                    'Family Support',
                    'Child Education Fee',
                    'Festival / Eid Expense',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPresetReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        reason === preset
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  id="reason"
                  placeholder="Specify purpose (e.g. Hospitalization, advance rent, tuition fee)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setApplyModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Submit Application
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards: Tailored for Admin vs Employee */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Active Loan Balance"
            value={formatCurrency(employeeKpis.activeBalance)}
            icon={PiggyBank}
          />
          <StatCard
            title="Monthly Payroll Deduction"
            value={`${formatCurrency(employeeKpis.monthlyDeduction)} / mo`}
            icon={CreditCard}
          />
          <StatCard
            title="Eligible Advance Limit"
            value={formatCurrency(employeeKpis.basicSalary)}
            icon={Wallet}
          />
          <StatCard
            title="Pending Applications"
            value={employeeKpis.pendingCount.toString()}
            icon={Clock}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Disbursed Facilities"
            value={formatCurrency(adminKpis.totalPrincipal)}
            icon={Wallet}
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(adminKpis.totalRemaining)}
            icon={PiggyBank}
          />
          <StatCard
            title="Active Repayments"
            value={adminKpis.activeCount.toString()}
            icon={CreditCard}
          />
          <StatCard
            title="Pending Applications"
            value={adminKpis.pendingCount.toString()}
            icon={Clock}
          />
        </div>
      )}

      {/* Loans Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">
              {isEmployee ? 'My Active Loans & Advances' : 'Organization Loan & Advance Ledger'}
            </CardTitle>
            <CardDescription>
              Showing {visibleLoans.length} total loan record(s)
            </CardDescription>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active (Repaying)</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="completed">Completed / Settled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Facility Type</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead className="text-right">Monthly Installment</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                  <TableHead>Repayment Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                      No loan or salary advance records match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleLoans.map((loan) => {
                    const repaidAmount = Math.max(0, loan.principalAmount - loan.remainingBalance);
                    const progressPercent = Math.min(
                      100,
                      Math.round((repaidAmount / (loan.principalAmount || 1)) * 100)
                    );

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{loan.employeeName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{loan.department}</span>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px]">{loan.reason}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              loan.type === 'advance'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {loan.type === 'advance' ? 'Salary Advance' : 'Personal Loan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-slate-900">
                          {formatCurrency(loan.principalAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {formatCurrency(loan.monthlyInstallment)} / mo
                          <div className="text-[10px] text-slate-400">
                            {loan.termMonths} month(s)
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-red-600">
                          {formatCurrency(loan.remainingBalance)}
                        </TableCell>
                        <TableCell>
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>{progressPercent}%</span>
                              <span>{loan.repayments.length}/{loan.termMonths} mo</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  loan.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-600'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              LOAN_STATUSES[loan.status]?.color || 'bg-slate-100'
                            }`}
                          >
                            {LOAN_STATUSES[loan.status]?.label || loan.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" /> History
                          </Button>

                          {canApproveLoans && loan.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                onClick={() => handleApprove(loan)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 h-8"
                                onClick={() => handleReject(loan)}
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}

                          {canApproveLoans && loan.status === 'active' && loan.remainingBalance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-indigo-600 hover:bg-indigo-50 h-8"
                              onClick={() => handleSettleEarly(loan)}
                            >
                              Settle Early
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Repayment History Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Repayment & Deduction Ledger</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-md border text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <strong className="text-slate-900">{selectedLoan.employeeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="capitalize font-medium text-slate-800">
                    {selectedLoan.type === 'advance' ? 'Salary Advance' : 'Personal Loan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal / Term:</span>
                  <span>
                    {formatCurrency(selectedLoan.principalAmount)} ({selectedLoan.termMonths} months @ {formatCurrency(selectedLoan.monthlyInstallment)}/mo)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(selectedLoan.remainingBalance)}
                  </span>
                </div>
                {selectedLoan.approvedBy && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Approved By:</span>
                    <span>
                      {selectedLoan.approvedBy}{' '}
                      {selectedLoan.approvedAt ? `on ${formatDate(selectedLoan.approvedAt)}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t text-xs text-slate-500">
                  <span>Purpose:</span>
                  <span className="italic">{selectedLoan.reason}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-2">
                  Deductions Logged via Monthly Payroll ({selectedLoan.repayments.length})
                </h4>
                <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Cycle</TableHead>
                        <TableHead>Deduction Date</TableHead>
                        <TableHead className="text-right">Amount Deducted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLoan.repayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-slate-400 text-xs">
                            No payroll installments recorded yet. Monthly payroll will automatically deduct{' '}
                            {formatCurrency(selectedLoan.monthlyInstallment)}.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedLoan.repayments.map((rep) => (
                          <TableRow key={rep.id}>
                            <TableCell className="font-medium text-xs">
                              {rep.month ? `${getMonthName(rep.month)} ${rep.year}` : 'Direct Settlement'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {formatDate(rep.date)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-emerald-700">
                              -{formatCurrency(rep.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
