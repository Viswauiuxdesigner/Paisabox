import Dexie, { type Table } from 'dexie';
import { subDays, subHours, subMonths, format } from 'date-fns';
import type { Category, Expense, PaymentMethod } from '../types/expense';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', icon: 'utensils', color: '#f97316', isDefault: true, sortOrder: 1 },
  { name: 'Transport', icon: 'car', color: '#3b82f6', isDefault: true, sortOrder: 2 },
  { name: 'Tea & Coffee', icon: 'coffee', color: '#8b5cf6', isDefault: true, sortOrder: 3 },
  { name: 'Recharge', icon: 'smartphone', color: '#06b6d4', isDefault: true, sortOrder: 4 },
  { name: 'DTH Recharge', icon: 'tv', color: '#ec4899', isDefault: true, sortOrder: 5 },
  { name: 'Groceries', icon: 'shopping-basket', color: '#10b981', isDefault: true, sortOrder: 6 },
  { name: 'Bills (Electricity/Water/Gas)', icon: 'zap', color: '#eab308', isDefault: true, sortOrder: 7 },
  { name: 'Rent', icon: 'home', color: '#6366f1', isDefault: true, sortOrder: 8 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f43f5e', isDefault: true, sortOrder: 9 },
  { name: 'Health', icon: 'heart-pulse', color: '#ef4444', isDefault: true, sortOrder: 10 },
  { name: 'Entertainment', icon: 'film', color: '#a855f7', isDefault: true, sortOrder: 11 },
  { name: 'Other', icon: 'tag', color: '#64748b', isDefault: true, sortOrder: 12 },
];

class ExpenseTrackerDB extends Dexie {
  categories!: Table<Category, number>;
  expenses!: Table<Expense, number>;

  constructor() {
    super('kharcha_expense_db');
    this.version(1).stores({
      categories: '++id, name, sortOrder',
      expenses: '++id, date, categoryId, createdAt',
    });
  }
}

export const db = new ExpenseTrackerDB();

const SEED_FLAG = 'kharcha_dev_seeded';
let initPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = db
      .transaction('rw', db.categories, async () => {
        const catCount = await db.categories.count();
        if (catCount === 0) {
          await db.categories.bulkAdd(DEFAULT_CATEGORIES);
        }
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export async function seedSampleExpenses(): Promise<number> {
  const categories = await db.categories.toArray();
  if (categories.length === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
  const allCats = await db.categories.toArray();
  const byName = new Map(allCats.map((c) => [c.name, c.id!]));
  const catId = (name: string) => byName.get(name) ?? allCats[0]?.id ?? 1;

  const now = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

  const samples: Array<{
    amount: number;
    cat: string;
    date: Date;
    note?: string;
    paymentMethod?: PaymentMethod;
    customLabel?: string;
  }> = [
    // Today (different hours for hourly trend)
    { amount: 45, cat: 'Tea & Coffee', date: subHours(now, 4), note: 'Morning masala chai & bun', paymentMethod: 'UPI' },
    { amount: 180, cat: 'Transport', date: subHours(now, 3), note: 'Auto rickshaw to office', paymentMethod: 'UPI' },
    { amount: 320, cat: 'Food', date: subHours(now, 1), note: 'South Indian thali lunch', paymentMethod: 'UPI' },
    // Earlier this week
    { amount: 850, cat: 'Groceries', date: subDays(now, 1), note: 'Milk, veggies, fruits & bread', paymentMethod: 'UPI' },
    { amount: 299, cat: 'Recharge', date: subDays(now, 1), note: 'Jio 28-day prepaid plan', paymentMethod: 'UPI' },
    { amount: 65, cat: 'Tea & Coffee', date: subDays(now, 2), note: 'Filter coffee with friend', paymentMethod: 'Cash' },
    { amount: 1450, cat: 'Shopping', date: subDays(now, 2), note: 'Running socks & t-shirt', paymentMethod: 'Card' },
    { amount: 540, cat: 'Food', date: subDays(now, 3), note: 'Dinner biryani order', paymentMethod: 'UPI' },
    { amount: 120, cat: 'Transport', date: subDays(now, 3), note: 'Metro card top-up', paymentMethod: 'UPI' },
    // Last week
    { amount: 1850, cat: 'Bills (Electricity/Water/Gas)', date: subDays(now, 6), note: 'BESCOM electricity bill', paymentMethod: 'Net Banking' },
    { amount: 420, cat: 'Health', date: subDays(now, 7), note: 'Pharmacy vitamins', paymentMethod: 'Card' },
    { amount: 680, cat: 'Entertainment', date: subDays(now, 8), note: 'Movie tickets + popcorn', paymentMethod: 'Card' },
    { amount: 360, cat: 'DTH Recharge', date: subDays(now, 9), note: 'Tata Play monthly pack', paymentMethod: 'UPI' },
    { amount: 1240, cat: 'Groceries', date: subDays(now, 10), note: 'Weekly supermarket haul', paymentMethod: 'Card' },
    { amount: 250, cat: 'Other', date: subDays(now, 11), customLabel: 'Haircut', note: 'Local salon', paymentMethod: 'Cash' },
    // Earlier this month
    { amount: 14500, cat: 'Rent', date: subDays(now, 15), note: 'Monthly apartment rent', paymentMethod: 'Net Banking' },
    { amount: 950, cat: 'Bills (Electricity/Water/Gas)', date: subDays(now, 16), note: 'Cooking gas cylinder', paymentMethod: 'UPI' },
    { amount: 780, cat: 'Food', date: subDays(now, 18), note: 'Weekend family dinner', paymentMethod: 'Card' },
    // Last month (for MoM comparison & yearly chart)
    { amount: 14500, cat: 'Rent', date: subMonths(now, 1), note: 'Last month rent', paymentMethod: 'Net Banking' },
    { amount: 2100, cat: 'Groceries', date: subDays(subMonths(now, 1), 2), note: 'Monthly staples & rice', paymentMethod: 'UPI' },
    { amount: 1620, cat: 'Bills (Electricity/Water/Gas)', date: subDays(subMonths(now, 1), 4), note: 'Electricity & water', paymentMethod: 'Net Banking' },
    { amount: 1900, cat: 'Shopping', date: subDays(subMonths(now, 1), 5), note: 'Kitchen blender', paymentMethod: 'Card' },
    { amount: 890, cat: 'Food', date: subDays(subMonths(now, 1), 7), note: 'Cafe & snacks', paymentMethod: 'UPI' },
    // 2-4 months ago (for yearly chart)
    { amount: 14500, cat: 'Rent', date: subMonths(now, 2), note: 'Rent', paymentMethod: 'Net Banking' },
    { amount: 3200, cat: 'Health', date: subDays(subMonths(now, 2), 3), note: 'Dental checkup', paymentMethod: 'Card' },
    { amount: 1750, cat: 'Groceries', date: subDays(subMonths(now, 2), 6), note: 'Supermarket', paymentMethod: 'UPI' },
    { amount: 14500, cat: 'Rent', date: subMonths(now, 3), note: 'Rent', paymentMethod: 'Net Banking' },
    { amount: 2800, cat: 'Transport', date: subDays(subMonths(now, 3), 4), note: 'Train tickets', paymentMethod: 'Card' },
    { amount: 14500, cat: 'Rent', date: subMonths(now, 4), note: 'Rent', paymentMethod: 'Net Banking' },
    { amount: 2400, cat: 'Entertainment', date: subDays(subMonths(now, 4), 2), note: 'Concert & dinner', paymentMethod: 'Card' },
  ];

  const baseTs = Date.now();
  const rows: Omit<Expense, 'id'>[] = samples.map((s, idx) => ({
    amount: s.amount,
    categoryId: catId(s.cat),
    customLabel: s.customLabel,
    date: fmt(s.date),
    note: s.note,
    paymentMethod: s.paymentMethod,
    createdAt: baseTs - idx * 1000,
    updatedAt: baseTs - idx * 1000,
  }));

  await db.expenses.bulkAdd(rows);
  return rows.length;
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.expenses, db.categories, async () => {
    await db.expenses.clear();
    await db.categories.clear();
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  });
  localStorage.setItem(SEED_FLAG, 'true');
}

export async function exportAllDataJSON(): Promise<string> {
  const [categories, expenses] = await Promise.all([
    db.categories.orderBy('sortOrder').toArray(),
    db.expenses.orderBy('date').reverse().toArray(),
  ]);
  return JSON.stringify(
    {
      app: 'PaisaBox',
      version: 1,
      exportedAt: new Date().toISOString(),
      categories,
      expenses,
    },
    null,
    2
  );
}

export async function importAllDataJSON(jsonText: string): Promise<{ categories: number; expenses: number }> {
  const parsed = JSON.parse(jsonText) as {
    categories?: Category[];
    expenses?: Expense[];
  };

  if (!parsed || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.categories)) {
    throw new Error('Invalid backup file: expected categories and expenses arrays.');
  }

  const rawCategories = parsed.categories;
  const rawExpenses = parsed.expenses;

  await db.transaction('rw', db.categories, db.expenses, async () => {
    await db.expenses.clear();
    await db.categories.clear();

    const oldToNewCatId = new Map<number, number>();
    for (let i = 0; i < rawCategories.length; i++) {
      const cat = rawCategories[i];
      const oldId = cat.id;
      const newId = await db.categories.add({
        name: String(cat.name || 'Category'),
        icon: String(cat.icon || 'tag'),
        color: String(cat.color || '#64748b'),
        isDefault: Boolean(cat.isDefault),
        sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : i + 1,
      });
      if (typeof oldId === 'number') {
        oldToNewCatId.set(oldId, newId);
      }
    }

    const fallbackCat = (await db.categories.toCollection().first())?.id ?? 1;
    const validExpenses: Omit<Expense, 'id'>[] = rawExpenses
      .filter((e) => typeof e.amount === 'number' && e.amount > 0 && typeof e.date === 'string')
      .map((e) => ({
        amount: Number(e.amount),
        categoryId: oldToNewCatId.get(e.categoryId) ?? fallbackCat,
        customLabel: e.customLabel ? String(e.customLabel) : undefined,
        date: String(e.date),
        note: e.note ? String(e.note) : undefined,
        paymentMethod: e.paymentMethod,
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
        updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now(),
      }));

    if (validExpenses.length > 0) {
      await db.expenses.bulkAdd(validExpenses);
    }
  });

  localStorage.setItem(SEED_FLAG, 'true');
  return {
    categories: await db.categories.count(),
    expenses: await db.expenses.count(),
  };
}
