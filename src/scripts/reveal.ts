import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Les éléments marqués data-reveal sont masqués par le CSS dès le premier affichage (voir global.css) : ils
// apparaissent en glissant, par petits groupes, quand ils entrent dans l'écran.
export function initReveals(): void {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (items.length === 0) return;

  // Le script a démarré : l'animation de secours du CSS (qui réaffiche tout après 4 s) n'a plus lieu d'être
  items.forEach((item) => {
    item.style.animation = 'none';
  });
  gsap.set(items, { opacity: 0, y: 28 });

  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        overwrite: true,
      }),
  });
}

// Un léger décalage de profondeur sur l'accroche : le logo en filigrane descend plus lentement que la page,
// et le téléphone se redresse en remontant
export function initParallax(): void {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const scrub = {
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  };
  gsap.to('[data-parallax]', { yPercent: 16, ease: 'none', scrollTrigger: scrub });
  gsap.to('[data-hero-phone]', {
    y: -48,
    rotation: 0,
    ease: 'none',
    scrollTrigger: scrub,
  });
}
