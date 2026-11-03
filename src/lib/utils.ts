import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { MONTHS } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateEmployeeId(index: number): string {
  return `EMP-${String(index + 1).padStart(3, '0')}`;
}

export function formatDate(date: string): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return date;
  }
}

export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number = 0, symbol: string = '৳'): string {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  const isNegative = safeAmount < 0;
  const absoluteFormatted = Math.abs(safeAmount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${absoluteFormatted}`;
}

export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function getMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return MONTHS[month - 1];
}

export function getMonthYear(month: number, year: number): string {
  const monthName = getMonthName(month);
  return `${monthName} ${year}`;
}

/**
 * Returns YYYY-MM-DD formatted string in local time, preventing UTC midnight date skews.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
