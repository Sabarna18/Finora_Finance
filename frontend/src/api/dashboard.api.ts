import { api } from "./client";


// ======================================================
// TYPES
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
  spent_amount: number;
  remaining_amount: number;
  status: string;
  percentage_used: number;
}


export interface BudgetStatusResponse {
  month: number;
  year: number;
  data: BudgetStatusItem[];
}


export interface RecentTransactionItem {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  category_id: number | null;
  created_at: string;
}


export interface RecentTransactionsResponse {
  count: number;
  data: RecentTransactionItem[];
}


// ======================================================
// API
// ======================================================
export const dashboardApi = {

  // ==========================================
  // SUMMARY
  // ==========================================
  async getSummary(
    params?: {
      month?: number;
      year?: number;
    }
  ) {

    const response =
      await api.get<DashboardSummary>(
        "/dashboard/summary",
        {
          params,
        }
      );

    return response.data;

  },


  // ==========================================
  // MONTHLY TREND
  // ==========================================
  async getMonthlyTrend(
    params?: {
      year?: number;
    }
  ) {

    const response =
      await api.get<
        MonthlyTrendResponse
      >(
        "/dashboard/monthly-trend",
        {
          params,
        }
      );

    return response.data;

  },


  // ==========================================
  // CATEGORY BREAKDOWN
  // ==========================================
  async getCategoryBreakdown(
    params?: {
      month?: number;
      year?: number;
    }
  ) {

    const response =
      await api.get<
        CategoryBreakdownResponse
      >(
        "/dashboard/category-breakdown",
        {
          params,
        }
      );

    return response.data;

  },


  // ==========================================
  // BUDGET STATUS
  // ==========================================
  async getBudgetStatus(
    params?: {
      month?: number;
      year?: number;
    }
  ) {

    const response =
      await api.get<
        BudgetStatusResponse
      >(
        "/dashboard/budget-status",
        {
          params,
        }
      );

    return response.data;

  },

  // ==========================================
  // BUDGET STATUSES
  // GET /dashboard/status
  // ==========================================
  async getBudgetStatuses(
    params: {
      month: number;
      year: number;
    }
  ) {

    const response =
      await api.get<BudgetStatusItem[]>(
        "/dashboard/status",
        {
          params,
        }
      );

    return response.data;

  },


  // ==========================================
  // RECENT TRANSACTIONS
  // ==========================================
  async getRecentTransactions(
    limit = 5
  ) {

    const response =
      await api.get<
        RecentTransactionsResponse
      >(
        "/dashboard/recent-transactions",
        {
          params: {
            limit,
          },
        }
      );

    return response.data;

  },

};