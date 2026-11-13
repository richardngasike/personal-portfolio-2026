const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Dates are stored as YYYY-MM-DD. They are formatted without constructing a
// Date object so the result never shifts with the server's time zone.
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return '';
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatDateRange(options: {
  start: string | null;
  end: string | null;
  isCurrent?: boolean;
  display?: string;
}): string {
  if (options.display) return options.display;
  const start = formatMonthYear(options.start);
  const end = options.isCurrent ? 'Present' : formatMonthYear(options.end);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  }).format(date);
}

export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  in_development: 'In development',
  completed: 'Completed',
  archived: 'Archived',
};
