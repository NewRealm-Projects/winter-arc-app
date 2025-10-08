import { describe, expect, it } from 'vitest';
import { getRouterBasename } from '../lib/router';

describe('getRouterBasename', () => {
  it('returns undefined for empty, root, or dot root bases', () => {
    expect(getRouterBasename(undefined)).toBeUndefined();
    expect(getRouterBasename('')).toBeUndefined();
    expect(getRouterBasename('/')).toBeUndefined();
    expect(getRouterBasename('./')).toBeUndefined();
  });

  it('normalizes trailing slashes and enforces leading slash', () => {
    expect(getRouterBasename('/winter-arc-app/')).toBe('/winter-arc-app');
    expect(getRouterBasename('winter-arc-app/')).toBe('/winter-arc-app');
    expect(getRouterBasename('winter-arc-app')).toBe('/winter-arc-app');
  });

  it('ignores inputs that normalize back to root', () => {
    expect(getRouterBasename('///')).toBeUndefined();
    expect(getRouterBasename(' / ')).toBeUndefined();
  });
});
