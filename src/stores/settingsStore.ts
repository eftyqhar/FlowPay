import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanySettings } from '@/lib/types';
import { DEFAULT_COMPANY_SETTINGS } from '@/lib/constants';

interface SettingsState {
  settings: CompanySettings;
  updateSettings: (partial: Partial<CompanySettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_COMPANY_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () =>
        set(() => ({
          settings: DEFAULT_COMPANY_SETTINGS,
        })),
    }),
    {
      name: 'flowpay-settings',
      merge: (persistedState: any, currentState: SettingsState) => {
        return {
          ...currentState,
          settings: {
            ...DEFAULT_COMPANY_SETTINGS,
            ...(persistedState?.settings || {}),
          },
        };
      },
    }
  )
);
