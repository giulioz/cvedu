import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  define: {
    'process.env': {},
    Buffer: { isBuffer: () => false },
  },
  plugins: [react()],
});
