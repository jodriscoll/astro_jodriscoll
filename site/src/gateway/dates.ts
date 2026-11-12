const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseYearMonth(value: string, label: string): [number, number] {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`${label} must be YYYY-MM`);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`${label} has a bad month`);
  return [Number(match[1]), month];
}

export function durationMonths(start: string, end: string): number {
  const [startYear, startMonth] = parseYearMonth(start, 'start');
  const [endYear, endMonth] = parseYearMonth(end, 'end');
  const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  if (months < 1) throw new Error(`Range ${start} – ${end} is empty`);
  return months;
}

export function formatYearMonth(value: string): string {
  const [year, month] = parseYearMonth(value, 'date');
  return `${MONTHS[month - 1]} ${year}`;
}

export function currentYearMonth(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatRange(start: string, end: string): string {
  return `${formatYearMonth(start)} – ${formatYearMonth(end)}`;
}

export function formatOpenRange(start: string): string {
  return `${formatYearMonth(start)} – Present`;
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearLabel = years === 1 ? '1 yr' : `${years} yr`;
  const monthLabel = rest === 1 ? '1 mo' : `${rest} mo`;
  if (years > 0 && rest > 0) return `${yearLabel} ${monthLabel}`;
  if (years > 0) return yearLabel;
  return monthLabel;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
