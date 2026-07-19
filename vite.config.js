import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT ?? "5173"),
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**', 'src/constants/**'],
      exclude: [
        'src/App.jsx',
        'src/main.jsx',
        'src/db.js',
        'src/seeds.js',
        'src/supabase.js',
        'src/useSupabase.js',
        'src/seeds/**',
        'src/components/**',
        'src/print/**',
      ],
      thresholds: { lines: 100, functions: 100, branches: 94, statements: 99 },
    },
  },
})
