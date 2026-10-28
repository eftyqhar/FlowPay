import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/stores/employeeStore';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Edit,
  UserX,
  UserCheck,
  FileText,
  ArrowLeft,
  Download,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  Briefcase,
  Smartphone,
  Building,
  CreditCard,
} from 'lucide-react';
import { getInitials, formatDate, getMonthName, formatCurrency } from '@/lib/utils';
import { calculateFullSalary } from '@/lib/salary';
import { PayslipPreviewDialog } from '@/components/payslip/PayslipPreviewDialog';
import { toast } from 'sonner';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { employees, updateEmployee, addDocument, deleteDocument } = useEmployeeStore();
  const { getPayrollByEmployee } = usePayrollStore();
  const { currentUser } = useAuthStore();

  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Contract');

  const employee = employees.find((e) => e.id === id || e.employeeId === id);

  // Authorization check for employees:
  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployeeRole = userRole === 'employee';
  const canManageEmployees = ['owner', 'admin', 'hr'].includes(userRole);
  if (isEmployeeRole && employee && currentUser) {
    // If the logged in user's employeeId doesn't match this employee, deny access
    const isOwnProfile =
      currentUser.employeeId === employee.employeeId ||
      currentUser.email?.toLowerCase() === employee.email?.toLowerCase();
    if (!isOwnProfile) {
      return (
        <div className="flex h-full min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-8 text-center bg-white rounded-lg border">
          <ShieldCheck className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Unauthorized Profile Access</h2>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            You only have authorization to view your own employee profile and payslips.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              const myProfile = employees.find(
                (e) =>
                  e.employeeId === currentUser?.employeeId ||
                  e.email?.toLowerCase() === currentUser?.email?.toLowerCase()
              );
              if (myProfile) navigate(`/employees/${myProfile.id}`);
              else navigate('/');
            }}
          >
            Go to My Profile
          </Button>
        </div>
      );
    }
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/employees')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
        </Button>
        <EmptyState
          title="Employee not found"
          description="The employee you are looking for does not exist or has been removed."
        />
      </div>
    );
  }

  const history = id
    ? getPayrollByEmployee(id).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];
  const payslips = history.filter((h) => h.status === 'paid');

  const handleToggleStatus = () => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    updateEmployee(employee.id, { status: newStatus });
    toast.success(`Employee marked as ${newStatus}`);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error('Document name is required');
      return;
    }
    addDocument(employee.id, {
      name: docName.trim(),
      type: docType,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
    });
    setDocName('');
    setDocModalOpen(false);
    toast.success('Document uploaded successfully');
  };

  const { grossSalary, totalDeductions, netSalary } = calculateFullSalary(employee);

  return (
    <div className="space-y-6">
      {!isEmployeeRole && (
        <Button variant="ghost" onClick={() => navigate('/employees')} className="-ml-4 text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
        </Button>
      )}

      {/* Header Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
                <AvatarImage src={employee.photo} />
                <AvatarFallback className="text-2xl font-bold bg-indigo-100 text-indigo-700">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-slate-600 font-medium">{employee.designation}</span>
                  <span className="text-slate-300">•</span>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {employee.department}
                  </Badge>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-sm">{employee.employeeId}</span>
                </div>
              </div>
            </div>
            {canManageEmployees && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => navigate(`/employees/edit/${employee.id}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </Button>
                <Button
                  variant={employee.status === 'active' ? 'destructive' : 'default'}
                  onClick={handleToggleStatus}
                >
                  {employee.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" /> Activate
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <StatusBadge status={employee.status} />
            <span className="text-sm text-slate-500">Joined on {formatDate(employee.joiningDate)}</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Salary History ({history.length})</TabsTrigger>
          <TabsTrigger value="payslips">Payslips ({payslips.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({(employee.documents || []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Email Address</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone Number</p>
                    <p className="font-medium">{employee.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Joining Date</p>
                    <p className="font-medium">{formatDate(employee.joiningDate)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-slate-500">Provident Fund (PF) Status</p>
                    <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                      {employee.pfEligible ?? true ? 'Eligible (Enrolled)' : 'Not Enrolled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leave Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg text-center border">
                      <p className="text-xs text-slate-500 font-medium">Casual Leave</p>
                      <p className="text-xl font-bold text-indigo-600 mt-1">
                        {employee.leaveBalance?.casual ?? 10} <span className="text-xs font-normal text-slate-400">days</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center border">
                      <p className="text-xs text-slate-500 font-medium">Sick Leave</p>
                      <p className="text-xl font-bold text-emerald-600 mt-1">
                        {employee.leaveBalance?.sick ?? 14} <span className="text-xs font-normal text-slate-400">days</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center border">
                      <p className="text-xs text-slate-500 font-medium">Annual Leave</p>
                      <p className="text-xl font-bold text-amber-600 mt-1">
                        {employee.leaveBalance?.annual ?? 15} <span className="text-xs font-normal text-slate-400">days</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout & Banking Accounts Card */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Payout & Disbursement Channels
                  </CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                    {employee.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
                  </span>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Traditional Bank */}
                  <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bank Account (BEFTN / RTGS)</span>
                    </div>
                    {employee.bankInfo ? (
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <p className="text-slate-400">Bank Name</p>
                          <p className="font-semibold text-slate-800">{employee.bankInfo.bankName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Account Number</p>
                          <p className="font-mono font-semibold text-slate-800">{employee.bankInfo.accountNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Routing Number</p>
                          <p className="font-mono text-slate-700">{employee.bankInfo.routingNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Type</p>
                          <p className="capitalize text-slate-700">{employee.bankInfo.accountType || 'Savings'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">No bank details registered.</p>
                    )}
                  </div>

                  {/* Mobile Banking / MFS */}
                  <div className="p-3 border border-purple-100 rounded-lg bg-purple-50/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-900">
                        <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                        <span>Mobile Banking (MFS)</span>
                      </div>
                      {employee.mobileBankingInfo?.accountNumber && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          {employee.mobileBankingInfo.provider}
                        </span>
                      )}
                    </div>
                    {employee.mobileBankingInfo?.accountNumber ? (
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <p className="text-slate-400">Provider</p>
                          <p className="font-semibold text-slate-800 capitalize">
                            {employee.mobileBankingInfo.provider}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Account Number</p>
                          <p className="font-mono font-bold text-purple-800">
                            {employee.mobileBankingInfo.accountNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Wallet Type</p>
                          <p className="capitalize text-slate-700">
                            {employee.mobileBankingInfo.accountType || 'Personal'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Status</p>
                          <p className="text-emerald-700 font-semibold">Verified Wallet</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">No mobile banking wallet added.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Current Salary Structure</span>
                  <CurrencyDisplay amount={netSalary} className="text-emerald-600 font-bold" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 bg-slate-50 p-2 rounded">
                      Standard Monthly Earnings
                    </h4>
                    <div className="flex justify-between px-2 text-sm">
                      <span className="text-slate-600">Basic Salary</span>
                      <CurrencyDisplay amount={employee.basicSalary} />
                    </div>
                    <div className="flex justify-between px-2 text-sm">
                      <span className="text-slate-600">House Rent & Medical Allowances</span>
                      <CurrencyDisplay amount={employee.allowances} />
                    </div>
                    <div className="flex justify-between px-2 pt-2 border-t font-semibold text-sm">
                      <span>Standard Gross</span>
                      <CurrencyDisplay amount={grossSalary} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <h4 className="text-sm font-semibold text-slate-900 bg-slate-50 p-2 rounded">
                      Standard Monthly Deductions
                    </h4>
                    <div className="flex justify-between px-2 text-sm">
                      <span className="text-slate-600">Income Tax Withholding</span>
                      <CurrencyDisplay amount={employee.tax} className="text-red-500" />
                    </div>
                    <div className="flex justify-between px-2 text-sm">
                      <span className="text-slate-600">Other Authorized Deductions</span>
                      <CurrencyDisplay amount={employee.deductions} className="text-red-500" />
                    </div>
                    <div className="flex justify-between px-2 pt-2 border-t font-semibold text-sm">
                      <span>Total Deductions</span>
                      <CurrencyDisplay amount={totalDeductions} className="text-red-500" />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg flex justify-between items-center border border-indigo-100">
                    <div>
                      <span className="font-bold text-indigo-950 block">Net Payable Salary</span>
                      <span className="text-xs text-indigo-700">Estimated standard monthly take-home</span>
                    </div>
                    <CurrencyDisplay amount={netSalary} className="text-xl font-bold text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salary & Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {getMonthName(record.month)} {record.year}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Gross: {formatCurrency(record.grossSalary)} • Deductions: -{formatCurrency(record.totalDeductions)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <CurrencyDisplay amount={record.netSalary} className="font-bold text-base" />
                          <div className="mt-0.5">
                            <StatusBadge status={record.status} />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayroll(record);
                            setShowPayslip(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No payroll records found"
                  description="No historical payroll runs found for this employee."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issued Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              {payslips.length > 0 ? (
                <div className="space-y-3">
                  {payslips.map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            Payslip — {getMonthName(record.month)} {record.year}
                          </div>
                          <div className="text-xs text-slate-500">
                            Disbursed via {record.paymentMethod?.replace('_', ' ') || 'Bank Transfer'} on{' '}
                            {formatDate(record.paymentDate || record.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CurrencyDisplay amount={record.netSalary} className="font-bold text-base" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayroll(record);
                            setShowPayslip(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1.5" /> View Payslip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No finalized payslips available"
                  description="Payslips are issued once monthly payroll has been finalized and marked as paid."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Employee Documents</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Contracts, NID scans, tax certificates, and NDA files</p>
              </div>
              {canManageEmployees && (
                <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-1.5" /> Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Employee Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDocument} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="docName">Document Title *</Label>
                        <Input
                          id="docName"
                          placeholder="e.g. Employment_Agreement.pdf"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docType">Document Category</Label>
                        <select
                          id="docType"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full border rounded-md p-2 text-sm bg-white"
                        >
                          <option value="Contract">Employment Contract</option>
                          <option value="Identity">National ID / Passport</option>
                          <option value="Tax Certificate">Tax / TIN Certificate</option>
                          <option value="Academic">Academic Certificate</option>
                          <option value="Other">Other Document</option>
                        </select>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit">Upload Document</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {(employee.documents || []).length > 0 ? (
                <div className="space-y-3">
                  {(employee.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center p-3.5 border rounded-lg bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {doc.type} • Uploaded {formatDate(doc.uploadDate)} • {doc.size || '1.5 MB'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info(`Simulated download for: ${doc.name}`)}
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        {canManageEmployees && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              deleteDocument(employee.id, doc.id);
                              toast.success('Document deleted');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No documents uploaded yet"
                  description="Upload identity records, signed agreements, or educational proofs here."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPayslip && selectedPayroll && (
        <PayslipPreviewDialog
          payrollRecord={selectedPayroll}
          open={showPayslip}
          onOpenChange={setShowPayslip}
        />
      )}
    </div>
  );
}
