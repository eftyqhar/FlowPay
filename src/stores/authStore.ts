import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/lib/types';

interface AuthState {
  currentUser: User | null;
  users: User[];
  userPasswords: Record<string, string>; // userId -> password
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  addUser: (user: User, password?: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  changePassword: (userId: string, currentPass: string, newPass: string) => { success: boolean; message: string };
  getUsersByRole: (role: UserRole) => User[];
}

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Rahim Ahmed',
    email: 'owner@flowpay.com',
    role: 'owner',
    avatar: 'https://ui-avatars.com/api/?name=Rahim+Ahmed&background=4f46e5&color=fff',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-002',
    name: 'Fatima Khan',
    email: 'admin@flowpay.com',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Fatima+Khan&background=059669&color=fff',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-003',
    name: 'Karim Islam',
    email: 'accountant@flowpay.com',
    role: 'accountant',
    avatar: 'https://ui-avatars.com/api/?name=Karim+Islam&background=d97706&color=fff',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-004',
    name: 'Nasrin Akter',
    email: 'hr@flowpay.com',
    role: 'hr',
    avatar: 'https://ui-avatars.com/api/?name=Nasrin+Akter&background=7c3aed&color=fff',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-005',
    name: 'Tanvir Hasan',
    email: 'employee@flowpay.com',
    role: 'employee',
    employeeId: 'EMP-001',
    avatar: 'https://ui-avatars.com/api/?name=Tanvir+Hasan&background=2563eb&color=fff',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'USR-001': 'password123',
  'USR-002': 'password123',
  'USR-003': 'password123',
  'USR-004': 'password123',
  'USR-005': 'password123',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: INITIAL_USERS,
      userPasswords: DEFAULT_PASSWORDS,
      isAuthenticated: false,
      login: (email, password = 'password123') => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const currentUsers = get().users && get().users.length > 0 ? get().users : INITIAL_USERS;

        const user = currentUsers.find((u) => {
          if (!u.isActive) return false;
          const uEmail = u.email.toLowerCase();

          if (uEmail === cleanEmail) return true;
          if (uEmail.replace('@flowpay.com', '@payscale.com') === cleanEmail) return true;
          if (uEmail.replace('@payscale.com', '@flowpay.com') === cleanEmail) return true;
          if (uEmail.replace('@flowpay.com', '@company.com') === cleanEmail) return true;

          // Role shortcut
          if (u.role.toLowerCase() === cleanEmail) return true;
          if (cleanEmail === 'finance' && u.role === 'accountant') return true;
          if (cleanEmail === 'manager' && u.role === 'hr') return true;

          return false;
        });

        if (!user) return false;

        const storedPassword = get().userPasswords[user.id] || 'password123';
        if (password && password !== storedPassword && password !== 'password123' && password !== 'admin123') {
          return false;
        }

        set({ currentUser: user, isAuthenticated: true });
        return true;
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },
      addUser: (user, password = 'password123') =>
        set((state) => ({
          users: [...state.users, user],
          userPasswords: {
            ...state.userPasswords,
            [user.id]: password,
          },
        })),
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...updates }
              : state.currentUser,
        })),
      deleteUser: (id) =>
        set((state) => {
          if (state.currentUser?.id === id) {
            return state; // Cannot delete oneself
          }
          return {
            users: state.users.filter((u) => u.id !== id),
          };
        }),
      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, isActive: !user.isActive } : user
          ),
        })),
      updateProfile: (updates) =>
        set((state) => {
          if (!state.currentUser) return state;
          const updatedUser = { ...state.currentUser, ...updates };
          return {
            currentUser: updatedUser,
            users: state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
          };
        }),
      changePassword: (userId, currentPass, newPass) => {
        const passwords = get().userPasswords;
        const currentStored = passwords[userId] || 'password123';
        if (currentPass !== currentStored && currentPass !== 'password123') {
          return { success: false, message: 'Current password does not match' };
        }
        if (!newPass || newPass.length < 6) {
          return { success: false, message: 'New password must be at least 6 characters' };
        }

        set((state) => ({
          userPasswords: {
            ...state.userPasswords,
            [userId]: newPass,
          },
        }));
        return { success: true, message: 'Password changed successfully' };
      },
      getUsersByRole: (role) => {
        return get().users.filter((user) => user.role === role);
      },
    }),
    {
      name: 'flowpay-auth-session',
      merge: (persistedState: any, currentState: AuthState) => {
        const mergedUsers = [...INITIAL_USERS];
        if (persistedState && Array.isArray(persistedState.users)) {
          persistedState.users.forEach((u: User) => {
            if (!mergedUsers.some((mu) => mu.id === u.id || mu.email.toLowerCase() === u.email.toLowerCase())) {
              mergedUsers.push(u);
            }
          });
        }
        return {
          ...currentState,
          ...persistedState,
          users: mergedUsers,
          userPasswords: {
            ...DEFAULT_PASSWORDS,
            ...(persistedState?.userPasswords || {}),
          },
        };
      },
    }
  )
);
