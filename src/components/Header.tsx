import React from 'react';
import { Lock, Unlock, Settings, Volume2, VolumeX, ShieldAlert, Wallet, Download } from 'lucide-react';
import { formatMonthName } from '../utils/formatters';
import { PullCordLamp } from './PullCordLamp';
import { downloadOfflineApp } from '../utils/downloadOffline';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onOpenSettings: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hasOverspendWarning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  availableMonths,
  theme,
  onToggleTheme,
  isLocked,
  onToggleLock,
  onOpenSettings,
  activeSection,
  onNavigate,
  soundEnabled,
  onToggleSound,
  hasOverspendWarning,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] dark:shadow-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 flex items-center justify-center font-bold text-sm tracking-tighter border border-emerald-500/30">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            PocketLedger
          </span>
          {hasOverspendWarning && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"
              title="One or more categories exceed 100% budget cap"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Budget Alert
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links (Single line, text with subtle hover) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'guardrails', label: 'Budget Limits' },
            { id: 'analytics', label: 'Trends' },
            { id: 'ledger', label: 'Expense Ledger' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeSection === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-500 -mb-[2px]'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Functional Controls & Interactive Pull Cord Lamp */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="h-8 pl-2.5 pr-7 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-colors cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              aria-label="Select Billing Month"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m, true)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <span className="text-[10px]">▼</span>
            </div>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Budget Audio Alerts Active' : 'Budget Audio Muted'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
            aria-label="Toggle Sound Alerts"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {/* Biometric / PIN Privacy Lock Switch */}
          <button
            onClick={onToggleLock}
            title={isLocked ? 'Ledger is Locked. Click to unlock' : 'Click to lock sensitive records'}
            className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold border transition-all ${
              isLocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Secure</span>
              </>
            )}
          </button>

          {/* Prominent Save / Download App for Laptop (.html) */}
          <button
            type="button"
            onClick={() => downloadOfflineApp()}
            title="Download offline app to laptop (.html) - Open and use anytime offline"
            className="h-8 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Download PocketLedger for Laptop"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save to Laptop (.html)</span>
            <span className="sm:hidden">Save</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Configure Income, Categories & Backup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            aria-label="Open Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Interactive Ceiling Pendant Lamp with Pull Cord */}
          <div className="pl-1 shrink-0">
            <PullCordLamp
              theme={theme}
              onToggle={onToggleTheme}
              soundEnabled={soundEnabled}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
