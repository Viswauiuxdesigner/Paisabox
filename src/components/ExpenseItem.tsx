import React, { useState, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Category, CurrencyCode, Expense } from '../types/expense';
import { CategoryIcon } from '../utils/icons';
import { formatCurrency, getDisplayCategoryName } from '../utils/format';

interface ExpenseItemProps {
  expense: Expense;
  category?: Category;
  currency: CurrencyCode;
  showDate?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  category,
  currency,
  showDate = false,
  onEdit,
  onDelete,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const swiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!swiping.current && Math.abs(dy) > Math.abs(dx)) {
      return;
    }
    if (Math.abs(dx) > 8) {
      swiping.current = true;
    }
    if (dx < 0) {
      setOffsetX(Math.max(-112, dx));
    } else if (offsetX < 0) {
      setOffsetX(Math.min(0, -112 + dx));
    }
  };

  const handleTouchEnd = () => {
    if (offsetX < -52) {
      setOffsetX(-112);
    } else {
      setOffsetX(0);
    }
    startX.current = null;
    startY.current = null;
  };

  const dt = parseISO(expense.date);
  const displayName = getDisplayCategoryName(expense, category);
  const color = category?.color ?? '#64748b';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/60">
      {/* Mobile swipe action buttons behind the card */}
      <div className="absolute inset-y-0 right-0 flex items-center md:hidden">
        <button
          type="button"
          onClick={() => {
            setOffsetX(0);
            onEdit(expense);
          }}
          aria-label="Edit expense"
          className="h-full w-14 flex items-center justify-center bg-sky-600 text-white active:bg-sky-700"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            setOffsetX(0);
            if (expense.id !== undefined) onDelete(expense.id);
          }}
          aria-label="Delete expense"
          className="h-full w-14 flex items-center justify-center bg-rose-600 text-white active:bg-rose-700"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Foreground row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (offsetX < -10) {
            setOffsetX(0);
            return;
          }
          onEdit(expense);
        }}
        style={{ transform: `translateX(${offsetX}px)` }}
        className="relative flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/40 rounded-2xl transition-all duration-150 ease-out group cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}1A`, color }}
          >
            <CategoryIcon name={category?.icon ?? 'tag'} size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </p>
              {expense.paymentMethod && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  {expense.paymentMethod}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {expense.note ? `${expense.note} · ` : ''}
              {showDate ? format(dt, 'dd MMM, h:mm a') : format(dt, 'h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(expense.amount, currency)}
          </span>

          {/* Visible Edit & Delete buttons (mobile + desktop) */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(expense);
              }}
              aria-label="Edit expense"
              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (expense.id !== undefined) onDelete(expense.id);
              }}
              aria-label="Delete expense"
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
