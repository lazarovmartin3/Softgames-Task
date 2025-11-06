import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Softgames-Task/',
  server: {
    port: 3000,
    proxy: {
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['@pixi/app', '@pixi/assets', '@pixi/core', '@pixi/display', '@pixi/graphics', '@pixi/sprite', '@pixi/text'],
    exclude: ['@pixi-spine/loader-4.1', '@pixi-spine/runtime-4.1']
  }
});
