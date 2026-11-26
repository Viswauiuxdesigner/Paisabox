import { CURRENCIES, type CurrencyCode, type Category, type Expense } from '../types/expense';
import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.INR;
  const hasDecimals = Math.abs(amount % 1) > 0.001;
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.INR;
  if (amount >= 100000 && currency === 'INR') {
    return `${cfg.symbol}${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${cfg.symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${cfg.symbol}${Math.round(amount)}`;
}

export function toLocalDateTimeInput(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function toLocalDateInput(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function getDisplayCategoryName(expense: Expense, category?: Category): string {
  if (!category) return expense.customLabel?.trim() || 'Other';
  if (category.name.toLowerCase() === 'other' && expense.customLabel?.trim()) {
    return expense.customLabel.trim();
  }
  return category.name;
}

export function exportExpensesToCSV(expenses: Expense[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const headers = ['ID', 'Date', 'Time', 'Category', 'Custom Label', 'Amount', 'Payment Method', 'Note'];
  const escape = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = expenses.map((e) => {
    const dt = parseISO(e.date);
    const cat = catMap.get(e.categoryId);
    return [
      e.id ?? '',
      format(dt, 'yyyy-MM-dd'),
      format(dt, 'HH:mm'),
      cat?.name ?? 'Other',
      e.customLabel ?? '',
      e.amount,
      e.paymentMethod ?? '',
      e.note ?? '',
    ]
      .map(escape)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
