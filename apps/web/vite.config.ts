import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // @rotortech-tes/shared is an npm-workspace symlink that compiles to
  // CommonJS (functions/Node needs `require()`). With symlinks resolved to
  // their real path, Rollup's default commonjsOptions.include (matching
  // `node_modules`) never sees it and misparses its exports; keeping the
  // node_modules-looking symlink path fixes that.
  resolve: { preserveSymlinks: true },
});
