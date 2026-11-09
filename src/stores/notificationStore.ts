import { create } from 'zustand';
import { NotificationItem, User } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToNotification, notificationToRow } from '@/lib/dbMappers';

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
  if (!n.targetUserId && !n.targetEmployeeId && (!n.targetRoles || n.targetRoles.length === 0)) {
    return user.role !== 'employee';
  }

  return false;
};

interface NotificationState {
  notifications: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (user?: User | null, employeeId?: string) => void;
  clearAll: () => void;
  getUserNotifications: (user: User | null | undefined, employeeId?: string) => NotificationItem[];
  getUnreadCount: (user?: User | null | undefined, employeeId?: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      set({ notifications: (data || []).map(rowToNotification), isLoading: false });
    } catch (err) {
      console.error('Error fetching notifications from Supabase:', err);
      set({ isLoading: false });
    }
  },

  addNotification: (item) => {
    const newNotif: NotificationItem = {
      ...item,
      id: generateId(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));

    supabase
      .from('notifications')
      .insert(notificationToRow(newNotif))
      .then(({ error }) => {
        if (error) console.error('Failed to sync notification to Supabase:', error);
      });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));

    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update notification in Supabase:', error);
      });
  },

  markAllAsRead: (user, employeeId) => {
    const visibleIds = get()
      .getUserNotifications(user, employeeId)
      .map((n) => n.id);

    set((state) => ({
      notifications: state.notifications.map((n) =>
        isNotificationForUser(n, user, employeeId) ? { ...n, isRead: true } : n
      ),
    }));

    if (visibleIds.length > 0) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', visibleIds)
        .then(({ error }) => {
          if (error) console.error('Failed to mark notifications read in Supabase:', error);
        });
    }
  },

  clearAll: () => {
    set({ notifications: [] });
  },

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
}));
