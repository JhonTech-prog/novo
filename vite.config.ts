import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Isso garante que process.env.API_KEY funcione no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Isso previne o erro "process is not defined" que deixa a tela branca
      'process.env': {}
    }
  };
});