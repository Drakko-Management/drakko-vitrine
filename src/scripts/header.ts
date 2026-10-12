// L'en-tête de l'accueil est transparent sur l'accroche, puis devient plein dès qu'on a commencé à descendre
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>(
    '[data-header][data-mode="overlay"]',
  );
  if (!header) return;
  const update = () => header.classList.toggle('is-solid', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}
