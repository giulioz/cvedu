import { defineConfig } from 'vite';
export default defineConfig({
  define: {
    'process.env': {},
    Buffer: { isBuffer: () => false },
  },
});
