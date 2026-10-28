import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, FileText, FileSpreadsheet, Search } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export';

export default function SalaryReportPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const { employees } = useEmployeeStore();
  const { departments } = useDepartmentStore();

  const [month, setMonth] = useState<string>('all');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const matchMonth = month === 'all' || p.month.toString() === month;
      const matchYear = p.year.toString() === year;
      const matchSearch =
        p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'all' || p.department === deptFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchMonth && matchYear && matchSearch && matchDept && matchStatus;
    });
  }, [payrolls, month, year, search, deptFilter, statusFilter]);

  const stats = useMemo(() => {
    return filteredPayrolls.reduce(
      (acc, curr) => ({
        gross: acc.gross + curr.grossSalary,
        deductions: acc.deductions + curr.totalDeductions,
        tax: acc.tax + curr.tax,
        net: acc.net + curr.netSalary,
      }),
      { gross: 0, deductions: 0, tax: 0, net: 0 }
    );
  }, [filteredPayrolls]);

  const chartData = useMemo(() => {
    const dataByMonth: Record<number, { monthNum: number; name: string; gross: number; net: number }> = {};
    filteredPayrolls.forEach((p) => {
      if (!dataByMonth[p.month]) {
        dataByMonth[p.month] = {
          monthNum: p.month,
          name: getMonthName(p.month).substring(0, 3),
          gross: 0,
          net: 0,
        };
      }
      dataByMonth[p.month].gross += p.grossSalary;
      dataByMonth[p.month].net += p.netSalary;
    });
    return Object.values(dataByMonth).sort((a, b) => a.monthNum - b.monthNum);
  }, [filteredPayrolls]);

  const tableData = useMemo(() => {
    return filteredPayrolls.map((p) => {
      return {
        id: p.id,
        employeeId: p.employeeId,
        name: p.employeeName,
        department: p.department,
        designation: p.designation,
        period: `${getMonthName(p.month)} ${p.year}`,
        basic: p.basicSalary,
        allowances: p.allowances,
        bonus: p.bonus || 0,
        overtime: p.overtime || 0,
        gross: p.grossSalary,
        deductions: p.totalDeductions,
        tax: p.tax,
        net: p.netSalary,
        status: p.status.toUpperCase(),
      };
    });
  }, [filteredPayrolls]);

  const columns = [
    { key: 'name', header: 'Employee' },
    { key: 'department', header: 'Department' },
    { key: 'period', header: 'Period' },
    { key: 'basic', header: 'Basic Salary', cell: (item: any) => formatCurrency(item.basic) },
    { key: 'gross', header: 'Gross Earnings', cell: (item: any) => formatCurrency(item.gross) },
    { key: 'deductions', header: 'Total Deductions', cell: (item: any) => formatCurrency(item.deductions) },
    {
      key: 'net',
      header: 'Net Salary',
      cell: (item: any) => (
        <span className="font-bold text-slate-900">{formatCurrency(item.net)}</span>
      ),
    },
    { key: 'status', header: 'Status' },
  ];

  const uniqueYears = Array.from(new Set(payrolls.map((p) => p.year))).sort((a, b) => b - a);
  if (!uniqueYears.includes(new Date().getFullYear())) {
    uniqueYears.push(new Date().getFullYear());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Salary & Compensation Report" description="Comprehensive organizational payroll expenditure report" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(tableData, 'salary_report')}>
            <FileText className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(tableData, 'salary_report')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('salary-report-card', 'salary_report')}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={month} onValueChange={setMonth}>
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

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {uniqueYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Gross Salary" value={formatCurrency(stats.gross)} icon={FileText} />
        <StatCard title="Total Deductions" value={formatCurrency(stats.deductions)} icon={FileText} />
        <StatCard title="Total Tax Withholding" value={formatCurrency(stats.tax)} icon={FileText} />
        <StatCard title="Total Net Payable" value={formatCurrency(stats.net)} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Expenditure Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val: number) => `৳${val / 1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="gross" fill="#6366f1" name="Gross Salary" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#10b981" name="Net Salary" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card id="salary-report-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detailed Salary Records ({tableData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={tableData} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
