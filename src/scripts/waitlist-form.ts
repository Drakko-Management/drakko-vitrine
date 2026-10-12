import { createTurnstile, type TurnstileHandle } from '../lib/turnstile';
import { FAILURE_MESSAGES, subscribeToWaitlist } from '../lib/waitlist-api';
import { readConfig } from './config';

// Étape 1 de la liste d'attente (WaitlistForm.astro) : une même logique pour tous les formulaires de la page.

export function initWaitlistForms(): void {
  const { apiUrl, turnstileSiteKey } = readConfig();
  document
    .querySelectorAll<HTMLElement>('[data-waitlist]')
    .forEach((root) => attach(root, apiUrl, turnstileSiteKey));
}

function attach(root: HTMLElement, apiUrl: string, siteKey?: string): void {
  const form = root.querySelector<HTMLFormElement>('[data-waitlist-form]');
  const done = root.querySelector<HTMLElement>('[data-done]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const submit = root.querySelector<HTMLButtonElement>('[data-submit]');
  const container = root.querySelector<HTMLElement>('[data-turnstile]');
  if (!form || !done || !status || !submit || !container) return;

  const email = form.elements.namedItem('email') as HTMLInputElement;
  const consent = form.elements.namedItem('consent') as HTMLInputElement;
  const trap = form.elements.namedItem('website') as HTMLInputElement;

  let turnstile: TurnstileHandle | null = null;
  const ensureTurnstile = (): TurnstileHandle | null => {
    if (siteKey && !turnstile) turnstile = createTurnstile(container, siteKey);
    return turnstile;
  };
  // Le script de Cloudflare ne se charge qu'au premier geste dans le formulaire
  form.addEventListener('focusin', ensureTurnstile, { once: true });

  const say = (state: 'busy' | 'error' | 'idle', text = '') => {
    status.dataset.state = state;
    status.textContent = text;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const address = email.value.trim();
    if (!address || !email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      say('error', 'Saisissez une adresse email valide.');
      email.focus();
      return;
    }
    email.removeAttribute('aria-invalid');
    if (!consent.checked) {
      say('error', FAILURE_MESSAGES.consent);
      consent.focus();
      return;
    }

    submit.disabled = true;
    say('busy', 'Envoi en cours…');

    let captchaToken: string | undefined;
    const widget = ensureTurnstile();
    if (widget) {
      say('busy', 'Vérification en cours…');
      const token = await widget.getToken();
      if (!token) {
        say('error', FAILURE_MESSAGES.captcha);
        submit.disabled = false;
        return;
      }
      captchaToken = token;
    }

    const result = await subscribeToWaitlist(
      { email: address, consent: true, captchaToken, website: trap.value },
      { apiUrl },
    );
    widget?.reset();

    if (result.ok) {
      say('idle');
      form.hidden = true;
      const shown = done.querySelector('[data-email]');
      if (shown) shown.textContent = address;
      done.hidden = false;
      done.focus();
      return;
    }
    say('error', FAILURE_MESSAGES[result.kind]);
    submit.disabled = false;
  });
}
