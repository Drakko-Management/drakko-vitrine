// Anti-robots Cloudflare Turnstile. Le script de Cloudflare n'est chargé qu'au premier geste de l'internaute
// dans un formulaire (pas à l'ouverture de la page) : pas d'appel à un tiers pour qui ne s'inscrit pas.
// Le widget reste invisible, sauf si Cloudflare juge qu'un défi est nécessaire.

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TOKEN_TIMEOUT_MS = 20_000;

let loading: Promise<TurnstileApi | null> | null = null;

function loadApi(): Promise<TurnstileApi | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile ?? null);
    script.onerror = () => resolve(null);
    document.head.append(script);
  });
  return loading;
}

export interface TurnstileHandle {
  // Le jeton prouvant que la personne est réelle, ou null (script bloqué, échec, délai dépassé)
  getToken(): Promise<string | null>;
  // Un jeton ne sert qu'une fois : à appeler après chaque envoi
  reset(): void;
}

export function createTurnstile(
  container: HTMLElement,
  siteKey: string,
): TurnstileHandle {
  let token: string | null = null;
  let widgetId: string | undefined;
  let waiters: Array<(value: string | null) => void> = [];

  const settle = (value: string | null) => {
    token = value;
    const pending = waiters;
    waiters = [];
    pending.forEach((resolve) => resolve(value));
  };

  const ready = loadApi().then((api) => {
    if (!api) {
      settle(null);
      return null;
    }
    widgetId = api.render(container, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      callback: (value: string) => settle(value),
      'error-callback': () => settle(null),
      'expired-callback': () => {
        token = null;
      },
    });
    return api;
  });

  return {
    getToken() {
      if (token) return Promise.resolve(token);
      const answer = new Promise<string | null>((resolve) => waiters.push(resolve));
      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS),
      );
      return Promise.race([answer, timeout]);
    },
    reset() {
      token = null;
      void ready.then((api) => api?.reset(widgetId));
    },
  };
}
