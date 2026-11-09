// Seed data has been removed in favor of Supabase PostgreSQL database
export const initializeSeedData = () => {
  // Clean up any legacy dummy data from browser localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacyKeys = [
      'flowpay-employees',
      'flowpay-payroll',
      'flowpay-attendance',
      'flowpay-loans',
      'flowpay-departments',
      'flowpay-notifications',
      'flowpay-audit',
      'flowpay-auth',
      'flowpay-settings',
    ];
    legacyKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // ignore
      }
    });
  }
};
