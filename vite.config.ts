/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const THEME = '#09090B'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // En GitHub Pages el sitio vive en /<repo>/. Se puede cambiar con VITE_BASE_PATH.
  const base = env.VITE_BASE_PATH || (command === 'build' ? '/ascend/' : '/')

  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string
  }

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      rolldownOptions: {
        output: {
          // Librerías en chunks propios: cambian poco, así un deploy solo re-descarga el código de la app.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              },
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
              {
                name: 'motion',
                test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/,
              },
              { name: 'vendor', test: /node_modules[\\/]/ },
            ],
          },
        },
      },
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          name: 'ASCEND',
          short_name: 'ASCEND',
          description: 'Build yourself. Track your progress.',
          lang: 'es',
          dir: 'ltr',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: THEME,
          theme_color: THEME,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Solo el app shell. Los datos de Supabase NUNCA se cachean en el service worker:
          // el modo offline de datos lo maneja Dexie.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // Las pantallas de inicio de iOS no hacen falta offline. De Inter solo se precachean
          // latin y latin-ext: el resto de los alfabetos el navegador ni los pide (unicode-range).
          globIgnores: ['splash/**', '**/inter-{cyrillic,greek,vietnamese}*'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
        },
        devOptions: { enabled: false },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
