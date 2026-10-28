import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, FileText, CheckCircle, CreditCard, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { getMonthName, getMonthYear, formatCurrency } from '@/lib/utils';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

export default function CurrentPayrollPage() {
  const navigate = useNavigate();
  const { payrollRecords, getPayrollByMonth, approvePayroll, markAsPaid } = usePayrollStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const canManagePayroll = ['owner', 'admin', 'accountant'].includes(userRole);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Find latest month with payroll records or fallback to current
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

  // Payment Modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [pendingPayIds, setPendingPayIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');

  const periodString = getMonthYear(selectedMonth, selectedYear);
  const payrolls = getPayrollByMonth(selectedMonth, selectedYear) || [];

  const filteredPayrolls = useMemo(() => {
    if (activeTab === 'all') return payrolls;
    return payrolls.filter((p) => p.status === activeTab);
  }, [payrolls, activeTab]);

  const stats = useMemo(() => {
    return {
      totalAmount: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      draftCount: payrolls.filter((p) => p.status === 'draft').length,
      approvedCount: payrolls.filter((p) => p.status === 'approved').length,
      paidCount: payrolls.filter((p) => p.status === 'paid').length,
    };
  }, [payrolls]);

  if (!canManagePayroll) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Payroll Processing Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">
          Company payroll processing and salary disbursements are restricted to Finance & Administration. You can view your individual payslips under Payslips.
        </p>
        <Button onClick={() => navigate('/payslips')}>
          Go to My Payslips
        </Button>
      </div>
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPayrolls.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkApprove = () => {
    const draftIds = selectedIds.filter(
      (id) => payrolls.find((p) => p.id === id)?.status === 'draft'
    );
    if (draftIds.length === 0) {
      toast.info('No draft records selected for approval');
      return;
    }

    const approverName = currentUser?.name || 'Admin';
    approvePayroll(draftIds, approverName);
    addLog({
      userId: currentUser?.id || 'USR-001',
      userName: approverName,
      action: 'Batch Payroll Approval',
      module: 'Payroll',
      details: `Approved ${draftIds.length} payroll records for ${periodString}`,
    });
    toast.success(`Approved ${draftIds.length} payroll records`);
    setSelectedIds([]);
  };

  const handleOpenBulkPayModal = () => {
    const approvedIds = selectedIds.filter(
      (id) => payrolls.find((p) => p.id === id)?.status === 'approved'
    );
    if (approvedIds.length === 0) {
      toast.info('Only approved records can be marked as paid');
      return;
    }
    setPendingPayIds(approvedIds);
    setTransactionRef(`TXN-${Date.now().toString(36).toUpperCase()}`);
    setPayModalOpen(true);
  };

  const handleSinglePayModal = (id: string) => {
    setPendingPayIds([id]);
    setTransactionRef(`TXN-${Date.now().toString(36).toUpperCase()}`);
    setPayModalOpen(true);
  };

  const handleConfirmDisbursement = () => {
    if (pendingPayIds.length === 0) return;
    const paidByName = currentUser?.name || 'Accountant';
    markAsPaid(pendingPayIds, paidByName, paymentMethod, transactionRef);
    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: paidByName,
      action: 'Disburse Salary',
      module: 'Payroll',
      details: `Disbursed ${pendingPayIds.length} salaries via ${paymentMethod} (Ref: ${transactionRef})`,
    });
    toast.success(`Disbursed salary for ${pendingPayIds.length} employee(s)`);
    setPayModalOpen(false);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <PageHeader title="Payroll Processing" description={`Current Period: ${periodString}`} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
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
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => navigate('/payroll/generate')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Generate Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Payable"
          value={formatCurrency(stats.totalAmount)}
          icon={CreditCard}
        />
        <StatCard
          title="Draft Records"
          value={stats.draftCount.toString()}
          icon={FileText}
        />
        <StatCard
          title="Approved (Pending Payout)"
          value={stats.approvedCount.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="Disbursed & Paid"
          value={stats.paidCount.toString()}
          icon={CheckCircle}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-[400px]">
            <TabsList>
              <TabsTrigger value="all">All ({payrolls.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({stats.draftCount})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approvedCount})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({stats.paidCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleBulkApprove}>
                  Approve Selected ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleOpenBulkPayModal}
                >
                  Disburse Selected
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      filteredPayrolls.length > 0 &&
                      selectedIds.length === filteredPayrolls.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                    <p className="font-medium text-slate-700 mb-1">
                      No payroll records found for {periodString}
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      Click the button below to compute and generate salary for eligible employees.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/payroll/generate')}
                    >
                      Generate for {periodString} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(payroll.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(payroll.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{payroll.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">{payroll.designation}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{payroll.department}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <CurrencyDisplay amount={payroll.grossSalary} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">
                      -<CurrencyDisplay amount={payroll.totalDeductions} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-slate-900">
                      <CurrencyDisplay amount={payroll.netSalary} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payroll.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/payroll/${payroll.id}`}>
                              <FileText className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          {payroll.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => {
                                approvePayroll([payroll.id], currentUser?.name || 'Admin');
                                toast.success(`Approved payroll for ${payroll.employeeName}`);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-600" /> Approve
                            </DropdownMenuItem>
                          )}
                          {payroll.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleSinglePayModal(payroll.id)}>
                              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" /> Disburse & Mark Paid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Disburse Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Salary Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              Confirm disbursement for <strong>{pendingPayIds.length}</strong> payroll record(s) totaling{' '}
              <strong>
                {formatCurrency(
                  payrolls
                    .filter((p) => pendingPayIds.includes(p.id))
                    .reduce((sum, p) => sum + p.netSalary, 0)
                )}
              </strong>.
            </p>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="bank_transfer">Bank Transfer (BEFTN/RTGS)</option>
                <option value="mobile_banking">Mobile Banking (bKash / Nagad)</option>
                <option value="cash">Company Cash</option>
                <option value="check">Bank Cheque</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txRef">Transaction Reference / Voucher ID</Label>
              <Input
                id="txRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. TXN-9482918"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleConfirmDisbursement}
            >
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
