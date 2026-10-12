// La configuration publique vient d'attributs du <body> (posés par Base.astro au moment de la construction) :
// aucun script en ligne, ce que la politique de sécurité du contenu interdit.
export interface PageConfig {
  apiUrl: string;
  turnstileSiteKey?: string;
}

export function readConfig(): PageConfig {
  const { apiUrl, turnstileSiteKey } = document.body.dataset;
  if (!apiUrl) throw new Error("Adresse de l'API absente de la page.");
  return { apiUrl, turnstileSiteKey: turnstileSiteKey || undefined };
}
