import { defineConfig } from 'astro/config';

// `site` sert aux adresses canoniques et aux images de partage. Production : https://drakko.fr (voir README).
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://drakko.fr',
  devToolbar: { enabled: false },
  // Aucun script ni style en ligne dans la page : la politique de sécurité du contenu (Base.astro) peut alors
  // se limiter à 'self' pour les scripts
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
