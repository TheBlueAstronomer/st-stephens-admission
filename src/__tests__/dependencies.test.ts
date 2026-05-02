import { describe, it, expect } from 'vitest';

describe('Shared frontend dependencies', () => {
  it('react-hook-form useForm is importable', async () => {
    const { useForm } = await import('react-hook-form');
    expect(useForm).toBeDefined();
  });

  it('zod z.string() returns a schema', async () => {
    const { z } = await import('zod');
    const schema = z.string();
    expect(schema).toBeDefined();
    expect(schema.parse('hello')).toBe('hello');
  });

  it('@hookform/resolvers zodResolver is importable', async () => {
    const { zodResolver } = await import('@hookform/resolvers/zod');
    expect(zodResolver).toBeDefined();
  });

  it('recharts is importable', async () => {
    const recharts = await import('recharts');
    expect(recharts.BarChart).toBeDefined();
  }, 20_000);
});
