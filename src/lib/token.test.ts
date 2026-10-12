import { describe, expect, it } from 'vitest';
import { readTokenFromHash } from './token';

const HEX = 'a'.repeat(64);

describe('readTokenFromHash', () => {
  it('lit le jeton du fragment, avec ou sans « # »', () => {
    expect(readTokenFromHash(`#token=${HEX}`)).toBe(HEX);
    expect(readTokenFromHash(`token=${HEX}`)).toBe(HEX);
  });

  it('ignore les autres paramètres', () => {
    expect(readTokenFromHash(`#utm=x&token=${HEX}`)).toBe(HEX);
  });

  it.each([
    ['vide', ''],
    ['sans jeton', '#autre=1'],
    ['jeton vide', '#token='],
    ['trop court', '#token=abc'],
    ['trop long', `#token=${'a'.repeat(201)}`],
    ['caractères non sûrs', `#token=${'a'.repeat(20)}<script>`],
    ['espaces', `#token=${'a'.repeat(10)}%20${'a'.repeat(10)}`],
  ])('refuse un jeton %s', (_what, hash) => {
    expect(readTokenFromHash(hash)).toBeNull();
  });
});
