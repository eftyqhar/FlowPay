import { create } from 'zustand';
import { Department } from '@/lib/types';
import { DEPARTMENTS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { rowToDepartment, departmentToRow } from '@/lib/dbMappers';

interface DepartmentState {
  departments: Department[];
  isLoading: boolean;
  fetchDepartments: () => Promise<void>;
  addDepartment: (department: Department) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  getDepartmentByName: (name: string) => Department | undefined;
}

const defaultDepts: Department[] = DEPARTMENTS.map((name) => ({
  id: `dept-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  createdAt: '2024-01-01T00:00:00.000Z',
}));

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: defaultDepts,
  isLoading: false,

  fetchDepartments: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default departments to Supabase
        const rows = defaultDepts.map(departmentToRow);
        await supabase.from('departments').upsert(rows);
        set({ departments: defaultDepts, isLoading: false });
      } else {
        set({ departments: data.map(rowToDepartment), isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      set({ isLoading: false });
    }
  },

  addDepartment: async (department) => {
    try {
      const row = departmentToRow(department);
      const { error } = await supabase.from('departments').insert(row);
      if (error) throw error;
      set((state) => ({ departments: [...state.departments, department] }));
    } catch (err) {
      console.error('Error adding department:', err);
      // Optimistic fallback
      set((state) => ({ departments: [...state.departments, department] }));
    }
  },

  updateDepartment: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: updates.name,
          head: updates.head,
          head_id: updates.headId,
          description: updates.description,
        })
        .eq('id', id);
      if (error) throw error;
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === id ? { ...dept, ...updates } : dept
        ),
      }));
    } catch (err) {
      console.error('Error updating department:', err);
    }
  },

  deleteDepartment: async (id) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        departments: state.departments.filter((dept) => dept.id !== id),
      }));
    } catch (err) {
      console.error('Error deleting department:', err);
    }
  },

  getDepartmentByName: (name) => {
    return get().departments.find(
      (dept) => dept.name.toLowerCase() === name.toLowerCase()
    );
  },
}));
