import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import {
  CURRENCIES,
  PAYMENT_METHODS,
  type Category,
  type CurrencyCode,
  type Expense,
  type PaymentMethod,
} from '../types/expense';
import { CategoryIcon } from '../utils/icons';
import { toLocalDateTimeInput } from '../utils/format';

interface ExpenseFormProps {
  categories: Category[];
  currency: CurrencyCode;
  initialExpense?: Expense | null;
  onSave: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>, existingId?: number) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  currency,
  initialExpense,
  onSave,
  onCancel,
  compact = false,
}) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 1);
  const [customLabel, setCustomLabel] = useState('');
  const [date, setDate] = useState(toLocalDateTimeInput());
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>('UPI');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialExpense) {
      setAmount(String(initialExpense.amount));
      setCategoryId(initialExpense.categoryId);
      setCustomLabel(initialExpense.customLabel ?? '');
      setDate(initialExpense.date.slice(0, 16));
      setNote(initialExpense.note ?? '');
      setPaymentMethod(initialExpense.paymentMethod);
    } else if (categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id!);
    }
  }, [initialExpense, categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isOtherSelected = selectedCategory?.name.toLowerCase() === 'other';
  const currencySymbol = CURRENCIES[currency]?.symbol ?? '₹';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(
        {
          amount: Math.round(numericAmount * 100) / 100,
          categoryId,
          customLabel: isOtherSelected && customLabel.trim() ? customLabel.trim() : undefined,
          date: date || toLocalDateTimeInput(),
          note: note.trim() || undefined,
          paymentMethod,
        },
        initialExpense?.id
      );
      if (!initialExpense) {
        setAmount('');
        setCustomLabel('');
        setNote('');
        setDate(toLocalDateTimeInput());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Amount
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-2xl font-bold text-teal-600 dark:text-teal-400 select-none">
            {currencySymbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError('');
            }}
            className="w-full pl-11 pr-4 py-3.5 text-2xl font-bold rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all tabular-nums"
            required
          />
        </div>
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>

      {/* Category Chips */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Category
        </label>
        <div
          className={`flex flex-wrap gap-2 ${
            compact ? 'max-h-36 overflow-y-auto pr-1' : ''
          }`}
        >
          {categories.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id!)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? 'text-white shadow-sm scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={
                  active
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                <CategoryIcon name={cat.icon} size={14} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Label when "Other" is selected */}
      {isOtherSelected && (
        <div className="animate-fade-in">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Custom Label (for Other)
          </label>
          <input
            type="text"
            placeholder="e.g., Haircut, Donation, Gift"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            maxLength={40}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
          />
        </div>
      )}

      {/* Date & Note row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Payment Method (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(active ? undefined : method)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit & Cancel */}
      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X size={16} />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-5 rounded-2xl text-sm font-bold bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Check size={18} />
          {saving ? 'Saving...' : initialExpense ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
};
