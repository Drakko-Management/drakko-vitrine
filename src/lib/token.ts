// Les liens de l'email portent le jeton dans le fragment (`#token=…`) : il n'est jamais envoyé au serveur
// web ni dans un en-tête Referer. Le jeton du back est hexadécimal (32 octets) ; on accepte un peu plus large
// pour ne pas dépendre du format exact, mais jamais autre chose que des caractères sûrs.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,200}$/;

export function readTokenFromHash(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return token && TOKEN_PATTERN.test(token) ? token : null;
}
