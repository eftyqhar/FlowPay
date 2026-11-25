/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-excel': ['exceljs'],
          'vendor-ui': ['lucide-react', 'sonner'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
