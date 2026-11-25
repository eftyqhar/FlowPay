import { create } from 'zustand';
import { Employee, EmployeeDocument } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToEmployee, employeeToRow } from '@/lib/dbMappers';
import { toast } from 'sonner';

interface EmployeeState {
  employees: Employee[];
  isLoading: boolean;
  fetchEmployees: () => Promise<void>;
  addEmployee: (
    employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId'>
  ) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  toggleEmployeeStatus: (id: string) => Promise<void>;
  addDocument: (
    employeeId: string,
    document: Omit<EmployeeDocument, 'id' | 'uploadDate'>
  ) => Promise<void>;
  deleteDocument: (employeeId: string, documentId: string) => Promise<void>;
  deductLeaveBalance: (
    employeeId: string,
    leaveType: 'casual' | 'sick' | 'annual',
    days: number
  ) => Promise<void>;
  updateDepartmentName: (oldName: string, newName: string) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeesByDepartment: (dept: string) => Employee[];
  getActiveEmployees: () => Employee[];
  searchEmployees: (query: string) => Employee[];
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  isLoading: false,

  fetchEmployees: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ employees: (data || []).map(rowToEmployee), isLoading: false });
    } catch (err: any) {
      console.error('Error fetching employees from Supabase:', err);
      toast.error(err?.message || 'Failed to load employees');
      set({ isLoading: false });
    }
  },

  addEmployee: async (employeeData) => {
    const now = new Date().toISOString();
    const draftEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      // Leave employeeId empty so PostgreSQL emp_id_seq trigger generates EMP-XXXX atomically
      employeeId: '',
      leaveBalance: employeeData.leaveBalance || { casual: 10, sick: 14, annual: 15 },
      documents: employeeData.documents || [],
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeToRow(draftEmployee))
      .select('*')
      .single();

    if (error || !data) {
      const msg = error?.message || 'Failed to create employee in database';
      toast.error(msg);
      throw new Error(msg);
    }

    const createdEmployee = rowToEmployee(data);
    set((state) => ({
      employees: [createdEmployee, ...state.employees],
    }));

    return createdEmployee;
  },

  updateEmployee: async (id, updates) => {
    const previousEmployees = get().employees;
    const now = new Date().toISOString();

    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates, updatedAt: now } : emp
      ),
    }));

    const updatedEmp = get().employees.find((e) => e.id === id);
    if (!updatedEmp) return;

    const { error } = await supabase
      .from('employees')
      .update(employeeToRow(updatedEmp))
      .eq('id', id);

    if (error) {
      set({ employees: previousEmployees });
      toast.error(`Failed to update employee: ${error.message}`);
      throw new Error(error.message);
    }
  },

  deleteEmployee: async (id) => {
    const previousEmployees = get().employees;
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    }));

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      set({ employees: previousEmployees });
      toast.error(`Cannot delete employee: ${error.message}`);
      throw new Error(error.message);
    }
  },

  toggleEmployeeStatus: async (id) => {
    const emp = get().employees.find((e) => e.id === id);
    if (!emp) return;
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    await get().updateEmployee(id, { status: newStatus });
  },

  addDocument: async (employeeId, documentData) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const newDoc: EmployeeDocument = {
      ...documentData,
      id: generateId(),
      uploadDate: new Date().toISOString().split('T')[0],
    };

    const newDocs = [...(emp.documents || []), newDoc];
    await get().updateEmployee(employeeId, { documents: newDocs });
  },

  deleteDocument: async (employeeId, documentId) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const newDocs = (emp.documents || []).filter((doc) => doc.id !== documentId);
    await get().updateEmployee(employeeId, { documents: newDocs });
  },

  deductLeaveBalance: async (employeeId, leaveType, days) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const currentBalance = emp.leaveBalance || { casual: 10, sick: 14, annual: 15 };
    const updatedBalance = {
      ...currentBalance,
      [leaveType]: Math.max(0, currentBalance[leaveType] - days),
    };

    await get().updateEmployee(employeeId, { leaveBalance: updatedBalance });
  },

  updateDepartmentName: async (oldName, newName) => {
    const previousEmployees = get().employees;
    const now = new Date().toISOString();

    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.department === oldName ? { ...emp, department: newName, updatedAt: now } : emp
      ),
    }));

    const { error } = await supabase
      .from('employees')
      .update({ department: newName, updated_at: now })
      .eq('department', oldName);

    if (error) {
      set({ employees: previousEmployees });
      toast.error(`Failed to update department name: ${error.message}`);
      throw new Error(error.message);
    }
  },

  getEmployeeById: (id) => {
    return get().employees.find((emp) => emp.id === id);
  },

  getEmployeesByDepartment: (dept) => {
    return get().employees.filter(
      (emp) => emp.department.toLowerCase() === dept.toLowerCase()
    );
  },

  getActiveEmployees: () => {
    return get().employees.filter((emp) => emp.status === 'active');
  },

  searchEmployees: (query) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return get().employees;

    return get().employees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(cleanQuery) ||
        emp.employeeId.toLowerCase().includes(cleanQuery) ||
        emp.email.toLowerCase().includes(cleanQuery) ||
        emp.department.toLowerCase().includes(cleanQuery) ||
        emp.designation.toLowerCase().includes(cleanQuery)
    );
  },
}));
