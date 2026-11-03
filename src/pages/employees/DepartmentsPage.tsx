import React, { useState } from 'react';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { formatCurrency, generateId } from '@/lib/utils';
import { calculateFullSalary } from '@/lib/salary';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useDepartmentStore();
  const { employees } = useEmployeeStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');
  
  const [formData, setFormData] = useState({ name: '', description: '', headId: '' });

  const handleOpenNew = () => {
    setIsEdit(false);
    setFormData({ name: '', description: '', headId: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    setIsEdit(true);
    setCurrentId(dept.id);
    setFormData({ name: dept.name, description: dept.description, headId: dept.headId || '' });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Department name is required');
      return;
    }

    if (isEdit) {
      const currentDept = departments.find((d) => d.id === currentId);
      if (currentDept && currentDept.name !== formData.name) {
        useEmployeeStore.getState().updateDepartmentName(currentDept.name, formData.name);
      }
      updateDepartment(currentId, formData);
      toast.success('Department updated successfully');
    } else {
      addDepartment({ 
        ...formData, 
        id: generateId(), 
        createdAt: new Date().toISOString() 
      });
      toast.success('Department added successfully');
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const empCount = employees.filter(e => e.department === name).length;
    if (empCount > 0) {
      toast.error(`Cannot delete department with ${empCount} active employees.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(id);
      toast.success('Department deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Departments" 
        description="Manage company departments and view their summaries."
      >
        <Button onClick={handleOpenNew} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptEmployees = employees.filter(e => e.department === dept.name);
          const totalNetSalary = deptEmployees.reduce((sum, emp) => sum + calculateFullSalary(emp).netSalary, 0);
          
          return (
            <Card key={dept.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex justify-between items-start">
                  <span className="truncate pr-2">{dept.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => handleOpenEdit(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDelete(dept.id, dept.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">{dept.description}</p>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>Employees</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{deptEmployees.length}</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                    <div className="text-indigo-600 text-xs mb-1 font-medium">Total Payroll</div>
                    <p className="text-lg font-bold text-indigo-900 tabular-nums">{formatCurrency(totalNetSalary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Brief description of the department's role"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{isEdit ? 'Save Changes' : 'Add Department'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
