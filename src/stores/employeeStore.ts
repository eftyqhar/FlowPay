import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, EmployeeDocument } from '@/lib/types';
import { generateEmployeeId, generateId } from '@/lib/utils';

interface EmployeeState {
  employees: Employee[];
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

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: [],
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

        set((state) => ({
          employees: [...state.employees, newEmployee],
        }));

        return newEmployee;
      },
      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
          ),
        })),
      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
        })),
      toggleEmployeeStatus: (id) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id
              ? {
                  ...emp,
                  status: emp.status === 'active' ? 'inactive' : 'active',
                  updatedAt: new Date().toISOString(),
                }
              : emp
          ),
        })),
      addDocument: (employeeId, documentData) =>
        set((state) => ({
          employees: state.employees.map((emp) => {
            if (emp.id !== employeeId) return emp;
            const newDoc: EmployeeDocument = {
              ...documentData,
              id: generateId(),
              uploadDate: new Date().toISOString(),
            };
            return {
              ...emp,
              documents: [...(emp.documents || []), newDoc],
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      deleteDocument: (employeeId, documentId) =>
        set((state) => ({
          employees: state.employees.map((emp) => {
            if (emp.id !== employeeId) return emp;
            return {
              ...emp,
              documents: (emp.documents || []).filter((d) => d.id !== documentId),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      deductLeaveBalance: (employeeId, leaveType, days) =>
        set((state) => ({
          employees: state.employees.map((emp) => {
            if (emp.id !== employeeId && emp.employeeId !== employeeId) return emp;
            const currentBalance = emp.leaveBalance || { casual: 10, sick: 14, annual: 15 };
            const currentTypeDays = currentBalance[leaveType] ?? 0;
            const newTypeDays = Math.max(0, currentTypeDays - days);
            return {
              ...emp,
              leaveBalance: {
                ...currentBalance,
                [leaveType]: newTypeDays,
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      updateDepartmentName: (oldName, newName) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.department === oldName
              ? { ...emp, department: newName, updatedAt: new Date().toISOString() }
              : emp
          ),
        })),
      getEmployeeById: (id) => {
        return get().employees.find((emp) => emp.id === id || emp.employeeId === id);
      },
      getEmployeesByDepartment: (dept) => {
        return get().employees.filter((emp) => emp.department === dept);
      },
      getActiveEmployees: () => {
        return get().employees.filter((emp) => emp.status === 'active');
      },
      searchEmployees: (query) => {
        const q = query.toLowerCase();
        return get().employees.filter(
          (emp) =>
            emp.fullName.toLowerCase().includes(q) ||
            emp.email.toLowerCase().includes(q) ||
            emp.employeeId.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q)
        );
      },
      getNextEmployeeId: () => {
        let maxNum = 0;
        get().employees.forEach((e) => {
          const match = e.employeeId?.match(/EMP-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
      },
    }),
    {
      name: 'flowpay-employees',
    }
  )
);
