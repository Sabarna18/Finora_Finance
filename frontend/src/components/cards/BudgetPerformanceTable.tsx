// src/features/reports/tables/BudgetPerformanceTable.tsx

import { BudgetPerformanceItem } from "../../api/reports.api";

interface Props {
    data: BudgetPerformanceItem[];
}

export default function BudgetPerformanceTable({
    data,
}: Props) {

    return (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-800">
                        <th className="p-4 text-left">Category</th>
                        <th className="p-4 text-right">Budget</th>
                        <th className="p-4 text-right">Spent</th>
                        <th className="p-4 text-right">Variance</th>
                        <th className="p-4 text-center">Status</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((row) => (
                        <tr
                            key={row.budget_id}
                            className="border-b border-zinc-800"
                        >
                            <td className="p-4">
                                {row.category}
                            </td>

                            <td className="p-4 text-right">
                                ₹{row.budget.toLocaleString()}
                            </td>

                            <td className="p-4 text-right">
                                ₹{row.spent.toLocaleString()}
                            </td>

                            <td className="p-4 text-right">
                                ₹{row.variance.toLocaleString()}
                            </td>

                            <td className="p-4 text-center">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${row.status
                                        .toLowerCase()
                                        .includes("over")
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-green-500/20 text-green-400"
                                        }`}
                                >
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}