import React, { useState } from 'react';
import { Category, MonthVariance } from '../types/finance';
import { formatINR, formatPercentage, formatMonthName } from '../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Minus, PieChart, BarChart3 } from 'lucide-react';
import { SmoothTiltCard } from './SmoothTiltCard';

interface AnalyticsChartsProps {
  currentMonth: string;
  previousMonth: string;
  variances: MonthVariance[];
  essentialTotal: number;
  lifestyleTotal: number;
  categories: Category[];
  isLocked?: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  currentMonth,
  previousMonth,
  variances,
  essentialTotal,
  lifestyleTotal,
  categories,
  isLocked = false,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'trends' | 'distribution'>('trends');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const grandTotal = essentialTotal + lifestyleTotal;
  const essentialPct = grandTotal > 0 ? (essentialTotal / grandTotal) * 100 : 50;
  const lifestylePct = grandTotal > 0 ? (lifestyleTotal / grandTotal) * 100 : 50;

  // SVG Donut calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const essentialDashOffset = grandTotal > 0 ? circumference - (essentialPct / 100) * circumference : circumference;
  const lifestyleDashOffset = grandTotal > 0 ? circumference - (lifestylePct / 100) * circumference : circumference;

  return (
    <SmoothTiltCard maxTilt={2.5} scale={1.002} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Spending Trends &amp; Distribution</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Comparing <strong className="text-slate-800 dark:text-slate-200">{formatMonthName(currentMonth, true)}</strong> against previous month <strong className="text-slate-800 dark:text-slate-200">{formatMonthName(previousMonth, true)}</strong>.
          </p>
        </div>

        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveChartTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeChartTab === 'trends'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monthly Change</span>
          </button>
          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeChartTab === 'distribution'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Essential vs Lifestyle</span>
          </button>
        </div>
      </div>

      {activeChartTab === 'trends' ? (
        /* Variance Table & Trends */
        <div className="mt-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Group</th>
                  <th className="pb-3 font-medium text-right font-mono">{formatMonthName(previousMonth, true)}</th>
                  <th className="pb-3 font-medium text-right font-mono">{formatMonthName(currentMonth, true)}</th>
                  <th className="pb-3 font-medium text-right font-mono">Difference</th>
                  <th className="pb-3 font-medium text-right font-mono">% Change</th>
                  <th className="pb-3 font-medium pl-4">Comparison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {variances.map((item) => {
                  const netDiff = item.currentAmount - item.previousAmount;
                  const isIncreased = netDiff > 0;
                  const isDecreased = netDiff < 0;
                  const maxVal = Math.max(item.currentAmount, item.previousAmount, 1);
                  const currentWidthPct = item.currentAmount > 0 ? (item.currentAmount / maxVal) * 100 : 0;
                  const prevWidthPct = item.previousAmount > 0 ? (item.previousAmount / maxVal) * 100 : 0;

                  return (
                    <tr key={item.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.categoryName}
                      </td>
                      <td className="py-3 text-slate-500 whitespace-nowrap">
                        <span className="text-[11px]">
                          {item.type === 'essential' ? 'Essential' : 'Lifestyle'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        <span className={isLocked ? 'blur-xs select-none' : ''}>
                          {formatINR(item.previousAmount)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        <span className={isLocked ? 'blur-xs select-none' : ''}>
                          {formatINR(item.currentAmount)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            netDiff > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : netDiff < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          } ${isLocked ? 'blur-xs select-none' : ''}`}
                        >
                          {netDiff > 0 ? `+${formatINR(netDiff)}` : netDiff < 0 ? `-${formatINR(Math.abs(netDiff))}` : '₹0'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums">
                        {item.isNew ? (
                          <span className="text-[11px] font-semibold text-indigo-500">
                            New this mo
                          </span>
                        ) : item.previousAmount === 0 && item.currentAmount === 0 ? (
                          <span className="text-slate-400 flex items-center justify-end gap-0.5">
                            <Minus className="w-3 h-3" />
                            <span>0%</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold ${
                              isIncreased
                                ? 'text-rose-600 dark:text-rose-400'
                                : isDecreased
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isIncreased ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : isDecreased ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : null}
                            <span>{formatPercentage(item.percentageChange)}</span>
                          </span>
                        )}
                      </td>
                      {/* Comparative Bar */}
                      <td className="py-3 pl-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-8 text-slate-400 font-mono">Prev</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300/40 dark:border-transparent">
                              <div
                                style={{ width: `${prevWidthPct}%` }}
                                className="bg-slate-400 h-full rounded-full"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-8 text-slate-500 font-mono">Curr</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300/40 dark:border-transparent">
                              <div
                                style={{ width: `${currentWidthPct}%` }}
                                className={`h-full rounded-full ${
                                  isIncreased ? 'bg-rose-500' : isDecreased ? 'bg-emerald-500' : 'bg-slate-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Pure SVG Donut Chart */
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative flex items-center justify-center p-4">
            <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 180 180">
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="text-slate-200 dark:text-slate-800 stroke-current"
                strokeWidth="18"
                fill="none"
              />
              {grandTotal > 0 && (
                <>
                  {/* Essential segment */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className="text-emerald-500 stroke-current transition-all duration-500 cursor-pointer hover:opacity-90"
                    strokeWidth="18"
                    strokeDasharray={circumference}
                    strokeDashoffset={essentialDashOffset}
                    strokeLinecap="round"
                    fill="none"
                    onMouseEnter={() => setHoveredSlice('essential')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  {/* Lifestyle segment */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    className="text-indigo-500 stroke-current transition-all duration-500 cursor-pointer hover:opacity-90"
                    strokeWidth="18"
                    strokeDasharray={circumference}
                    strokeDashoffset={lifestyleDashOffset}
                    strokeLinecap="round"
                    fill="none"
                    style={{
                      transformOrigin: 'center',
                      transform: `rotate(${(essentialPct / 100) * 360}deg)`,
                    }}
                    onMouseEnter={() => setHoveredSlice('lifestyle')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                </>
              )}
            </svg>

            {/* Donut Center Total Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {grandTotal === 0
                  ? 'No Expenses Yet'
                  : hoveredSlice === 'essential'
                  ? 'Essential'
                  : hoveredSlice === 'lifestyle'
                  ? 'Lifestyle'
                  : 'Total Spent'}
              </span>
              <span className={`text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums ${isLocked ? 'blur-xs select-none' : ''}`}>
                {grandTotal === 0
                  ? '₹0'
                  : hoveredSlice === 'essential'
                  ? formatINR(essentialTotal)
                  : hoveredSlice === 'lifestyle'
                  ? formatINR(lifestyleTotal)
                  : formatINR(grandTotal)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {grandTotal === 0
                  ? 'Ready for first entry'
                  : hoveredSlice === 'essential'
                  ? `${essentialPct.toFixed(1)}% Share`
                  : hoveredSlice === 'lifestyle'
                  ? `${lifestylePct.toFixed(1)}% Share`
                  : formatMonthName(currentMonth, true)}
              </span>
            </div>
          </div>

          {/* Donut Legend and Detailed Breakdown */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white">Essential Needs</span>
                </div>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                  {grandTotal > 0 ? `${essentialPct.toFixed(1)}% (${formatINR(essentialTotal)})` : '₹0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Rent, grocery staples, electricity, water, gas, Wi-Fi, daily commute, and healthcare essentials.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-indigo-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white">Lifestyle &amp; Leisure</span>
                </div>
                <span className="font-mono tabular-nums text-indigo-700 dark:text-indigo-400 font-semibold">
                  {grandTotal > 0 ? `${lifestylePct.toFixed(1)}% (${formatINR(lifestyleTotal)})` : '₹0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Dining out, weekend cafes, movies, streaming subscriptions, clothing, vacations, and leisure.
              </p>
            </div>
          </div>
        </div>
      )}
    </SmoothTiltCard>
  );
};
