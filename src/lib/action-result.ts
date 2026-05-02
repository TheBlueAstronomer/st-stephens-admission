export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

type FlattenableValidationError = {
  flatten: () => {
    fieldErrors: Record<string, string[] | undefined>;
  };
};

export function actionSuccess<T>(data?: T, warning?: string): ActionResult<T> {
  return {
    success: true,
    ...(data !== undefined ? { data } : {}),
    ...(warning ? { warning } : {}),
  };
}

export function actionError<T = void>(error: string, warning?: string): ActionResult<T> {
  return {
    success: false,
    error,
    ...(warning ? { warning } : {}),
  };
}

export function validationError<T = void>(
  error: FlattenableValidationError,
  fallback = 'Validation failed.',
): ActionResult<T> {
  const message = Object.values(error.flatten().fieldErrors)
    .flat()
    .filter(Boolean)
    .join('; ');

  return actionError<T>(message || fallback);
}

export function toActionResult<T>(result: {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}): ActionResult<T> {
  if (result.success) {
    return actionSuccess(result.data, result.warning);
  }

  return actionError(result.error ?? 'Unexpected action failure.', result.warning);
}

export function toVoidActionResult(result: {
  success: boolean;
  error?: string;
  warning?: string;
}): ActionResult {
  if (result.success) {
    return actionSuccess(undefined, result.warning);
  }

  return actionError(result.error ?? 'Unexpected action failure.', result.warning);
}
