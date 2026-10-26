import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist', target: 'chrome130', sourcemap: false },
});
