import type { TeamSize, Trade } from './waitlist-options';

// Client de la liste d'attente (back : 03-back/src/waitlist, règles dans 01-docs/02-business-rules.md).
// Chaque appel rend un résultat, jamais une exception : l'écran n'a qu'à afficher le message du cas.

export type FailureKind =
  | 'consent'
  | 'captcha'
  | 'unavailable'
  | 'rate-limited'
  | 'token-invalid'
  | 'pilot-consent'
  | 'invalid'
  | 'server'
  | 'network';

export type ApiResult = { ok: true } | { ok: false; kind: FailureKind };

export interface ApiContext {
  // Adresse de l'API, sans barre finale
  apiUrl: string;
  fetchFn?: typeof fetch;
}

export const FAILURE_MESSAGES: Record<FailureKind, string> = {
  consent: 'Cochez la case pour confirmer votre accord.',
  captcha:
    'La vérification anti-robot a échoué. Rechargez la page, puis réessayez.',
  unavailable:
    "L'inscription est momentanément indisponible. Réessayez un peu plus tard.",
  'rate-limited': 'Trop de tentatives. Patientez une minute, puis réessayez.',
  'token-invalid': "Ce lien a expiré ou n'est pas valide.",
  'pilot-consent':
    "Pour tester en avant-première, il faut accepter d'être contacté.",
  invalid: 'Vérifiez les informations saisies.',
  server: 'Une erreur est survenue. Réessayez dans un instant.',
  network: 'Connexion impossible. Vérifiez votre réseau, puis réessayez.',
};

// Codes `code` renvoyés par le back
const CODE_TO_KIND: Record<string, FailureKind> = {
  WAITLIST_CONSENT_REQUIRED: 'consent',
  CAPTCHA_FAILED: 'captcha',
  WAITLIST_UNAVAILABLE: 'unavailable',
  WAITLIST_TOKEN_INVALID: 'token-invalid',
  WAITLIST_PILOT_CONSENT_REQUIRED: 'pilot-consent',
};

export interface SubscribeInput {
  email: string;
  consent: boolean;
  // Jeton Cloudflare Turnstile, absent quand l'anti-robots n'est pas configuré (développement)
  captchaToken?: string;
  // Piège à robots : champ caché qui doit rester vide
  website?: string;
}

export interface ProfileInput {
  firstName?: string;
  company?: string;
  trade?: Trade;
  teamSize?: TeamSize;
  phone?: string;
  painPoint?: string;
  pilotInterest?: boolean;
  pilotContactConsent?: boolean;
}

async function readCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'code' in body) {
      const { code } = body as { code: unknown };
      return typeof code === 'string' ? code : undefined;
    }
  } catch {
    // corps absent ou illisible : le statut seul décide
  }
  return undefined;
}

async function send(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  { apiUrl, fetchFn = fetch }: ApiContext,
): Promise<ApiResult> {
  let response: Response;
  try {
    response = await fetchFn(`${apiUrl.replace(/\/+$/, '')}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, kind: 'network' };
  }

  if (response.ok) return { ok: true };
  if (response.status === 429) return { ok: false, kind: 'rate-limited' };

  const code = await readCode(response);
  if (code && CODE_TO_KIND[code]) return { ok: false, kind: CODE_TO_KIND[code] };
  if (response.status === 503) return { ok: false, kind: 'unavailable' };
  if (response.status >= 500) return { ok: false, kind: 'server' };
  return { ok: false, kind: 'invalid' };
}

// Le français est la seule langue du teaser (France seule, ADR-020) : c'est aussi celle de l'email envoyé
export const subscribeToWaitlist = (input: SubscribeInput, ctx: ApiContext) =>
  send('POST', '/waitlist', { ...input, lang: 'fr' }, ctx);

export const confirmWaitlistEmail = (token: string, ctx: ApiContext) =>
  send('POST', '/waitlist/confirm', { token }, ctx);

export const saveWaitlistProfile = (
  token: string,
  profile: ProfileInput,
  ctx: ApiContext,
) => send('PATCH', '/waitlist/profile', { token, ...profile }, ctx);

export const unsubscribeFromWaitlist = (token: string, ctx: ApiContext) =>
  send('POST', '/waitlist/unsubscribe', { token }, ctx);
