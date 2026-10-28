import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
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
  ArrowRight,
  Eye,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import { useLoanStore } from '@/stores/loanStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { LOAN_STATUSES } from '@/lib/constants';
import { formatDate, formatCurrency, getMonthName } from '@/lib/utils';
import { LoanType, LoanRecord } from '@/lib/types';
import { toast } from 'sonner';

export default function LoansPage() {
  const { loans, applyLoan, approveLoan, rejectLoan, settleEarly } = useLoanStore();
  const { employees } = useEmployeeStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  const canApproveLoans = ['owner', 'admin', 'accountant'].includes(userRole);

  const myEmployee = useMemo(() => {
    return employees.find(
      (e) =>
        e.employeeId === currentUser?.employeeId ||
        e.email.toLowerCase() === currentUser?.email.toLowerCase()
    );
  }, [employees, currentUser]);

  // Loan Application State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(myEmployee?.id || '');
  const [loanType, setLoanType] = useState<LoanType>('loan');
  const [amount, setAmount] = useState(30000);
  const [termMonths, setTermMonths] = useState(6);
  const [reason, setReason] = useState('');

  // Repayment Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const monthlyInstallment = useMemo(() => {
    if (!amount || !termMonths || termMonths <= 0) return 0;
    return Math.round(amount / termMonths);
  }, [amount, termMonths]);

  const visibleLoans = useMemo(() => {
    let list = loans;
    if (isEmployee && myEmployee) {
      list = list.filter((l) => l.employeeId === myEmployee.id);
    }
    if (statusFilter !== 'all') {
      list = list.filter((l) => l.status === statusFilter);
    }
    return list;
  }, [loans, isEmployee, myEmployee, statusFilter]);

  const kpis = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalRemaining = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const activeCount = loans.filter((l) => l.status === 'active').length;
    const pendingCount = loans.filter((l) => l.status === 'pending').length;
    return { totalPrincipal, totalRemaining, activeCount, pendingCount };
  }, [loans]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === employeeId) || myEmployee;
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    applyLoan({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      type: loanType,
      principalAmount: amount,
      monthlyInstallment,
      termMonths,
      reason: reason.trim(),
    });

    addLog({
      userId: currentUser?.id || 'USR-005',
      userName: currentUser?.name || 'Employee',
      action: 'Apply for Loan / Advance',
      module: 'Loans',
      details: `${emp.fullName} applied for ${loanType.toUpperCase()} of ৳${amount} (${termMonths} months @ ৳${monthlyInstallment}/mo)`,
    });

    toast.success(`${loanType === 'advance' ? 'Salary Advance' : 'Loan'} application submitted`);
    setReason('');
    setApplyModalOpen(false);
  };

  const handleApprove = (loan: LoanRecord) => {
    approveLoan(loan.id, currentUser?.name || 'Finance Admin');
    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: currentUser?.name || 'Finance Admin',
      action: 'Approve Loan / Advance',
      module: 'Loans',
      details: `Approved ${loan.type} of ৳${loan.principalAmount} for ${loan.employeeName}`,
    });
    toast.success(`Loan approved for ${loan.employeeName}`);
  };

  const handleReject = (loan: LoanRecord) => {
    rejectLoan(loan.id);
    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: currentUser?.name || 'Finance Admin',
      action: 'Reject Loan Application',
      module: 'Loans',
      details: `Rejected ${loan.type} application for ${loan.employeeName}`,
    });
    toast.info(`Application rejected for ${loan.employeeName}`);
  };

  const handleSettleEarly = (loan: LoanRecord) => {
    if (window.confirm(`Are you sure you want to mark this loan of ৳${loan.remainingBalance} as fully settled?`)) {
      settleEarly(loan.id);
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
          description="Employee advance applications, approval workflows, and automated payroll deduction schedules"
        />
        <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Apply for Loan / Advance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Loan / Salary Advance Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4 pt-2">
              {canApproveLoans && (
                <div className="space-y-2">
                  <Label htmlFor="empSelect">Employee Directory *</Label>
                  <Select
                    value={employeeId || employees[0]?.id}
                    onValueChange={setEmployeeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.department} — Basic: {formatCurrency(emp.basicSalary)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="loanType">Facility Type</Label>
                <Select
                  value={loanType}
                  onValueChange={(v) => setLoanType(v as LoanType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Facility Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loan">Company Personal Loan (Longer Term)</SelectItem>
                    <SelectItem value="advance">Salary Advance (1-3 Months Repayment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Principal Amount (BDT ৳) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1000"
                    step="500"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termMonths">Repayment Term (Months) *</Label>
                  <Input
                    id="termMonths"
                    type="number"
                    min="1"
                    max="36"
                    value={termMonths}
                    onChange={(e) => setTermMonths(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-950 flex justify-between items-center">
                <span>Calculated Monthly Installment:</span>
                <span className="font-bold text-base text-indigo-700">
                  {formatCurrency(monthlyInstallment)} / month
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Purpose / Reason *</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Medical emergency, education fee, relocation"
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

      {/* KPI Cards */}
      {!isEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Disbursed Loans"
            value={formatCurrency(kpis.totalPrincipal)}
            icon={Wallet}
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(kpis.totalRemaining)}
            icon={PiggyBank}
          />
          <StatCard
            title="Active Repayments"
            value={kpis.activeCount.toString()}
            icon={CreditCard}
          />
          <StatCard
            title="Pending Applications"
            value={kpis.pendingCount.toString()}
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
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead className="text-right">Monthly Installment</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                      No loan or salary advance records match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{loan.employeeName}</div>
                        <div className="text-xs text-slate-500">{loan.department}</div>
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
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-red-600">
                        {formatCurrency(loan.remainingBalance)}
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
                      <TableCell className="text-right space-x-1">
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
                  ))
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
            <DialogTitle>Repayment & Deduction Schedule</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-md border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <strong className="text-slate-900">{selectedLoan.employeeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="capitalize">{selectedLoan.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal / Term:</span>
                  <span>{formatCurrency(selectedLoan.principalAmount)} ({selectedLoan.termMonths} months)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-red-600">{formatCurrency(selectedLoan.remainingBalance)}</span>
                </div>
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
                              {rep.month ? `${getMonthName(rep.month)} ${rep.year}` : 'Direct Payment'}
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
