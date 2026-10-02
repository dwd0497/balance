import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const moneyFormatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

export function formatMoney(amount: string | number) {
  return moneyFormatter.format(Number(amount));
}
