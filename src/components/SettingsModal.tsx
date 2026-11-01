import React, { useState, useRef } from 'react';
import { BudgetSettings, Category, ExpenseType, Transaction } from '../types/finance';
import { formatINR } from '../utils/formatters';
import { downloadOfflineApp } from '../utils/downloadOffline';
import {
  X,
  Wallet,
  FolderPlus,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Lock,
  Check,
  AlertCircle,
  Trash2,
  Laptop,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BudgetSettings;
  onUpdateSettings: (newSettings: Partial<BudgetSettings>) => void;
  onAddCustomCategory: (cat: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetToDemoData: () => void;
  allTransactions: Transaction[];
  onImportBackup: (importedData: { settings: BudgetSettings; transactions: Transaction[] }) => void;
  onClearTransactions: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onAddCustomCategory,
  onDeleteCategory,
  onResetToDemoData,
  allTransactions,
  onImportBackup,
  onClearTransactions,
}) => {
  const [incomeInput, setIncomeInput] = useState(String(settings.monthlyIncome));
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<ExpenseType>('essential');
  const [newCatCap, setNewCatCap] = useState('3000');
  const [newPin, setNewPin] = useState(settings.securityPin);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateSettings({ monthlyIncome: val, globalBudgetCap: val });
      setSaveMessage('Monthly income updated successfully.');
      setTimeout(() => setSaveMessage(''), 2500);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMessage('Please enter a category name');
      return;
    }
    const cap = parseFloat(newCatCap);
    if (isNaN(cap) || cap < 0) {
      setErrorMessage('Please enter a valid monthly limit');
      return;
    }

    onAddCustomCategory({
      name: newCatName.trim(),
      type: newCatType,
      budgetCap: cap,
      iconName: newCatType === 'essential' ? 'Home' : 'Sparkles',
      isCustom: true,
    });

    setNewCatName('');
    setNewCatCap('3000');
    setErrorMessage('');
    setSaveMessage('Custom category added successfully.');
    setTimeout(() => setSaveMessage(''), 2500);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      onUpdateSettings({ securityPin: newPin });
      setSaveMessage('Security PIN updated.');
      setTimeout(() => setSaveMessage(''), 2500);
    } else {
      setErrorMessage('PIN must be exactly 4 digits');
    }
  };

  // Full JSON Backup Export
  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings,
      transactions: allTransactions,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PocketLedger_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Full JSON Backup Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings && Array.isArray(parsed.transactions)) {
          onImportBackup({
            settings: parsed.settings,
            transactions: parsed.transactions,
          });
          setSaveMessage('Backup restored successfully.');
          setTimeout(() => setSaveMessage(''), 2500);
        } else {
          setErrorMessage('Invalid backup file format');
        }
      } catch {
        setErrorMessage('Failed to read JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Preferences &amp; Settings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure monthly income, custom categories, privacy lock, and local data backups.
          </p>
        </div>

        {saveMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Monthly Income Baseline */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Monthly Income / Salary</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Your expected monthly net salary or total income used to calculate savings and limits.
            </p>
            <form onSubmit={handleSaveIncome} className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full h-9 pl-7 pr-3 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Save Income
              </button>
            </form>
          </div>

          {/* Section 2: Add Custom Category */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <FolderPlus className="w-4 h-4 text-emerald-500" />
              <span>Add Custom Category</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Add a personal category (e.g. "Pet Care", "Gadgets", "Books &amp; Courses", "House Maintenance").
            </p>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care & Vet"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as ExpenseType)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="essential">Essential (Need)</option>
                  <option value="lifestyle">Lifestyle (Want)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCatCap}
                  onChange={(e) => setNewCatCap(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-3 text-right">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Add Category
                </button>
              </div>
            </form>

            {/* Current Categories List with Remove Option */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Active Categories ({settings.categories.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {settings.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.type === 'essential' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">({cat.type})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatINR(cat.budgetCap)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove "${cat.name}" category?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title={`Remove ${cat.name}`}
                        aria-label={`Remove ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Security & Audio Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Security PIN (4 Digits)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                4-digit passkey used to unlock private transaction records.
              </p>
              <form onSubmit={handleUpdatePin} className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-20 h-8 text-center text-xs tracking-widest font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Save PIN
                </button>
              </form>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Audio Alert Tone</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Plays a subtle beep tone when any category exceeds 100% of its budget limit.
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ soundAlertsEnabled: !settings.soundAlertsEnabled })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    settings.soundAlertsEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {settings.soundAlertsEnabled ? 'Alert Sounds Active' : 'Alert Sounds Muted'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Save to Laptop (Offline App) */}
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Laptop className="w-4 h-4 text-emerald-500" />
              <span>Save &amp; Run Locally on Your Laptop</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Download the complete self-contained app as a single <code className="font-mono text-emerald-600 dark:text-emerald-400">.html</code> file. No Node.js or installation needed—just double-click to open and use offline on your laptop anytime!
            </p>

            <button
              type="button"
              onClick={() => downloadOfflineApp()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Offline App for Laptop (.html)</span>
            </button>
          </div>

          {/* Section 5: Backup & Data Reset */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Data Management &amp; Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              All data is stored directly in your browser. You can export backups as JSON or clear history anytime.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export JSON Backup</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Restore JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all recorded expenses? Category limits and settings will remain.')) {
                    onClearTransactions();
                    setSaveMessage('All transaction records cleared.');
                    setTimeout(() => setSaveMessage(''), 2500);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 hover:border-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Expenses</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset to default clean settings (default categories and ₹45,000 income)?')) {
                    onResetToDemoData();
                    setSaveMessage('Settings reset to fresh default.');
                    setTimeout(() => setSaveMessage(''), 2500);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
