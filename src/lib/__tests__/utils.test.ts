import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname utility)', () => {
  it('combina classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  it('lida com valores condicionais', () => {
    expect(cn('base', false ? 'hidden' : undefined, 'visible')).toBe('base visible');
  });
  it('lida com undefined e null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
  it('faz merge de classes Tailwind conflitantes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('');
  });
  it('lida com arrays de classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
