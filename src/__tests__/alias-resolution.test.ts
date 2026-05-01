import { describe, it, expect } from 'vitest';

describe('@/ import alias resolution', () => {
  it('resolves @/lib/utils (cn function)', async () => {
    const { cn } = await import('@/lib/utils');
    expect(cn).toBeDefined();
    expect(typeof cn).toBe('function');
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves @/lib/db (prisma singleton)', async () => {
    const mod = await import('@/lib/db');
    expect(mod.prisma).toBeDefined();
  });

  it('resolves @/components/ui/button', async () => {
    const { Button } = await import('@/components/ui/button');
    expect(Button).toBeDefined();
  });
});
