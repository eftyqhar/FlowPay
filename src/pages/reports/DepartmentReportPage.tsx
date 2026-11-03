import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { DataTable } from '@/components/shared/DataTable';
import { exportToExcel } from '@/lib/export';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DepartmentReportPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const { employees } = useEmployeeStore();

  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const uniqueYears = useMemo(() => {
    const set = new Set(payrolls.map((p) => p.year));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [payrolls]);

  const deptData = useMemo(() => {
    const data: Record<string, any> = {};

    const filteredPayrolls = payrolls.filter(p => p.month.toString() === month && p.year.toString() === year);

    filteredPayrolls.forEach(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const deptName = p.department || emp?.department || 'General';
      if (!data[deptName]) {
        data[deptName] = {
          id: deptName,
          name: deptName,
          employeeCount: 0,
          totalBasic: 0,
          totalAllowances: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          maxSalary: 0,
          minSalary: Infinity,
          highestPaid: 'N/A',
          lowestPaid: 'N/A'
        };
      }
      const d = data[deptName];
      d.employeeCount += 1;
      d.totalBasic += p.basicSalary;
      d.totalAllowances += p.allowances;
      d.totalGross += p.grossSalary;
      d.totalDeductions += p.totalDeductions;
      d.totalNet += p.netSalary;
      
      const empName = p.employeeName || emp?.fullName || 'Employee';
      if (p.netSalary > d.maxSalary) {
        d.maxSalary = p.netSalary;
        d.highestPaid = empName;
      }
      if (p.netSalary < d.minSalary) {
        d.minSalary = p.netSalary;
        d.lowestPaid = empName;
      }
    });

    return Object.values(data).map(d => ({
      ...d,
      minSalary: d.minSalary === Infinity ? 0 : d.minSalary,
      avgSalary: d.employeeCount > 0 ? d.totalNet / d.employeeCount : 0
    })).filter(d => d.employeeCount > 0);
  }, [payrolls, employees, month, year]);

  const columns = [
    { header: 'Department', key: 'name' },
    { header: 'Employees', key: 'employeeCount' },
    { header: 'Total Basic', key: 'totalBasic', cell: (item: any) => formatCurrency(item.totalBasic) },
    { header: 'Total Allowances', key: 'totalAllowances', cell: (item: any) => formatCurrency(item.totalAllowances) },
    { header: 'Total Gross', key: 'totalGross', cell: (item: any) => formatCurrency(item.totalGross) },
    { header: 'Total Deductions', key: 'totalDeductions', cell: (item: any) => formatCurrency(item.totalDeductions) },
    { header: 'Total Net', key: 'totalNet', cell: (item: any) => formatCurrency(item.totalNet) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Department Report" description="Department-wise salary analysis" />
        <Button variant="outline" onClick={() => exportToExcel(deptData, 'dept-report')}><Download className="w-4 h-4 mr-2"/> Export</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              {Array.from({length: 12}).map((_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>{getMonthName(i+1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {uniqueYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Department Comparison</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={(value: number, name: string) => name === 'Employees' ? value : formatCurrency(value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalNet" fill="#8884d8" name="Total Salary" />
                <Bar yAxisId="left" dataKey="avgSalary" fill="#ffc658" name="Avg Salary" />
                <Bar yAxisId="right" dataKey="employeeCount" fill="#82ca9d" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Salary Distribution</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} dataKey="totalNet" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {deptData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptData.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{dept.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{dept.employeeCount} Employees</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Salary:</span> <span className="font-medium">{formatCurrency(dept.totalNet)}</span></div>
                <div className="flex justify-between"><span>Avg Salary:</span> <span className="font-medium">{formatCurrency(dept.avgSalary)}</span></div>
                <div className="flex justify-between"><span>Highest:</span> <span className="font-medium">{dept.highestPaid} ({formatCurrency(dept.maxSalary)})</span></div>
                <div className="flex justify-between"><span>Lowest:</span> <span className="font-medium">{dept.lowestPaid} ({formatCurrency(dept.minSalary)})</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Detailed Breakdown</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={deptData} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
