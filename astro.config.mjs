import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://falconx.cl',
  integrations: [sitemap()],
  // CSS total ~6 KB: inline evita 2 requests que bloqueaban el primer pintado (LCP = FCP en móvil)
  build: { inlineStylesheets: 'always' },
});
