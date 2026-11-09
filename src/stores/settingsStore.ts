import { create } from 'zustand';
import { CompanySettings } from '@/lib/types';
import { DEFAULT_COMPANY_SETTINGS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { rowToSettings, settingsToRow } from '@/lib/dbMappers';

interface SettingsState {
  settings: CompanySettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (partial: Partial<CompanySettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_COMPANY_SETTINGS,
  isLoading: false,

  fetchSettings: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        set({ settings: rowToSettings(data), isLoading: false });
      } else {
        // Upsert default settings
        await supabase
          .from('company_settings')
          .upsert({ id: 'default', ...settingsToRow(DEFAULT_COMPANY_SETTINGS) });
        set({ settings: DEFAULT_COMPANY_SETTINGS, isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching settings from Supabase:', err);
      set({ isLoading: false });
    }
  },

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });

    supabase
      .from('company_settings')
      .upsert({ id: 'default', ...settingsToRow(updated) })
      .then(({ error }) => {
        if (error) console.error('Failed to update company settings in Supabase:', error);
      });
  },

  resetSettings: () => {
    set({ settings: DEFAULT_COMPANY_SETTINGS });

    supabase
      .from('company_settings')
      .upsert({ id: 'default', ...settingsToRow(DEFAULT_COMPANY_SETTINGS) })
      .then(({ error }) => {
        if (error) console.error('Failed to reset company settings in Supabase:', error);
      });
  },
}));
