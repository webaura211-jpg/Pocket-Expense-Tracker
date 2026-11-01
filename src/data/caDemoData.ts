import { Category, Transaction, BudgetSettings } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  // Essential Costs (Needs)
  {
    id: 'cat_housing',
    name: 'Housing & Rent',
    type: 'essential',
    budgetCap: 15000,
    iconName: 'Home',
  },
  {
    id: 'cat_groceries',
    name: 'Groceries & Daily Food',
    type: 'essential',
    budgetCap: 8000,
    iconName: 'ShoppingCart',
  },
  {
    id: 'cat_utilities',
    name: 'Electricity, Gas & Wi-Fi',
    type: 'essential',
    budgetCap: 3000,
    iconName: 'Zap',
  },
  {
    id: 'cat_transit',
    name: 'Commute, Metro & Fuel',
    type: 'essential',
    budgetCap: 3500,
    iconName: 'Car',
  },
  {
    id: 'cat_health',
    name: 'Healthcare & Medicines',
    type: 'essential',
    budgetCap: 2000,
    iconName: 'HeartPulse',
  },

  // Lifestyle Costs (Wants & Discretionary)
  {
    id: 'cat_dining',
    name: 'Dining Out & Food Delivery',
    type: 'lifestyle',
    budgetCap: 4000,
    iconName: 'UtensilsCrossed',
  },
  {
    id: 'cat_shopping',
    name: 'Shopping & Apparel',
    type: 'lifestyle',
    budgetCap: 3500,
    iconName: 'ShoppingBag',
  },
  {
    id: 'cat_entertainment',
    name: 'Movies & Subscriptions',
    type: 'lifestyle',
    budgetCap: 1500,
    iconName: 'Film',
  },
  {
    id: 'cat_travel',
    name: 'Travel & Weekend Trips',
    type: 'lifestyle',
    budgetCap: 3000,
    iconName: 'Plane',
  },
  {
    id: 'cat_fitness',
    name: 'Fitness & Personal Care',
    type: 'lifestyle',
    budgetCap: 1500,
    iconName: 'Dumbbell',
  },
];

export const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyIncome: 45000, // Monthly salary / net income
  globalBudgetCap: 45000,
  categories: DEFAULT_CATEGORIES,
  soundAlertsEnabled: true,
  biometricLocked: false,
  securityPin: '1234', // Simple 4-digit PIN default
};

/**
 * Clean zero-state: No pre-filled transactions by default.
 * Users start fresh with their own real records.
 */
export const DEFAULT_TRANSACTIONS: Transaction[] = [];
