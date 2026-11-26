export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Net Banking';

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Net Banking'];

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
};

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  sortOrder: number;
}

export interface Expense {
  id?: number;
  amount: number;
  categoryId: number;
  customLabel?: string;
  /** Local ISO string without timezone offset: YYYY-MM-DDTHH:mm */
  date: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  createdAt: number;
  updatedAt: number;
}

export type NavTab = 'home' | 'reports' | 'settings';

export type ReportPeriod = 'today' | 'weekly' | 'monthly' | 'yearly';

export interface ToastMessage {
  id: number;
  text: string;
  type?: 'success' | 'error' | 'info';
}
