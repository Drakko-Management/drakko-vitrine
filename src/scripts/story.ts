import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stepForProgress } from '../lib/story-progress';

// Le récit en mode « épinglé » : le CSS fixe la scène à l'écran (position: sticky) pendant que la page défile
// dans une zone haute ; ici, on lit la progression du scroll pour montrer l'étape qui correspond. Le texte de
// toutes les étapes reste dans la page (opacité seulement, jamais « caché ») : un lecteur d'écran les lit toutes.
// Rend la fonction qui défait tout (changement de taille d'écran ou de préférence).
export function initStory(): () => void {
  const root = document.querySelector<HTMLElement>('[data-story]');
  const track = root?.querySelector<HTMLElement>('[data-story-track]');
  if (!root || !track) return () => undefined;

  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-goto]')];
  const texts = steps.map((s) => s.querySelector<HTMLElement>('[data-step-text]')!);
  const phones = steps.map((s) => s.querySelector<HTMLElement>('[data-step-phone]')!);

  root.dataset.pinned = 'true';
  gsap.set([...texts, ...phones], { opacity: 0 });
  gsap.set(phones, { zIndex: 0 });

  let current = -1;

  const show = (next: number) => {
    const previous = current;
    current = next;

    buttons.forEach((button, i) => {
      if (i === next) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    // Une étape peut être traversée sans qu'on s'y arrête (défilement rapide, lien avec ancre) : toute animation
    // encore en cours, retardée comprise, est annulée avant d'en lancer d'autres. Sinon l'apparition retardée
    // d'une étape déjà quittée reprendrait la main sur son effacement.
    gsap.killTweensOf([...texts, ...phones]);

    // Textes : les anciens s'effacent vite, le nouveau arrive juste après
    texts.forEach((text, i) => {
      if (i !== next) {
        gsap.to(text, { opacity: 0, y: -18, duration: 0.25, ease: 'power2.in' });
      }
    });
    gsap.fromTo(
      texts[next],
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.55, delay: 0.15, ease: 'power3.out' },
    );

    // Téléphones : le nouveau apparaît PAR-DESSUS l'ancien, qui reste opaque en dessous jusqu'à la fin. Deux
    // cadres qui s'estompent en même temps laisseraient transparaître le fond pendant le fondu.
    phones.forEach((phone, i) => {
      if (i !== next && i !== previous) gsap.set(phone, { opacity: 0, zIndex: 0 });
    });
    if (previous >= 0) gsap.set(phones[previous], { zIndex: 1 });
    gsap.set(phones[next], { zIndex: 2 });
    gsap.to(phones[next], {
      opacity: 1,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        if (current !== next) return;
        phones.forEach((phone, i) => {
          if (i !== next) gsap.set(phone, { opacity: 0, zIndex: 0 });
        });
      },
    });
  };

  const trigger = ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const next = stepForProgress(self.progress, steps.length);
      if (next !== current) show(next);
    },
  });
  // État initial juste, même si l'on arrive au milieu du récit (rechargement, lien avec ancre)
  show(stepForProgress(trigger.progress, steps.length));

  const abort = new AbortController();
  buttons.forEach((button, i) => {
    button.addEventListener(
      'click',
      () => {
        const target =
          trigger.start + (trigger.end - trigger.start) * ((i + 0.5) / steps.length);
        window.scrollTo({ top: target, behavior: 'smooth' });
      },
      { signal: abort.signal },
    );
  });

  return () => {
    abort.abort();
    trigger.kill();
    delete root.dataset.pinned;
    gsap.set([...texts, ...phones], { clearProps: 'all' });
    buttons.forEach((button) => button.removeAttribute('aria-current'));
  };
}
