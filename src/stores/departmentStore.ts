import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Department } from '@/lib/types';
import { DEPARTMENTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface DepartmentState {
  departments: Department[];
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  getDepartmentByName: (name: string) => Department | undefined;
}

const initialDepartments: Department[] = DEPARTMENTS.map((name) => ({
  id: `dept-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  createdAt: '2024-01-01T00:00:00.000Z',
}));

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      departments: initialDepartments,
      addDepartment: (department) =>
        set((state) => ({
          departments: [...state.departments, department],
        })),
      updateDepartment: (id, updates) =>
        set((state) => ({
          departments: state.departments.map((dept) =>
            dept.id === id ? { ...dept, ...updates } : dept
          ),
        })),
      deleteDepartment: (id) =>
        set((state) => ({
          departments: state.departments.filter((dept) => dept.id !== id),
        })),
      getDepartmentByName: (name) => {
        return get().departments.find(
          (dept) => dept.name.toLowerCase() === name.toLowerCase()
        );
      },
    }),
    {
      name: 'flowpay-departments',
      merge: (persistedState: any, currentState: DepartmentState) => {
        let state = persistedState;
        if (!state && typeof window !== 'undefined') {
          const old = localStorage.getItem('payscale-departments');
          if (old) {
            try {
              state = JSON.parse(old)?.state;
            } catch {
              // Ignore
            }
          }
        }
        return {
          ...currentState,
          ...(state || {}),
        };
      },
    }
  )
);
