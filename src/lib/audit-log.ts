type AuditPrimitive = string | number | boolean | null;

export interface AuditValuePayload {
  version: 1;
  label?: string;
  value?: AuditPrimitive;
  summary?: string;
  fields?: Record<string, AuditPrimitive>;
  target?: {
    type: string;
    id?: string | null;
  };
}

function toAuditPrimitive(value: unknown): AuditPrimitive {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value);
}

function toAuditFields(fields: Record<string, unknown>): Record<string, AuditPrimitive> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, toAuditPrimitive(value)]),
  );
}

export function serializeAuditValue(payload: Omit<AuditValuePayload, 'version'>): string {
  return JSON.stringify({
    version: 1,
    ...payload,
  } satisfies AuditValuePayload);
}

export function serializeAuditScalar(label: string, value: unknown): string {
  return serializeAuditValue({
    label,
    value: toAuditPrimitive(value),
  });
}

export function serializeAuditFields(
  summary: string,
  fields: Record<string, unknown>,
  target?: AuditValuePayload['target'],
): string {
  return serializeAuditValue({
    summary,
    fields: toAuditFields(fields),
    target,
  });
}

export function parseAuditValue(raw: string | null | undefined): AuditValuePayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        version: 1,
        value: String(parsed),
      };
    }

    const record = parsed as Record<string, unknown>;
    if (record.version === 1) {
      return record as unknown as AuditValuePayload;
    }

    return {
      version: 1,
      fields: toAuditFields(record),
    };
  } catch {
    return {
      version: 1,
      value: raw,
    };
  }
}

function formatPrimitive(value: AuditPrimitive | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function formatAuditValue(raw: string | null | undefined): string {
  const parsed = parseAuditValue(raw);
  if (!parsed) return '';

  if (parsed.label) {
    return `${parsed.label}: ${formatPrimitive(parsed.value)}`;
  }

  if (parsed.summary) {
    return parsed.summary;
  }

  if (parsed.fields && Object.keys(parsed.fields).length > 0) {
    return Object.entries(parsed.fields)
      .map(([key, value]) => `${key}: ${formatPrimitive(value)}`)
      .join(', ');
  }

  return formatPrimitive(parsed.value);
}
