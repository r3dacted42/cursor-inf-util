import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cursor-inf-util/',
  plugins: [vue(), mkcert(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'cursor install.inf utility',
      short_name: 'cur-inf-util',
      description: 'utility to easily generate install.inf files for cursor packs or complete cursor pack zip files',
      theme_color: '#242424',
      display: 'standalone',
      scope: '/cursor-inf-util/',
      start_url: '/cursor-inf-util/',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})