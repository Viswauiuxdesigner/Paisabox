import React, { useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  Smartphone,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { CURRENCIES, type Category, type CurrencyCode, type Expense } from '../types/expense';
import { CategoryIcon, COLOR_OPTIONS, ICON_OPTIONS } from '../utils/icons';
import {
  clearAllData,
  db,
  exportAllDataJSON,
  importAllDataJSON,
  seedSampleExpenses,
} from '../db/database';
import { downloadTextFile, exportExpensesToCSV } from '../utils/format';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  categories: Category[];
  expenses: Expense[];
  canInstall: boolean;
  onInstallApp: () => Promise<boolean>;
  onNotify: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  onToggleTheme,
  currency,
  onChangeCurrency,
  categories,
  expenses,
  canInstall,
  onInstallApp,
  onNotify,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('tag');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0]);
  const [showAddCat, setShowAddCat] = useState(false);

  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('tag');
  const [editCatColor, setEditCatColor] = useState('#0d9488');

  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    await db.categories.add({
      name: trimmed,
      icon: newCatIcon,
      color: newCatColor,
      isDefault: false,
      sortOrder: maxOrder + 1,
    });
    setNewCatName('');
    setShowAddCat(false);
    onNotify(`Category "${trimmed}" added`);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id ?? null);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
    setEditCatColor(cat.color);
  };

  const saveEditCategory = async () => {
    if (editingCatId === null || !editCatName.trim()) return;
    await db.categories.update(editingCatId, {
      name: editCatName.trim(),
      icon: editCatIcon,
      color: editCatColor,
    });
    setEditingCatId(null);
    onNotify('Category updated');
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (cat.id === undefined) return;
    if (cat.name.toLowerCase() === 'other') {
      onNotify('The "Other" fallback category cannot be deleted.', 'error');
      return;
    }
    const otherCat = categories.find((c) => c.name.toLowerCase() === 'other');
    const fallbackId = otherCat?.id ?? categories.find((c) => c.id !== cat.id)?.id;
    if (fallbackId !== undefined) {
      await db.expenses.where('categoryId').equals(cat.id).modify({ categoryId: fallbackId });
    }
    await db.categories.delete(cat.id);
    onNotify(`Deleted "${cat.name}"`);
  };

  const handleExportCSV = () => {
    const csv = exportExpensesToCSV(expenses, categories);
    downloadTextFile(csv, `paisabox-expenses-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    onNotify('Exported CSV file');
  };

  const handleExportJSON = async () => {
    const json = await exportAllDataJSON();
    downloadTextFile(json, `paisabox-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    onNotify('Exported JSON backup');
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importAllDataJSON(text);
      onNotify(`Restored ${res.expenses} expenses & ${res.categories} categories`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to import JSON', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSeedSample = async () => {
    const count = await seedSampleExpenses();
    onNotify(`Added ${count} sample expenses`);
  };

  const handleClearAll = async () => {
    await clearAllData();
    setConfirmClear(false);
    onNotify('All expenses cleared', 'info');
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* PWA Install Banner */}
      {canInstall && (
        <section className="p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <Smartphone size={22} className="shrink-0" />
            <div>
              <p className="font-bold text-sm">Install PaisaBox on your device</p>
              <p className="text-xs text-teal-100">Works offline with instant launch from your home screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onInstallApp}
            className="px-4 py-2 rounded-xl bg-white text-teal-700 font-bold text-xs shrink-0 hover:bg-teal-50 transition-colors cursor-pointer"
          >
            Install
          </button>
        </section>
      )}

      {/* Preferences: Theme & Currency */}
      <section className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Preferences</h2>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appearance</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between Light and Dark mode
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Currency</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Default is Indian Rupee (₹)</p>
          </div>
          <select
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
            aria-label="Currency selection"
            className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 outline-none"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Manage Categories */}
      <section className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Manage Categories</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add, rename, customize icons/colors, or delete categories
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCat((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={15} />
            New Category
          </button>
        </div>

        {showAddCat && (
          <form
            onSubmit={handleAddCategory}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in"
          >
            <input
              type="text"
              placeholder="Category name (e.g., Pet Care, Gym)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              maxLength={32}
              required
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-teal-500"
            />
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewCatIcon(ic)}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    newCatIcon === ic
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-600'
                      : 'border-transparent bg-white dark:bg-slate-900 text-slate-500'
                  }`}
                >
                  <CategoryIcon name={ic} size={16} />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewCatColor(col)}
                  aria-label={`Color ${col}`}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    newCatColor === col ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCat(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
              >
                Add Category
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categories.map((cat) => {
            const isEditing = editingCatId === cat.id;
            return (
              <div key={cat.id} className="py-2.5">
                {isEditing ? (
                  <div className="space-y-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={saveEditCategory}
                        className="p-2 rounded-lg bg-teal-600 text-white cursor-pointer"
                        aria-label="Save category"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 cursor-pointer"
                        aria-label="Cancel edit"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_OPTIONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setEditCatIcon(ic)}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            editCatIcon === ic
                              ? 'bg-teal-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-500'
                          }`}
                        >
                          <CategoryIcon name={ic} size={14} />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setEditCatColor(col)}
                          className={`w-5 h-5 rounded-full cursor-pointer ${
                            editCatColor === col ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white' : ''
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}1F`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={16} />
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditCategory(cat)}
                        aria-label={`Edit ${cat.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      {cat.name.toLowerCase() !== 'other' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          aria-label={`Delete ${cat.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Data Backup & Reset */}
      <section className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Data & Backup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Download size={16} className="text-teal-600" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Download size={16} className="text-sky-600" />
            Backup JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Upload size={16} className="text-violet-600" />
            Restore from JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleSeedSample}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Database size={16} className="text-amber-600" />
            Load Sample Data
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm font-bold">
                <AlertTriangle size={18} />
                <span>Delete all expenses and reset categories?</span>
              </div>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/80">
                This permanently erases your local IndexedDB data. Export a JSON backup first if needed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Clear Everything
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
