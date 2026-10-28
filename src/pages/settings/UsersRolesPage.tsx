import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuditStore } from '@/stores/auditStore';
import { formatDate, generateId } from '@/lib/utils';
import { UserPlus, Trash2, Power, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, UserRole } from '@/lib/types';
import { toast } from 'sonner';

export default function UsersRolesPage() {
  const { users, currentUser, addUser, toggleUserStatus, deleteUser } = useAuthStore();
  const { employees } = useEmployeeStore();
  const { addLog } = useAuditStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [linkedEmployeeId, setLinkedEmployeeId] = useState('');

  const handleToggleStatus = (id: string, userName: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    toggleUserStatus(id);
    addLog({
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Admin',
      action: 'Toggle User Status',
      module: 'Security',
      details: `Toggled active state for user: ${userName}`,
    });
    toast.success('User status updated');
  };

  const handleDelete = (id: string, userName: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${userName}?`)) {
      deleteUser(id);
      addLog({
        userId: currentUser?.id || 'USR-001',
        userName: currentUser?.name || 'Admin',
        action: 'Delete User',
        module: 'Security',
        details: `Deleted user: ${userName} (ID: ${id})`,
      });
      toast.success('User removed successfully');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('All fields are required');
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.error('A user with this email already exists');
      return;
    }

    const newUser: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      employeeId: linkedEmployeeId || undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    addUser(newUser, password.trim());
    addLog({
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Admin',
      action: 'Create System User',
      module: 'Security',
      details: `Created new user ${newUser.name} with role ${role.toUpperCase()}`,
    });

    toast.success(`User ${newUser.name} created successfully`);
    setName('');
    setEmail('');
    setPassword('');
    setLinkedEmployeeId('');
    setIsAddOpen(false);
  };

  const columns = [
    {
      header: 'User Name',
      key: 'name',
      cell: (u: User) => (
        <div className="flex items-center gap-2.5">
          <img
            src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
            alt={u.name}
            className="w-8 h-8 rounded-full border"
          />
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{u.name}</p>
            {u.id === currentUser?.id && (
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">
                (You)
              </span>
            )}
          </div>
        </div>
      ),
    },
    { header: 'Email Address', key: 'email' },
    {
      header: 'Assigned Role',
      key: 'role',
      cell: (item: User) => (
        <Badge
          variant="outline"
          className={
            item.role === 'owner'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : item.role === 'admin'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : item.role === 'accountant'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : item.role === 'hr'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }
        >
          {item.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      cell: (item: User) => (
        <Badge
          variant={item.isActive ? 'default' : 'secondary'}
          className={item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Linked Employee',
      key: 'employeeId',
      cell: (item: User) => (
        <span className="font-mono text-xs text-slate-500">
          {item.employeeId || 'N/A (Global)'}
        </span>
      ),
    },
    {
      header: 'Created On',
      key: 'createdAt',
      cell: (item: User) => formatDate(item.createdAt),
    },
    {
      header: 'Actions',
      key: 'actions',
      cell: (item: User) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            disabled={item.id === currentUser?.id}
            onClick={() => handleToggleStatus(item.id, item.name)}
            title="Toggle Status"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {item.id !== currentUser?.id && item.role !== 'owner' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDelete(item.id, item.name)}
              title="Delete User"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="User Accounts & Role Permissions"
          description="Manage authenticated users, credentials, role assignments, and access policies"
        />
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="w-4 h-4 mr-2" /> Add System User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New FlowPay User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. jdoe@flowpay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">System Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner (Full System Access)</SelectItem>
                    <SelectItem value="admin">Admin (Payroll, HR & Approvals)</SelectItem>
                    <SelectItem value="accountant">Accountant (Payments & Reporting)</SelectItem>
                    <SelectItem value="hr">HR (Employee Directory & Attendance)</SelectItem>
                    <SelectItem value="employee">Employee (Self-Service Profile & Payslips)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'employee' && (
                <div className="space-y-2">
                  <Label htmlFor="linkedEmployee">Link to Employee Record</Label>
                  <Select value={linkedEmployeeId} onValueChange={setLinkedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee directory record" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.employeeId}>
                          {emp.fullName} ({emp.employeeId} - {emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    Links this login account to view their own salary history & payslips.
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Create User Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Active System Users ({users.length})
          </CardTitle>
          <CardDescription>
            All registered platform users with active session access and assigned roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable data={users} columns={columns} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Role & Permission Boundaries
          </CardTitle>
          <CardDescription>Detailed overview of module permissions enforced at route and action level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b">
                <tr>
                  <th className="p-3 border-r font-semibold">Module</th>
                  <th className="p-3 border-r font-semibold">Owner</th>
                  <th className="p-3 border-r font-semibold">Admin</th>
                  <th className="p-3 border-r font-semibold">Accountant</th>
                  <th className="p-3 border-r font-semibold">HR Manager</th>
                  <th className="p-3 font-semibold">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Dashboard Analytics</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Executive View</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Executive View</td>
                  <td className="p-3 border-r text-indigo-700 font-semibold">Financial & Payout KPIs</td>
                  <td className="p-3 border-r text-purple-700 font-semibold">Headcount & Attendance</td>
                  <td className="p-3 text-slate-500">Self-Service Summary</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Employee Directory & Profiles</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-slate-600 font-medium">Read-Only (Bank & Salary)</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Hire, Edit & Docs</td>
                  <td className="p-3 text-slate-500">Own Profile Only</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Payroll Processing & Disbursement</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Generate & Disburse</td>
                  <td className="p-3 border-r text-red-500 font-semibold">Restricted (No Access)</td>
                  <td className="p-3 text-slate-500">Own Payslips Only</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Attendance & Leave Approvals</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-slate-600 font-medium">Read-Only Ledger</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Approve & Correct</td>
                  <td className="p-3 text-slate-700">Check-in & Apply</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Loans & Advances Approval</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Approve & Settle</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Approve & Settle</td>
                  <td className="p-3 border-r text-slate-600 font-medium">Apply for Self Only</td>
                  <td className="p-3 text-slate-700">Apply for Advance</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Salary & Statutory Rules</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Configure Rates</td>
                  <td className="p-3 border-r text-red-500 font-semibold">Restricted (No Access)</td>
                  <td className="p-3 text-red-500 font-semibold">Restricted (No Access)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium border-r bg-slate-50/50">Users, Roles & Security</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-emerald-700 font-semibold">Full Access</td>
                  <td className="p-3 border-r text-red-500 font-semibold">Restricted (No Access)</td>
                  <td className="p-3 border-r text-red-500 font-semibold">Restricted (No Access)</td>
                  <td className="p-3 text-red-500 font-semibold">Restricted (No Access)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
