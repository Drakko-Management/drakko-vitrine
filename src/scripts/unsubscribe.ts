import { FAILURE_MESSAGES, unsubscribeFromWaitlist } from '../lib/waitlist-api';
import { readConfig } from './config';
import { forgetToken, takeToken } from './session-token';

// Page ouverte depuis le lien « supprimer mon adresse » de l'email. Rien n'est supprimé à l'ouverture : un
// robot qui préchargerait les liens d'un email ne doit pas effacer l'inscription. Il faut cliquer.

const { apiUrl } = readConfig();
const token = takeToken();

const views = [...document.querySelectorAll<HTMLElement>('[data-view]')];
function show(name: string): void {
  views.forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  document.querySelector<HTMLElement>(`[data-view="${name}"]`)?.focus();
}

if (!token) {
  show('invalid');
} else {
  show('ready');
  const button = document.querySelector<HTMLButtonElement>('[data-confirm]')!;
  const status = document.querySelector<HTMLElement>('[data-status]')!;

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.dataset.state = 'busy';
    status.textContent = 'Suppression en cours…';

    const result = await unsubscribeFromWaitlist(token, { apiUrl });
    if (result.ok) {
      forgetToken();
      show('done');
      return;
    }
    if (result.kind === 'token-invalid') {
      forgetToken();
      show('invalid');
      return;
    }
    status.dataset.state = 'error';
    status.textContent = FAILURE_MESSAGES[result.kind];
    button.disabled = false;
  });
}
