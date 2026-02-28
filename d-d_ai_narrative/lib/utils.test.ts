import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('fusionne des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('résout les conflits Tailwind (dernière classe gagne)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('ignore les valeurs falsy (false, undefined, null, empty)', () => {
    expect(cn('foo', false, undefined, null, '', 'bar')).toBe('foo bar');
  });
});
