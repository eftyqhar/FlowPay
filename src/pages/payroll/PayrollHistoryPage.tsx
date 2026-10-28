import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Search } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAuthStore } from '@/stores/authStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { getMonthName, formatDate } from '@/lib/utils';
import { useExport } from '@/hooks/useExport';

export default function PayrollHistoryPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const { currentUser } = useAuthStore();
  const { employees } = useEmployeeStore();
  const { downloadExcel, downloadCSV } = useExport();

  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');

  const isEmployee = currentUser?.role === 'employee';
  const myEmployee = isEmployee
    ? employees.find(
        (e) =>
          e.employeeId === currentUser?.employeeId ||
          e.email.toLowerCase() === currentUser?.email.toLowerCase()
      )
    : null;

  const filteredPayrolls = useMemo(() => {
    return payrolls
      .filter((p) => {
        // Enforce employee sees only own records
        if (isEmployee) {
          if (myEmployee && p.employeeId !== myEmployee.id) return false;
        }

        const matchSearch =
          p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(search.toLowerCase());
        const matchMonth = filterMonth === 'all' || p.month.toString() === filterMonth;
        const matchYear = filterYear === 'all' || p.year.toString() === filterYear;
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchDept = filterDept === 'all' || p.department === filterDept;

        return matchSearch && matchMonth && matchYear && matchStatus && matchDept;
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return a.employeeName.localeCompare(b.employeeName);
      });
  }, [payrolls, search, filterMonth, filterYear, filterStatus, filterDept, isEmployee, myEmployee]);

  const uniqueDepartments = Array.from(new Set(payrolls.map((p) => p.department)));
  const uniqueYears = Array.from(new Set(payrolls.map((p) => p.year))).sort((a, b) => b - a);

  const handleExportCSV = () => {
    const exportData = filteredPayrolls.map((p) => ({
      'Employee ID': p.employeeId,
      'Employee Name': p.employeeName,
      Department: p.department,
      Designation: p.designation,
      Month: getMonthName(p.month),
      Year: p.year,
      'Basic Salary': p.basicSalary,
      Allowances: p.allowances,
      Bonus: p.bonus,
      Overtime: p.overtime,
      'Gross Salary': p.grossSalary,
      'Total Deductions': p.totalDeductions,
      'Net Salary': p.netSalary,
      Status: p.status,
      'Payment Method': p.paymentMethod || 'N/A',
      'Transaction Ref': p.transactionRef || 'N/A',
      'Disbursed On': p.paymentDate || 'N/A',
    }));
    downloadCSV(exportData as unknown as Record<string, unknown>[], 'flowpay_payroll_history');
  };

  const handleExportExcel = () => {
    const exportData = filteredPayrolls.map((p) => ({
      'Employee ID': p.employeeId,
      'Employee Name': p.employeeName,
      Department: p.department,
      Designation: p.designation,
      Month: getMonthName(p.month),
      Year: p.year,
      'Basic Salary': p.basicSalary,
      Allowances: p.allowances,
      Bonus: p.bonus,
      Overtime: p.overtime,
      'Gross Salary': p.grossSalary,
      'Total Deductions': p.totalDeductions,
      'Net Salary': p.netSalary,
      Status: p.status,
      'Payment Method': p.paymentMethod || 'N/A',
      'Transaction Ref': p.transactionRef || 'N/A',
      'Disbursed On': p.paymentDate || 'N/A',
    }));
    downloadExcel(exportData as unknown as Record<string, unknown>[], 'flowpay_payroll_history');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Payroll History"
          description="View and audit historical payroll cycles and disbursements"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {getMonthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {!isEmployee && (
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No payroll records match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{payroll.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">{payroll.employeeId}</div>
                    </TableCell>
                    <TableCell>{payroll.department}</TableCell>
                    <TableCell>
                      {getMonthName(payroll.month)} {payroll.year}
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/payroll/${payroll.id}`}>
                          <FileText className="h-4 w-4 mr-1 text-slate-500" /> Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
