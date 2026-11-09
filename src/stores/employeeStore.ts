import { create } from 'zustand';
import { Employee, EmployeeDocument } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToEmployee, employeeToRow } from '@/lib/dbMappers';

interface EmployeeState {
  employees: Employee[];
  isLoading: boolean;
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  toggleEmployeeStatus: (id: string) => void;
  addDocument: (employeeId: string, document: Omit<EmployeeDocument, 'id' | 'uploadDate'>) => void;
  deleteDocument: (employeeId: string, documentId: string) => void;
  deductLeaveBalance: (employeeId: string, leaveType: 'casual' | 'sick' | 'annual', days: number) => void;
  updateDepartmentName: (oldName: string, newName: string) => void;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeesByDepartment: (dept: string) => Employee[];
  getActiveEmployees: () => Employee[];
  searchEmployees: (query: string) => Employee[];
  getNextEmployeeId: () => string;
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
    } catch (err) {
      console.error('Error fetching employees from Supabase:', err);
      set({ isLoading: false });
    }
  },

  addEmployee: (employeeData) => {
    const newId = get().getNextEmployeeId();
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      employeeId: newId,
      leaveBalance: employeeData.leaveBalance || { casual: 10, sick: 14, annual: 15 },
      documents: employeeData.documents || [],
      createdAt: now,
      updatedAt: now,
    };

    // Update state optimistically
    set((state) => ({
      employees: [newEmployee, ...state.employees],
    }));

    // Sync with Supabase
    supabase
      .from('employees')
      .insert(employeeToRow(newEmployee))
      .then(({ error }) => {
        if (error) console.error('Failed to sync new employee to Supabase:', error);
      });

    return newEmployee;
  },

  updateEmployee: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates, updatedAt: now } : emp
      ),
    }));

    const updatedEmp = get().employees.find((e) => e.id === id);
    if (updatedEmp) {
      supabase
        .from('employees')
        .update(employeeToRow(updatedEmp))
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Failed to sync employee update to Supabase:', error);
        });
    }
  },

  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    }));

    supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to delete employee from Supabase:', error);
      });
  },

  toggleEmployeeStatus: (id) => {
    const emp = get().employees.find((e) => e.id === id);
    if (!emp) return;
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    get().updateEmployee(id, { status: newStatus });
  },

  addDocument: (employeeId, documentData) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const newDoc: EmployeeDocument = {
      ...documentData,
      id: generateId(),
      uploadDate: new Date().toISOString().split('T')[0],
    };

    const newDocs = [...(emp.documents || []), newDoc];
    get().updateEmployee(employeeId, { documents: newDocs });
  },

  deleteDocument: (employeeId, documentId) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const newDocs = (emp.documents || []).filter((doc) => doc.id !== documentId);
    get().updateEmployee(employeeId, { documents: newDocs });
  },

  deductLeaveBalance: (employeeId, leaveType, days) => {
    const emp = get().employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const currentBalance = emp.leaveBalance || { casual: 10, sick: 14, annual: 15 };
    const updatedBalance = {
      ...currentBalance,
      [leaveType]: Math.max(0, currentBalance[leaveType] - days),
    };

    get().updateEmployee(employeeId, { leaveBalance: updatedBalance });
  },

  updateDepartmentName: (oldName, newName) => {
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.department === oldName ? { ...emp, department: newName, updatedAt: new Date().toISOString() } : emp
      ),
    }));

    supabase
      .from('employees')
      .update({ department: newName, updated_at: new Date().toISOString() })
      .eq('department', oldName)
      .then(({ error }) => {
        if (error) console.error('Failed to update department in Supabase:', error);
      });
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

  getNextEmployeeId: () => {
    const currentEmployees = get().employees;
    let maxNum = 0;
    for (const emp of currentEmployees) {
      const match = (emp.employeeId || '').match(/EMP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  },
}));
