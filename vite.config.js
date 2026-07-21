import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Minh Việt Travel ERP',
        short_name: 'Minh Việt ERP',
        description: 'Hệ thống quản lý điều hành Minh Việt Travel',
        lang: 'vi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#172554',
        background_color: '#f8fafc',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // API Supabase khác origin, không đụng tới cache — luôn đi network trực tiếp.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
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
