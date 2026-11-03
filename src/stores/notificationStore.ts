import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationItem, User } from '@/lib/types';
import { generateId } from '@/lib/utils';

export const isNotificationForUser = (
  n: NotificationItem,
  user: User | null | undefined,
  employeeId?: string
): boolean => {
  if (!user) return false;

  // 1. Direct target user ID match
  if (n.targetUserId && n.targetUserId === user.id) {
    return true;
  }

  // 2. Direct target employee ID match
  if (n.targetEmployeeId) {
    const resolvedEmpId = employeeId || user.employeeId;
    if (resolvedEmpId && n.targetEmployeeId === resolvedEmpId) {
      return true;
    }
  }

  // 3. Target role match (e.g. ['admin', 'owner', 'accountant', 'hr'])
  if (n.targetRoles && n.targetRoles.length > 0) {
    return n.targetRoles.includes(user.role);
  }

  // 4. Fallback for legacy notifications without explicit targets:
  // Administrative notifications must NEVER show in regular employee accounts.
  if (!n.targetUserId && !n.targetEmployeeId && (!n.targetRoles || n.targetRoles.length === 0)) {
    return user.role !== 'employee';
  }

  return false;
};

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (user?: User | null, employeeId?: string) => void;
  clearAll: () => void;
  getUserNotifications: (user: User | null | undefined, employeeId?: string) => NotificationItem[];
  getUnreadCount: (user?: User | null | undefined, employeeId?: string) => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 'notif-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          title: 'Pending Payroll Approval',
          message: 'September 2026 payroll has draft records pending review.',
          type: 'warning',
          isRead: false,
          link: '/payroll',
          targetRoles: ['admin', 'owner', 'accountant'],
        },
        {
          id: 'notif-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          title: 'Leave Request Received',
          message: 'Tanvir Hasan requested 2 days of Casual Leave.',
          type: 'info',
          isRead: false,
          link: '/attendance',
          targetRoles: ['admin', 'owner', 'hr'],
        },
        {
          id: 'notif-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          title: 'Welcome to FlowPay Portal',
          message: 'Your self-service portal is active. You can review payslips and apply for leave or salary advance.',
          type: 'info',
          isRead: false,
          link: '/loans',
          targetRoles: ['employee'],
        },
      ],
      addNotification: (item) =>
        set((state) => ({
          notifications: [
            {
              ...item,
              id: generateId(),
              timestamp: new Date().toISOString(),
              isRead: false,
            },
            ...state.notifications.slice(0, 200), // safe upper limit
          ],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: (user, employeeId) => {
        if (!user) {
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          }));
          return;
        }
        set((state) => ({
          notifications: state.notifications.map((n) =>
            isNotificationForUser(n, user, employeeId) ? { ...n, isRead: true } : n
          ),
        }));
      },
      clearAll: () => set({ notifications: [] }),
      getUserNotifications: (user, employeeId) => {
        if (!user) return [];
        return get().notifications.filter((n) => isNotificationForUser(n, user, employeeId));
      },
      getUnreadCount: (user, employeeId) => {
        if (!user) {
          return get().notifications.filter((n) => !n.isRead).length;
        }
        return get().notifications.filter(
          (n) => !n.isRead && isNotificationForUser(n, user, employeeId)
        ).length;
      },
    }),
    {
      name: 'flowpay-notifications',
    }
  )
);
