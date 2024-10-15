import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 3
          }
        }
      }
    })
  ],
  build: {
    sourcemap: true
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      vue: '@vue/compat',
      '@': path.resolve(__dirname, 'src/')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/variables.scss";`
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.KITSU_API_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: process.env.KITSU_EVENT_TARGET || 'http://127.0.0.1:5001',
        ws: true
      }
    }
  },
  test: {
    globals: true,
    threads: false,
    environment: 'jsdom',
    setupFiles: ['vitest-localstorage-mock', 'tests/unit.setup.js'],
    mockReset: false
  }
})
