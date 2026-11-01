import React from 'react';
import { formatINR } from '../utils/formatters';
import { Wallet, ArrowDownRight, PiggyBank, Scale, Edit3 } from 'lucide-react';
import { SmoothTiltCard } from './SmoothTiltCard';

interface KPIOverviewProps {
  monthlyIncome: number;
  totalExpenses: number;
  essentialExpenses: number;
  lifestyleExpenses: number;
  onEditIncome: () => void;
  isLocked?: boolean;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({
  monthlyIncome,
  totalExpenses,
  essentialExpenses,
  lifestyleExpenses,
  onEditIncome,
  isLocked = false,
}) => {
  const netSavings = monthlyIncome - totalExpenses;
  const isDeficit = netSavings < 0;
  const spentPercentage = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;

  const essentialRatio = totalExpenses > 0 ? (essentialExpenses / totalExpenses) * 100 : 50;
  const lifestyleRatio = totalExpenses > 0 ? (lifestyleExpenses / totalExpenses) * 100 : 50;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monthly Income */}
      <SmoothTiltCard
        maxTilt={7}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 relative group"
      >
        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Monthly Income / Salary</span>
            <button
              onClick={onEditIncome}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-emerald-500 p-1 -mr-1"
              title="Edit Monthly Income"
              aria-label="Edit Income"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums ${isLocked ? 'blur-sm select-none' : ''}`}>
              {formatINR(monthlyIncome)}
            </span>
            <Wallet className="w-5 h-5 text-emerald-500/80 shrink-0" />
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Monthly Base</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Configurable</span>
          </div>
        </div>
      </SmoothTiltCard>

      {/* 2. Total Monthly Expenses */}
      <SmoothTiltCard
        maxTilt={7}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
      >
        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Total Expenses</span>
            <span className={`tabular-nums text-[11px] font-semibold px-2 py-0.5 rounded border ${
              spentPercentage > 100
                ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                : spentPercentage > 85
                ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                : 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}>
              {spentPercentage.toFixed(0)}% of Income
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums ${isLocked ? 'blur-sm select-none' : ''}`}>
              {formatINR(totalExpenses)}
            </span>
            <ArrowDownRight className="w-5 h-5 text-rose-500/80 shrink-0" />
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Essential: {formatINR(essentialExpenses)}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Lifestyle: {formatINR(lifestyleExpenses)}</span>
          </div>
        </div>
      </SmoothTiltCard>

      {/* 3. Net Savings or Deficit */}
      <SmoothTiltCard
        maxTilt={7}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
      >
        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>{isDeficit ? 'Net Deficit (Overspent)' : 'Net Savings / Remaining'}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
              isDeficit
                ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
            }`}>
              {isDeficit ? 'Over Budget' : 'Safe Margin'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold tracking-tight tabular-nums ${isLocked ? 'blur-sm select-none' : ''} ${
                isDeficit
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatINR(netSavings)}
            </span>
            <PiggyBank
              className={`w-5 h-5 shrink-0 ${
                isDeficit ? 'text-rose-500/80' : 'text-emerald-500/80'
              }`}
            />
          </div>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
            {isDeficit ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Exceeds monthly income by {formatINR(Math.abs(netSavings))}</span>
            ) : (
              <span>Available unspent balance for savings</span>
            )}
          </div>
        </div>
      </SmoothTiltCard>

      {/* 4. Essential vs Lifestyle Ratio */}
      <SmoothTiltCard
        maxTilt={7}
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
      >
        <div className="p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Essential vs Lifestyle</span>
            <Scale className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {essentialRatio.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Needs</span>
              <span className="text-slate-400">/</span>
              <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                {lifestyleRatio.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Wants</span>
            </div>
          </div>
          {/* Split Progress Bar */}
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex border border-slate-300/60 dark:border-transparent">
            <div
              style={{ width: `${essentialRatio}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Essential: ${essentialRatio.toFixed(1)}%`}
            />
            <div
              style={{ width: `${lifestyleRatio}%` }}
              className="bg-indigo-500 h-full transition-all duration-300"
              title={`Lifestyle: ${lifestyleRatio.toFixed(1)}%`}
            />
          </div>
        </div>
      </SmoothTiltCard>
    </div>
  );
};
