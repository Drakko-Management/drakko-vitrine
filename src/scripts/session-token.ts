// Le lien de l'email porte le jeton dans le fragment. On l'efface de la barre d'adresse (il ne doit pas
// finir dans un signet ou un historique partagé), mais on le garde le temps de l'onglet : un rechargement de
// la page ne doit pas rendre le lien « inconnu ». sessionStorage meurt avec l'onglet.
import { readTokenFromHash } from '../lib/token';

const KEY = 'drakko-waitlist-token';

export function takeToken(): string | null {
  const fromLink = readTokenFromHash(location.hash);
  if (fromLink) {
    try {
      sessionStorage.setItem(KEY, fromLink);
    } catch {
      // stockage indisponible (navigation privée stricte) : le jeton reste en mémoire pour cette visite
    }
    history.replaceState(null, '', location.pathname + location.search);
    return fromLink;
  }
  try {
    return readTokenFromHash(`token=${sessionStorage.getItem(KEY) ?? ''}`);
  } catch {
    return null;
  }
}

export function forgetToken(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
