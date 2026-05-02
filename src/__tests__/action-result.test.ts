import { describe, expect, it } from 'vitest';
import {
  actionError,
  actionSuccess,
  toActionResult,
  toVoidActionResult,
  validationError,
} from '@/lib/action-result';

describe('shared action result helpers', () => {
  it('builds success payloads with optional data and warning', () => {
    expect(actionSuccess({ id: 'abc' }, 'duplicate email')).toEqual({
      success: true,
      data: { id: 'abc' },
      warning: 'duplicate email',
    });
  });

  it('builds standardized error payloads', () => {
    expect(actionError('Nope')).toEqual({
      success: false,
      error: 'Nope',
    });
  });

  it('formats flattened validation errors into one message', () => {
    expect(
      validationError({
        flatten: () => ({
          fieldErrors: {
            name: ['Name is required'],
            email: ['Email is invalid'],
          },
        }),
      }),
    ).toEqual({
      success: false,
      error: 'Name is required; Email is invalid',
    });
  });

  it('converts workflow-style results into the shared action result contract', () => {
    expect(toActionResult({ success: true, data: { interviewId: 'iv-1' } })).toEqual({
      success: true,
      data: { interviewId: 'iv-1' },
    });

    expect(toActionResult({ success: false, error: 'Interview not found.' })).toEqual({
      success: false,
      error: 'Interview not found.',
    });
  });

  it('drops internal data when normalizing void action responses', () => {
    expect(
      toVoidActionResult({
        success: true,
        warning: 'Heads up',
      }),
    ).toEqual({
      success: true,
      warning: 'Heads up',
    });
  });
});
