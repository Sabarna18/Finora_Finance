// ======================================================
// src/types/api.ts
// Shared API contracts
// Mirrors backend Pydantic schemas
// ======================================================


// ======================================================
// ENUMS
// ======================================================
export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}


// ======================================================
// AUTH
// ======================================================
export interface LoginRequest {
  email: string;
  password: string;
}


export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}


export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
}


// ======================================================
// USER
// Mirrors UserResponse
// ======================================================
export interface User {
  id: number;

  name: string;

  email: string;

  is_active: boolean;

  created_at: string;
}


// ======================================================
// CATEGORY
// Mirrors CategoryResponse
// ======================================================
export interface Category {
  id: number;

  name: string;

  type: TransactionType;

  user_id: number;

  created_at: string;
}

// ======================================================
// CATEGORY RESPONSE
// ======================================================



export interface CategoryResponse {

  id: number;

  name: string;

  type: TransactionType;

  user_id: number;

  created_at: string;

}


export interface CategoryCreate {
  name: string;

  type: TransactionType;
}


// ======================================================
// TRANSACTIONS
// Mirrors TransactionResponse
// ======================================================
export interface Transaction {
  id: number;

  amount: number;

  type: TransactionType;

  description: string | null;

  date: string | null;

  category_id: number | null;

  user_id: number;

  created_at: string;
}


export interface TransactionCreate {
  amount: number;

  type: TransactionType;

  description?: string;

  date?: string;

  category_id?: number | null;
}


export interface TransactionUpdate {
  amount?: number;

  type?: TransactionType;

  description?: string;

  date?: string;

  category_id?: number | null;
}


// ======================================================
// BUDGETS
// Mirrors FastAPI Budget Schemas
// ======================================================

export interface Budget {
  id: number;

  amount: number;

  month: number;

  year: number;

  category_id: number | null;

  user_id: number;

  created_at: string;
}


export interface BudgetCreate {
  amount: number;

  month: number;

  year: number;

  category_id?: number | null;
}


export interface BudgetUpdate {
  amount?: number;

  month?: number;

  year?: number;

  category_id?: number | null;
}


// ======================================================
// BUDGET QUERY PARAMS
// ======================================================
export interface BudgetListParams {
  month?: number;

  year?: number;
}


// ======================================================
// DELETE RESPONSE
// ======================================================
export interface DeleteBudgetResponse {
  message: string;
}

export interface BudgetStatus {

  budget_id: number;

  category_id: number | null;

  category_name: string | null;

  budget_amount: number;

  spent_amount: number;

  remaining_amount: number;

  percentage_used: number;

  status:
  | "Healthy"
  | "Warning"
  | "Exceeded";

  month: number;

  year: number;

}


// ======================================================
// DASHBOARD
// Based on dashboard endpoints
// ======================================================
export interface DashboardSummary {
  month: number;

  year: number;

  total_income: number;

  total_expense: number;

  savings: number;

  transaction_count: number;
}


export interface MonthlyTrendItem {
  month: number;

  income: number;

  expense: number;
}


export interface MonthlyTrendResponse {
  year: number;

  data: MonthlyTrendItem[];
}


export interface CategoryBreakdownItem {
  category: string;

  amount: number;
}


export interface CategoryBreakdownResponse {
  month: number;

  year: number;

  data: CategoryBreakdownItem[];
}


export interface BudgetStatusItem {
  budget_id: number;

  category: string;

  budget: number;

  spent: number;

  remaining: number;

  status: "Exceeded" | "Within Limit";
}


export interface BudgetStatusResponse {
  month: number;

  year: number;

  data: BudgetStatusItem[];
}


export interface RecentTransactionItem {
  id: number;

  amount: number;

  type: TransactionType;

  description: string | null;

  date: string;

  category_id: number | null;
}


export interface RecentTransactionsResponse {
  count: number;

  data: RecentTransactionItem[];
}


// ======================================================
// COMMON QUERY TYPES
// ======================================================
export interface PaginationParams {
  page?: number;

  limit?: number;
}


export interface DateRangeParams {
  start_date?: string;

  end_date?: string;
}