// Contenu et réglages communs à toutes les pages. Les textes viennent de 01-docs/11-teaser-content.md.

const apiUrl = import.meta.env.PUBLIC_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3100' : undefined);

// Une version publiée sans adresse d'API aurait un formulaire qui ne mène nulle part : mieux vaut échouer
if (!apiUrl) {
  throw new Error(
    "PUBLIC_API_URL est requis pour construire la vitrine (adresse de l'API, voir README.md).",
  );
}

export const site = {
  name: 'Drakko',
  tagline: 'Pilotez. Organisez. Avancez.',
  title: 'Drakko — Chaque chantier terminé, documenté et signé',
  description:
    "Le suivi de chantier pour les artisans et entreprises du bâtiment et de l'extérieur : photos avant/après, validation du client sur son téléphone, procès-verbal PDF signé.",
  url: (import.meta.env.PUBLIC_SITE_URL ?? 'https://drakko.fr').replace(/\/+$/, ''),
  apiUrl: apiUrl.replace(/\/+$/, ''),
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || undefined,
  indexable: import.meta.env.PUBLIC_INDEXABLE === 'true',
  // Adresse de contact affichée dans le pied de page ; vide : le lien n'est pas affiché
  contactEmail: '',
  year: new Date().getFullYear(),
} as const;
