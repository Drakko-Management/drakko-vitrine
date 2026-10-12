import { describe, expect, it } from 'vitest';
import { stepForProgress } from './story-progress';

describe('stepForProgress', () => {
  it('découpe la progression en parts égales', () => {
    expect(stepForProgress(0, 6)).toBe(0);
    expect(stepForProgress(0.16, 6)).toBe(0);
    expect(stepForProgress(0.17, 6)).toBe(1);
    expect(stepForProgress(0.5, 6)).toBe(3);
    expect(stepForProgress(0.99, 6)).toBe(5);
  });

  it('la fin du scroll reste sur la dernière étape (progression = 1)', () => {
    expect(stepForProgress(1, 6)).toBe(5);
  });

  it('ne sort jamais des bornes, même avec une progression aberrante', () => {
    expect(stepForProgress(-0.2, 6)).toBe(0);
    expect(stepForProgress(1.7, 6)).toBe(5);
  });

  it('sans étape : zéro', () => {
    expect(stepForProgress(0.5, 0)).toBe(0);
  });
});
