import React, { useState, useMemo } from 'react';
import { Category, ExpenseType, PaymentMode, Transaction } from '../types/finance';
import { formatINR, formatMonthName } from '../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  Home,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  PlusCircle,
} from 'lucide-react';
import { SmoothTiltCard } from './SmoothTiltCard';

interface LedgerTableProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  isLocked?: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  transactions,
  categories,
  currentMonth,
  onUpdateTransaction,
  onDeleteTransaction,
  isLocked = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Edit form state
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('UPI');
  const [editNotes, setEditNotes] = useState('');

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date.startsWith(currentMonth)) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoryMap.get(tx.category);
        const catName = cat ? cat.name.toLowerCase() : '';
        const notes = (tx.notes || '').toLowerCase();
        const payment = tx.paymentMode.toLowerCase();
        const amtStr = String(tx.amount);

        return (
          catName.includes(q) ||
          notes.includes(q) ||
          payment.includes(q) ||
          amtStr.includes(q)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth, typeFilter, categoryFilter, searchQuery, categoryMap]);

  const totalFilteredAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const startEditing = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditDate(tx.date);
    setEditCategoryId(tx.category);
    setEditAmount(String(tx.amount));
    setEditPaymentMode(tx.paymentMode);
    setEditNotes(tx.notes || '');
  };

  const cancelEditing = () => {
    setEditingTxId(null);
  };

  const saveEdit = (txId: string) => {
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const cat = categoryMap.get(editCategoryId);
    const updatedType: ExpenseType = cat ? cat.type : 'essential';

    onUpdateTransaction({
      id: txId,
      date: editDate,
      category: editCategoryId,
      amount: parsedAmount,
      type: updatedType,
      paymentMode: editPaymentMode,
      notes: editNotes.trim(),
      createdAt: Date.now(),
    });

    setEditingTxId(null);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount_INR', 'Payment_Mode', 'Notes'];
    const rows = filteredTransactions.map((tx) => {
      const cat = categoryMap.get(tx.category);
      const catName = cat ? `"${cat.name.replace(/"/g, '""')}"` : `"${tx.category}"`;
      const notesClean = `"${(tx.notes || '').replace(/"/g, '""')}"`;
      return [
        tx.date,
        tx.type === 'essential' ? 'Essential' : 'Lifestyle',
        catName,
        tx.amount,
        tx.paymentMode,
        notesClean,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PocketLedger_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPaymentIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-amber-500" />;
      case 'Card':
        return <CreditCard className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Net Banking':
        return <Building className="w-3.5 h-3.5 text-cyan-500" />;
    }
  };

  return (
    <SmoothTiltCard maxTilt={2} scale={1.002} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      {/* Table Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="text-xs font-normal text-slate-500">
              ({filteredTransactions.length} items · Total: {formatINR(totalFilteredAmount)})
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            History for <strong className="text-slate-800 dark:text-slate-200">{formatMonthName(currentMonth, true)}</strong> with search, inline edit, and CSV export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Search note, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 shadow-xs"
            />
          </div>

          {/* Segmented Type Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('essential')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === 'essential'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Essential
            </button>
            <button
              onClick={() => setTypeFilter('lifestyle')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === 'lifestyle'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lifestyle
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* CSV Export Button */}
          {filteredTransactions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-300 dark:border-slate-700 whitespace-nowrap"
              title="Download Ledger as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="pb-3 pl-2">Date</th>
              <th className="pb-3">Group</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Note</th>
              <th className="pb-3">Payment</th>
              <th className="pb-3 text-right font-mono">Amount (₹)</th>
              <th className="pb-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <PlusCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No expenses logged yet for {formatMonthName(currentMonth, true)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Start fresh! Use the Quick Logger above to record your first expense (e.g. groceries, dining, rent, or commute).
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const cat = categoryMap.get(tx.category);
                const isEditing = editingTxId === tx.id;

                if (isEditing) {
                  return (
                    <tr key={tx.id} className="bg-emerald-50/30 dark:bg-emerald-950/20">
                      <td className="py-2.5 pl-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="h-7 px-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                      </td>
                      <td className="py-2.5">
                        <span className="text-[11px] text-slate-400">
                          {cat?.type === 'essential' ? 'Essential' : 'Lifestyle'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="h-7 px-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Note..."
                          className="h-7 px-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white w-full"
                        />
                      </td>
                      <td className="py-2.5">
                        <select
                          value={editPaymentMode}
                          onChange={(e) => setEditPaymentMode(e.target.value as PaymentMode)}
                          className="h-7 px-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Net Banking">Net Banking</option>
                        </select>
                      </td>
                      <td className="py-2.5 text-right">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="h-7 px-2 text-xs rounded bg-white dark:bg-slate-800 border border-emerald-500 text-slate-900 dark:text-white font-mono text-right w-24"
                        />
                      </td>
                      <td className="py-2.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(tx.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-500 rounded bg-emerald-50 dark:bg-emerald-950"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-slate-400 hover:text-slate-300 rounded"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 pl-2 whitespace-nowrap font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {tx.date}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {tx.type === 'essential' ? (
                          <Home className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span>{tx.type === 'essential' ? 'Essential' : 'Lifestyle'}</span>
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {cat ? cat.name : tx.category}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={tx.notes || ''}>
                      {tx.notes ? tx.notes : <span className="text-slate-400 italic">No notes</span>}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        {getPaymentIcon(tx.paymentMode)}
                        <span>{tx.paymentMode}</span>
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      <span className={isLocked ? 'blur-xs select-none' : ''}>
                        {formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(tx)}
                          className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Edit Transaction"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Transaction"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SmoothTiltCard>
  );
};
