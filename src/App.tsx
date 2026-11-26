import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Home,
  BarChart3,
  Settings,
  Plus,
  WifiOff,
  Sun,
  Moon,
  X,
  Wallet,
} from 'lucide-react';
import { db, initializeDatabase } from './db/database';
import { useAppSettings } from './hooks/useAppSettings';
import type { Expense, NavTab, ToastMessage } from './types/expense';
import { ToastContainer } from './components/Toast';
import { ExpenseForm } from './components/ExpenseForm';
import { HomePage } from './pages/HomePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dbReady, setDbReady] = useState(false);

  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    canInstall,
    promptInstall,
    isOnline,
  } = useAppSettings();

  useEffect(() => {
    initializeDatabase().then(() => setDbReady(true));
  }, []);

  const categories = useLiveQuery(
    () => db.categories.orderBy('sortOrder').toArray(),
    [],
    []
  );

  const expenses = useLiveQuery(
    () => db.expenses.orderBy('date').reverse().toArray(),
    [],
    []
  );

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const handleSaveExpense = async (
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: number
  ) => {
    const now = Date.now();
    if (existingId !== undefined) {
      await db.expenses.update(existingId, { ...data, updatedAt: now });
      notify('Expense updated');
    } else {
      await db.expenses.add({ ...data, createdAt: now, updatedAt: now });
      notify('Expense saved!');
    }
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: number) => {
    await db.expenses.delete(id);
    notify('Expense deleted', 'info');
  };

  const openQuickAdd = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ToastContainer toasts={toasts} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6 z-30">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-sm">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">PaisaBox</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Offline Expense Tracker</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openQuickAdd}
          className="mb-6 w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Add Expense
        </button>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {!isOnline && <WifiOff size={13} />}
            {isOnline ? 'Local + Ready' : 'Offline Mode'}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center">
              <Wallet size={17} />
            </div>
            <span className="font-extrabold text-base tracking-tight">PaisaBox</span>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                <WifiOff size={12} />
                Offline
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-10">
          {!dbReady ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading your local vault...</div>
          ) : activeTab === 'home' ? (
            <HomePage
              expenses={expenses}
              categories={categories}
              currency={currency}
              onSaveExpense={handleSaveExpense}
              onEditExpense={openEditModal}
              onDeleteExpense={handleDeleteExpense}
              onOpenReports={() => setActiveTab('reports')}
            />
          ) : activeTab === 'reports' ? (
            <ReportsPage
              expenses={expenses}
              categories={categories}
              currency={currency}
              onEditExpense={openEditModal}
              onDeleteExpense={handleDeleteExpense}
            />
          ) : (
            <SettingsPage
              theme={theme}
              onToggleTheme={toggleTheme}
              currency={currency}
              onChangeCurrency={setCurrency}
              categories={categories}
              expenses={expenses}
              canInstall={canInstall}
              onInstallApp={promptInstall}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {/* Floating "+" Button (Mobile + Desktop) */}
      <button
        type="button"
        onClick={openQuickAdd}
        aria-label="Quick add expense"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-xl shadow-teal-600/30 flex items-center justify-center transition-all cursor-pointer"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              activeTab === 'home' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              activeTab === 'reports' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={openQuickAdd}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400"
          >
            <Plus size={22} />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              activeTab === 'settings' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Quick Add / Edit Expense Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={() => {
            setModalOpen(false);
            setEditingExpense(null);
          }}
        >
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingExpense(null);
                }}
                aria-label="Close modal"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <ExpenseForm
              categories={categories}
              currency={currency}
              initialExpense={editingExpense}
              onSave={handleSaveExpense}
              onCancel={() => {
                setModalOpen(false);
                setEditingExpense(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
