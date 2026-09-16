/** API timestamps without an explicit timezone represent UTC. */
export function parseApiDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  const timestamp = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  return new Date(hasTimezone ? timestamp : `${timestamp}Z`);
}
