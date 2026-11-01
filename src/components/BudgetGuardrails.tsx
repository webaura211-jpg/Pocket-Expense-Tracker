import React, { useState } from 'react';
import { Category, ExpenseType } from '../types/finance';
import { formatINR } from '../utils/formatters';
import { audioAlert } from '../utils/audioAlert';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Home,
  Sparkles,
  PlusCircle,
  Sliders,
  Volume2,
  Trash2,
} from 'lucide-react';
import { SmoothTiltCard } from './SmoothTiltCard';

interface CategorySpentMap {
  [categoryId: string]: number;
}

interface BudgetGuardrailsProps {
  categories: Category[];
  spendingMap: CategorySpentMap;
  monthlyIncome: number;
  onUpdateCategoryCap: (categoryId: string, newCap: number) => void;
  onAddNewCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
  isLocked?: boolean;
}

export const BudgetGuardrails: React.FC<BudgetGuardrailsProps> = ({
  categories,
  spendingMap,
  monthlyIncome,
  onUpdateCategoryCap,
  onAddNewCategory,
  onDeleteCategory,
  isLocked = false,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCapValue, setEditCapValue] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<'all' | ExpenseType>('all');

  const totalAssignedBudget = categories.reduce((sum, c) => sum + c.budgetCap, 0);
  const totalActualSpent = Object.values(spendingMap).reduce((sum, val) => sum + val, 0);
  const unallocatedHeadroom = monthlyIncome - totalAssignedBudget;

  const essentialCategories = categories.filter((c) => c.type === 'essential');
  const lifestyleCategories = categories.filter((c) => c.type === 'lifestyle');

  const displayedCategories =
    activeGroup === 'all'
      ? categories
      : categories.filter((c) => c.type === activeGroup);

  const startEditing = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCapValue(String(cat.budgetCap));
  };

  const handleSaveCap = (categoryId: string) => {
    const val = Number(editCapValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateCategoryCap(categoryId, val);
    }
    setEditingCategoryId(null);
  };

  return (
    <SmoothTiltCard maxTilt={2.5} scale={1.002} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      {/* Top Header & Group Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Budget Limits &amp; Spending Caps</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Automatic tracking with color warnings and audio alert on budget overspend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveGroup('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeGroup === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              onClick={() => setActiveGroup('essential')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeGroup === 'essential'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Essential ({essentialCategories.length})
            </button>
            <button
              onClick={() => setActiveGroup('lifestyle')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeGroup === 'lifestyle'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lifestyle ({lifestyleCategories.length})
            </button>
          </div>

          <button
            onClick={onAddNewCategory}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Global Safety Check Banner */}
      <div className="my-5 p-4 rounded-lg bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              totalActualSpent > monthlyIncome
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900'
            }`}
          >
            {totalActualSpent > monthlyIncome ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              Budget Status: {totalActualSpent > monthlyIncome ? 'Total Expenses Exceed Monthly Income' : 'Spending is Within Income Limits'}
            </div>
            <div className="text-slate-600 dark:text-slate-400 mt-0.5">
              Configured Limits: <span className="font-mono font-medium">{formatINR(totalAssignedBudget)}</span>
              <span className="mx-1" aria-hidden="true">·</span>
              {unallocatedHeadroom >= 0 ? (
                <span>Unallocated Income: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatINR(unallocatedHeadroom)}</strong></span>
              ) : (
                <span>Limits over-budget by: <strong className="text-rose-500 font-mono">{formatINR(Math.abs(unallocatedHeadroom))}</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>&lt;70% Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>70–99% Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>&gt;100% Exceeded</span>
          </div>
          <button
            onClick={() => audioAlert.playOverspendAlert()}
            title="Test synthesized warning audio tone"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[11px] underline">Test Beep</span>
          </button>
        </div>
      </div>

      {/* Category Budget Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedCategories.map((category) => {
          const spent = spendingMap[category.id] || 0;
          const cap = category.budgetCap;
          const percentage = cap > 0 ? (spent / cap) * 100 : 0;
          const isOverBudget = percentage >= 100;
          const isWarning = percentage >= 70 && percentage < 100;

          const statusBgColor = isOverBudget
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-emerald-500';

          const statusBadge = isOverBudget ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-900/60 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              Budget Exceeded!
            </span>
          ) : isWarning ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-900/60">
              <AlertTriangle className="w-3 h-3" />
              Nearing Limit
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Safe
            </span>
          );

          return (
            <SmoothTiltCard
              key={category.id}
              maxTilt={4.5}
              className={`p-4 rounded-xl border transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-md ${
                isOverBudget
                  ? 'border-rose-300 dark:border-rose-900/70 bg-rose-50/50 dark:bg-rose-950/30'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-slate-200/90 hover:border-slate-300 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                    category.type === 'essential'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {category.type === 'essential' ? (
                      <Home className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {category.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{category.type === 'essential' ? 'Essential Need' : 'Lifestyle'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {statusBadge}
                  <button
                    onClick={() => startEditing(category)}
                    className="text-slate-400 hover:text-emerald-500 p-1"
                    title="Change Budget Limit"
                    aria-label="Edit Cap"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${category.name}" category?`)) {
                        onDeleteCategory(category.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    title="Remove Category"
                    aria-label="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-300/50 dark:border-transparent">
                  <div
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                    className={`h-full transition-all duration-300 ${statusBgColor}`}
                  />
                </div>
              </div>

              {/* Numerical Metrics */}
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-baseline gap-1">
                  <span>Spent:</span>
                  <strong className={`font-mono font-semibold text-slate-900 dark:text-white tabular-nums ${isLocked ? 'blur-xs select-none' : ''}`}>
                    {formatINR(spent)}
                  </strong>
                  <span className="text-slate-400">/</span>
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        value={editCapValue}
                        onChange={(e) => setEditCapValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCap(category.id);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                        autoFocus
                        className="w-16 h-6 px-1 text-xs font-mono bg-white dark:bg-slate-800 border border-emerald-500 rounded text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveCap(category.id)}
                        className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      Cap: {formatINR(cap)}
                    </span>
                  )}
                </div>

                <div className="font-mono tabular-nums text-xs font-semibold">
                  <span className={isOverBudget ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </SmoothTiltCard>
          );
        })}
      </div>
    </SmoothTiltCard>
  );
};
