import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  const proxyTarget = env.API_PROXY_TARGET || (env.VITE_API_BASE_URL?.startsWith('http') ? env.VITE_API_BASE_URL : 'http://127.0.0.1:8000');
  return {
  plugins: [react(), tailwindcss()],
  envDir: '..',
  // O navegador usa a origem do Vite para manter os cookies na mesma origem.
  define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/') },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: proxyTarget }, '/health': { target: proxyTarget } },
  },
  preview: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: proxyTarget }, '/health': { target: proxyTarget } },
  },
};
})
