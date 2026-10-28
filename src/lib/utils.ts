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
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${symbol}${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
