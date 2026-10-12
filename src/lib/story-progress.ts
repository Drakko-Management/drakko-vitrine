// L'étape du récit qui correspond à la progression du scroll dans la zone du récit (0 au début, 1 à la fin)
export function stepForProgress(progress: number, steps: number): number {
  if (steps <= 0) return 0;
  const index = Math.floor(progress * steps);
  return Math.min(steps - 1, Math.max(0, index));
}
