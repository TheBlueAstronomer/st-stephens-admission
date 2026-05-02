export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return toDate(value).toLocaleDateString('en-GB', options);
}

export function formatTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return toDate(value).toLocaleTimeString('en-GB', options);
}

export function formatDateTime(
  value: string | Date,
  dateOptions?: Intl.DateTimeFormatOptions,
  timeOptions?: Intl.DateTimeFormatOptions,
): string {
  return `${formatDate(value, dateOptions)} at ${formatTime(value, timeOptions)}`;
}
