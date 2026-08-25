import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/**', 'hooks/**'],
      exclude: [
        'lib/supabase.ts',
        'lib/translator.ts',
        'components/menu/MenuContainer.tsx',
        'components/menu/ProductModal.tsx',
        'components/menu/Header.tsx',
        'components/menu/HeroBanner.tsx',
        'components/menu/CategoryCard.tsx',
        'components/menu/ProductCard.tsx',
        'components/admin/ImageCropModal.tsx',
        'components/admin/ConfirmModal.tsx',
        'components/admin/QrGenerator.tsx',
        'app/**',
        '**/*.test.*',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});