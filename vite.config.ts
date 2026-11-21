import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { jpegDecoderPlugin } from './scripts/jpeg-decoder-plugin';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), jpegDecoderPlugin()],
  worker: { plugins: () => [jpegDecoderPlugin()] },
  build: { target: 'safari18' },
  server: { watch: { ignored: ['**/src-tauri/**', '**/out/**'] } }
});
