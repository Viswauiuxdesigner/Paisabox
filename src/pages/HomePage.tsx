import React, { useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { TrendingUp, Calendar, CalendarDays, Award, PlusCircle } from 'lucide-react';
import type { Category, CurrencyCode, Expense } from '../types/expense';
import { formatCurrency } from '../utils/format';
import { CategoryIcon } from '../utils/icons';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseItem } from '../components/ExpenseItem';

interface HomePageProps {
  expenses: Expense[];
  categories: Category[];
  currency: CurrencyCode;
  onSaveExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>, existingId?: number) => Promise<void>;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  onOpenReports: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  expenses,
  categories,
  currency,
  onSaveExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenReports,
}) => {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayRange = { start: startOfDay(now), end: endOfDay(now) };
    const weekRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    const todayList: Expense[] = [];
    const monthByCat = new Map<number, number>();

    for (const exp of expenses) {
      const dt = parseISO(exp.date);
      if (isWithinInterval(dt, todayRange)) {
        todayTotal += exp.amount;
        todayList.push(exp);
      }
      if (isWithinInterval(dt, weekRange)) {
        weekTotal += exp.amount;
      }
      if (isWithinInterval(dt, monthRange)) {
        monthTotal += exp.amount;
        monthByCat.set(exp.categoryId, (monthByCat.get(exp.categoryId) ?? 0) + exp.amount);
      }
    }

    let topCatId: number | null = null;
    let topCatAmount = 0;
    for (const [cid, amt] of monthByCat.entries()) {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatId = cid;
      }
    }

    const topCategory = topCatId !== null ? catMap.get(topCatId) : undefined;
    const topCategoryPct = monthTotal > 0 ? Math.round((topCatAmount / monthTotal) * 100) : 0;

    return {
      todayTotal,
      weekTotal,
      monthTotal,
      todayList,
      last5: expenses.slice(0, 5),
      topCategory,
      topCatAmount,
      topCategoryPct,
    };
  }, [expenses, catMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/15">
          <div className="flex items-center justify-between text-teal-100 text-xs font-medium">
            <span>Today</span>
            <TrendingUp size={15} />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold tabular-nums tracking-tight">
            {formatCurrency(stats.todayTotal, currency)}
          </p>
          <p className="mt-1 text-[11px] text-teal-100/80">
            {stats.todayList.length} {stats.todayList.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>This Week</span>
            <Calendar size={15} className="text-sky-500" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
            {formatCurrency(stats.weekTotal, currency)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Mon – Sun</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>This Month</span>
            <CalendarDays size={15} className="text-violet-500" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
            {formatCurrency(stats.monthTotal, currency)}
          </p>
          <button
            type="button"
            onClick={onOpenReports}
            className="mt-1 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            View report →
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Top Category</span>
            <Award size={15} className="text-amber-500" />
          </div>
          {stats.topCategory ? (
            <>
              <div className="mt-2 flex items-center gap-2 min-w-0">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${stats.topCategory.color}20`,
                    color: stats.topCategory.color,
                  }}
                >
                  <CategoryIcon name={stats.topCategory.icon} size={14} />
                </span>
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                  {stats.topCategory.name}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {formatCurrency(stats.topCatAmount, currency)} ({stats.topCategoryPct}%)
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-400">No spending this month</p>
          )}
        </div>
      </section>

      {/* Main Grid: Fast Add Form + Today's & Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Fast Entry Card */}
        <section className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={18} className="text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Quick Add Expense</h2>
          </div>
          <ExpenseForm
            categories={categories}
            currency={currency}
            onSave={onSaveExpense}
            compact
          />
        </section>

        {/* Today's Expenses + Last 5 Expenses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Today&apos;s Expenses
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {formatCurrency(stats.todayTotal, currency)}
              </span>
            </div>
            {stats.todayList.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                No expenses recorded today yet. Add one on the left or tap <strong>+</strong>.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.todayList.map((exp) => (
                  <ExpenseItem
                    key={exp.id}
                    expense={exp}
                    category={catMap.get(exp.categoryId)}
                    currency={currency}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Last 5 Expenses */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Last 5 Expenses
              </h2>
              <button
                type="button"
                onClick={onOpenReports}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                See all →
              </button>
            </div>
            {stats.last5.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                Your recent expenses will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.last5.map((exp) => (
                  <ExpenseItem
                    key={`recent-${exp.id}`}
                    expense={exp}
                    category={catMap.get(exp.categoryId)}
                    currency={currency}
                    showDate
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
