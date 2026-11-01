import React, { useState } from 'react';
import { Category, ExpenseType, PaymentMode, Transaction } from '../types/finance';
import { formatINR } from '../utils/formatters';
import { audioAlert } from '../utils/audioAlert';
import { PlusCircle, Home, Sparkles, Check } from 'lucide-react';
import { SmoothTiltCard } from './SmoothTiltCard';

interface TransactionEntryProps {
  categories: Category[];
  spendingMap: { [catId: string]: number };
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  selectedMonth: string; // e.g. '2026-11'
}

const EVERYDAY_QUICK_TAGS = [
  'Grocery Store',
  'Food Delivery / Swiggy',
  'Electricity / Wi-Fi',
  'Metro / Cab Commute',
  'Mobile Recharge',
  'Pharmacy / Medicine',
  'Coffee & Snacks',
  'Monthly Rent',
];

export const TransactionEntry: React.FC<TransactionEntryProps> = ({
  categories,
  spendingMap,
  onAddTransaction,
  selectedMonth,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const defaultDate = todayIso.startsWith(selectedMonth)
    ? todayIso
    : `${selectedMonth}-01`;

  const [date, setDate] = useState<string>(defaultDate);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const currentType: ExpenseType = activeCategory ? activeCategory.type : 'essential';

  const categorySpent = spendingMap[selectedCategoryId] || 0;
  const categoryCap = activeCategory ? activeCategory.budgetCap : 0;
  const categoryRemaining = categoryCap - categorySpent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      date,
      category: selectedCategoryId,
      amount: parsedAmount,
      type: currentType,
      paymentMode,
      notes: notes.trim(),
    });

    audioAlert.playConfirmChime();

    setAmount('');
    setNotes('');
    setIsSuccessFeedback(true);
    setTimeout(() => setIsSuccessFeedback(false), 2000);
  };

  return (
    <SmoothTiltCard maxTilt={2.5} scale={1.002} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Quick Expense Logger</span>
            {isSuccessFeedback && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                <Check className="w-3 h-3" /> Logged!
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Log groceries, dining out, bills, or shopping in seconds.
          </p>
        </div>

        {activeCategory && (
          <div className="text-right text-xs">
            <span className="text-slate-400">Budget Limit: </span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {formatINR(categoryCap)}
            </span>
            <div className="text-[11px] mt-0.5">
              {categoryRemaining >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(categoryRemaining)} available
                </span>
              ) : (
                <span className="text-rose-500 font-mono font-semibold">
                  Exceeded by {formatINR(Math.abs(categoryRemaining))}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-9 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <optgroup label="Essential (Needs)">
                {categories
                  .filter((c) => c.type === 'essential')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Lifestyle (Wants)">
                {categories
                  .filter((c) => c.type === 'lifestyle')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* 3. Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full h-9 pl-7 pr-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 4. Payment Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full h-9 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>

        {/* Notes & Quick Tags */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Note / Description (Optional)
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Quick tags:</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="e.g. Weekly vegetable run, Netflix monthly bill, Weekend dinner..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
          />

          <div className="flex flex-wrap gap-1.5 mt-2">
            {EVERYDAY_QUICK_TAGS.map((quickTag) => (
              <button
                key={quickTag}
                type="button"
                onClick={() => setNotes(quickTag)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                {quickTag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              {currentType === 'essential' ? (
                <Home className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>Grouped as {currentType === 'essential' ? 'Essential Need' : 'Lifestyle Expense'}</span>
            </span>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </form>
    </SmoothTiltCard>
  );
};
