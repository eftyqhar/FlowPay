import { create } from 'zustand';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { rowToUser, userToRow } from '@/lib/dbMappers';

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  addUser: (user: User, password?: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (
    userIdOrCurrentPass: string,
    currentPassOrNewPass: string,
    optionalNewPass?: string
  ) => Promise<{ success: boolean; message: string }>;
  getUsersByRole: (role: UserRole) => User[];
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: [],
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (userProfile) {
          const mapped = rowToUser(userProfile);
          set({ currentUser: mapped, isAuthenticated: true, isLoading: false });
        } else {
          // Fallback user from session metadata
          const fallbackUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as UserRole) || 'admin',
            isActive: true,
            createdAt: session.user.created_at || new Date().toISOString(),
          };

          // Save to public.users
          await supabase.from('users').upsert(userToRow(fallbackUser));
          set({ currentUser: fallbackUser, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
      }

      // Listen to auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (userProfile) {
            set({ currentUser: rowToUser(userProfile), isAuthenticated: true, isLoading: false });
          }
        } else {
          set({ currentUser: null, isAuthenticated: false, isLoading: false });
        }
      });

      // Fetch all users
      get().fetchUsers();
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, message: error.message };
      }

      if (data.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .maybeSingle();

        let appUser: User;
        if (userProfile) {
          appUser = rowToUser(userProfile);
        } else {
          appUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: (data.user.user_metadata?.role as UserRole) || 'admin',
            isActive: true,
            createdAt: data.user.created_at || new Date().toISOString(),
          };
          await supabase.from('users').upsert(userToRow(appUser));
        }

        set({ currentUser: appUser, isAuthenticated: true, isLoading: false });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, message: 'No user session returned.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Login failed.' };
    }
  },

  signup: async (email: string, password: string, name: string, role: UserRole) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name, role },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, message: error.message };
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          name,
          email: data.user.email || email.trim(),
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        await supabase.from('users').upsert(userToRow(newUser));
        set({ currentUser: newUser, isAuthenticated: true, isLoading: false });
        get().fetchUsers();
        return { success: true };
      }

      set({ isLoading: false });
      return { success: true, message: 'Please check your email to verify your account.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Signup failed.' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    set({ currentUser: null, isAuthenticated: false });
  },

  fetchUsers: async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ users: (data || []).map(rowToUser) });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  },

  addUser: async (user: User, password?: string) => {
    try {
      const row = userToRow(user);
      const { error } = await supabase.from('users').insert(row);
      if (error) throw error;
      set((state) => ({ users: [user, ...state.users] }));

      if (password) {
        supabase.auth.signUp({
          email: user.email,
          password,
          options: { data: { name: user.name, role: user.role } },
        }).catch((e) => console.log('Auth user sign up note:', e));
      }
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  },

  updateUser: async (id: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          role: updates.role,
          avatar: updates.avatar,
          is_active: updates.isActive,
          employee_id: updates.employeeId,
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        currentUser:
          state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
      }));
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  },

  deleteUser: async (id: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  },

  toggleUserStatus: async (id: string) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = !user.isActive;
    await get().updateUser(id, { isActive: newStatus });
  },

  updateProfile: async (updates: Partial<User>) => {
    const current = get().currentUser;
    if (!current) return;
    await get().updateUser(current.id, updates);
  },

  changePassword: async (
    userIdOrCurrentPass: string,
    currentPassOrNewPass: string,
    optionalNewPass?: string
  ) => {
    const newPass = optionalNewPass || currentPassOrNewPass;
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Password updated successfully in Supabase.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update password.' };
    }
  },

  getUsersByRole: (role: UserRole) => {
    return get().users.filter((u) => u.role === role);
  },
}));
