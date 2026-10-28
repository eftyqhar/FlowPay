import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, Edit, UserX, UserCheck, Search } from 'lucide-react';
import { calculateFullSalary } from '@/lib/salary';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { Employee } from '@/lib/types';

export default function AllEmployeesPage() {
  const navigate = useNavigate();
  const { employees, updateEmployee } = useEmployeeStore();
  const { departments } = useDepartmentStore();
  const { currentUser } = useAuthStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const canManageEmployees = ['owner', 'admin', 'hr'].includes(userRole);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateEmployee(id, { status: newStatus as 'active' | 'inactive' });
    toast.success(`Employee marked as ${newStatus}`);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase() === searchTerm.toLowerCase() ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (emp: Employee) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={emp.photo} alt={emp.fullName} />
            <AvatarFallback>{getInitials(emp.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{emp.fullName}</span>
            <span className="text-xs text-slate-500">{emp.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      cell: (emp: Employee) => {
        return <span className="text-sm">{emp.department}</span>;
      }
    },
    {
      key: 'designation',
      header: 'Designation',
      cell: (emp: Employee) => <span className="text-sm">{emp.designation}</span>
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      cell: (emp: Employee) => <CurrencyDisplay amount={emp.basicSalary} className="text-sm justify-end" />
    },
    {
      key: 'netSalary',
      header: 'Net Salary',
      cell: (emp: Employee) => <CurrencyDisplay amount={calculateFullSalary(emp).netSalary} className="text-sm font-medium justify-end" />
    },
    {
      key: 'status',
      header: 'Status',
      cell: (emp: Employee) => <StatusBadge status={emp.status} />
    },
    {
      key: 'actions',
      header: '',
      cell: (emp: Employee) => (
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/employees/${emp.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </DropdownMenuItem>
              {canManageEmployees && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/employees/edit/${emp.id}`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(emp.id, emp.status)}>
                    {emp.status === 'active' ? (
                      <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                    ) : (
                      <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employees" 
        description="Manage your company's employee directory and details."
      >
        {canManageEmployees && (
          <Button onClick={() => navigate('/employees/add')} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
        />
      </div>
    </div>
  );
}
