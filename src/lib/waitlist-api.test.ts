import { describe, expect, it, vi } from 'vitest';
import {
  confirmWaitlistEmail,
  FAILURE_MESSAGES,
  saveWaitlistProfile,
  subscribeToWaitlist,
  unsubscribeFromWaitlist,
  type FailureKind,
} from './waitlist-api';

const API = 'https://api.acme.test';

const answer = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  );

describe('ce qui part à l’API', () => {
  it('inscription : POST /waitlist avec le corps attendu et la langue française', async () => {
    const fetchFn = answer(204);

    const result = await subscribeToWaitlist(
      { email: 'lea@acme.test', consent: true, captchaToken: 'tok', website: '' },
      { apiUrl: API, fetchFn },
    );

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API}/waitlist`);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'lea@acme.test',
      consent: true,
      captchaToken: 'tok',
      website: '',
      lang: 'fr',
    });
  });

  it("l'adresse de l'API peut se terminer par une barre", async () => {
    const fetchFn = answer(204);

    await subscribeToWaitlist(
      { email: 'a@b.test', consent: true },
      { apiUrl: `${API}///`, fetchFn },
    );

    expect(fetchFn.mock.calls[0][0]).toBe(`${API}/waitlist`);
  });

  it('confirmation, fiche et désinscription : la bonne route, la bonne méthode, le jeton dans le corps', async () => {
    const fetchFn = answer(204);
    const ctx = { apiUrl: API, fetchFn };

    await confirmWaitlistEmail('jeton', ctx);
    await saveWaitlistProfile('jeton', { firstName: 'Léa', trade: 'ROOFER' }, ctx);
    await unsubscribeFromWaitlist('jeton', ctx);

    const calls = fetchFn.mock.calls as [string, RequestInit][];
    expect(calls.map(([url, init]) => `${init.method} ${url}`)).toEqual([
      `POST ${API}/waitlist/confirm`,
      `PATCH ${API}/waitlist/profile`,
      `POST ${API}/waitlist/unsubscribe`,
    ]);
    expect(JSON.parse(calls[0][1].body as string)).toEqual({ token: 'jeton' });
    expect(JSON.parse(calls[1][1].body as string)).toEqual({
      token: 'jeton',
      firstName: 'Léa',
      trade: 'ROOFER',
    });
    expect(JSON.parse(calls[2][1].body as string)).toEqual({ token: 'jeton' });
  });

  it('le jeton ne part jamais dans l’adresse', async () => {
    const fetchFn = answer(204);

    await confirmWaitlistEmail('secret-123', { apiUrl: API, fetchFn });

    expect(fetchFn.mock.calls[0][0]).not.toContain('secret-123');
  });
});

describe('ce que répond l’API', () => {
  const kindOf = async (status: number, body?: unknown) => {
    const result = await subscribeToWaitlist(
      { email: 'a@b.test', consent: true },
      { apiUrl: API, fetchFn: answer(status, body) },
    );
    return result.ok ? 'ok' : result.kind;
  };

  it.each<[number, unknown, FailureKind]>([
    [400, { code: 'WAITLIST_CONSENT_REQUIRED' }, 'consent'],
    [400, { code: 'CAPTCHA_FAILED' }, 'captcha'],
    [503, { code: 'WAITLIST_UNAVAILABLE' }, 'unavailable'],
    [400, { code: 'WAITLIST_TOKEN_INVALID' }, 'token-invalid'],
    [400, { code: 'WAITLIST_PILOT_CONSENT_REQUIRED' }, 'pilot-consent'],
  ])('%i avec le code %j → %s', async (status, body, kind) => {
    expect(await kindOf(status, body)).toBe(kind);
  });

  it('204 : réussite', async () => {
    expect(await kindOf(204)).toBe('ok');
  });

  it('429 : trop de tentatives, quel que soit le corps', async () => {
    expect(await kindOf(429)).toBe('rate-limited');
    expect(await kindOf(429, { message: 'ThrottlerException' })).toBe(
      'rate-limited',
    );
  });

  it('400 sans code (erreur de validation du serveur) : informations à vérifier', async () => {
    expect(await kindOf(400, { message: ['email must be an email'] })).toBe(
      'invalid',
    );
  });

  it('503 sans code : indisponible ; autre 5xx : erreur serveur', async () => {
    expect(await kindOf(503)).toBe('unavailable');
    expect(await kindOf(500)).toBe('server');
    expect(await kindOf(502, '<html>Bad gateway</html>')).toBe('server');
  });

  it('un code inconnu retombe sur le statut', async () => {
    expect(await kindOf(400, { code: 'AUTRE_CHOSE' })).toBe('invalid');
  });

  it('réseau coupé : jamais d’exception, un résultat « network »', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await subscribeToWaitlist(
      { email: 'a@b.test', consent: true },
      { apiUrl: API, fetchFn },
    );

    expect(result).toEqual({ ok: false, kind: 'network' });
  });

  it('chaque cas d’échec a un message à afficher, en français, sans texte technique', () => {
    for (const [kind, message] of Object.entries(FAILURE_MESSAGES)) {
      expect(message, kind).toMatch(/\S{3,}/);
      expect(message, kind).not.toMatch(/WAITLIST|CAPTCHA_|undefined|\[object/);
    }
  });
});
