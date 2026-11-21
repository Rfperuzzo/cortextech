import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const sections = resolve(import.meta.dirname, 'src/sections');
const include = html => html.replace(/<!--\s*@secao\s+([\w-]+)\s*-->/g,
  (_, name) => readFileSync(resolve(sections, name + '.html'), 'utf8'));

export default defineConfig({
  base: './',
  plugins: [{
    name: 'cortextech-sections',
    transformIndexHtml: { order: 'pre', handler: include },
    handleHotUpdate({ file, server }) {
      if (file.replaceAll('\\', '/').includes('/src/sections/') && file.endsWith('.html')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    }
  }],
  server: { host: '127.0.0.1', port: 5183, strictPort: true },
  preview: { host: '127.0.0.1', port: 4183, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 650 }
});
