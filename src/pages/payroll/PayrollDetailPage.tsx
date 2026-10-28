import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  FileText,
  Trash2,
  ShieldAlert,
  Building,
  User,
  Hash,
} from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { getMonthName, formatDate, formatCurrency } from '@/lib/utils';
import { PayslipPreviewDialog } from '@/components/payslip/PayslipPreviewDialog';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payrollRecords, approvePayroll, markAsPaid, deletePayrollRecord } = usePayrollStore();
  const { currentUser } = useAuthStore();
  const { employees } = useEmployeeStore();
  const { addLog } = useAuditStore();

  const [showPayslip, setShowPayslip] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState(`TXN-${Date.now().toString(36).toUpperCase()}`);

  const record = payrollRecords.find((p) => p.id === id);

  // Security: Check horizontal privilege escalation
  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  const canManagePayroll = ['owner', 'admin', 'accountant'].includes(userRole);
  if (isEmployee && record) {
    const myEmp = employees.find(
      (e) =>
        e.employeeId === currentUser?.employeeId ||
        e.email.toLowerCase() === currentUser?.email.toLowerCase()
    );
    if (!myEmp || record.employeeId !== myEmp.id) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Unauthorized Access</h2>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">
            You do not have permission to view payroll records of other employees.
          </p>
          <Button onClick={() => navigate('/payslips')}>Go to My Payslips</Button>
        </div>
      );
    }
  }

  if (!record) {
    return (
      <EmptyState
        title="Record Not Found"
        description="The payroll record you are looking for does not exist or has been removed."
        action={{ label: 'Back to Payroll', onClick: () => navigate('/payroll') }}
      />
    );
  }

  const handleApprove = () => {
    const approver = currentUser?.name || 'Admin';
    approvePayroll([record.id], approver);
    addLog({
      userId: currentUser?.id || 'USR-002',
      userName: approver,
      action: 'Approve Payroll',
      module: 'Payroll',
      details: `Approved payroll for ${record.employeeName} (${getMonthName(record.month)} ${record.year})`,
    });
    toast.success('Payroll record approved successfully');
  };

  const handleConfirmDisbursement = () => {
    const disburser = currentUser?.name || 'Accountant';
    markAsPaid([record.id], disburser, paymentMethod, transactionRef);
    addLog({
      userId: currentUser?.id || 'USR-003',
      userName: disburser,
      action: 'Disburse Salary',
      module: 'Payments',
      details: `Disbursed ${record.employeeName}'s salary via ${paymentMethod} (Ref: ${transactionRef})`,
    });
    setPayModalOpen(false);
    toast.success('Salary payment recorded and marked as paid');
  };

  const handleDeleteDraft = () => {
    if (window.confirm(`Are you sure you want to delete this draft payroll for ${record.employeeName}?`)) {
      deletePayrollRecord(record.id);
      addLog({
        userId: currentUser?.id || 'USR-001',
        userName: currentUser?.name || 'Admin',
        action: 'Delete Draft Payroll',
        module: 'Payroll',
        details: `Deleted draft payroll for ${record.employeeName} (${getMonthName(record.month)} ${record.year})`,
      });
      toast.success('Draft payroll record deleted');
      navigate('/payroll');
    }
  };

  const periodString = `${getMonthName(record.month)} ${record.year}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Payroll: ${record.employeeName}`}
          description={`Period: ${periodString} • Status: ${record.status.toUpperCase()}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Itemized Salary Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Earnings Table */}
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center justify-between">
                  <span>Gross Earnings</span>
                  <CurrencyDisplay amount={record.grossSalary} className="text-slate-900 font-bold" />
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead className="text-right">Amount (৳)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Basic Salary</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <CurrencyDisplay amount={record.basicSalary} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          Allowances (House Rent, Medical, Conveyance)
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <CurrencyDisplay amount={record.allowances} />
                        </TableCell>
                      </TableRow>
                      {record.bonus > 0 && (
                        <TableRow>
                          <TableCell>Performance & Festival Bonus</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 font-medium">
                            +<CurrencyDisplay amount={record.bonus} />
                          </TableCell>
                        </TableRow>
                      )}
                      {record.overtime > 0 && (
                        <TableRow>
                          <TableCell>Overtime Payment</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 font-medium">
                            +<CurrencyDisplay amount={record.overtime} />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Deductions Table */}
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center justify-between">
                  <span>Deductions & Withholdings</span>
                  <span className="text-red-600 font-bold">
                    -<CurrencyDisplay amount={record.totalDeductions} />
                  </span>
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Deduction Type</TableHead>
                        <TableHead className="text-right">Amount (৳)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Income Tax Withholding</TableCell>
                        <TableCell className="text-right tabular-nums text-red-600">
                          {record.tax > 0 ? (
                            <>-<CurrencyDisplay amount={record.tax} /></>
                          ) : (
                            '৳0.00'
                          )}
                        </TableCell>
                      </TableRow>
                      {(record.absentDays || record.unpaidLeaveDays) &&
                      ((record.absentDays || 0) > 0 || (record.unpaidLeaveDays || 0) > 0) ? (
                        <TableRow>
                          <TableCell>
                            Absent / Unpaid Leave ({record.absentDays ?? record.unpaidLeaveDays} days absence)
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            -<CurrencyDisplay amount={record.absenceDeduction ?? record.leaveDeduction ?? 0} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {record.loanDeduction && record.loanDeduction > 0 ? (
                        <TableRow>
                          <TableCell>Loan / Advance Installment</TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            -<CurrencyDisplay amount={record.loanDeduction} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {record.pfEmployeeDeduction && record.pfEmployeeDeduction > 0 ? (
                        <TableRow>
                          <TableCell>Provident Fund (Employee 8.33%)</TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            -<CurrencyDisplay amount={record.pfEmployeeDeduction} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {record.deductions > 0 && (
                        <TableRow>
                          <TableCell>Other Authorized Deductions</TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">
                            -<CurrencyDisplay amount={record.deductions} />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Net Salary Highlight */}
              <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div>
                  <span className="text-lg font-bold text-indigo-950 block">Net Payable Salary</span>
                  <span className="text-xs text-indigo-700">Final transfer amount after statutory deductions</span>
                </div>
                <CurrencyDisplay amount={record.netSalary} className="text-2xl font-bold text-indigo-700 tabular-nums" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900">{record.employeeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-slate-600">{record.employeeId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{record.department} • {record.designation}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Status & Workflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Current Status
                </span>
                <StatusBadge status={record.status} />
              </div>

              {record.approvedBy && (
                <div className="text-xs text-slate-600">
                  <p><strong>Approved by:</strong> {record.approvedBy}</p>
                  <p className="text-slate-400">{formatDate(record.approvedAt || '')}</p>
                </div>
              )}

              {record.status === 'paid' && (
                <div className="p-3 bg-slate-50 rounded-md border text-xs space-y-1">
                  <p><strong>Paid on:</strong> {formatDate(record.paidAt || record.paymentDate || '')}</p>
                  <p><strong>Method:</strong> {record.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                  {record.transactionRef && (
                    <p className="font-mono text-slate-500">Ref: {record.transactionRef}</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                {canManagePayroll && record.status === 'draft' && (
                  <>
                    <Button onClick={handleApprove} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve Payroll
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteDraft}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
                    </Button>
                  </>
                )}

                {canManagePayroll && record.status === 'approved' && (
                  <Button
                    onClick={() => setPayModalOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Disburse & Mark Paid
                  </Button>
                )}

                {record.status === 'paid' && (
                  <Button onClick={() => setShowPayslip(true)} className="w-full">
                    <FileText className="mr-2 h-4 w-4" /> View / Download Payslip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disburse Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Salary for {record.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              Net payable amount: <strong>{formatCurrency(record.netSalary)}</strong> for {periodString}.
            </p>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="bank_transfer">Bank Transfer (BEFTN/RTGS)</option>
                <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                <option value="cash">Cash Voucher</option>
                <option value="check">Bank Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="txRef">Transaction Reference / Voucher ID</Label>
              <Input
                id="txRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. TXN-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirmDisbursement}>
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPayslip && (
        <PayslipPreviewDialog
          payrollRecord={record}
          open={showPayslip}
          onOpenChange={setShowPayslip}
        />
      )}
    </div>
  );
}
