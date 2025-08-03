import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        callback: './public/auth/callback.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    'process.env': {},
  },
  publicDir: 'public'
});
