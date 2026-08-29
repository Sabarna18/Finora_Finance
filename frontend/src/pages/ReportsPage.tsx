// src/pages/ReportsPage.tsx

import { useState } from "react";



import ReportsFilters from "../components/ui/ReportsFilters";
import CashFlowCards from "../components/cards/CashflowCards";
import IncomeExpenseTrendChart from "../components/ui/IncomeExpenseTrendChart";
import CategoryAnalysisChart from "../components/ui/CategoryAnalysisChart";
import BudgetPerformanceChart from "../components/ui/BudgetPerformanceChart";
import BudgetPerformanceTable from "../components/cards/BudgetPerformanceTable";






import {
  useBudgetPerformanceReport,
  useCashFlowReport,
  useCategoryAnalysisReport,
  useIncomeExpenseTrendReport,
} from "../hooks/useReports";

export default function ReportsPage() {

  const today = new Date();

  const [month, setMonth] = useState(
    today.getMonth() + 1
  );

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [startDate, setStartDate] = useState(
    `${year}-01-01`
  );

  const [endDate, setEndDate] = useState(
    `${year}-12-31`
  );

  const cashFlow =
    useCashFlowReport(
      startDate,
      endDate
    );

  const categoryAnalysis =
    useCategoryAnalysisReport(
      month,
      year
    );

  const trend =
    useIncomeExpenseTrendReport(
      year
    );

  const budgetPerformance =
    useBudgetPerformanceReport(
      month,
      year
    );

  if (
    cashFlow.isLoading ||
    categoryAnalysis.isLoading ||
    trend.isLoading ||
    budgetPerformance.isLoading
  ) {
    return (
      <div className="text-zinc-100">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <ReportsFilters
        month={month}
        year={year}
        startDate={startDate}
        endDate={endDate}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {cashFlow.data && (
        <CashFlowCards
          data={cashFlow.data}
        />
      )}

      {trend.data && (
        <IncomeExpenseTrendChart
          data={trend.data.data}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {categoryAnalysis.data && (
          <CategoryAnalysisChart
            data={categoryAnalysis.data.data}
          />
        )}

        {budgetPerformance.data && (
          <BudgetPerformanceChart
            data={budgetPerformance.data.data}
          />
        )}
      </div>

      {budgetPerformance.data && (
        <BudgetPerformanceTable
          data={budgetPerformance.data.data}
        />
      )}

    </div>
  );
}

