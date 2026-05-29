import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Obrigatório para GitHub Pages quando o site vive em /<repo>/
    base: '/carregar-descontos-vk11/',

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // HMR é útil no desenvolvimento local.
      // No AI Studio Preview pode dar erros de websocket, mas isso desaparece em produção no GitHub Pages
      // porque GitHub Pages serve apenas os ficheiros estáticos gerados pelo build.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
