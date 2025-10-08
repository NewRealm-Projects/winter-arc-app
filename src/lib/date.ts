const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone?: string): Intl.DateTimeFormat => {
  const cacheKey = timeZone ?? 'local';
  if (!FORMATTER_CACHE.has(cacheKey)) {
    FORMATTER_CACHE.set(
      cacheKey,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    );
  }
  return FORMATTER_CACHE.get(cacheKey)!;
};

export function todayKey(timeZone?: string): string {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}
