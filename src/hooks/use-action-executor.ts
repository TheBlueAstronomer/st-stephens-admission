'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/action-result';

type SuccessMessage<T> = string | ((result: ActionResult<T>) => string | null | undefined);

interface ExecuteActionOptions<T> {
  action: () => Promise<ActionResult<T>>;
  successMessage?: SuccessMessage<T>;
  errorMessage?: string;
  refresh?: boolean;
  onSuccess?: (result: ActionResult<T>) => void;
  onError?: (message: string, result: ActionResult<T>) => void;
}

function resolveSuccessMessage<T>(
  successMessage: SuccessMessage<T> | undefined,
  result: ActionResult<T>,
) {
  if (!successMessage) {
    return null;
  }

  return typeof successMessage === 'function' ? successMessage(result) : successMessage;
}

export function useActionExecutor() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const executeAction = <T,>({
    action,
    successMessage,
    errorMessage,
    refresh = false,
    onSuccess,
    onError,
  }: ExecuteActionOptions<T>) => {
    startTransition(async () => {
      const result = await action();

      if (result.success) {
        const message = resolveSuccessMessage(successMessage, result);
        if (message) {
          toast.success(message);
        }
        onSuccess?.(result);
        if (refresh) {
          router.refresh();
        }
        return;
      }

      const message = result.error ?? errorMessage ?? 'Action failed.';
      if (onError) {
        onError(message, result);
        return;
      }

      toast.error(message);
    });
  };

  return {
    isPending,
    executeAction,
  };
}
