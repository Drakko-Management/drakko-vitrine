import {
  confirmWaitlistEmail,
  FAILURE_MESSAGES,
  saveWaitlistProfile,
  type ProfileInput,
} from '../lib/waitlist-api';
import type { TeamSize, Trade } from '../lib/waitlist-options';
import { readConfig } from './config';
import { forgetToken, takeToken } from './session-token';

// Page ouverte depuis le lien de l'email : confirme l'adresse, puis propose la fiche facultative. Le jeton du
// lien autorise les deux ; il n'est jamais mis dans une adresse de requête.

const { apiUrl } = readConfig();
const token = takeToken();

const views = [...document.querySelectorAll<HTMLElement>('[data-view]')];
function show(name: string): void {
  views.forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  document.querySelector<HTMLElement>(`[data-view="${name}"]`)?.focus();
}

async function confirm(): Promise<void> {
  if (!token) return show('invalid');
  show('loading');
  const result = await confirmWaitlistEmail(token, { apiUrl });
  if (result.ok) return show('confirmed');
  if (result.kind === 'token-invalid') {
    forgetToken();
    return show('invalid');
  }
  const text = document.querySelector('[data-error-text]');
  if (text) text.textContent = FAILURE_MESSAGES[result.kind];
  show('error');
}

document.querySelector('[data-retry]')?.addEventListener('click', () => void confirm());
void confirm();

// ----- la fiche -----

const form = document.querySelector<HTMLFormElement>('[data-profile-form]');
if (form && token) {
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const consentRow = form.querySelector<HTMLElement>('[data-consent-row]')!;
  const painPoint = form.elements.namedItem('painPoint') as HTMLTextAreaElement;
  const count = form.querySelector<HTMLElement>('[data-count]')!;
  const interest = form.elements.namedItem('pilotInterest') as HTMLInputElement;
  const consent = form.elements.namedItem('pilotContactConsent') as HTMLInputElement;

  const say = (state: 'busy' | 'error' | 'idle', text = '') => {
    status.dataset.state = state;
    status.textContent = text;
  };

  painPoint.addEventListener('input', () => {
    count.textContent = `${painPoint.value.length} / 500`;
  });

  // Le consentement à être contacté n'apparaît que si l'on demande à tester
  interest.addEventListener('change', () => {
    consentRow.hidden = !interest.checked;
    if (!interest.checked) consent.checked = false;
  });

  const value = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value.trim();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    // Tester suppose d'accepter d'être contacté : on le dit avant d'appeler l'API
    if (interest.checked && !consent.checked) {
      say('error', FAILURE_MESSAGES['pilot-consent']);
      consent.focus();
      return;
    }

    const profile: ProfileInput = {
      firstName: value('firstName'),
      company: value('company'),
      phone: value('phone'),
      painPoint: value('painPoint'),
      pilotInterest: interest.checked,
      pilotContactConsent: consent.checked,
    };
    // Une liste laissée sur « Choisir… » n'envoie rien (le serveur refuserait une valeur vide)
    if (value('trade')) profile.trade = value('trade') as Trade;
    if (value('teamSize')) profile.teamSize = value('teamSize') as TeamSize;

    submit.disabled = true;
    say('busy', 'Enregistrement…');
    const result = await saveWaitlistProfile(token, profile, { apiUrl });

    if (result.ok) {
      say('idle');
      forgetToken();
      show('saved');
      return;
    }
    if (result.kind === 'token-invalid') {
      forgetToken();
      show('invalid');
      return;
    }
    say('error', FAILURE_MESSAGES[result.kind]);
    submit.disabled = false;
  });
}
