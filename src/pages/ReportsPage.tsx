import React, { useState, useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  parseISO,
  isWithinInterval,
  getHours,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { Category, CurrencyCode, Expense, ReportPeriod } from '../types/expense';
import { formatCompactCurrency, formatCurrency } from '../utils/format';
import { CategoryIcon } from '../utils/icons';
import { ExpenseItem } from '../components/ExpenseItem';

interface ReportsPageProps {
  expenses: Expense[];
  categories: Category[];
  currency: CurrencyCode;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
}

const PERIOD_TABS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export const ReportsPage: React.FC<ReportsPageProps> = ({
  expenses,
  categories,
  currency,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [offset, setOffset] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    setOffset(0);
  };

  const reportData = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let prevStart: Date;
    let prevEnd: Date;
    let periodLabel = '';
    let prevLabel = '';

    if (period === 'today') {
      const target = addDays(now, offset);
      start = startOfDay(target);
      end = endOfDay(target);
      const prev = addDays(target, -1);
      prevStart = startOfDay(prev);
      prevEnd = endOfDay(prev);
      periodLabel = offset === 0 ? `Today · ${format(target, 'dd MMM')}` : format(target, 'EEE, dd MMM yyyy');
      prevLabel = offset === 0 ? 'yesterday' : format(prev, 'dd MMM');
    } else if (period === 'weekly') {
      const target = addWeeks(now, offset);
      start = startOfWeek(target, { weekStartsOn: 1 });
      end = endOfWeek(target, { weekStartsOn: 1 });
      const prev = addWeeks(target, -1);
      prevStart = startOfWeek(prev, { weekStartsOn: 1 });
      prevEnd = endOfWeek(prev, { weekStartsOn: 1 });
      periodLabel = `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`;
      prevLabel = 'last week';
    } else if (period === 'monthly') {
      const target = addMonths(now, offset);
      start = startOfMonth(target);
      end = endOfMonth(target);
      const prev = addMonths(target, -1);
      prevStart = startOfMonth(prev);
      prevEnd = endOfMonth(prev);
      periodLabel = format(target, 'MMMM yyyy');
      prevLabel = format(prev, 'MMM');
    } else {
      const target = addYears(now, offset);
      start = startOfYear(target);
      end = endOfYear(target);
      const prev = addYears(target, -1);
      prevStart = startOfYear(prev);
      prevEnd = endOfYear(prev);
      periodLabel = format(target, 'yyyy');
      prevLabel = format(prev, 'yyyy');
    }

    const matchesCategory = (e: Expense) =>
      selectedCategoryId === 'all' || e.categoryId === selectedCategoryId;

    const currentExpenses = expenses.filter((e) => {
      if (!matchesCategory(e)) return false;
      return isWithinInterval(parseISO(e.date), { start, end });
    });

    const prevExpenses = expenses.filter((e) => {
      if (!matchesCategory(e)) return false;
      return isWithinInterval(parseISO(e.date), { start: prevStart, end: prevEnd });
    });

    const total = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const diffPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

    // Category breakdown
    const byCat = new Map<number, number>();
    for (const e of currentExpenses) {
      byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount);
    }
    const breakdown = Array.from(byCat.entries())
      .map(([cid, amount]) => {
        const cat = catMap.get(cid);
        return {
          categoryId: cid,
          name: cat?.name ?? 'Other',
          icon: cat?.icon ?? 'tag',
          color: cat?.color ?? '#64748b',
          amount,
          pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Trend chart buckets
    let trend: { label: string; amount: number }[] = [];
    if (period === 'today') {
      const hours = Array.from({ length: 24 }, (_, h) => ({
        label: `${String(h).padStart(2, '0')}:00`,
        amount: 0,
      }));
      for (const e of currentExpenses) {
        const h = getHours(parseISO(e.date));
        hours[h].amount += e.amount;
      }
      trend = hours;
    } else if (period === 'weekly') {
      const days = eachDayOfInterval({ start, end });
      const dayMap = new Map(days.map((d) => [format(d, 'yyyy-MM-dd'), 0]));
      for (const e of currentExpenses) {
        const key = format(parseISO(e.date), 'yyyy-MM-dd');
        dayMap.set(key, (dayMap.get(key) ?? 0) + e.amount);
      }
      trend = days.map((d) => ({
        label: format(d, 'EEE'),
        amount: dayMap.get(format(d, 'yyyy-MM-dd')) ?? 0,
      }));
    } else if (period === 'monthly') {
      const days = eachDayOfInterval({ start, end });
      const dayMap = new Map(days.map((d) => [format(d, 'yyyy-MM-dd'), 0]));
      for (const e of currentExpenses) {
        const key = format(parseISO(e.date), 'yyyy-MM-dd');
        dayMap.set(key, (dayMap.get(key) ?? 0) + e.amount);
      }
      trend = days.map((d) => ({
        label: format(d, 'd'),
        amount: dayMap.get(format(d, 'yyyy-MM-dd')) ?? 0,
      }));
    } else {
      const months = eachMonthOfInterval({ start, end });
      const monthMap = new Map(months.map((m) => [format(m, 'yyyy-MM'), 0]));
      for (const e of currentExpenses) {
        const key = format(parseISO(e.date), 'yyyy-MM');
        monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount);
      }
      trend = months.map((m) => ({
        label: format(m, 'MMM'),
        amount: monthMap.get(format(m, 'yyyy-MM')) ?? 0,
      }));
    }

    // Group transactions by date
    const groupedMap = new Map<string, { dateLabel: string; total: number; items: Expense[] }>();
    for (const e of currentExpenses) {
      const dt = parseISO(e.date);
      const key = format(dt, 'yyyy-MM-dd');
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          dateLabel: format(dt, 'EEE, dd MMM yyyy'),
          total: 0,
          items: [],
        });
      }
      const grp = groupedMap.get(key)!;
      grp.total += e.amount;
      grp.items.push(e);
    }

    return {
      periodLabel,
      prevLabel,
      total,
      prevTotal,
      diffPct,
      count: currentExpenses.length,
      breakdown,
      trend,
      grouped: Array.from(groupedMap.entries()),
    };
  }, [expenses, period, offset, selectedCategoryId, catMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 self-start">
          {PERIOD_TABS.map((t) => {
            const active = period === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handlePeriodChange(t.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={selectedCategoryId}
            onChange={(e) =>
              setSelectedCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            aria-label="Filter by category"
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-teal-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Navigator & Total Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous period"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Selected Period</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {reportData.periodLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            aria-label="Next period"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Spent ({reportData.count} {reportData.count === 1 ? 'item' : 'items'})
          </p>
          <div className="flex sm:justify-end items-baseline gap-2.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(reportData.total, currency)}
            </span>
            {reportData.diffPct !== null && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  reportData.diffPct > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {reportData.diffPct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {reportData.diffPct > 0 ? '+' : ''}
                {reportData.diffPct}% vs {reportData.prevLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut + List */}
        <section className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Category Breakdown</h3>
          {reportData.breakdown.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              No data for this period
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.breakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {reportData.breakdown.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {reportData.breakdown.map((item) => (
                  <div key={item.categoryId} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}1F`, color: item.color }}
                      >
                        <CategoryIcon name={item.icon} size={14} />
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <span className="text-xs text-slate-400 w-9 text-right">{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Trend Bar Chart */}
        <section className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {period === 'today'
              ? 'Hourly Spending'
              : period === 'weekly'
                ? 'Daily Spending (Mon–Sun)'
                : period === 'monthly'
                  ? 'Daily Spending'
                  : 'Monthly Spending'}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === 'today' ? 3 : period === 'monthly' ? 3 : 0}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value, currency), 'Spent']}
                  cursor={{ fill: '#0d948814' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Full List of Transactions Grouped by Date */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Transactions
        </h3>
        {reportData.grouped.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            No transactions match this period and filter.
          </div>
        ) : (
          <div className="space-y-5">
            {reportData.grouped.map(([dateKey, group]) => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {group.dateLabel}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {formatCurrency(group.total, currency)}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((exp) => (
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
