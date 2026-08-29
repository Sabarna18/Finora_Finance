import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
} from "lucide-react";

import SummaryCard from "./SummaryCard";



import type { DashboardSummary } from "../../api/dashboard.api";


interface SummaryGridProps {
  summary: DashboardSummary;
}


export default function SummaryGrid({
  summary,
}: SummaryGridProps) {

  return (

    <section
      className="
        grid
        grid-cols-1
        gap-5

        md:grid-cols-2
        xl:grid-cols-4
      "
    >

      <SummaryCard
        title="Income"
        value={`₹${summary.total_income}`}
        subtitle="Total incoming cash flow"
        icon={<TrendingUp size={22} />}
      />

      <SummaryCard
        title="Expenses"
        value={`₹${summary.total_expense}`}
        subtitle="Total outgoing spending"
        icon={<TrendingDown size={22} />}
      />

      <SummaryCard
        title="Savings"
        value={`₹${summary.savings}`}
        subtitle="Current retained balance"
        icon={<Wallet size={22} />}
      />

      <SummaryCard
        title="Transactions"
        value={summary.transaction_count}
        subtitle="Tracked transaction entries"
        icon={<Receipt size={22} />}
      />

    </section>

  );

}