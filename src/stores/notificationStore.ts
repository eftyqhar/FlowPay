import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationItem } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 'notif-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          title: 'Pending Payroll Approval',
          message: 'September 2026 payroll has 8 draft records pending review.',
          type: 'warning',
          isRead: false,
          link: '/payroll',
        },
        {
          id: 'notif-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          title: 'Leave Request Received',
          message: 'Tanvir Hasan requested 2 days of Casual Leave.',
          type: 'info',
          isRead: false,
          link: '/attendance',
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
            ...state.notifications,
          ],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      clearAll: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    {
      name: 'flowpay-notifications',
    }
  )
);
