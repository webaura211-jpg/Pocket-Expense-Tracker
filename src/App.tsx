import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BudgetSettings, Category, Transaction, MonthVariance } from './types/finance';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_TRANSACTIONS } from './data/caDemoData';
import { getPreviousMonth, formatMonthName } from './utils/formatters';
import { audioAlert } from './utils/audioAlert';
import { downloadOfflineApp } from './utils/downloadOffline';
import { Download } from 'lucide-react';

import { Header } from './components/Header';
import { KPIOverview } from './components/KPIOverview';
import { BudgetGuardrails } from './components/BudgetGuardrails';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionEntry } from './components/TransactionEntry';
import { LedgerTable } from './components/LedgerTable';
import { BiometricModal } from './components/BiometricModal';
import { SettingsModal } from './components/SettingsModal';
import { SmoothTiltCard } from './components/SmoothTiltCard';

const SETTINGS_KEY = 'pocketledger_settings_v2';
const TRANSACTIONS_KEY = 'pocketledger_transactions_v2';
const THEME_KEY = 'pocketledger_theme_v2';

export default function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<BudgetSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Transactions State - Starts completely empty by default
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(TRANSACTIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TRANSACTIONS;
  });

  // 3. UI State
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Fallback
    }
    return 'dark';
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync transactions to localStorage
  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // Sync theme class to documentElement
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Available months list derived from transactions + current calendar month
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const today = new Date();
    const curYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const prevYm = getPreviousMonth(curYm);
    monthSet.add(curYm);
    monthSet.add(prevYm);

    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthSet.add(tx.date.substring(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Previous month string
  const previousMonth = useMemo(() => {
    return getPreviousMonth(currentMonth);
  }, [currentMonth]);

  // Current month transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Previous month transactions
  const previousMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(previousMonth));
  }, [transactions, previousMonth]);

  // Current month spending map by category
  const spendingMap = useMemo(() => {
    const map: { [categoryId: string]: number } = {};
    settings.categories.forEach((c) => {
      map[c.id] = 0;
    });

    currentMonthTransactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });

    return map;
  }, [currentMonthTransactions, settings.categories]);

  // Previous month spending map by category
  const prevSpendingMap = useMemo(() => {
    const map: { [categoryId: string]: number } = {};
    settings.categories.forEach((c) => {
      map[c.id] = 0;
    });

    previousMonthTransactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });

    return map;
  }, [previousMonthTransactions, settings.categories]);

  // Total current expenses & essential/lifestyle split
  const { totalExpenses, essentialExpenses, lifestyleExpenses } = useMemo(() => {
    let total = 0;
    let essential = 0;
    let lifestyle = 0;

    currentMonthTransactions.forEach((tx) => {
      total += tx.amount;
      if (tx.type === 'essential') {
        essential += tx.amount;
      } else {
        lifestyle += tx.amount;
      }
    });

    return { totalExpenses: total, essentialExpenses: essential, lifestyleExpenses: lifestyle };
  }, [currentMonthTransactions]);

  // Check for overspent categories
  const hasOverspendWarning = useMemo(() => {
    return settings.categories.some((cat) => {
      const spent = spendingMap[cat.id] || 0;
      return spent > cat.budgetCap;
    });
  }, [settings.categories, spendingMap]);

  // Trigger audio alert on new overspend state
  const prevOverspendRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasOverspendWarning && !prevOverspendRef.current && settings.soundAlertsEnabled) {
      audioAlert.playOverspendAlert();
    }
    prevOverspendRef.current = hasOverspendWarning;
  }, [hasOverspendWarning, settings.soundAlertsEnabled]);

  // Month-over-Month Variances per Category
  const variances: MonthVariance[] = useMemo(() => {
    return settings.categories.map((cat) => {
      const currentAmount = spendingMap[cat.id] || 0;
      const previousAmount = prevSpendingMap[cat.id] || 0;
      const isNew = previousAmount === 0 && currentAmount > 0;

      let percentageChange = 0;
      if (previousAmount > 0) {
        percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        type: cat.type,
        currentAmount,
        previousAmount,
        percentageChange,
        isNew,
      };
    }).sort((a, b) => b.currentAmount - a.currentAmount);
  }, [settings.categories, spendingMap, prevSpendingMap]);

  // Handlers
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleLock = () => {
    if (isLocked) {
      setIsBiometricModalOpen(true);
    } else {
      setIsLocked(true);
    }
  };

  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  const handleToggleSound = () => {
    setSettings((prev) => ({
      ...prev,
      soundAlertsEnabled: !prev.soundAlertsEnabled,
    }));
  };

  const handleUpdateCategoryCap = (categoryId: string, newCap: number) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, budgetCap: newCap } : c
      ),
    }));
  };

  const handleAddTransaction = (newTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Check if adding this will breach budget cap
    const existingSpent = spendingMap[newTx.category] || 0;
    const cat = settings.categories.find((c) => c.id === newTx.category);
    if (cat && existingSpent + newTx.amount > cat.budgetCap && settings.soundAlertsEnabled) {
      setTimeout(() => audioAlert.playOverspendAlert(), 300);
    }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddCustomCategory = (newCat: Omit<Category, 'id'>) => {
    const catId = `cat_custom_${Date.now()}`;
    setSettings((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...newCat, id: catId }],
    }));
  };

  const handleDeleteCategory = (categoryId: string) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== categoryId),
    }));
  };

  const handleResetToDemoData = () => {
    setSettings(DEFAULT_SETTINGS);
    setTransactions([]);
    setIsLocked(false);
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  const handleImportBackup = (data: { settings: BudgetSettings; transactions: Transaction[] }) => {
    if (data.settings) setSettings(data.settings);
    if (data.transactions) setTransactions(data.transactions);
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Top Bar */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        availableMonths={availableMonths}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        soundEnabled={settings.soundAlertsEnabled}
        onToggleSound={handleToggleSound}
        hasOverspendWarning={hasOverspendWarning}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <SmoothTiltCard
          maxTilt={3.5}
          scale={1.003}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Personal Budget &amp; Expense Manager
                </span>
                <span className="text-slate-400" aria-hidden="true">·</span>
                <span className="text-xs text-slate-500 font-mono">Billing Cycle: {formatMonthName(currentMonth)}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Monthly Expense &amp; Budget Tracker
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Track essential needs against lifestyle expenses, set monthly limits, and keep your finances in balance.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => downloadOfflineApp()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer active:scale-95"
                title="Download single-file app to your laptop (.html) - Open and use offline anytime"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download App for Laptop (.html)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
              >
                Configure Income &amp; Limits
              </button>
            </div>
          </div>
        </SmoothTiltCard>

        {/* Section 1: KPI Overview Strip */}
        <section id="overview" className="scroll-mt-20">
          <KPIOverview
            monthlyIncome={settings.monthlyIncome}
            totalExpenses={totalExpenses}
            essentialExpenses={essentialExpenses}
            lifestyleExpenses={lifestyleExpenses}
            onEditIncome={() => setIsSettingsModalOpen(true)}
            isLocked={isLocked}
          />
        </section>

        {/* Section 2: Budget Limits & Guardrails */}
        <section id="guardrails" className="scroll-mt-20">
          <BudgetGuardrails
            categories={settings.categories}
            spendingMap={spendingMap}
            monthlyIncome={settings.monthlyIncome}
            onUpdateCategoryCap={handleUpdateCategoryCap}
            onAddNewCategory={() => setIsSettingsModalOpen(true)}
            onDeleteCategory={handleDeleteCategory}
            isLocked={isLocked}
          />
        </section>

        {/* Section 3: Month-over-Month Variance & Split */}
        <section id="analytics" className="scroll-mt-20">
          <AnalyticsCharts
            currentMonth={currentMonth}
            previousMonth={previousMonth}
            variances={variances}
            essentialTotal={essentialExpenses}
            lifestyleTotal={lifestyleExpenses}
            categories={settings.categories}
            isLocked={isLocked}
          />
        </section>

        {/* Quick Transaction Entry */}
        <section id="quick-entry" className="scroll-mt-20">
          <TransactionEntry
            categories={settings.categories}
            spendingMap={spendingMap}
            onAddTransaction={handleAddTransaction}
            selectedMonth={currentMonth}
          />
        </section>

        {/* Section 4: Full Transaction Ledger */}
        <section id="ledger" className="scroll-mt-20">
          <LedgerTable
            transactions={transactions}
            categories={settings.categories}
            currentMonth={currentMonth}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isLocked={isLocked}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">PocketLedger</span>
            <span aria-hidden="true">·</span>
            <span>Simple Personal Budgeting</span>
          </div>
          <div>
            <span>100% Client-Side Local Storage</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Private &amp; Secure</span>
          </div>
        </div>
      </footer>

      {/* Biometric / PIN Privacy Modal */}
      <BiometricModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onUnlockSuccess={handleUnlockSuccess}
        correctPin={settings.securityPin}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onAddCustomCategory={handleAddCustomCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetToDemoData={handleResetToDemoData}
        allTransactions={transactions}
        onImportBackup={handleImportBackup}
        onClearTransactions={handleClearTransactions}
      />
    </div>
  );
}
