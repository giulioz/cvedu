import { ConfigEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig((env: ConfigEnv) => ({
  define:
    env.command === 'build'
      ? {}
      : {
          'process.env': {},
          Buffer: { isBuffer: () => false },
        },
  plugins: [react()],
}));
