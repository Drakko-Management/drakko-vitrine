/// <reference types="astro/client" />

// Variables publiques (visibles dans le navigateur : jamais de secret ici). Voir README.md.
interface ImportMetaEnv {
  // Adresse de l'API (03-back), sans barre finale. Obligatoire pour une version publiée.
  readonly PUBLIC_API_URL?: string;
  // Clé de SITE Cloudflare Turnstile (la clé secrète est dans le back). Facultative en développement.
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  // Adresse publique du site (adresses canoniques, image de partage)
  readonly PUBLIC_SITE_URL?: string;
  // « true » en production seulement : sinon la page demande aux moteurs de recherche de l'ignorer
  readonly PUBLIC_INDEXABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
