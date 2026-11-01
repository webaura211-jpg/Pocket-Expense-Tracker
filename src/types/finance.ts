export type ExpenseType = 'essential' | 'lifestyle';

export type PaymentMode = 'UPI' | 'Cash' | 'Card' | 'Net Banking';

export interface Category {
  id: string;
  name: string;
  type: ExpenseType;
  budgetCap: number; // monthly limit in INR
  iconName: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: string; // Category ID or Name
  amount: number; // in INR
  type: ExpenseType;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: number;
}

export interface BudgetSettings {
  monthlyIncome: number;
  globalBudgetCap: number;
  categories: Category[];
  soundAlertsEnabled: boolean;
  biometricLocked: boolean;
  securityPin: string; // default '1234'
}

export interface MonthVariance {
  categoryId: string;
  categoryName: string;
  type: ExpenseType;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number; // positive = increase, negative = decrease
  isNew: boolean;
}
