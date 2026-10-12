import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHeader } from './header';
import { initParallax, initReveals } from './reveal';
import { initStory } from './story';
import { initWaitlistForms } from './waitlist-form';

gsap.registerPlugin(ScrollTrigger);

initWaitlistForms();
initHeader();

// Les animations ne s'installent que si l'internaute les accepte ; le récit n'est épinglé que sur un grand
// écran. Un changement (rotation, redimensionnement, préférence) défait et refait ce qui convient.
const media = gsap.matchMedia();
media.add(
  {
    motion: '(prefers-reduced-motion: no-preference)',
    pinned:
      '(min-width: 62rem) and (min-height: 36rem) and (prefers-reduced-motion: no-preference)',
  },
  (context) => {
    const { motion, pinned } = context.conditions as {
      motion: boolean;
      pinned: boolean;
    };
    let undoStory: (() => void) | undefined;
    if (motion) {
      initReveals();
      initParallax();
    }
    if (pinned) undoStory = initStory();
    return () => undoStory?.();
  },
);
