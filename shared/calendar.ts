export type CalendarInput = Date | string | number;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidMonthKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = MONTH_KEY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1 && year <= 9999 && month >= 1 && month <= 12;
}

export function assertMonthKey(value: string): string {
  if (!isValidMonthKey(value)) throw new Error("Mês inválido. Use o formato YYYY-MM.");
  return value;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateKeyFromDate(value: CalendarInput): string {
  if (typeof value === "string" && DATE_KEY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const candidate = new Date(Date.UTC(year, month - 1, day, 12));
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) return value;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function monthKeyFromDate(value: CalendarInput): string {
  return dateKeyFromDate(value).slice(0, 7);
}

export function currentMonthKey(now = new Date()): string {
  return monthKeyFromDate(now);
}

export function formatMonthLabel(month: string, options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) {
  if (!isValidMonthKey(month)) return "período inválido";
  return new Intl.DateTimeFormat("pt-BR", options).format(monthStartDate(month));
}

export function monthOptions(centerMonth: string, radius = 2): string[] {
  const base = isValidMonthKey(centerMonth) ? centerMonth : currentMonthKey();
  const [year, month] = base.split("-").map(Number);
  return Array.from({ length: radius * 2 + 1 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index - radius, 1, 12));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
  });
}

export function isDateInMonth(value: CalendarInput, month: string): boolean {
  return isValidMonthKey(month) && monthKeyFromDate(value) === month;
}

export function monthStartDate(month: string): Date {
  assertMonthKey(month);
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1, 12));
}

export function monthEndDate(month: string): Date {
  assertMonthKey(month);
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));
}
